using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.Infrastructure.JobFetchers;

public class BdjobsJobFetcher : IJobFetcherService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<BdjobsJobFetcher> _logger;

    private static readonly string[] TechKeywords =
    [
        "software", "developer", "engineer", ".net", "c#", "java", "python",
        "react", "angular", "vue", "frontend", "backend", "full stack", "fullstack",
        "devops", "cloud", "database", "sql", "ai", "machine learning", "flutter",
        "android", "ios", "qa", "sqa", "programmer", "architect"
    ];

    public BdjobsJobFetcher(HttpClient httpClient, ILogger<BdjobsJobFetcher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public string SourceName => "BDJobs";

    public async Task<IReadOnlyList<JobPosting>> FetchLatestJobsAsync(CancellationToken cancellationToken = default)
    {
        var jobList = new List<JobPosting>();
        try
        {
            _logger.LogInformation("Fetching Bangladeshi IT and software jobs from BDJobs API...");
            using var request = new HttpRequestMessage(HttpMethod.Get, "https://gateway.bdjobs.com/recruitment-account-test/api/JobSearch/GetJobSearch?isPro=1&rpp=50&pg=1");
            request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
            request.Headers.Add("Accept", "application/json, text/plain, */*");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("BDJobs Gateway API returned non-success code: {StatusCode}", response.StatusCode);
                return jobList;
            }

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("data", out var dataElement) || dataElement.ValueKind != JsonValueKind.Array)
            {
                return jobList;
            }

            foreach (var element in dataElement.EnumerateArray())
            {
                var jobId = element.TryGetProperty("Jobid", out var idProp) ? idProp.GetString() : null;
                if (string.IsNullOrEmpty(jobId)) continue;

                var title = element.TryGetProperty("jobTitle", out var titleProp) ? titleProp.GetString() ?? "" : "";
                var company = element.TryGetProperty("companyName", out var compProp) ? compProp.GetString() ?? "Unknown Company" : "Unknown Company";
                var location = element.TryGetProperty("location", out var locProp) ? locProp.GetString() ?? "Bangladesh" : "Bangladesh";
                var workPlace = element.TryGetProperty("WorkPlace", out var wpProp) ? wpProp.GetString() ?? "" : "";
                var jobType = element.TryGetProperty("JobType", out var jtProp) ? jtProp.GetString() ?? "FullTime" : "FullTime";
                var eduRec = element.TryGetProperty("eduRec", out var eduProp) ? eduProp.GetString() ?? "" : "";
                var experience = element.TryGetProperty("experience", out var expProp) ? expProp.GetString() ?? "" : "";
                var jobContext = element.TryGetProperty("jobContext", out var ctxProp) ? ctxProp.GetString() ?? "" : "";
                var jobDesc = element.TryGetProperty("jobDescription", out var descProp) ? descProp.GetString() ?? "" : "";

                int catId = 0;
                if (element.TryGetProperty("Cat_id", out var catProp))
                {
                    catProp.TryGetInt32(out catId);
                }

                // Filter: Must be Cat_id == 8 (IT & Telecommunication) OR have strong Tech keywords in Title
                bool isTech = catId == 8 || TechKeywords.Any(k => title.Contains(k, StringComparison.OrdinalIgnoreCase));
                if (!isTech) continue;

                // Format Salary
                string? salary = null;
                if (element.TryGetProperty("Salary", out var salProp) && salProp.ValueKind == JsonValueKind.Object)
                {
                    var min = salProp.TryGetProperty("MinSalary", out var minP) ? minP.GetInt64() : 0;
                    var max = salProp.TryGetProperty("MaxSalary", out var maxP) ? maxP.GetInt64() : 0;
                    if (min > 0 || max > 0)
                    {
                        salary = $"BDT {min:N0} - {max:N0}";
                    }
                }

                DateTime? publishedAt = null;
                if (element.TryGetProperty("publishDate", out var pubProp) && DateTime.TryParse(pubProp.GetString(), out var dt))
                {
                    publishedAt = dt.ToUniversalTime();
                }

                var cleanContext = Regex.Replace(jobContext, "<.*?>", string.Empty);
                var fullDesc = $"Requirements & Education:\n{eduRec}\nExperience: {experience}\n{cleanContext}\n{jobDesc}".Trim();

                bool isRemote = workPlace.Equals("Home", StringComparison.OrdinalIgnoreCase) ||
                                title.Contains("remote", StringComparison.OrdinalIgnoreCase) ||
                                location.Contains("remote", StringComparison.OrdinalIgnoreCase);

                jobList.Add(new JobPosting
                {
                    Id = Guid.NewGuid(),
                    ExternalId = jobId,
                    Source = JobSource.Bdjobs,
                    Title = title,
                    Company = company,
                    Location = string.IsNullOrWhiteSpace(location) ? "Dhaka, Bangladesh" : location,
                    IsRemote = isRemote,
                    SalaryRange = salary,
                    JobType = jobType,
                    Description = fullDesc,
                    Url = $"https://jobs.bdjobs.com/jobdetails.asp?id={jobId}",
                    PublishedAt = publishedAt,
                    CreatedAt = DateTime.UtcNow
                });
            }

            _logger.LogInformation("Successfully fetched {Count} tech jobs from BDJobs.", jobList.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while fetching jobs from BDJobs Gateway API.");
        }

        return jobList;
    }
}
