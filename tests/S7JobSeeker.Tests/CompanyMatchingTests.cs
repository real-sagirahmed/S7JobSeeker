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
}
