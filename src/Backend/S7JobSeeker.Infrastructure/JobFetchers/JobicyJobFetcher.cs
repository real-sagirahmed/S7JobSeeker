using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.Infrastructure.JobFetchers;

public class JobicyJobFetcher : IJobFetcherService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<JobicyJobFetcher> _logger;

    public JobicyJobFetcher(HttpClient httpClient, ILogger<JobicyJobFetcher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public string SourceName => "Jobicy";

    public async Task<IReadOnlyList<JobPosting>> FetchLatestJobsAsync(CancellationToken cancellationToken = default)
    {
        var jobList = new List<JobPosting>();
        try
        {
            _logger.LogInformation("Fetching engineering jobs from Jobicy API...");
            using var request = new HttpRequestMessage(HttpMethod.Get, "https://jobicy.com/api/v2/remote-jobs?count=50&industry=engineering");
            request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            request.Headers.Add("Accept", "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Jobicy API returned non-success code: {StatusCode}", response.StatusCode);
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
                var id = element.TryGetProperty("id", out var idProp) ? idProp.ToString() : Guid.NewGuid().ToString();
                var title = element.TryGetProperty("jobTitle", out var titleProp) ? titleProp.GetString() : "Untitled";
                var company = element.TryGetProperty("companyName", out var companyProp) ? companyProp.GetString() : "Unknown";
                var location = element.TryGetProperty("jobGeo", out var locProp) ? locProp.GetString() : "Remote";
                var description = element.TryGetProperty("jobDescription", out var descProp) ? descProp.GetString() : "";
                var url = element.TryGetProperty("url", out var urlProp) ? urlProp.GetString() : null;

                string? salary = null;
                var hasMin = element.TryGetProperty("salaryMin", out var minProp) || element.TryGetProperty("annualSalaryMin", out minProp);
                var hasMax = element.TryGetProperty("salaryMax", out var maxProp) || element.TryGetProperty("annualSalaryMax", out maxProp);
                if (hasMin && hasMax)
                {
                    var currency = element.TryGetProperty("salaryCurrency", out var currProp) ? currProp.GetString() : "USD";
                    salary = $"{minProp} - {maxProp} {currency}";
                }

                string? jobType = "Full-time";
                if (element.TryGetProperty("jobType", out var typeProp))
                {
                    jobType = typeProp.ValueKind == JsonValueKind.Array
                        ? string.Join(", ", typeProp.EnumerateArray().Select(t => t.GetString()).Where(t => !string.IsNullOrEmpty(t)))
                        : typeProp.GetString();
                }

                DateTime? publishedAt = null;
                if (element.TryGetProperty("pubDate", out var pubProp) && DateTime.TryParse(pubProp.GetString(), out var dt))
                {
                    publishedAt = dt;
                }

                var plainDesc = Regex.Replace(description ?? "", "<.*?>", string.Empty);

                jobList.Add(new JobPosting
                {
                    Id = Guid.NewGuid(),
                    ExternalId = id,
                    Source = JobSource.Jobicy,
                    Title = title ?? "Untitled",
                    Company = company ?? "Unknown",
                    Location = string.IsNullOrWhiteSpace(location) ? "Remote" : location,
                    IsRemote = true,
                    SalaryRange = salary,
                    JobType = string.IsNullOrWhiteSpace(jobType) ? "Full-time" : jobType,
                    Description = plainDesc.Trim(),
                    Url = url,
                    PublishedAt = publishedAt,
                    CreatedAt = DateTime.UtcNow
                });
            }

            _logger.LogInformation("Successfully fetched {Count} engineering jobs from Jobicy.", jobList.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while fetching jobs from Jobicy.");
        }

        return jobList;
    }
}
