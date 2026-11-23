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

    // ARCHITECTURAL INTENT: Proprietary S7 Brand Nomenclature Lock
    // The system locks proprietary branding for all modules: S7 Match Radar, S7 Circular Scanner,
    // S7 Talent DNA, teamS7 CBS Engineering Immersion, S7 Production-Ready CBS Credential,
    // S7 Technical Readiness Dossier, and S7 Tailored Application Pack.
    // Third-party educational or aggregator names (e.g. "Coursera-Grade") MUST NOT be used.
    [Fact]
    public void LocaleBranding_MustEnforceProprietaryS7NomenclatureAndExcludeCompetitorNames()
    {
        var enLocalePath = Path.Combine(AppContext.BaseDirectory, "../../../../../src/Frontend/src/locales/en.ts");
        var bnLocalePath = Path.Combine(AppContext.BaseDirectory, "../../../../../src/Frontend/src/locales/bn.ts");

        if (File.Exists(enLocalePath) && File.Exists(bnLocalePath))
        {
            var enCode = File.ReadAllText(enLocalePath);
            var bnCode = File.ReadAllText(bnLocalePath);

            // Assert English proprietary branding
            Assert.Contains("'S7 Match Radar'", enCode);
            Assert.Contains("'S7 Circular Scanner'", enCode);
            Assert.Contains("'S7 Talent DNA'", enCode);
            Assert.Contains("'teamS7 CBS Engineering Immersion'", enCode);
            Assert.Contains("'S7 Production-Ready CBS Credential'", enCode);
            Assert.Contains("'S7 Technical Readiness Dossier'", enCode);
            Assert.Contains("'S7 Tailored Application Pack'", enCode);

            // Assert Bengali proprietary branding
            Assert.Contains("'S7 ম্যাচ রাডার'", bnCode);
            Assert.Contains("'S7 সার্কুলার স্ক্যানার'", bnCode);
            Assert.Contains("'S7 ট্যালেন্ট DNA'", bnCode);
            Assert.Contains("'teamS7 সিবিএস ইঞ্জিনিয়ারিং ইমার্শন'", bnCode);
            Assert.Contains("'S7 ভেরিফায়েড প্রোডাকশন ক্রেডেনশিয়াল'", bnCode);
            Assert.Contains("'S7 টেকনিক্যাল রেডিনেস ডসিয়ার'", bnCode);
            Assert.Contains("'S7 টেইলরড অ্যাপ্লিকেশন প্যাক'", bnCode);

            // Assert no active third-party educational competitor labels
            Assert.DoesNotContain("'Coursera-Grade CBS Career Sprint'", enCode);
            Assert.DoesNotContain("'Coursera-Grade Verified Certificate'", enCode);
            Assert.DoesNotContain("'Coursera-মানের সিবিএস ক্যারিয়ার স্প্রিন্ট'", bnCode);
            Assert.DoesNotContain("'Coursera-মানের ভেরিফায়েড সার্টিফিকেট'", bnCode);
        }
    }
}
