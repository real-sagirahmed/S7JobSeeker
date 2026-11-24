using S7JobSeeker.Core.Enums;
using S7JobSeeker.Infrastructure.JobFetchers;
using Xunit;

namespace S7JobSeeker.Tests;

public class FreelancerJobFetcherTests
{
    private const string SampleFreelancerJson = """
    {
      "status": "success",
      "result": {
        "projects": [
          {
            "id": 40832836,
            "title": "C# ASP.NET Core Web API Performance Tuning",
            "seo_url": "c-sharp-programming/Dotnet-Api-Performance-Tuning",
            "type": "fixed",
            "preview_description": "We need an expert .NET engineer to optimize EF Core queries, add Redis caching, and tune SQL Server performance.",
            "currency": {
              "code": "USD",
              "sign": "$"
            },
            "budget": {
              "minimum": 750.0,
              "maximum": 1500.0
            },
            "jobs": [
              { "id": 1, "name": "C# Programming" },
              { "id": 2, "name": ".NET" },
              { "id": 3, "name": "SQL Server" }
            ],
            "submitdate": 1795494309
          },
          {
            "id": 40832831,
            "title": "Fullstack React and .NET Developer Needed",
            "seo_url": "software-development/Fullstack-React-Dotnet-Developer",
            "type": "hourly",
            "preview_description": "Looking for a dedicated junior to mid-level developer to build new features on our SaaS platform.",
            "currency": {
              "code": "EUR",
              "sign": "€"
            },
            "budget": {
              "minimum": 30.0,
              "maximum": 50.0
            },
            "jobs": [
              { "id": 4, "name": "React.js" },
              { "id": 5, "name": "ASP.NET Core" }
            ],
            "submitdate": 1795494257
          }
        ],
        "total_count": 2
      }
    }
    """;

    [Fact]
    public void ParseFreelancerJson_ValidJson_ParsesProjectsCorrectly()
    {
        var projects = FreelancerJobFetcher.ParseFreelancerJson(SampleFreelancerJson);

        Assert.Equal(2, projects.Count);

        var first = projects[0];
        Assert.Equal("40832836", first.ExternalId);
        Assert.Equal(JobSource.Freelancer, first.Source);
        Assert.Equal("C# ASP.NET Core Web API Performance Tuning", first.Title);
        Assert.Equal("Freelancer Client", first.Company);
        Assert.True(first.IsRemote);
        Assert.Equal("Fixed", first.JobType);
        Assert.Equal("Fixed: $750 - $1500 USD", first.SalaryRange);
        Assert.Equal(100, first.FlexScore);
        Assert.True(first.IsWorkFromAnywhere);
        Assert.Equal("https://www.freelancer.com/projects/c-sharp-programming/Dotnet-Api-Performance-Tuning", first.Url);
        Assert.Contains("EF Core", first.Description);
        Assert.Contains("SQL Server", first.Description);
        Assert.NotNull(first.TagsJson);
        Assert.Contains("C# Programming", first.TagsJson);

        var second = projects[1];
        Assert.Equal("40832831", second.ExternalId);
        Assert.Equal(JobSource.Freelancer, second.Source);
        Assert.Equal("Hourly", second.JobType);
        Assert.Equal("Hourly: €30 - €50 EUR", second.SalaryRange);
        Assert.True(second.IsRemote);
        Assert.Equal(100, second.FlexScore);
    }

    [Fact]
    public void ParseFreelancerJson_PrioritizesFullDescriptionOverPreviewSnippet()
    {
        const string json = """
        {
          "status": "success",
          "result": {
            "projects": [
              {
                "id": 40833000,
                "title": "Complex .NET Microservices Architecture",
                "seo_url": "software-development/Dotnet-Microservices",
                "type": "fixed",
                "preview_description": "We need an engineer to...",
                "description": "We need an engineer to build an enterprise-grade ASP.NET Core 9 microservices platform using RabbitMQ, MediatR, and Clean Architecture.",
                "currency": { "code": "USD", "sign": "$" },
                "budget": { "minimum": 2000.0, "maximum": 4000.0 },
                "jobs": [{ "id": 15, "name": ".NET" }, { "id": 106, "name": "C# Programming" }],
                "submitdate": 1795495000
              }
            ],
            "total_count": 1
          }
        }
        """;

        var projects = FreelancerJobFetcher.ParseFreelancerJson(json);

        Assert.Single(projects);
        var job = projects[0];
        Assert.Contains("enterprise-grade ASP.NET Core 9 microservices platform", job.Description);
        Assert.DoesNotContain("We need an engineer to...", job.Description);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("{}")]
    [InlineData("{\"result\": { \"projects\": [] }}")]
    [InlineData("invalid json content")]
    public void ParseFreelancerJson_InvalidOrEmpty_ReturnsEmptyList(string invalidJson)
    {
        var projects = FreelancerJobFetcher.ParseFreelancerJson(invalidJson);
        Assert.NotNull(projects);
        Assert.Empty(projects);
    }
}
