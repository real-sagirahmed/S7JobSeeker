using System.Text.Json;
using Microsoft.Extensions.Logging;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.Infrastructure.JobFetchers;

public class ArbeitnowJobFetcher : IJobFetcherService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ArbeitnowJobFetcher> _logger;

    public ArbeitnowJobFetcher(HttpClient httpClient, ILogger<ArbeitnowJobFetcher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public string SourceName => "Arbeitnow";

    public async Task<IReadOnlyList<JobPosting>> FetchLatestJobsAsync(CancellationToken cancellationToken = default)
    {
        var jobList = new List<JobPosting>();
        try
        {
            _logger.LogInformation("Fetching jobs from Arbeitnow API...");
            var response = await _httpClient.GetAsync("https://www.arbeitnow.com/api/job-board-api", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Arbeitnow API returned non-success code: {StatusCode}", response.StatusCode);
                return jobList;
            }

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("data", out var dataElement))
            {
                return jobList;
            }

            foreach (var element in dataElement.EnumerateArray())
            {
                var slug = element.TryGetProperty("slug", out var slugProp) ? slugProp.GetString() : Guid.NewGuid().ToString();
                var title = element.TryGetProperty("title", out var titleProp) ? titleProp.GetString() : "Untitled";
                var company = element.TryGetProperty("company_name", out var companyProp) ? companyProp.GetString() : "Unknown";
                var location = element.TryGetProperty("location", out var locProp) ? locProp.GetString() : "Remote";
                var isRemote = element.TryGetProperty("remote", out var remProp) && remProp.GetBoolean();
                var description = element.TryGetProperty("description", out var descProp) ? descProp.GetString() : "";
                var url = element.TryGetProperty("url", out var urlProp) ? urlProp.GetString() : null;

                DateTime? publishedAt = null;
                if (element.TryGetProperty("created_at", out var createdProp))
                {
                    if (createdProp.ValueKind == JsonValueKind.Number)
                    {
                        publishedAt = DateTimeOffset.FromUnixTimeSeconds(createdProp.GetInt64()).UtcDateTime;
                    }
                    else if (DateTime.TryParse(createdProp.GetString(), out var dt))
                    {
                        publishedAt = dt;
                    }
                }

                var plainDesc = System.Text.RegularExpressions.Regex.Replace(description ?? "", "<.*?>", string.Empty);

                jobList.Add(new JobPosting
                {
                    Id = Guid.NewGuid(),
                    ExternalId = slug ?? Guid.NewGuid().ToString(),
                    Source = JobSource.Arbeitnow,
                    Title = title ?? "Untitled",
                    Company = company ?? "Unknown",
                    Location = location ?? "Remote",
                    IsRemote = isRemote,
                    Description = plainDesc.Trim(),
                    Url = url,
                    PublishedAt = publishedAt,
                    CreatedAt = DateTime.UtcNow
                });
            }

            _logger.LogInformation("Successfully fetched {Count} jobs from Arbeitnow.", jobList.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while fetching jobs from Arbeitnow.");
        }

        return jobList;
    }
}
