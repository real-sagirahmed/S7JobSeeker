using System.Net;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Infrastructure.JobFetchers;
using Xunit;

namespace S7JobSeeker.Tests;

public class MockHttpMessageHandler : HttpMessageHandler
{
    private readonly Func<HttpRequestMessage, HttpResponseMessage> _handler;

    public MockHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler)
    {
        _handler = handler;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        return Task.FromResult(_handler(request));
    }
}

public class JobFetcherTests
{
    [Fact]
    public async Task JobicyJobFetcher_ParsesJobsSuccessfully()
    {
        var sampleJson = """
        {
            "jobs": [
                {
                    "id": "jobicy-101",
                    "jobTitle": "Lead Full Stack .NET Engineer",
                    "companyName": "CloudScale Systems",
                    "jobGeo": "USA, Remote",
                    "jobDescription": "<p>Looking for a strong <strong>C# and .NET</strong> engineer.</p>",
                    "url": "https://jobicy.com/jobs/101",
                    "annualSalaryMin": 120000,
                    "annualSalaryMax": 150000,
                    "salaryCurrency": "USD",
                    "jobType": ["Full-time"],
                    "pubDate": "2026-11-07T08:00:00Z"
                }
            ]
        }
        """;

        var handler = new MockHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(sampleJson, Encoding.UTF8, "application/json")
        });

        var client = new HttpClient(handler);
        var fetcher = new JobicyJobFetcher(client, NullLogger<JobicyJobFetcher>.Instance);

        var result = await fetcher.FetchLatestJobsAsync();

        Assert.Single(result);
        var job = result[0];
        Assert.Equal("jobicy-101", job.ExternalId);
        Assert.Equal(JobSource.Jobicy, job.Source);
        Assert.Equal("Lead Full Stack .NET Engineer", job.Title);
        Assert.Equal("CloudScale Systems", job.Company);
        Assert.Equal("USA, Remote", job.Location);
        Assert.True(job.IsRemote);
        Assert.Equal("120000 - 150000 USD", job.SalaryRange);
        Assert.DoesNotContain("<p>", job.Description);
    }

    [Fact]
    public async Task HimalayasJobFetcher_ParsesJobsSuccessfully()
    {
        var sampleJson = """
        {
            "jobs": [
                {
                    "guid": "https://himalayas.app/jobs/hima-202",
                    "title": "Senior AI Systems Architect",
                    "companyName": "NextGen AI",
                    "description": "<p>Deep learning & <em>RAG</em> pipelines.</p>",
                    "employmentType": "Full-time",
                    "minSalary": 140000,
                    "maxSalary": 180000,
                    "currency": "USD",
                    "salaryPeriod": "yr",
                    "pubDate": 1794049652,
                    "applicationLink": "https://himalayas.app/jobs/hima-202"
                }
            ]
        }
        """;

        var handler = new MockHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(sampleJson, Encoding.UTF8, "application/json")
        });

        var client = new HttpClient(handler);
        var fetcher = new HimalayasJobFetcher(client, NullLogger<HimalayasJobFetcher>.Instance);

        var result = await fetcher.FetchLatestJobsAsync();

        Assert.Single(result);
        var job = result[0];
        Assert.Equal("https://himalayas.app/jobs/hima-202", job.ExternalId);
        Assert.Equal(JobSource.Himalayas, job.Source);
        Assert.Equal("Senior AI Systems Architect", job.Title);
        Assert.Equal("NextGen AI", job.Company);
        Assert.Equal("$140000 - $180000 USD/yr", job.SalaryRange);
    }

    [Fact]
    public async Task WwrJobFetcher_ParsesXmlRssSuccessfully()
    {
        var sampleXml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Vertican: Senior Applied AI Engineer</title>
              <link>https://weworkremotely.com/jobs/vertican-ai</link>
              <pubDate>Fri, 07 Nov 2026 09:30:00 +0000</pubDate>
              <region>Worldwide</region>
              <type>Full-Time</type>
              <description>&lt;p&gt;Building intelligent LLM workflows.&lt;/p&gt;</description>
            </item>
          </channel>
        </rss>
        """;

        var handler = new MockHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(sampleXml, Encoding.UTF8, "application/xml")
        });

        var client = new HttpClient(handler);
        var fetcher = new WwrJobFetcher(client, NullLogger<WwrJobFetcher>.Instance);

        var result = await fetcher.FetchLatestJobsAsync();

        Assert.NotEmpty(result);
        var job = result[0];
        Assert.Equal(JobSource.WeWorkRemotely, job.Source);
        Assert.Equal("Senior Applied AI Engineer", job.Title);
        Assert.Equal("Vertican", job.Company);
        Assert.Equal("Worldwide", job.Location);
    }

    [Fact]
    public async Task BdjobsJobFetcher_ParsesAndFiltersTechJobs()
    {
        var sampleJson = """
        {
            "data": [
                {
                    "Jobid": "1553412",
                    "jobTitle": "Senior Software Engineer (.NET & Angular)",
                    "companyName": "Dhaka Tech Hub",
                    "location": "Banani, Dhaka",
                    "Cat_id": 8,
                    "WorkPlace": "Office",
                    "JobType": "FullTime",
                    "jobDescription": "Experience with C#, ASP.NET Core, and Angular",
                    "eduRec": "BSc in CSE",
                    "experience": "3 to 5 years",
                    "publishDate": "2026-11-07T10:00:00Z",
                    "Salary": {
                        "MinSalary": 100000,
                        "MaxSalary": 150000
                    }
                },
                {
                    "Jobid": "9999999",
                    "jobTitle": "Unit In Charge, Pharmacy Outlet",
                    "companyName": "Medicine Corp",
                    "location": "Uttara, Dhaka",
                    "Cat_id": 29,
                    "WorkPlace": "Office",
                    "JobType": "FullTime",
                    "jobDescription": "Pharmacy oversight",
                    "publishDate": "2026-11-07T10:00:00Z"
                }
            ]
        }
        """;

        var handler = new MockHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(sampleJson, Encoding.UTF8, "application/json")
        });

        var client = new HttpClient(handler);
        var fetcher = new BdjobsJobFetcher(client, NullLogger<BdjobsJobFetcher>.Instance);

        var result = await fetcher.FetchLatestJobsAsync();

        // Pharmacy job should be filtered out; only Tech job included
        Assert.Single(result);
        var job = result[0];
        Assert.Equal("1553412", job.ExternalId);
        Assert.Equal(JobSource.Bdjobs, job.Source);
        Assert.Equal("Senior Software Engineer (.NET & Angular)", job.Title);
        Assert.Equal("Dhaka Tech Hub", job.Company);
        Assert.Equal("Banani, Dhaka", job.Location);
        Assert.Equal("BDT 100,000 - 150,000", job.SalaryRange);
        Assert.Equal("https://bdjobs.com/h/details/1553412", job.Url);
    }

    [Fact]
    public async Task LinkedinJobFetcher_ParsesGuestHtmlSuccessfully()
    {
        var sampleHtml = """
        <!DOCTYPE html>
        <ul>
          <li>
            <div class="base-card" data-entity-urn="urn:li:jobPosting:4487731921">
              <a class="base-card__full-link" href="https://bd.linkedin.com/jobs/view/senior-software-developer-net-4487731921?refId=123">
                <span class="sr-only">Senior .NET Developer</span>
              </a>
              <div class="base-search-card__info">
                <h3 class="base-search-card__title">
                  Senior .NET Developer
                </h3>
                <h4 class="base-search-card__subtitle">
                  <a class="hidden-nested-link" href="https://bd.linkedin.com/company/net-bridge">
                    Net Bridge Ltd
                  </a>
                </h4>
                <div class="base-search-card__metadata">
                  <span class="job-search-card__location">
                    Gulshan, Dhaka, Bangladesh
                  </span>
                  <time class="job-search-card__listdate" datetime="2026-11-07">1 hour ago</time>
                </div>
              </div>
            </div>
          </li>
        </ul>
        """;

        var handler = new MockHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(sampleHtml, Encoding.UTF8, "text/html")
        });

        var client = new HttpClient(handler);
        var fetcher = new LinkedinJobFetcher(client, NullLogger<LinkedinJobFetcher>.Instance);

        var result = await fetcher.FetchLatestJobsAsync();

        Assert.Single(result);
        var job = result[0];
        Assert.Equal("4487731921", job.ExternalId);
        Assert.Equal(JobSource.LinkedIn, job.Source);
        Assert.Equal("Senior .NET Developer", job.Title);
        Assert.Equal("Net Bridge Ltd", job.Company);
        Assert.Equal("Gulshan, Dhaka, Bangladesh", job.Location);
        Assert.Equal("https://bd.linkedin.com/jobs/view/senior-software-developer-net-4487731921", job.Url);
        Assert.NotNull(job.PublishedAt);
    }
}
