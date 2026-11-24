using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;
using S7JobSeeker.Infrastructure.Services;

namespace S7JobSeeker.Infrastructure.JobFetchers;

public class WellfoundJobFetcher : IJobFetcherService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WellfoundJobFetcher> _logger;

    private static readonly string[] RoleEndpoints =
    [
        "https://wellfound.com/role/software-engineer",
        "https://wellfound.com/role/backend-engineer",
        "https://wellfound.com/role/frontend-engineer",
        "https://wellfound.com/role/full-stack-engineer",
        "https://wellfound.com/role/devops-engineer",
        "https://wellfound.com/role/data-engineer",
        "https://wellfound.com/role/machine-learning-engineer"
    ];

    public WellfoundJobFetcher(HttpClient httpClient, ILogger<WellfoundJobFetcher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public string SourceName => "Wellfound";

    public async Task<IReadOnlyList<JobPosting>> FetchLatestJobsAsync(CancellationToken cancellationToken = default)
    {
        var jobList = new List<JobPosting>();
        var seenIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var endpoint in RoleEndpoints)
        {
            try
            {
                _logger.LogInformation("Fetching curated startup tech jobs from Wellfound: {Url}...", endpoint);
                using var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
                request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                request.Headers.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Wellfound returned non-success code: {StatusCode} for {Url}", response.StatusCode, endpoint);
                    continue;
                }

                var html = await response.Content.ReadAsStringAsync(cancellationToken);
                var parsedJobs = ParseWellfoundHtml(html);

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
                _logger.LogError(ex, "Error while fetching jobs from Wellfound endpoint {Url}.", endpoint);
            }
        }

        _logger.LogInformation("Successfully fetched {Count} unique startup tech jobs from Wellfound.", jobList.Count);
        return jobList;
    }

    public static IReadOnlyList<JobPosting> ParseWellfoundHtml(string html)
    {
        var results = new List<JobPosting>();
        if (string.IsNullOrWhiteSpace(html)) return results;

        var match = Regex.Match(html, @"<script id=""__NEXT_DATA__""[^>]*>(.*?)</script>", RegexOptions.Singleline);
        if (!match.Success)
        {
            return results;
        }

        return ParseWellfoundNextData(match.Groups[1].Value);
    }

    public static IReadOnlyList<JobPosting> ParseWellfoundNextData(string json)
    {
        var results = new List<JobPosting>();
        if (string.IsNullOrWhiteSpace(json)) return results;

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (!root.TryGetProperty("props", out var props) ||
                !props.TryGetProperty("pageProps", out var pageProps) ||
                !pageProps.TryGetProperty("apolloState", out var apolloState) ||
                !apolloState.TryGetProperty("data", out var apolloData) ||
                apolloData.ValueKind != JsonValueKind.Object)
            {
                return results;
            }

            // 1. Build Startup index and job-to-startup relationship
            var startupMap = new Dictionary<string, (string Name, string? HighConcept, string? Slug)>(StringComparer.OrdinalIgnoreCase);
            var jobToStartup = new Dictionary<string, (string Name, string? HighConcept, string? Slug)>(StringComparer.OrdinalIgnoreCase);

            foreach (var prop in apolloData.EnumerateObject())
            {
                var val = prop.Value;
                if (val.ValueKind != JsonValueKind.Object) continue;

                if (val.TryGetProperty("__typename", out var typeProp) && typeProp.GetString() == "StartupResult")
                {
                    var startupName = val.TryGetProperty("name", out var n) ? n.GetString() ?? "Startup" : "Startup";
                    var highConcept = val.TryGetProperty("highConcept", out var hc) ? hc.GetString() : null;
                    var startupSlug = val.TryGetProperty("slug", out var ss) ? ss.GetString() : null;
                    var info = (startupName, highConcept, startupSlug);

                    if (val.TryGetProperty("id", out var sid))
                    {
                        startupMap[sid.GetString() ?? prop.Name] = info;
                    }
                    startupMap[prop.Name] = info;

                    if (val.TryGetProperty("highlightedJobListings", out var hjl) && hjl.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in hjl.EnumerateArray())
                        {
                            if (item.TryGetProperty("__ref", out var jobRef))
                            {
                                var refStr = jobRef.GetString();
                                if (!string.IsNullOrWhiteSpace(refStr))
                                {
                                    jobToStartup[refStr] = info;
                                }
                            }
                        }
                    }
                }
            }

            // 2. Enumerate JobListingSearchResults
            foreach (var prop in apolloData.EnumerateObject())
            {
                var val = prop.Value;
                if (val.ValueKind != JsonValueKind.Object) continue;

                if (!val.TryGetProperty("__typename", out var typeProp) || typeProp.GetString() != "JobListingSearchResult")
                {
                    continue;
                }

                string id = prop.Name;
                if (val.TryGetProperty("id", out var idProp))
                {
                    id = idProp.GetString() ?? prop.Name;
                }
                else if (id.StartsWith("JobListingSearchResult:", StringComparison.OrdinalIgnoreCase))
                {
                    id = id.Substring("JobListingSearchResult:".Length);
                }

                if (string.IsNullOrWhiteSpace(id)) continue;

                var title = val.TryGetProperty("title", out var t) ? t.GetString()?.Trim() ?? "Software Engineer" : "Software Engineer";
                var slug = val.TryGetProperty("slug", out var s) ? s.GetString()?.Trim() : "job";
                var description = val.TryGetProperty("description", out var d) ? d.GetString()?.Trim() ?? "" : "";
                var compensation = val.TryGetProperty("compensation", out var c) ? c.GetString()?.Trim() : null;

                // Company information
                string company = "Startup";
                string? highConcept = null;
                if (jobToStartup.TryGetValue(prop.Name, out var stInfo) || jobToStartup.TryGetValue($"JobListingSearchResult:{id}", out stInfo))
                {
                    company = stInfo.Name;
                    highConcept = stInfo.HighConcept;
                }

                // Locations & Remote
                bool isRemote = val.TryGetProperty("remote", out var remProp) && remProp.ValueKind == JsonValueKind.True;
                var locationList = new List<string>();
                if (val.TryGetProperty("locationNames", out var locArr) && locArr.ValueKind == JsonValueKind.Array)
                {
                    foreach (var loc in locArr.EnumerateArray())
                    {
                        var locStr = loc.GetString();
                        if (!string.IsNullOrWhiteSpace(locStr))
                        {
                            locationList.Add(locStr.Trim());
                            if (locStr.Contains("Remote", StringComparison.OrdinalIgnoreCase))
                            {
                                isRemote = true;
                            }
                        }
                    }
                }

                var location = locationList.Count > 0 ? string.Join(", ", locationList) : (isRemote ? "Remote" : "Global");

                if (title.Contains("Remote", StringComparison.OrdinalIgnoreCase))
                {
                    isRemote = true;
                }

                // Experience detection
                int? expMin = null;
                int? expMax = null;
                if (val.TryGetProperty("yearsExperienceMin", out var expMinProp) && expMinProp.ValueKind == JsonValueKind.Number)
                {
                    expMin = expMinProp.GetInt32();
                }
                if (val.TryGetProperty("yearsExperienceMax", out var expMaxProp) && expMaxProp.ValueKind == JsonValueKind.Number)
                {
                    expMax = expMaxProp.GetInt32();
                }

                string expString;
                if (expMin.HasValue && expMax.HasValue)
                {
                    expString = $"{expMin}-{expMax} years";
                }
                else if (expMin.HasValue)
                {
                    expString = $"{expMin}+ years";
                }
                else
                {
                    expString = "";
                }

                // Published Date
                DateTime? publishedAt = null;
                if (val.TryGetProperty("liveStartAt", out var startAtProp) && startAtProp.ValueKind == JsonValueKind.Number)
                {
                    publishedAt = DateTimeOffset.FromUnixTimeSeconds(startAtProp.GetInt64()).UtcDateTime;
                }

                // Assemble description
                var cleanDesc = CleanDescription(description);
                if (!string.IsNullOrWhiteSpace(highConcept))
                {
                    cleanDesc = $"About {company}: {highConcept}\n\n{cleanDesc}".Trim();
                }

                var canonicalUrl = !string.IsNullOrWhiteSpace(slug)
                    ? $"https://wellfound.com/jobs/{id}-{slug}"
                    : $"https://wellfound.com/jobs/{id}";

                results.Add(new JobPosting
                {
                    Id = Guid.NewGuid(),
                    ExternalId = id,
                    Source = JobSource.Wellfound,
                    Title = title,
                    Company = company,
                    Location = location,
                    IsRemote = isRemote,
                    SalaryRange = compensation,
                    JobType = "Full Time",
                    Description = cleanDesc,
                    ExperienceLevel = ExperienceLevelDetector.Detect(title, cleanDesc, expString),
                    Url = canonicalUrl,
                    PublishedAt = publishedAt,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }
        catch
        {
            // Resilient degraded return on parse error
        }

        return results;
    }

    private static string CleanDescription(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var clean = Regex.Replace(raw, @"<.*?>", " ");
        clean = Regex.Replace(clean, @"\[(.*?)\]\(.*?\)", "$1");
        clean = Regex.Replace(clean, @"\s+", " ").Trim();
        return clean;
    }
}
