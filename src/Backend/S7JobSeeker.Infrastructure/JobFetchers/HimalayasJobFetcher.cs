using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.Infrastructure.JobFetchers;

public class HimalayasJobFetcher : IJobFetcherService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<HimalayasJobFetcher> _logger;

    public HimalayasJobFetcher(HttpClient httpClient, ILogger<HimalayasJobFetcher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public string SourceName => "Himalayas";

    public async Task<IReadOnlyList<JobPosting>> FetchLatestJobsAsync(CancellationToken cancellationToken = default)
    {
        var jobList = new List<JobPosting>();
        try
        {
            _logger.LogInformation("Fetching remote tech jobs from Himalayas API...");
            using var request = new HttpRequestMessage(HttpMethod.Get, "https://himalayas.app/jobs/api?limit=50");
            request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            request.Headers.Add("Accept", "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Himalayas API returned non-success code: {StatusCode}", response.StatusCode);
                return jobList;
            }

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("jobs", out var jobsElement))
            {
                return jobList;
            }

            foreach (var element in jobsElement.EnumerateArray())
            {
                var title = element.TryGetProperty("title", out var titleProp) ? titleProp.GetString() : "Untitled";
                var company = element.TryGetProperty("companyName", out var companyProp) ? companyProp.GetString() : "Unknown";
                var guid = element.TryGetProperty("guid", out var guidProp) ? guidProp.GetString() : null;
                var appLink = element.TryGetProperty("applicationLink", out var appLinkProp) ? appLinkProp.GetString() : null;
                var description = element.TryGetProperty("description", out var descProp) ? descProp.GetString() : "";
                var empType = element.TryGetProperty("employmentType", out var empProp) ? empProp.GetString() : "Full-time";

                var externalId = !string.IsNullOrWhiteSpace(guid) ? guid : appLink ?? Guid.NewGuid().ToString();

                string? salary = null;
                if (element.TryGetProperty("minSalary", out var minProp) && element.TryGetProperty("maxSalary", out var maxProp))
                {
                    var currency = element.TryGetProperty("currency", out var currProp) ? currProp.GetString() : "USD";
                    var period = element.TryGetProperty("salaryPeriod", out var perProp) ? perProp.GetString() : "yr";
                    salary = $"${minProp} - ${maxProp} {currency}/{period}";
                }

                DateTime? publishedAt = null;
                if (element.TryGetProperty("pubDate", out var pubProp) && pubProp.TryGetInt64(out var unixSeconds))
                {
                    publishedAt = DateTimeOffset.FromUnixTimeSeconds(unixSeconds).UtcDateTime;
                }

                var plainDesc = Regex.Replace(description ?? "", "<.*?>", string.Empty);

                jobList.Add(new JobPosting
                {
                    Id = Guid.NewGuid(),
                    ExternalId = externalId,
                    Source = JobSource.Himalayas,
                    Title = title ?? "Untitled",
                    Company = company ?? "Unknown",
                    Location = "Remote",
                    IsRemote = true,
                    SalaryRange = salary,
                    JobType = string.IsNullOrWhiteSpace(empType) ? "Full-time" : empType,
                    Description = plainDesc.Trim(),
                    Url = appLink ?? guid,
                    PublishedAt = publishedAt,
                    CreatedAt = DateTime.UtcNow
                });
            }

            _logger.LogInformation("Successfully fetched {Count} jobs from Himalayas.", jobList.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while fetching jobs from Himalayas.");
        }

        return jobList;
    }
}
