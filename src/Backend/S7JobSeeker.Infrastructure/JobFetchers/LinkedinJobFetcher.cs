using System.Net;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.Infrastructure.JobFetchers;

public class LinkedinJobFetcher : IJobFetcherService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<LinkedinJobFetcher> _logger;

    private static readonly string[] SearchUrls =
    [
        "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=software+engineer&location=Bangladesh&start=0",
        "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=software+engineer&location=Bangladesh&start=10",
        "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=dotnet+developer&location=Bangladesh&start=0"
    ];

    public LinkedinJobFetcher(HttpClient httpClient, ILogger<LinkedinJobFetcher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public string SourceName => "LinkedIn";

    public async Task<IReadOnlyList<JobPosting>> FetchLatestJobsAsync(CancellationToken cancellationToken = default)
    {
        var jobList = new List<JobPosting>();
        var seenIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var url in SearchUrls)
        {
            try
            {
                _logger.LogInformation("Fetching LinkedIn jobs from {Url}...", url);

                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                request.Headers.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
                request.Headers.Add("Accept-Language", "en-US,en;q=0.9");

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (response.StatusCode == HttpStatusCode.TooManyRequests)
                {
                    _logger.LogWarning("LinkedIn guest API rate-limited (429). Circuit-breaker skipping remaining queries.");
                    break;
                }

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("LinkedIn guest API returned non-success code: {StatusCode} for {Url}", response.StatusCode, url);
                    continue;
                }

                var html = await response.Content.ReadAsStringAsync(cancellationToken);
                var jobsFromHtml = ParseLinkedInHtml(html);

                foreach (var job in jobsFromHtml)
                {
                    if (seenIds.Add(job.ExternalId))
                    {
                        jobList.Add(job);
                    }
                }

                // Polite delay between requests to prevent aggressive rate limiting
                await Task.Delay(300, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error fetching LinkedIn jobs from {Url}", url);
            }
        }

        _logger.LogInformation("Successfully fetched {Count} jobs from LinkedIn.", jobList.Count);
        return jobList;
    }

    public static List<JobPosting> ParseLinkedInHtml(string html)
    {
        var result = new List<JobPosting>();
        if (string.IsNullOrWhiteSpace(html)) return result;

        var cards = Regex.Matches(html, @"<li[^>]*>(.*?)</li>", RegexOptions.Singleline);
        foreach (Match card in cards)
        {
            var cardHtml = card.Groups[1].Value;

            // URN / External Job Id
            var urnMatch = Regex.Match(cardHtml, @"urn:li:jobPosting:(\d+)");
            var rawId = urnMatch.Success ? urnMatch.Groups[1].Value : null;

            // Direct Link
            var linkMatch = Regex.Match(cardHtml, @"base-card__full-link[^>]*href=""([^""]+)""");
            string? directUrl = null;
            if (linkMatch.Success)
            {
                directUrl = linkMatch.Groups[1].Value.Split('?')[0];
            }
            else if (!string.IsNullOrEmpty(rawId))
            {
                directUrl = $"https://www.linkedin.com/jobs/view/{rawId}";
            }

            var externalId = !string.IsNullOrEmpty(rawId) ? rawId : directUrl ?? Guid.NewGuid().ToString();

            // Job Title
            var titleMatch = Regex.Match(cardHtml, @"base-search-card__title[^>]*>\s*([^<]+)");
            var rawTitle = titleMatch.Success ? WebUtility.HtmlDecode(titleMatch.Groups[1].Value.Trim()) : "Untitled";

            // Company Name
            var companyMatch = Regex.Match(cardHtml, @"base-search-card__subtitle[^>]*>.*?<a[^>]*>\s*([^<]+)", RegexOptions.Singleline);
            if (!companyMatch.Success)
            {
                companyMatch = Regex.Match(cardHtml, @"base-search-card__subtitle[^>]*>\s*([^<]+)");
            }
            var rawCompany = companyMatch.Success ? WebUtility.HtmlDecode(companyMatch.Groups[1].Value.Trim()) : "Unknown";

            // Location
            var locMatch = Regex.Match(cardHtml, @"job-search-card__location[^>]*>\s*([^<]+)");
            var rawLoc = locMatch.Success ? WebUtility.HtmlDecode(locMatch.Groups[1].Value.Trim()) : "Bangladesh";

            // Published Date
            DateTime? publishedAt = null;
            var timeMatch = Regex.Match(cardHtml, @"<time[^>]*datetime=""([^""]+)""");
            if (timeMatch.Success && DateTime.TryParse(timeMatch.Groups[1].Value, out var dt))
            {
                publishedAt = dt;
            }

            // Remote detection
            bool isRemote = rawLoc.Contains("Remote", StringComparison.OrdinalIgnoreCase) ||
                            rawTitle.Contains("Remote", StringComparison.OrdinalIgnoreCase);

            // Defensive schema-length sanitization
            var safeLocation = rawLoc.Length > 200 ? rawLoc[..197] + "..." : rawLoc;
            var safeTitle = rawTitle.Length > 300 ? rawTitle[..297] + "..." : rawTitle;
            var safeCompany = rawCompany.Length > 200 ? rawCompany[..197] + "..." : rawCompany;
            var safeExtId = externalId.Length > 200 ? externalId[..200] : externalId;

            var descSummary = $"{safeTitle} position at {safeCompany} located in {safeLocation}. Apply directly via verified LinkedIn listing.";

            result.Add(new JobPosting
            {
                Id = Guid.NewGuid(),
                ExternalId = safeExtId,
                Source = JobSource.LinkedIn,
                Title = safeTitle,
                Company = safeCompany,
                Location = safeLocation,
                IsRemote = isRemote,
                SalaryRange = null,
                JobType = "Full-time",
                Description = descSummary,
                Url = directUrl,
                PublishedAt = publishedAt,
                CreatedAt = DateTime.UtcNow
            });
        }

        return result;
    }
}
