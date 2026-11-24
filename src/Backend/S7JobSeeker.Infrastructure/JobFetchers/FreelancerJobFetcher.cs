using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;
using S7JobSeeker.Infrastructure.Services;

namespace S7JobSeeker.Infrastructure.JobFetchers;

public class FreelancerJobFetcher : IJobFetcherService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<FreelancerJobFetcher> _logger;

    // ARCHITECTURAL INTENT: Targeted skill taxonomy IDs & full description queries.
    // Querying with explicit jobs[] skill IDs (15: .NET, 106: C#, 690: ASP.NET, 1654: ASP.NET MVC,
    // 2130: .NET Core Web API, 695: SQL Server, 1239: Web API, 2164: API Dev, 759: React, 1088: Full Stack)
    // with full_description=true retrieves 150+ verified, high-value technical freelance projects.
    private static readonly string[] SearchQueries =
    [
        "https://www.freelancer.com/api/projects/0.1/projects/active?jobs[]=15&jobs[]=106&jobs[]=690&jobs[]=1654&jobs[]=2130&jobs[]=695&jobs[]=1239&jobs[]=2164&full_description=true&job_details=true&limit=50",
        "https://www.freelancer.com/api/projects/0.1/projects/active?jobs[]=759&jobs[]=1088&jobs[]=3518&jobs[]=279&jobs[]=1610&jobs[]=1623&full_description=true&job_details=true&limit=50",
        "https://www.freelancer.com/api/projects/0.1/projects/active?query=.net&full_description=true&job_details=true&limit=30",
        "https://www.freelancer.com/api/projects/0.1/projects/active?query=csharp&full_description=true&job_details=true&limit=30"
    ];

    public FreelancerJobFetcher(HttpClient httpClient, ILogger<FreelancerJobFetcher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public string SourceName => "Freelancer";

    public async Task<IReadOnlyList<JobPosting>> FetchLatestJobsAsync(CancellationToken cancellationToken = default)
    {
        var jobList = new List<JobPosting>();
        var seenIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var queryUrl in SearchQueries)
        {
            try
            {
                _logger.LogInformation("Fetching live freelance projects from Freelancer.com API: {Url}...", queryUrl);
                using var request = new HttpRequestMessage(HttpMethod.Get, queryUrl);
                request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                request.Headers.Add("Accept", "application/json");

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Freelancer API returned non-success code: {StatusCode} for {Url}", response.StatusCode, queryUrl);
                    continue;
                }

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var parsedJobs = ParseFreelancerJson(json);

                foreach (var job in parsedJobs)
                {
                    if (seenIds.Add(job.ExternalId))
                    {
                        jobList.Add(job);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while fetching freelance projects from endpoint {Url}.", queryUrl);
            }
        }

        _logger.LogInformation("Successfully fetched {Count} unique freelance projects from Freelancer.com.", jobList.Count);
        return jobList;
    }

    public static IReadOnlyList<JobPosting> ParseFreelancerJson(string json)
    {
        var results = new List<JobPosting>();
        if (string.IsNullOrWhiteSpace(json)) return results;

        try
        {
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("result", out var resultElement)) return results;
            if (!resultElement.TryGetProperty("projects", out var projectsElement) || projectsElement.ValueKind != JsonValueKind.Array)
            {
                return results;
            }

            foreach (var p in projectsElement.EnumerateArray())
            {
            // ID
            string? externalId = null;
            if (p.TryGetProperty("id", out var idProp))
            {
                externalId = idProp.ValueKind == JsonValueKind.Number ? idProp.GetInt64().ToString() : idProp.GetString();
            }

            if (string.IsNullOrWhiteSpace(externalId)) continue;

            // Title
            var title = p.TryGetProperty("title", out var titleProp) ? titleProp.GetString() : "Untitled Freelance Project";
            if (string.IsNullOrWhiteSpace(title)) title = "Untitled Freelance Project";

            // Description: Prioritize full client brief over 100-character preview
            string projectBrief = "";
            if (p.TryGetProperty("description", out var descProp) && !string.IsNullOrWhiteSpace(descProp.GetString()))
            {
                projectBrief = descProp.GetString()!;
            }
            else if (p.TryGetProperty("preview_description", out var prevProp) && !string.IsNullOrWhiteSpace(prevProp.GetString()))
            {
                projectBrief = prevProp.GetString()!;
            }

            projectBrief = Regex.Replace(projectBrief, "<.*?>", string.Empty).Trim();

            // URL
            string projectUrl = $"https://www.freelancer.com/projects/{externalId}";
            if (p.TryGetProperty("seo_url", out var seoProp) && !string.IsNullOrWhiteSpace(seoProp.GetString()))
            {
                projectUrl = $"https://www.freelancer.com/projects/{seoProp.GetString()!.Trim('/')}";
            }

            // Type (fixed / hourly)
            var projectType = "Fixed";
            if (p.TryGetProperty("type", out var typeProp) && !string.IsNullOrWhiteSpace(typeProp.GetString()))
            {
                projectType = typeProp.GetString()!.Equals("hourly", StringComparison.OrdinalIgnoreCase) ? "Hourly" : "Fixed";
            }

            // Currency
            var currCode = "USD";
            var currSign = "$";
            if (p.TryGetProperty("currency", out var currProp) && currProp.ValueKind == JsonValueKind.Object)
            {
                if (currProp.TryGetProperty("code", out var codeProp) && !string.IsNullOrWhiteSpace(codeProp.GetString()))
                {
                    currCode = codeProp.GetString()!;
                }
                if (currProp.TryGetProperty("sign", out var signProp) && !string.IsNullOrWhiteSpace(signProp.GetString()))
                {
                    currSign = signProp.GetString()!;
                }
            }

            // Budget
            string? salaryRange = null;
            if (p.TryGetProperty("budget", out var bProp) && bProp.ValueKind == JsonValueKind.Object)
            {
                double? min = bProp.TryGetProperty("minimum", out var minProp) && minProp.ValueKind == JsonValueKind.Number ? minProp.GetDouble() : null;
                double? max = bProp.TryGetProperty("maximum", out var maxProp) && maxProp.ValueKind == JsonValueKind.Number ? maxProp.GetDouble() : null;

                if (min.HasValue && max.HasValue)
                {
                    if (Math.Abs(min.Value - max.Value) < 0.01)
                    {
                        salaryRange = $"{projectType}: {currSign}{min.Value:0} {currCode}";
                    }
                    else
                    {
                        salaryRange = $"{projectType}: {currSign}{min.Value:0} - {currSign}{max.Value:0} {currCode}";
                    }
                }
                else if (min.HasValue)
                {
                    salaryRange = $"{projectType}: From {currSign}{min.Value:0} {currCode}";
                }
                else if (max.HasValue)
                {
                    salaryRange = $"{projectType}: Up to {currSign}{max.Value:0} {currCode}";
                }
            }

            // Skills / Jobs tags
            var skills = new List<string>();
            if (p.TryGetProperty("jobs", out var jobsProp) && jobsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var j in jobsProp.EnumerateArray())
                {
                    if (j.TryGetProperty("name", out var jNameProp) && !string.IsNullOrWhiteSpace(jNameProp.GetString()))
                    {
                        skills.Add(jNameProp.GetString()!);
                    }
                }
            }

            // Date
            DateTime? publishedAt = null;
            if (p.TryGetProperty("submitdate", out var submitProp) && submitProp.ValueKind == JsonValueKind.Number)
            {
                try
                {
                    publishedAt = DateTimeOffset.FromUnixTimeSeconds(submitProp.GetInt64()).UtcDateTime;
                }
                catch { }
            }

            var skillsStr = skills.Count > 0 ? string.Join(", ", skills) : "Software Development";
            var budgetInfo = !string.IsNullOrWhiteSpace(salaryRange) ? $"\nBudget: {salaryRange}" : "";
            var fullDescription = $"{title}\n\nClient Project Brief:\n{projectBrief}{budgetInfo}\nRequired Skills: {skillsStr}\n\nPlatform: Freelancer.com (Remote Freelance Project)";

            var expLevel = ExperienceLevelDetector.Detect(title, fullDescription);

            results.Add(new JobPosting
            {
                Id = Guid.NewGuid(),
                ExternalId = externalId,
                Source = JobSource.Freelancer,
                Title = title,
                Company = "Freelancer Client",
                Location = "Remote (Worldwide Freelance)",
                IsRemote = true,
                JobType = projectType,
                SalaryRange = salaryRange,
                Description = fullDescription,
                Url = projectUrl,
                TagsJson = skills.Count > 0 ? JsonSerializer.Serialize(skills) : null,
                PublishedAt = publishedAt ?? DateTime.UtcNow,
                FlexScore = 100,
                FlexWhereScore = 100,
                FlexWhenScore = 100,
                FlexHowScore = 100,
                IsWorkFromAnywhere = true,
                TimezoneRequirements = "Flexible (Client Deliverable Based)",
                FlexibilityNotes = "100% remote freelance contract with milestone autonomy.",
                ExperienceLevel = expLevel
            });
        }

        return results;
        }
        catch (JsonException)
        {
            return results;
        }
    }
}
