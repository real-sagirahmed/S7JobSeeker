using S7JobSeeker.Infrastructure.Services;
using Xunit;

namespace S7JobSeeker.Tests;

public class ExperienceLevelDetectorTests
{
    [Theory]
    [InlineData("Graduate Software Engineer, Canonical Ubuntu", null, null, "Fresher")]
    [InlineData("Software Engineering Intern - Remote Job", null, null, "Fresher")]
    [InlineData("Trainee Software Developer", null, null, "Fresher")]
    [InlineData("Fresher .NET Developer", null, null, "Fresher")]
    [InlineData("Software Engineer", null, "Entry-level / graduate", "Fresher")]
    [InlineData("Junior Software Engineer", null, null, "Junior")]
    [InlineData("Software Engineer I", null, null, "Junior")]
    [InlineData("Associate .NET Developer", null, null, "Junior")]
    [InlineData("Software Engineer", null, "Junior (1-2 years)", "Junior")]
    [InlineData("Senior Software Engineer", null, null, "Senior")]
    [InlineData("Lead .NET Architect", null, null, "Senior")]
    [InlineData("Principal Engineer", null, null, "Senior")]
    [InlineData("Software Engineer", null, "Senior (5-10 years)", "Senior")]
    [InlineData("Software Engineer II", null, null, "Mid")]
    [InlineData("Mid-Level Software Developer", null, null, "Mid")]
    [InlineData("Software Engineer", null, "Mid-level (2-5 years)", "Mid")]
    public void Detect_ClassifiesSeniorityCorrectly(string title, string? description, string? rawExperience, string expected)
    {
        var result = ExperienceLevelDetector.Detect(title, description, rawExperience);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void Detect_UnknownTitleWithoutKeywords_ReturnsNull()
    {
        var result = ExperienceLevelDetector.Detect("Developer", "Generic description", null);
        Assert.Null(result);
    }
}
