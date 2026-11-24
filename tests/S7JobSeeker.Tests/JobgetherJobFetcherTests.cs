using S7JobSeeker.Core.Enums;
using S7JobSeeker.Infrastructure.JobFetchers;
using Xunit;

namespace S7JobSeeker.Tests;

public class JobgetherJobFetcherTests
{
    private const string SampleJobgetherJson = """
    {
      "jobs": [
        {
          "id": "6affbf538acd9c1f9b305e35",
          "title": "Software Engineer - Postgres Tooling",
          "company": "Supabase",
          "url": "https://jobgether.com/offer/6affbf538acd9c1f9b305e35-software-engineer---postgres-tooling",
          "location": "Anywhere",
          "remote": "Full Remote",
          "contractType": "Full time",
          "experience": "Senior (5-10 years)",
          "jobFunctions": ["Software Engineer"],
          "postedAt": "2026-11-20T03:32:35.183Z"
        },
        {
          "id": "6afb21be8acd9c1f9b191eb2",
          "title": "Graduate Software Engineer, Open Source and Linux",
          "company": "Canonical",
          "url": "https://jobgether.com/offer/6afb21be8acd9c1f9b191eb2-graduate-software-engineer",
          "location": "Worldwide",
          "remote": true,
          "contractType": "Full time",
          "experience": "Entry-level / graduate",
          "jobFunctions": ["Open Source Developer", "Linux"],
          "postedAt": "2026-11-16T15:31:11.105Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 2,
        "hasMore": true
      }
    }
    """;

    [Fact]
    public void ParseJobgetherJson_ValidJson_ParsesJobPostingsCorrectly()
    {
        var jobs = JobgetherJobFetcher.ParseJobgetherJson(SampleJobgetherJson);

        Assert.Equal(2, jobs.Count);

        var first = jobs[0];
        Assert.Equal("6affbf538acd9c1f9b305e35", first.ExternalId);
        Assert.Equal(JobSource.Jobgether, first.Source);
        Assert.Equal("Software Engineer - Postgres Tooling", first.Title);
        Assert.Equal("Supabase", first.Company);
        Assert.Equal("Anywhere", first.Location);
        Assert.True(first.IsRemote);
        Assert.Equal("Full time", first.JobType);
        Assert.Equal("Senior", first.ExperienceLevel);
        Assert.Contains("Supabase", first.Description);
        Assert.Contains("Software Engineer", first.Description);
        Assert.Equal("https://jobgether.com/offer/6affbf538acd9c1f9b305e35-software-engineer---postgres-tooling", first.Url);

        var second = jobs[1];
        Assert.Equal("6afb21be8acd9c1f9b191eb2", second.ExternalId);
        Assert.Equal(JobSource.Jobgether, second.Source);
        Assert.Equal("Canonical", second.Company);
        Assert.Equal("Fresher", second.ExperienceLevel);
        Assert.True(second.IsRemote);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("{}")]
    [InlineData("{\"jobs\": []}")]
    public void ParseJobgetherJson_EmptyOrMissingJobs_ReturnsEmptyList(string json)
    {
        var jobs = JobgetherJobFetcher.ParseJobgetherJson(json);
        Assert.NotNull(jobs);
        Assert.Empty(jobs);
    }
}
