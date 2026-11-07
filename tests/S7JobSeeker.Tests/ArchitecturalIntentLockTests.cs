using S7JobSeeker.Core.Enums;
using Xunit;

namespace S7JobSeeker.Tests;

public class ArchitecturalIntentLockTests
{
    // ARCHITECTURAL INTENT: The system locks the Dual Ingestion model:
    // 3 Open API sources (Remotive, Arbeitnow, Jobicy) + 1 Custom Paste source.
    [Fact]
    public void JobSourceEnum_MustHaveExactlyFourLockedSources()
    {
        var sources = Enum.GetValues<JobSource>();
        Assert.Equal(4, sources.Length);
        Assert.Contains(JobSource.Remotive, sources);
        Assert.Contains(JobSource.Arbeitnow, sources);
        Assert.Contains(JobSource.Jobicy, sources);
        Assert.Contains(JobSource.CustomPaste, sources);
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
}
