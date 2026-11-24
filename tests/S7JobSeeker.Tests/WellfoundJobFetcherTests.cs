using S7JobSeeker.Core.Enums;
using S7JobSeeker.Infrastructure.JobFetchers;
using Xunit;

namespace S7JobSeeker.Tests;

public class WellfoundJobFetcherTests
{
    private const string SampleApolloJson = """
    {
      "props": {
        "pageProps": {
          "apolloState": {
            "data": {
              "StartupResult:9461632": {
                "__typename": "StartupResult",
                "id": "9461632",
                "name": "Ataraxis AI",
                "slug": "ataraxis-ai",
                "highConcept": "Transforming cancer care with AI precision medicine",
                "highlightedJobListings": [
                  { "__ref": "JobListingSearchResult:4337353" }
                ]
              },
              "JobListingSearchResult:4337353": {
                "__typename": "JobListingSearchResult",
                "id": "4337353",
                "title": "Senior AI Infrastructure Engineer",
                "slug": "senior-ai-infrastructure-engineer",
                "description": "Build high-throughput ML pipelines using Python, PyTorch, and Kubernetes on GCP.",
                "compensation": "$180k – $220k • 0.1% – 0.5%",
                "remote": true,
                "locationNames": ["San Francisco", "Remote"],
                "yearsExperienceMin": 5,
                "yearsExperienceMax": 8,
                "liveStartAt": 1794962902
              },
              "JobListingSearchResult:5095010": {
                "__typename": "JobListingSearchResult",
                "id": "5095010",
                "title": "Junior Full Stack Developer",
                "slug": "junior-full-stack-developer",
                "description": "Develop customer-facing web apps with TypeScript, React, and C# .NET APIs.",
                "compensation": "$85k – $110k",
                "remote": false,
                "locationNames": ["New York"],
                "yearsExperienceMin": 1,
                "yearsExperienceMax": 2,
                "liveStartAt": 1794962902
              }
            }
          }
        }
      }
    }
    """;

    [Fact]
    public void ParseWellfoundNextData_ParsesJobsAndLinksStartupsCorrectly()
    {
        var jobs = WellfoundJobFetcher.ParseWellfoundNextData(SampleApolloJson);

        Assert.Equal(2, jobs.Count);

        var aiJob = jobs.First(j => j.ExternalId == "4337353");
        Assert.Equal(JobSource.Wellfound, aiJob.Source);
        Assert.Equal("Senior AI Infrastructure Engineer", aiJob.Title);
        Assert.Equal("Ataraxis AI", aiJob.Company);
        Assert.Contains("San Francisco", aiJob.Location);
        Assert.True(aiJob.IsRemote);
        Assert.Equal("$180k – $220k • 0.1% – 0.5%", aiJob.SalaryRange);
        Assert.Equal("Senior", aiJob.ExperienceLevel);
        Assert.Equal("https://wellfound.com/jobs/4337353-senior-ai-infrastructure-engineer", aiJob.Url);
        Assert.Contains("About Ataraxis AI: Transforming cancer care with AI precision medicine", aiJob.Description);
        Assert.NotNull(aiJob.PublishedAt);

        var juniorJob = jobs.First(j => j.ExternalId == "5095010");
        Assert.Equal(JobSource.Wellfound, juniorJob.Source);
        Assert.Equal("Junior Full Stack Developer", juniorJob.Title);
        Assert.False(juniorJob.IsRemote);
        Assert.Equal("Junior", juniorJob.ExperienceLevel);
        Assert.Equal("$85k – $110k", juniorJob.SalaryRange);
        Assert.Equal("https://wellfound.com/jobs/5095010-junior-full-stack-developer", juniorJob.Url);
    }

    [Fact]
    public void ParseWellfoundHtml_ExtractsNextDataScriptCorrectly()
    {
        string sampleHtml = $"""
        <!DOCTYPE html>
        <html>
        <head><title>Wellfound</title></head>
        <body>
          <div id="__next">Content</div>
          <script id="__NEXT_DATA__" type="application/json">{SampleApolloJson}</script>
        </body>
        </html>
        """;

        var jobs = WellfoundJobFetcher.ParseWellfoundHtml(sampleHtml);
        Assert.Equal(2, jobs.Count);
        Assert.Contains(jobs, j => j.ExternalId == "4337353");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("<html><body>No Script Here</body></html>")]
    [InlineData("<script id=\"__NEXT_DATA__\">{}</script>")]
    public void ParseWellfoundHtml_InvalidOrEmpty_ReturnsEmptyList(string html)
    {
        var jobs = WellfoundJobFetcher.ParseWellfoundHtml(html);
        Assert.Empty(jobs);
    }
}
