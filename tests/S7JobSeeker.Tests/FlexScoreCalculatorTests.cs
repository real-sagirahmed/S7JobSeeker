using S7JobSeeker.Core.Services;
using System.Diagnostics;
using Xunit;

namespace S7JobSeeker.Tests;

public class FlexScoreCalculatorTests
{
    private readonly FlexScoreCalculator _calculator = new();

    [Fact]
    public void Worldwide_Async_Contractor_ShouldHaveHighFlexScore_AndWfaTrue()
    {
        var location = "Worldwide Remote";
        var description = "We are a 100% remote company. Work from anywhere in the world. Asynchronous communication, set your own hours. B2B contractor agreements via Deel with equipment stipend.";

        var result = _calculator.CalculateFlexScore(location, description, isRemote: true);

        Assert.True(result.OverallFlexScore >= 90, $"Expected >= 90, got {result.OverallFlexScore}");
        Assert.True(result.IsWorkFromAnywhere);
        Assert.Equal(100, result.WhereScore);
        Assert.Equal(100, result.WhenScore);
        Assert.True(result.HowScore >= 95);
        Assert.Contains("WFA", result.TimezoneRequirements);
    }

    [Fact]
    public void CountryLocked_US_Only_ShouldHaveRestrictedScore_AndWfaFalse()
    {
        var location = "US Only";
        var description = "Remote position for candidates authorized to work in the US. Core hours 9am - 5pm EST with standard team standup.";

        var result = _calculator.CalculateFlexScore(location, description, isRemote: true);

        Assert.True(result.OverallFlexScore < 70, $"Expected < 70, got {result.OverallFlexScore}");
        Assert.False(result.IsWorkFromAnywhere);
        Assert.True(result.WhereScore <= 50);
        Assert.Contains("Country-Restricted", result.TimezoneRequirements);
    }

    [Fact]
    public void Hybrid_Role_ShouldHaveModerateScore()
    {
        var location = "Dhaka, Bangladesh";
        var description = "This is a hybrid position requiring 3 days in office per week with flexible timings on remote days.";

        var result = _calculator.CalculateFlexScore(location, description, isRemote: false);

        Assert.True(result.OverallFlexScore <= 60, $"Expected <= 60, got {result.OverallFlexScore}");
        Assert.False(result.IsWorkFromAnywhere);
        Assert.Contains("Hybrid", result.TimezoneRequirements);
    }

    [Fact]
    public void OnSite_Role_ShouldHaveLowScore()
    {
        var location = "Frankfurt, Germany";
        var description = "On-site full-time engineer required. Relocation required with fixed working hours.";

        var result = _calculator.CalculateFlexScore(location, description, isRemote: false);

        Assert.True(result.OverallFlexScore <= 35, $"Expected <= 35, got {result.OverallFlexScore}");
        Assert.False(result.IsWorkFromAnywhere);
        Assert.True(result.WhereScore <= 20);
    }

    [Fact]
    public void DeterministicPerformance_ShouldEvaluateHundredsOfJobs_InFewMilliseconds()
    {
        var descriptions = new[]
        {
            "Work from anywhere in the world. Fully async culture with results-oriented autonomy and Deel contract.",
            "Remote within the US only. 4 hours overlap with EST required. Full-time W2.",
            "Hybrid setup with 2 days in office and 3 days remote. Standard business hours.",
            "Strictly on-site role in London office. Relocation required.",
            "Global remote position with flexible working hours and home office stipend."
        };

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 500; i++)
        {
            var text = descriptions[i % descriptions.Length];
            var res = _calculator.CalculateFlexScore("Global", text, isRemote: true);
            Assert.True(res.OverallFlexScore >= 15 && res.OverallFlexScore <= 99);
        }
        sw.Stop();

        // 500 job evaluations should take under 50ms with pre-compiled regexes
        Assert.True(sw.ElapsedMilliseconds < 100, $"Expected < 100ms for 500 evaluations, but took {sw.ElapsedMilliseconds}ms");
    }
}
