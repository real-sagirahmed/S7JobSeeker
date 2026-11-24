using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;
using S7JobSeeker.Infrastructure.Services;

namespace S7JobSeeker.Infrastructure.JobFetchers;

public class CareerjetJobFetcher : IJobFetcherService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CareerjetJobFetcher> _logger;

    private static readonly string[] SearchKeywords =
    [
        "dotnet",
        "c#",
        "software engineer",
        "developer",
        "full stack",
        "python",
        "react",
        "frontend",
        "backend",
        "data analyst"
    ];

    public CareerjetJobFetcher(HttpClient httpClient, IConfiguration configuration, ILogger<CareerjetJobFetcher> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public string SourceName => "Careerjet";

    public async Task<IReadOnlyList<JobPosting>> FetchLatestJobsAsync(CancellationToken cancellationToken = default)
    {
        var jobList = new List<JobPosting>();
        var seenUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var apiKey = _configuration["CareerjetSettings:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            apiKey = Environment.GetEnvironmentVariable("CAREERJET_API_KEY");
        }

        // Graceful Degraded Mode when API Key is unconfigured
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.Equals("YOUR_CAREERJET_API_KEY", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("Careerjet API Key is not configured. Register for a free publisher key at https://www.careerjet.com/partners/api/ and configure CareerjetSettings:ApiKey. Skipping Careerjet ingestion.");
            return jobList;
        }

        var baseUrl = _configuration["CareerjetSettings:BaseUrl"] ?? "https://search.api.careerjet.net/v4/query";
        var authBytes = Encoding.UTF8.GetBytes($"{apiKey.Trim()}:");
        var authHeaderValue = Convert.ToBase64String(authBytes);

        foreach (var keyword in SearchKeywords)
        {
            try
            {
                var queryUrl = $"{baseUrl}?locale_code=en_BD&keywords={Uri.EscapeDataString(keyword)}&location=Bangladesh&sort=date&page_size=30&user_ip=127.0.0.1&user_agent=Mozilla%2F5.0";
                _logger.LogInformation("Fetching Bangladesh tech jobs from Careerjet API: {Keyword}...", keyword);

                using var request = new HttpRequestMessage(HttpMethod.Get, queryUrl);
                request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeaderValue);
                request.Headers.Add("Referer", "https://s7jobseeker.com/");
                request.Headers.Add("Accept", "application/json");

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Careerjet API returned non-success code: {StatusCode} for query {Keyword}", response.StatusCode, keyword);
                    continue;
                }

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var parsedJobs = ParseCareerjetJson(json);

                foreach (var job in parsedJobs)
                {
                    if (!string.IsNullOrWhiteSpace(job.Url) && seenUrls.Add(job.Url))
                    {
                        jobList.Add(job);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while fetching jobs from Careerjet endpoint for keyword {Keyword}.", keyword);
            }
        }

        _logger.LogInformation("Successfully fetched {Count} unique tech jobs from Careerjet.", jobList.Count);
        return jobList;
    }

    public static IReadOnlyList<JobPosting> ParseCareerjetJson(string json)
    {
        var results = new List<JobPosting>();
        if (string.IsNullOrWhiteSpace(json)) return results;

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Check for error response
        if (root.TryGetProperty("type", out var typeProp) && typeProp.GetString() == "ERROR")
        {
            return results;
        }

        if (!root.TryGetProperty("jobs", out var jobsElement) || jobsElement.ValueKind != JsonValueKind.Array)
        {
            return results;
        }

        foreach (var element in jobsElement.EnumerateArray())
        {
            var title = element.TryGetProperty("title", out var titleProp) ? titleProp.GetString()?.Trim() ?? "Untitled" : "Untitled";
            var company = element.TryGetProperty("company", out var compProp) ? compProp.GetString()?.Trim() ?? "Unknown Company" : "Unknown Company";
            var url = element.TryGetProperty("url", out var urlProp) ? urlProp.GetString()?.Trim() : null;
            var locations = element.TryGetProperty("locations", out var locProp) ? locProp.GetString()?.Trim() : null;
            var description = element.TryGetProperty("description", out var descProp) ? descProp.GetString()?.Trim() : null;
            var dateStr = element.TryGetProperty("date", out var dateProp) ? dateProp.GetString()?.Trim() : null;

            if (string.IsNullOrWhiteSpace(url)) continue;

            // Location
            var location = !string.IsNullOrWhiteSpace(locations) ? locations : "Dhaka, Bangladesh";

            // Salary formatting
            string? salaryRange = null;
            if (element.TryGetProperty("salary", out var salProp) && !string.IsNullOrWhiteSpace(salProp.GetString()))
            {
                salaryRange = salProp.GetString()!.Trim();
            }
            else
            {
                double minSal = 0;
                double maxSal = 0;
                if (element.TryGetProperty("salary_min", out var minP) && minP.ValueKind == JsonValueKind.Number)
                {
                    minP.TryGetDouble(out minSal);
                }
                if (element.TryGetProperty("salary_max", out var maxP) && maxP.ValueKind == JsonValueKind.Number)
                {
                    maxP.TryGetDouble(out maxSal);
                }

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
            }

            // Description cleaning
            var cleanDesc = CleanHtml(description);
            if (string.IsNullOrWhiteSpace(cleanDesc))
            {
                cleanDesc = $"{title} at {company}. Location: {location}. Find and apply on Careerjet.";
            }

            // Remote detection
            bool isRemote = location.Contains("Remote", StringComparison.OrdinalIgnoreCase) ||
                            title.Contains("Remote", StringComparison.OrdinalIgnoreCase) ||
                            cleanDesc.Contains("Work from home", StringComparison.OrdinalIgnoreCase);

            // Published Date
            DateTime? publishedAt = null;
            if (!string.IsNullOrWhiteSpace(dateStr) && DateTime.TryParse(dateStr, out var dt))
            {
                publishedAt = dt.ToUniversalTime();
            }

            // Generate ExternalId from URL hash
            var externalId = GenerateHashId(url);

            results.Add(new JobPosting
            {
                Id = Guid.NewGuid(),
                ExternalId = externalId,
                Source = JobSource.Careerjet,
                Title = title,
                Company = company,
                Location = location,
                IsRemote = isRemote,
                SalaryRange = salaryRange,
                JobType = "Full Time",
                Description = cleanDesc,
                ExperienceLevel = ExperienceLevelDetector.Detect(title, cleanDesc, salaryRange),
                Url = url,
                PublishedAt = publishedAt,
                CreatedAt = DateTime.UtcNow
            });
        }

        return results;
    }

    private static string CleanHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return string.Empty;
        var clean = Regex.Replace(html, "<.*?>", " ");
        clean = Regex.Replace(clean, @"\s+", " ").Trim();
        return clean;
    }

    private static string GenerateHashId(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }
}
