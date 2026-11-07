using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.Extensions.Logging;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.Infrastructure.JobFetchers;

public class WwrJobFetcher : IJobFetcherService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WwrJobFetcher> _logger;

    private static readonly string[] FeedUrls =
    [
        "https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss",
        "https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss"
    ];

    public WwrJobFetcher(HttpClient httpClient, ILogger<WwrJobFetcher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public string SourceName => "WeWorkRemotely";

    public async Task<IReadOnlyList<JobPosting>> FetchLatestJobsAsync(CancellationToken cancellationToken = default)
    {
        var jobList = new List<JobPosting>();
        var seenUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var feedUrl in FeedUrls)
        {
            try
            {
                _logger.LogInformation("Fetching RSS jobs from {Url}...", feedUrl);
                using var request = new HttpRequestMessage(HttpMethod.Get, feedUrl);
                request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("WWR feed returned {StatusCode} for {Url}", response.StatusCode, feedUrl);
                    continue;
                }

                var xmlStream = await response.Content.ReadAsStreamAsync(cancellationToken);
                var doc = await XDocument.LoadAsync(xmlStream, LoadOptions.None, cancellationToken);

                var items = doc.Descendants("item");
                foreach (var item in items)
                {
                    var rawTitle = item.Element("title")?.Value?.Trim() ?? "Untitled";
                    var link = item.Element("link")?.Value?.Trim() ?? item.Element("guid")?.Value?.Trim();
                    var pubDateStr = item.Element("pubDate")?.Value?.Trim();
                    var rawDesc = item.Element("description")?.Value?.Trim() ?? "";
                    var type = item.Element("type")?.Value?.Trim() ?? "Full-Time";
                    var region = item.Element("region")?.Value?.Trim() ?? "Remote";

                    if (string.IsNullOrEmpty(link) || seenUrls.Contains(link)) continue;
                    seenUrls.Add(link);

                    // Extract Company from "Company: Job Title" format
                    string company = "Unknown";
                    string title = rawTitle;
                    var colonIdx = rawTitle.IndexOf(':');
                    if (colonIdx > 0 && colonIdx < rawTitle.Length - 1)
                    {
                        company = rawTitle[..colonIdx].Trim();
                        title = rawTitle[(colonIdx + 1)..].Trim();
                    }

                    DateTime? publishedAt = null;
                    if (!string.IsNullOrEmpty(pubDateStr) && DateTime.TryParse(pubDateStr, out var parsedDt))
                    {
                        publishedAt = parsedDt.ToUniversalTime();
                    }

                    var plainDesc = Regex.Replace(rawDesc, "<.*?>", string.Empty);

                    jobList.Add(new JobPosting
                    {
                        Id = Guid.NewGuid(),
                        ExternalId = link,
                        Source = JobSource.WeWorkRemotely,
                        Title = title,
                        Company = company,
                        Location = string.IsNullOrWhiteSpace(region) ? "Remote" : region,
                        IsRemote = true,
                        JobType = type,
                        Description = plainDesc.Trim(),
                        Url = link,
                        PublishedAt = publishedAt,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch WWR RSS feed from {Url}", feedUrl);
            }
        }

        _logger.LogInformation("Successfully fetched {Count} jobs from WeWorkRemotely.", jobList.Count);
        return jobList;
    }
}
