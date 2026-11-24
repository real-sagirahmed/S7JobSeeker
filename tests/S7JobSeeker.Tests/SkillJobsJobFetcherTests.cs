using S7JobSeeker.Core.Enums;
using S7JobSeeker.Infrastructure.JobFetchers;
using Xunit;

namespace S7JobSeeker.Tests;

public class SkillJobsJobFetcherTests
{
    private const string SampleSkillJobsJson = """
    {
      "count": 3,
      "next": null,
      "previous": null,
      "results": [
        {
          "id": 9935,
          "company_name": "ATI Limited",
          "company_details": {
            "name": "ATI Limited"
          },
          "title": "Data Analyst – Intern (ATI Limited)",
          "slug": "data-analyst-intern-ati-limited-7EZsBKoB",
          "position_summary": "<p>Looking for a motivated Data Analyst Intern to extract and analyze data.</p>",
          "job_responsibility": "<ul><li>Analyze data using SQL and Python.</li><li>Build dashboards and reporting models.</li></ul>",
          "qualification": "<ul><li>BSc in Computer Science or Statistics.</li></ul>",
          "skills_details": [
            { "id": 1, "name": "Python" },
            { "id": 2, "name": "SQL" }
          ],
          "location": "ATI Centre, Sector-11, Uttara, Dhaka-1230",
          "division": "Dhaka",
          "type": "Intern",
          "level": "Beginner",
          "workplace": "Work From Office",
          "min_salary": 15000.0,
          "max_salary": 20000.0,
          "showSalary": true,
          "isNegotiable": false,
          "min_experience_range": 0.0,
          "max_experience_range": 1.0,
          "allowFreshers": true,
          "created_at": "Nov 23, 2026"
        },
        {
          "id": 9941,
          "company_name": "Euro BD Deutschland",
          "title": "Junior .NET Software Engineer",
          "slug": "junior-dotnet-software-engineer-KiQfvNtA",
          "position_summary": "<p>Remote .NET backend engineer role.</p>",
          "job_responsibility": "<p>Develop microservices with ASP.NET Core.</p>",
          "qualification": "<p>Experience with C# and Web APIs.</p>",
          "skills_details": [
            { "id": 3, "name": "C#" },
            { "id": 4, "name": ".NET" }
          ],
          "location": "Remote",
          "division": "Dhaka",
          "type": "Full Time",
          "level": "Junior",
          "workplace": "Work From Home",
          "min_salary": 40000.0,
          "max_salary": 60000.0,
          "showSalary": true,
          "isNegotiable": false,
          "min_experience_range": 1.0,
          "max_experience_range": 2.0,
          "allowFreshers": false,
          "created_at": "Nov 24, 2026"
        },
        {
          "id": 9939,
          "company_name": "Inteaco group & Days Hotel",
          "title": "F&B Associate (Inteaco group & Days Hotel)",
          "slug": "fb-associate-inteaco-group-days-hotel-HsrL2Lbf",
          "position_summary": "<p>F&B service in hotel dining room.</p>",
          "job_responsibility": "<p>Serving food and beverages to hotel guests.</p>",
          "qualification": "<p>High school diploma or hospitality certification.</p>",
          "skills_details": [
            { "id": 10, "name": "Food Service" }
          ],
          "location": "Baridhara, Dhaka",
          "division": "Dhaka",
          "type": "Full Time",
          "level": "Beginner",
          "workplace": "Work From Office",
          "min_salary": 12000.0,
          "max_salary": 16000.0,
          "isNegotiable": false,
          "allowFreshers": true,
          "created_at": "Nov 23, 2026"
        }
      ]
    }
    """;

    [Fact]
    public void ParseSkillJobsJson_ParsesAndFiltersTechJobsAccurately()
    {
        var jobs = SkillJobsJobFetcher.ParseSkillJobsJson(SampleSkillJobsJson);

        // Assert: 2 tech jobs retained, 1 F&B non-tech job excluded
        Assert.Equal(2, jobs.Count);

        var internJob = jobs.First(j => j.ExternalId == "9935");
        Assert.Equal(JobSource.SkillJobs, internJob.Source);
        Assert.Equal("Data Analyst – Intern (ATI Limited)", internJob.Title);
        Assert.Equal("ATI Limited", internJob.Company);
        Assert.Equal("ATI Centre, Sector-11, Uttara, Dhaka-1230", internJob.Location);
        Assert.False(internJob.IsRemote);
        Assert.Equal("BDT 15,000 - 20,000", internJob.SalaryRange);
        Assert.Equal("Intern", internJob.JobType);
        Assert.Equal("Fresher", internJob.ExperienceLevel);
        Assert.Equal("https://skill.jobs/jobs/data-analyst-intern-ati-limited-7EZsBKoB", internJob.Url);
        Assert.Contains("Role Summary:", internJob.Description);
        Assert.Contains("Key Responsibilities:", internJob.Description);
        Assert.Contains("Python", internJob.Description);
        Assert.Contains("SQL", internJob.Description);
        Assert.DoesNotContain("<p>", internJob.Description);

        var remoteJob = jobs.First(j => j.ExternalId == "9941");
        Assert.Equal(JobSource.SkillJobs, remoteJob.Source);
        Assert.Equal("Junior .NET Software Engineer", remoteJob.Title);
        Assert.True(remoteJob.IsRemote);
        Assert.Equal("Junior", remoteJob.ExperienceLevel);
        Assert.Equal("BDT 40,000 - 60,000", remoteJob.SalaryRange);
        Assert.Equal("https://skill.jobs/jobs/junior-dotnet-software-engineer-KiQfvNtA", remoteJob.Url);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("{}")]
    [InlineData("{\"results\": []}")]
    public void ParseSkillJobsJson_EmptyOrMissingJobs_ReturnsEmptyList(string json)
    {
        var jobs = SkillJobsJobFetcher.ParseSkillJobsJson(json);
        Assert.Empty(jobs);
    }

    [Fact]
    public void ParseSkillJobsJson_NegotiableSalary_FormattedCorrectly()
    {
        const string json = """
        {
          "results": [
            {
              "id": 9999,
              "company_name": "Tech Corp",
              "title": "Senior Software Architect",
              "slug": "senior-software-architect",
              "location": "Dhaka",
              "workplace": "Hybrid",
              "isNegotiable": true,
              "min_salary": null,
              "max_salary": null,
              "allowFreshers": false,
              "min_experience_range": 5.0,
              "max_experience_range": 8.0,
              "position_summary": "Architect scalable cloud systems."
            }
          ]
        }
        """;

        var jobs = SkillJobsJobFetcher.ParseSkillJobsJson(json);
        Assert.Single(jobs);
        var job = jobs[0];
        Assert.Equal("Negotiable", job.SalaryRange);
        Assert.Equal("Senior", job.ExperienceLevel);
    }
}
