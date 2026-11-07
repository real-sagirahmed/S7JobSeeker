using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.Infrastructure.JobFetchers;

public class RemotiveJobFetcher : IJobFetcherService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<RemotiveJobFetcher> _logger;

    public RemotiveJobFetcher(HttpClient httpClient, ILogger<RemotiveJobFetcher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public string SourceName => "Remotive";

    public async Task<IReadOnlyList<JobPosting>> FetchLatestJobsAsync(CancellationToken cancellationToken = default)
    {
        var jobList = new List<JobPosting>();
        try
        {
            _logger.LogInformation("Fetching jobs from Remotive API...");
            var response = await _httpClient.GetAsync("https://remotive.com/api/remote-jobs?category=software-dev&limit=50", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Remotive API returned non-success code: {StatusCode}", response.StatusCode);
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
                var title = element.TryGetProperty("title", out var titleProp) ? titleProp.GetString() : "Untitled";
                var company = element.TryGetProperty("company_name", out var companyProp) ? companyProp.GetString() : "Unknown";
                var location = element.TryGetProperty("candidate_required_location", out var locProp) ? locProp.GetString() : "Remote";
                var description = element.TryGetProperty("description", out var descProp) ? descProp.GetString() : "";
                var url = element.TryGetProperty("url", out var urlProp) ? urlProp.GetString() : null;
                var salary = element.TryGetProperty("salary", out var salaryProp) ? salaryProp.GetString() : null;
                var jobType = element.TryGetProperty("job_type", out var typeProp) ? typeProp.GetString() : "Full-time";

                DateTime? publishedAt = null;
                if (element.TryGetProperty("publication_date", out var pubProp) && DateTime.TryParse(pubProp.GetString(), out var dt))
                {
                    publishedAt = dt;
                }

                // Clean HTML tags from description if needed
                var plainDesc = System.Text.RegularExpressions.Regex.Replace(description ?? "", "<.*?>", string.Empty);

                jobList.Add(new JobPosting
                {
                    Id = Guid.NewGuid(),
                    ExternalId = id,
                    Source = JobSource.Remotive,
                    Title = title ?? "Untitled",
                    Company = company ?? "Unknown",
                    Location = location ?? "Remote",
                    IsRemote = true,
                    SalaryRange = salary,
                    JobType = jobType,
                    Description = plainDesc.Trim(),
                    Url = url,
                    PublishedAt = publishedAt,
                    CreatedAt = DateTime.UtcNow
                });
            }

            _logger.LogInformation("Successfully fetched {Count} jobs from Remotive.", jobList.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while fetching jobs from Remotive.");
        }

        return jobList;
    }
}
