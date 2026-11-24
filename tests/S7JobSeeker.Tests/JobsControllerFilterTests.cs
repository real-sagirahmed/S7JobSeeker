using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using Xunit;

namespace S7JobSeeker.Tests;

public class JobsControllerFilterTests
{
    private readonly List<JobPosting> _sampleJobs =
    [
        new()
        {
            Id = Guid.NewGuid(),
            Title = "Senior .NET Developer",
            Description = "Lead backend services with ASP.NET Core and EF Core",
            ExperienceLevel = "Senior",
            Source = JobSource.Jobgether
        },
        new()
        {
            Id = Guid.NewGuid(),
            Title = "Junior .NET Developer",
            Description = "Work with C# and ASP.NET Core. 1-2 years experience required.",
            ExperienceLevel = "Junior",
            Source = JobSource.Jobgether
        },
        new()
        {
            Id = Guid.NewGuid(),
            Title = "Graduate Software Engineer",
            Description = "Open for fresh graduates and entry-level developers.",
            ExperienceLevel = "Fresher",
            Source = JobSource.Jobgether
        },
        new()
        {
            Id = Guid.NewGuid(),
            Title = "Senior React Architect",
            Description = "Frontend web application architecture with TypeScript and Next.js.",
            ExperienceLevel = "Senior",
            Source = JobSource.LinkedIn
        }
    ];

    [Fact]
    public void Filter_ByDotNetSearch_ReturnsOnlyDotNetJobs()
    {
        const string search = ".net";
        var results = _sampleJobs.Where(j =>
            j.Title.Contains(search, StringComparison.OrdinalIgnoreCase) ||
            j.Title.Contains("dotnet", StringComparison.OrdinalIgnoreCase) ||
            j.Title.Contains("c#", StringComparison.OrdinalIgnoreCase) ||
            j.Description.Contains(search, StringComparison.OrdinalIgnoreCase) ||
            j.Description.Contains("dotnet", StringComparison.OrdinalIgnoreCase) ||
            j.Description.Contains("asp.net", StringComparison.OrdinalIgnoreCase) ||
            j.Description.Contains("c#", StringComparison.OrdinalIgnoreCase)).ToList();

        Assert.Equal(2, results.Count);
        Assert.All(results, j => Assert.Contains(".NET", j.Title));
    }

    [Fact]
    public void Filter_ByJuniorExperience_ReturnsJuniorAndFresherJobs()
    {
        const string experienceLevel = "Junior";
        var results = _sampleJobs.Where(j =>
            j.ExperienceLevel == experienceLevel || j.ExperienceLevel == "Fresher" ||
            j.Title.Contains(experienceLevel, StringComparison.OrdinalIgnoreCase) ||
            j.Title.Contains("fresher", StringComparison.OrdinalIgnoreCase)).ToList();

        Assert.Equal(2, results.Count);
        Assert.Contains(results, j => j.Title == "Junior .NET Developer");
        Assert.Contains(results, j => j.Title == "Graduate Software Engineer");
    }

    [Fact]
    public void Filter_ByDotNetAndJuniorExperience_ReturnsExactJuniorDotNetDeveloper()
    {
        var results = _sampleJobs.Where(j =>
            (j.Title.Contains(".net", StringComparison.OrdinalIgnoreCase) || j.Description.Contains(".net", StringComparison.OrdinalIgnoreCase)) &&
            (j.ExperienceLevel == "Junior" || j.ExperienceLevel == "Fresher")).ToList();

        Assert.Single(results);
        Assert.Equal("Junior .NET Developer", results[0].Title);
        Assert.Equal("Junior", results[0].ExperienceLevel);
    }
}
