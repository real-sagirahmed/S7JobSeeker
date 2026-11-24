using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;
using S7JobSeeker.Infrastructure.Services;

namespace S7JobSeeker.Infrastructure.JobFetchers;

public class SkillJobsJobFetcher : IJobFetcherService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SkillJobsJobFetcher> _logger;

    private static readonly string[] FetchEndpoints =
    [
        "https://studio.skill.jobs/api/jobs_list/?limit=100&offset=0",
        "https://studio.skill.jobs/api/jobs_list/?limit=100&offset=100"
    ];

    private static readonly string[] TechKeywords =
    [
        "software", "developer", "engineer", ".net", "c#", "java", "python",
        "react", "angular", "vue", "frontend", "backend", "full stack", "fullstack",
        "devops", "cloud", "database", "sql", "ai", "machine learning", "flutter",
        "android", "ios", "qa", "sqa", "programmer", "architect", "data analyst",
        "data engineer", "data scientist", "web developer", "wordpress", "php", "laravel",
        "node", "typescript", "golang", "mern", "ui/ux", "product designer"
    ];

    public SkillJobsJobFetcher(HttpClient httpClient, ILogger<SkillJobsJobFetcher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public string SourceName => "SkillJobs";

    public async Task<IReadOnlyList<JobPosting>> FetchLatestJobsAsync(CancellationToken cancellationToken = default)
    {
        var jobList = new List<JobPosting>();
        var seenIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var endpointUrl in FetchEndpoints)
        {
            try
            {
                _logger.LogInformation("Fetching Bangladeshi tech jobs from Skill.Jobs API: {Url}...", endpointUrl);
                using var request = new HttpRequestMessage(HttpMethod.Get, endpointUrl);
                request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                request.Headers.Add("Accept", "application/json, text/plain, */*");

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Skill.Jobs API returned non-success code: {StatusCode} for {Url}", response.StatusCode, endpointUrl);
                    continue;
                }

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var parsedJobs = ParseSkillJobsJson(json);

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
                _logger.LogError(ex, "Error while fetching jobs from Skill.Jobs endpoint {Url}.", endpointUrl);
            }
        }

        _logger.LogInformation("Successfully fetched {Count} unique tech jobs from Skill.Jobs.", jobList.Count);
        return jobList;
    }

    public static IReadOnlyList<JobPosting> ParseSkillJobsJson(string json)
    {
        var results = new List<JobPosting>();
        if (string.IsNullOrWhiteSpace(json)) return results;

        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("results", out var resultsElement) || resultsElement.ValueKind != JsonValueKind.Array)
        {
            return results;
        }

        foreach (var element in resultsElement.EnumerateArray())
        {
            string? id = null;
            if (element.TryGetProperty("id", out var idProp))
            {
                id = idProp.ValueKind == JsonValueKind.Number ? idProp.GetInt64().ToString() : idProp.GetString();
            }

            if (string.IsNullOrWhiteSpace(id)) continue;

            var title = element.TryGetProperty("title", out var titleProp) ? titleProp.GetString()?.Trim() ?? "Untitled" : "Untitled";
            var slug = element.TryGetProperty("slug", out var slugProp) ? slugProp.GetString()?.Trim() : null;

            // Company Name
            string company = "Unknown Company";
            if (element.TryGetProperty("company_name", out var compProp) && !string.IsNullOrWhiteSpace(compProp.GetString()))
            {
                company = compProp.GetString()!.Trim();
            }
            else if (element.TryGetProperty("company_details", out var compDet) && compDet.ValueKind == JsonValueKind.Object)
            {
                if (compDet.TryGetProperty("name", out var detName) && !string.IsNullOrWhiteSpace(detName.GetString()))
                {
                    company = detName.GetString()!.Trim();
                }
            }

            // Location
            var location = element.TryGetProperty("location", out var locProp) ? locProp.GetString()?.Trim() : null;
            var division = element.TryGetProperty("division", out var divProp) ? divProp.GetString()?.Trim() : null;
            if (string.IsNullOrWhiteSpace(location))
            {
                location = !string.IsNullOrWhiteSpace(division) ? $"{division}, Bangladesh" : "Dhaka, Bangladesh";
            }

            var type = element.TryGetProperty("type", out var typeProp) ? typeProp.GetString()?.Trim() ?? "Full Time" : "Full Time";
            var level = element.TryGetProperty("level", out var lvlProp) ? lvlProp.GetString()?.Trim() ?? "" : "";
            var workplace = element.TryGetProperty("workplace", out var wpProp) ? wpProp.GetString()?.Trim() ?? "" : "";

            // Extract Skills
            var skillsList = new List<string>();
            if (element.TryGetProperty("skills_details", out var skillsArr) && skillsArr.ValueKind == JsonValueKind.Array)
            {
                foreach (var sk in skillsArr.EnumerateArray())
                {
                    if (sk.TryGetProperty("name", out var skName) && !string.IsNullOrWhiteSpace(skName.GetString()))
                    {
                        skillsList.Add(skName.GetString()!.Trim());
                    }
                }
            }

            // Tech filter check
            bool isTech = TechKeywords.Any(k => title.Contains(k, StringComparison.OrdinalIgnoreCase)) ||
                          skillsList.Any(s => TechKeywords.Any(k => s.Contains(k, StringComparison.OrdinalIgnoreCase)));

            var rawSummary = element.TryGetProperty("position_summary", out var sumProp) ? sumProp.GetString() ?? "" : "";
            var rawResp = element.TryGetProperty("job_responsibility", out var respProp) ? respProp.GetString() ?? "" : "";
            var rawQual = element.TryGetProperty("qualification", out var qualProp) ? qualProp.GetString() ?? "" : "";

            if (!isTech)
            {
                // Check in raw summary or responsibilities
                if (TechKeywords.Any(k => rawSummary.Contains(k, StringComparison.OrdinalIgnoreCase) ||
                                          rawResp.Contains(k, StringComparison.OrdinalIgnoreCase)))
                {
                    isTech = true;
                }
            }

            if (!isTech) continue;

            // Salary
            string? salaryRange = null;
            double minSal = 0;
            double maxSal = 0;
            if (element.TryGetProperty("min_salary", out var minP) && minP.ValueKind == JsonValueKind.Number)
            {
                minP.TryGetDouble(out minSal);
            }
            if (element.TryGetProperty("max_salary", out var maxP) && maxP.ValueKind == JsonValueKind.Number)
            {
                maxP.TryGetDouble(out maxSal);
            }

            bool isNegotiable = element.TryGetProperty("isNegotiable", out var negP) && negP.ValueKind == JsonValueKind.True;

            if (minSal > 0 && maxSal > 0)
            {
                salaryRange = $"BDT {minSal:N0} - {maxSal:N0}";
            }
            else if (maxSal > 0)
            {
                salaryRange = $"Up to BDT {maxSal:N0}";
            }
            else if (minSal > 0)
            {
                salaryRange = $"From BDT {minSal:N0}";
            }
            else if (isNegotiable)
            {
                salaryRange = "Negotiable";
            }

            // Experience
            double minExp = 0;
            double maxExp = 0;
            if (element.TryGetProperty("min_experience_range", out var expMinP) && expMinP.ValueKind == JsonValueKind.Number)
            {
                expMinP.TryGetDouble(out minExp);
            }
            if (element.TryGetProperty("max_experience_range", out var expMaxP) && expMaxP.ValueKind == JsonValueKind.Number)
            {
                expMaxP.TryGetDouble(out maxExp);
            }
            bool allowFreshers = element.TryGetProperty("allowFreshers", out var freshP) && freshP.ValueKind == JsonValueKind.True;

            string expText;
            if (allowFreshers && minExp == 0)
            {
                expText = "Fresher / 0 years";
            }
            else if (minExp > 0 || maxExp > 0)
            {
                expText = $"{minExp:0.#}-{maxExp:0.#} years";
            }
            else
            {
                expText = level;
            }

            // Remote
            bool isRemote = workplace.Contains("Home", StringComparison.OrdinalIgnoreCase) ||
                            location.Contains("Remote", StringComparison.OrdinalIgnoreCase) ||
                            title.Contains("Remote", StringComparison.OrdinalIgnoreCase);

            // Clean Description
            var cleanSummary = CleanHtml(rawSummary);
            var cleanResp = CleanHtml(rawResp);
            var cleanQual = CleanHtml(rawQual);

            var descParts = new List<string>();
            if (!string.IsNullOrWhiteSpace(cleanSummary)) descParts.Add($"Role Summary:\n{cleanSummary}");
            if (!string.IsNullOrWhiteSpace(cleanResp)) descParts.Add($"Key Responsibilities:\n{cleanResp}");
            if (!string.IsNullOrWhiteSpace(cleanQual)) descParts.Add($"Requirements & Qualifications:\n{cleanQual}");
            if (skillsList.Count > 0) descParts.Add($"Required Skills: {string.Join(", ", skillsList)}");

            var fullDescription = descParts.Count > 0
                ? string.Join("\n\n", descParts)
                : $"{title} at {company}. Location: {location}. Level: {level}. Workplace: {workplace}.";

            // Published Date
            DateTime? publishedAt = null;
            if (element.TryGetProperty("created_at", out var pubProp) && DateTime.TryParse(pubProp.GetString(), out var dt))
            {
                publishedAt = dt.ToUniversalTime();
            }

            var jobUrl = !string.IsNullOrWhiteSpace(slug)
                ? $"https://skill.jobs/jobs/{slug}"
                : $"https://skill.jobs/jobs/{id}";

            results.Add(new JobPosting
            {
                Id = Guid.NewGuid(),
                ExternalId = id,
                Source = JobSource.SkillJobs,
                Title = title,
                Company = company,
                Location = location,
                IsRemote = isRemote,
                SalaryRange = salaryRange,
                JobType = type,
                Description = fullDescription,
                ExperienceLevel = ExperienceLevelDetector.Detect(title, fullDescription, expText),
                Url = jobUrl,
                PublishedAt = publishedAt,
                CreatedAt = DateTime.UtcNow
            });
        }

        return results;
    }

    private static string CleanHtml(string html)
    {
        if (string.IsNullOrWhiteSpace(html)) return string.Empty;
        var clean = Regex.Replace(html, "<.*?>", " ");
        clean = Regex.Replace(clean, @"\s+", " ").Trim();
        return clean;
    }
}
