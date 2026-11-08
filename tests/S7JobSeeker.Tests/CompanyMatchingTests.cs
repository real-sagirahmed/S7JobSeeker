using System.Text.Json;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Infrastructure.Data.Seed;
using Xunit;

namespace S7JobSeeker.Tests;

public class CompanyMatchingTests
{
    [Fact]
    public void SeedData_ContainsValidCompaniesWithTechStacks()
    {
        var companies = BdTechCompaniesData.GetSeedCompanies();

        Assert.NotEmpty(companies);
        Assert.True(companies.Count >= 40, $"Expected at least 40 seed companies, found {companies.Count}");

        foreach (var c in companies)
        {
            Assert.False(string.IsNullOrWhiteSpace(c.Name), "Company Name must not be empty.");
            Assert.False(string.IsNullOrWhiteSpace(c.Slug), $"Slug must not be empty for {c.Name}.");
            Assert.StartsWith("http", c.Website);
            Assert.StartsWith("http", c.CareersUrl);

            var stack = JsonSerializer.Deserialize<List<string>>(c.PrimaryTechStackJson);
            Assert.NotNull(stack);
            Assert.NotEmpty(stack);
        }
    }

    [Fact]
    public void TechFitScore_CalculatesAccurately_BasedOnCandidateOverlap()
    {
        // Brain Station 23 stack: C#, .NET, React, Angular, Python, AWS, Azure, Flutter, SQL Server
        var companyStack = new List<string> { "C#", ".NET", "React", "Azure", "SQL Server" };
        var candidateSkills = new List<string> { "C#", ".NET", "SQL Server" };

        var candidateSkillsSet = new HashSet<string>(candidateSkills, StringComparer.OrdinalIgnoreCase);
        var matching = companyStack.Where(s => candidateSkillsSet.Contains(s)).ToList();

        int fitScore = (int)Math.Round(((double)matching.Count / companyStack.Count) * 100.0);

        // 3 matching out of 5 = 60%
        Assert.Equal(60, fitScore);
        Assert.Equal(3, matching.Count);
        Assert.Contains("C#", matching);
        Assert.Contains(".NET", matching);
        Assert.Contains("SQL Server", matching);
    }

    [Fact]
    public void CompanyCategory_ContainsAllEssentialPillars()
    {
        var categories = Enum.GetValues<CompanyCategory>();

        Assert.Contains(CompanyCategory.EnterpriseOutsourcing, categories);
        Assert.Contains(CompanyCategory.GlobalSaaSAndProduct, categories);
        Assert.Contains(CompanyCategory.FintechAndHighScale, categories);
        Assert.Contains(CompanyCategory.CloudDevOpsAndInfra, categories);
        Assert.Contains(CompanyCategory.AIAndDataIntelligence, categories);
    }

    [Fact]
    public void DotNetEcosystem_IdentifiesAllKeyDotNetFirms()
    {
        var companies = BdTechCompaniesData.GetSeedCompanies();

        var dotNetCompanies = companies.Where(c =>
            c.PrimaryTechStackJson.Contains(".NET", StringComparison.OrdinalIgnoreCase) ||
            c.PrimaryTechStackJson.Contains("C#", StringComparison.OrdinalIgnoreCase)
        ).ToList();

        Assert.True(dotNetCompanies.Count >= 25, $"Expected at least 25 .NET companies, found {dotNetCompanies.Count}");

        var companyNames = dotNetCompanies.Select(c => c.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.Contains("Brain Station 23", companyNames);
        Assert.Contains("BJIT Group", companyNames);
        Assert.Contains("Enosis Solutions", companyNames);
        Assert.Contains("Cefalo Bangladesh", companyNames);
        Assert.Contains("Orbitax Bangladesh", companyNames);
        Assert.Contains("LeadSoft Bangladesh Limited", companyNames);
        Assert.Contains("Southtech Limited", companyNames);
        Assert.Contains("DataSoft Systems Bangladesh", companyNames);
        Assert.Contains("Craftsmen Software", companyNames);
    }

    [Fact]
    public void ClusterSummary_StructureSupportsDotNetSpecialPremierCategory()
    {
        var summary = new ClusterSummaryDto(
            ClusterKey: "dotnet",
            Title: ".NET & C# Enterprise",
            Tagline: "Top firms building with .NET Core & Azure",
            CategoryId: 0,
            TotalCompanies: 32,
            ActiveJobsCount: 45,
            FeaturedCompanies: ["Brain Station 23", "Orbitax Bangladesh", "Enosis Solutions"],
            IsSpecial: true
        );

        Assert.True(summary.IsSpecial);
        Assert.Equal("dotnet", summary.ClusterKey);
        Assert.Equal(0, summary.CategoryId);
        Assert.Equal(32, summary.TotalCompanies);
        Assert.Equal(45, summary.ActiveJobsCount);
        Assert.Equal(3, summary.FeaturedCompanies.Count);
    }
}
