using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;
using S7JobSeeker.Infrastructure.Services;

namespace S7JobSeeker.Infrastructure.JobFetchers;

public class JobgetherJobFetcher : IJobFetcherService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<JobgetherJobFetcher> _logger;

    private static readonly string[] SearchQueries =
    [
        "https://jobgether.com/api/v1/jobs?keyword=dotnet&locations=anywhere&limit=25",
        "https://jobgether.com/api/v1/jobs?keyword=c%23&locations=anywhere&limit=25",
        "https://jobgether.com/api/v1/jobs?keyword=software&experience=entry-level-graduate&locations=anywhere&limit=25",
        "https://jobgether.com/api/v1/jobs?keyword=software&experience=junior-1-2-years&locations=anywhere&limit=25",
        "https://jobgether.com/api/v1/jobs?keyword=developer&experience=entry-level-graduate&locations=anywhere&limit=25",
        "https://jobgether.com/api/v1/jobs?keyword=developer&experience=junior-1-2-years&locations=anywhere&limit=25",
        "https://jobgether.com/api/v1/jobs?keyword=software&locations=anywhere&limit=25"
    ];

    public JobgetherJobFetcher(HttpClient httpClient, ILogger<JobgetherJobFetcher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public string SourceName => "Jobgether";

    public async Task<IReadOnlyList<JobPosting>> FetchLatestJobsAsync(CancellationToken cancellationToken = default)
    {
        var jobList = new List<JobPosting>();
        var seenIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var queryUrl in SearchQueries)
        {
            try
            {
                _logger.LogInformation("Fetching remote tech jobs from Jobgether API: {Url}...", queryUrl);
                using var request = new HttpRequestMessage(HttpMethod.Get, queryUrl);
                request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                request.Headers.Add("Accept", "application/json");

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Jobgether API returned non-success code: {StatusCode} for {Url}", response.StatusCode, queryUrl);
                    continue;
                }

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var parsedJobs = ParseJobgetherJson(json);

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
                _logger.LogError(ex, "Error while fetching jobs from Jobgether endpoint {Url}.", queryUrl);
            }
        }

        _logger.LogInformation("Successfully fetched {Count} unique tech jobs from Jobgether.", jobList.Count);
        return jobList;
    }

    public static IReadOnlyList<JobPosting> ParseJobgetherJson(string json)
    {
        var results = new List<JobPosting>();
        if (string.IsNullOrWhiteSpace(json)) return results;

        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("jobs", out var jobsElement) || jobsElement.ValueKind != JsonValueKind.Array)
        {
            return results;
        }

        foreach (var element in jobsElement.EnumerateArray())
        {
            var id = element.TryGetProperty("id", out var idProp) ? idProp.GetString() : null;
            var title = element.TryGetProperty("title", out var titleProp) ? titleProp.GetString() : "Untitled";
            var company = element.TryGetProperty("company", out var companyProp) ? companyProp.GetString() : "Unknown";
            var url = element.TryGetProperty("url", out var urlProp) ? urlProp.GetString() : null;
            var location = element.TryGetProperty("location", out var locProp) ? locProp.GetString() : "Anywhere";
            var contractType = element.TryGetProperty("contractType", out var contractProp) ? contractProp.GetString() : "Full-time";
            var experience = element.TryGetProperty("experience", out var expProp) ? expProp.GetString() : null;

            bool isRemote = true;
            if (element.TryGetProperty("remote", out var remProp))
            {
                if (remProp.ValueKind == JsonValueKind.True || remProp.ValueKind == JsonValueKind.False)
                {
                    isRemote = remProp.GetBoolean();
                }
                else if (remProp.ValueKind == JsonValueKind.String)
                {
                    var remStr = remProp.GetString() ?? "";
                    isRemote = remStr.Contains("Remote", StringComparison.OrdinalIgnoreCase) ||
                               remStr.Contains("Hybrid", StringComparison.OrdinalIgnoreCase) ||
                               !remStr.Equals("No", StringComparison.OrdinalIgnoreCase);
                }
            }

            var functions = new List<string>();
            if (element.TryGetProperty("jobFunctions", out var funcsProp) && funcsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var f in funcsProp.EnumerateArray())
                {
                    var str = f.GetString();
                    if (!string.IsNullOrWhiteSpace(str)) functions.Add(str);
                }
            }

            DateTime? publishedAt = null;
            if (element.TryGetProperty("postedAt", out var postedProp) && DateTime.TryParse(postedProp.GetString(), out var dt))
            {
                publishedAt = dt.ToUniversalTime();
            }

            string description;
            if (element.TryGetProperty("description", out var descProp) && !string.IsNullOrWhiteSpace(descProp.GetString()))
            {
                description = Regex.Replace(descProp.GetString()!, "<.*?>", string.Empty).Trim();
            }
            else
            {
                var funcText = functions.Count > 0 ? $" Job Functions: {string.Join(", ", functions)}." : "";
                var expText = !string.IsNullOrWhiteSpace(experience) ? $" Experience: {experience}." : "";
                description = $"{title} at {company}. Contract: {contractType}. Location: {location}. Remote: {(isRemote ? "Yes" : "No")}.{expText}{funcText} Apply directly on Jobgether.";
            }

            var externalId = !string.IsNullOrWhiteSpace(id) ? id : (url ?? Guid.NewGuid().ToString());
            var expLevel = ExperienceLevelDetector.Detect(title, description, experience);

            results.Add(new JobPosting
            {
                Id = Guid.NewGuid(),
                ExternalId = externalId,
                Source = JobSource.Jobgether,
                Title = title ?? "Untitled",
                Company = company ?? "Unknown",
                Location = location ?? "Remote / Worldwide",
                IsRemote = isRemote,
                JobType = contractType ?? "Full-time",
                Description = description,
                ExperienceLevel = expLevel,
                Url = url,
                PublishedAt = publishedAt ?? DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            });
        }

        return results;
    }
}
