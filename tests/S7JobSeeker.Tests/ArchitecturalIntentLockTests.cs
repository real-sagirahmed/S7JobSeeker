using S7JobSeeker.Core.Enums;
using Xunit;

namespace S7JobSeeker.Tests;

public class ArchitecturalIntentLockTests
{
    // ARCHITECTURAL INTENT: The system locks the Multi-Source Ingestion model:
    // 6 Open API / Gateway sources (Remotive, Arbeitnow, Jobicy, Himalayas, Bdjobs, LinkedIn) + 1 RSS source (WeWorkRemotely) + 1 Custom Paste source.
    [Fact]
    public void JobSourceEnum_MustHaveExactlyEightLockedSources()
    {
        var sources = Enum.GetValues<JobSource>();
        Assert.Equal(8, sources.Length);
        Assert.Contains(JobSource.Remotive, sources);
        Assert.Contains(JobSource.Arbeitnow, sources);
        Assert.Contains(JobSource.Jobicy, sources);
        Assert.Contains(JobSource.CustomPaste, sources);
        Assert.Contains(JobSource.Himalayas, sources);
        Assert.Contains(JobSource.WeWorkRemotely, sources);
        Assert.Contains(JobSource.Bdjobs, sources);
        Assert.Contains(JobSource.LinkedIn, sources);
    }

    [Fact]
    public void SkillCategories_MustCoverEssentialTechPillars()
    {
        var categories = Enum.GetValues<SkillCategory>();
        Assert.True(categories.Length >= 8);
        Assert.Contains(SkillCategory.Backend, categories);
        Assert.Contains(SkillCategory.Frontend, categories);
        Assert.Contains(SkillCategory.Database, categories);
        Assert.Contains(SkillCategory.CloudAndDevOps, categories);
        Assert.Contains(SkillCategory.AIAndData, categories);
    }

    [Fact]
    public void ProgramAndAuthController_JwtFallbacks_MustBeIdentical()
    {
        var authPath = Path.Combine(AppContext.BaseDirectory, "../../../../../src/Backend/S7JobSeeker.Api/Controllers/AuthController.cs");
        var programPath = Path.Combine(AppContext.BaseDirectory, "../../../../../src/Backend/S7JobSeeker.Api/Program.cs");

        if (File.Exists(authPath) && File.Exists(programPath))
        {
            var authCode = File.ReadAllText(authPath);
            var programCode = File.ReadAllText(programPath);

            Assert.Contains("\"s7job-seeker-api\"", authCode);
            Assert.Contains("\"s7job-seeker-api\"", programCode);

            Assert.Contains("\"s7job-seeker-client\"", authCode);
            Assert.Contains("\"s7job-seeker-client\"", programCode);
        }
    }
}
