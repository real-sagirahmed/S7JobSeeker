using S7JobSeeker.Core.Enums;
using S7JobSeeker.Infrastructure.JobFetchers;
using Xunit;

namespace S7JobSeeker.Tests;

public class CareerjetJobFetcherTests
{
    private const string SampleCareerjetJson = """
    {
      "type": "JOBS",
      "hits": 2,
      "pages": 1,
      "jobs": [
        {
          "url": "https://www.careerjet.com.bd/job/cj_dot_net_12345.html",
          "title": "Senior .NET Core Backend Engineer",
          "company": "Dhaka Tech Hub Ltd",
          "locations": "Dhaka, Bangladesh",
          "salary": "BDT 90,000 - 130,000 per month",
          "salary_min": 90000,
          "salary_max": 130000,
          "salary_type": "M",
          "salary_currency_code": "BDT",
          "date": "2026-11-20T08:00:00Z",
          "description": "<p>We are hiring an experienced .NET Core Engineer to design distributed services with C#, EF Core, and PostgreSQL.</p>",
          "site": "careerjet.com.bd"
        },
        {
          "url": "https://www.careerjet.com.bd/job/cj_junior_dev_67890.html",
          "title": "Junior Full Stack Developer (Remote)",
          "company": "InnoSoft Global",
          "locations": "Remote, Bangladesh",
          "salary": "",
          "salary_min": 35000,
          "salary_max": 50000,
          "salary_type": "M",
          "salary_currency_code": "BDT",
          "date": "2026-11-22T10:00:00Z",
          "description": "<div>Junior developer responsible for React frontend and Node/C# backend APIs. Work from home supported.</div>",
          "site": "careerjet.com.bd"
        }
      ]
    }
    """;

    [Fact]
    public void ParseCareerjetJson_ParsesJobPostingsAccurately()
    {
        var jobs = CareerjetJobFetcher.ParseCareerjetJson(SampleCareerjetJson);

        Assert.Equal(2, jobs.Count);

        var seniorJob = jobs[0];
        Assert.Equal(JobSource.Careerjet, seniorJob.Source);
        Assert.Equal("Senior .NET Core Backend Engineer", seniorJob.Title);
        Assert.Equal("Dhaka Tech Hub Ltd", seniorJob.Company);
        Assert.Equal("Dhaka, Bangladesh", seniorJob.Location);
        Assert.False(seniorJob.IsRemote);
        Assert.Equal("BDT 90,000 - 130,000 per month", seniorJob.SalaryRange);
        Assert.Equal("Senior", seniorJob.ExperienceLevel);
        Assert.Equal("https://www.careerjet.com.bd/job/cj_dot_net_12345.html", seniorJob.Url);
        Assert.Contains(".NET Core Engineer", seniorJob.Description);
        Assert.DoesNotContain("<p>", seniorJob.Description);
        Assert.NotEmpty(seniorJob.ExternalId);

        var juniorJob = jobs[1];
        Assert.Equal(JobSource.Careerjet, juniorJob.Source);
        Assert.Equal("Junior Full Stack Developer (Remote)", juniorJob.Title);
        Assert.True(juniorJob.IsRemote);
        Assert.Equal("Junior", juniorJob.ExperienceLevel);
        Assert.Equal("BDT 35,000 - 50,000", juniorJob.SalaryRange);
        Assert.Equal("https://www.careerjet.com.bd/job/cj_junior_dev_67890.html", juniorJob.Url);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("{}")]
    [InlineData("{\"jobs\": []}")]
    [InlineData("{\"type\": \"ERROR\", \"error\": \"Invalid API key\"}")]
    public void ParseCareerjetJson_EmptyOrError_ReturnsEmptyList(string json)
    {
        var jobs = CareerjetJobFetcher.ParseCareerjetJson(json);
        Assert.Empty(jobs);
    }

    [Fact]
    public void ParseCareerjetJson_SalaryMinOnly_FormatsCorrectly()
    {
        const string json = """
        {
          "type": "JOBS",
          "jobs": [
            {
              "url": "https://www.careerjet.com.bd/job/test.html",
              "title": "Software QA Engineer",
              "company": "Quality First",
              "locations": "Dhaka",
              "salary_min": 45000,
              "salary_max": 0,
              "description": "Manual and automated test QA."
            }
          ]
        }
        """;

        var jobs = CareerjetJobFetcher.ParseCareerjetJson(json);
        Assert.Single(jobs);
        Assert.Equal("From BDT 45,000", jobs[0].SalaryRange);
    }
}
