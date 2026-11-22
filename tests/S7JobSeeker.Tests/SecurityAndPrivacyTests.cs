using System.Text.Json;
using Xunit;

namespace S7JobSeeker.Tests;

public class SecurityAndPrivacyTests
{
    [Fact]
    public void AppSettings_MustNotContainRealProductionApiKeys_ForPublicRepositorySafety()
    {
        var appSettingsPath = Path.Combine(AppContext.BaseDirectory, "../../../../../src/Backend/S7JobSeeker.Api/appsettings.json");
        if (File.Exists(appSettingsPath))
        {
            var json = File.ReadAllText(appSettingsPath);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            // Gemini ApiKey must be empty in committed source
            if (root.TryGetProperty("GeminiSettings", out var gemini) && gemini.TryGetProperty("ApiKey", out var geminiKey))
            {
                var val = geminiKey.GetString();
                Assert.True(string.IsNullOrEmpty(val) || val == "DEMO_KEY", "Gemini API key must not be hardcoded in committed appsettings.json for a public repository!");
            }

            // Qdrant ApiKey must be empty in committed source
            if (root.TryGetProperty("QdrantSettings", out var qdrant) && qdrant.TryGetProperty("ApiKey", out var qdrantKey))
            {
                var val = qdrantKey.GetString();
                Assert.True(string.IsNullOrEmpty(val), "Qdrant API key must not be hardcoded in committed appsettings.json for a public repository!");
            }
        }
    }

    [Fact]
    public void GitIgnore_MustExistAndBlockSensitiveFiles()
    {
        var gitIgnorePath = Path.Combine(AppContext.BaseDirectory, "../../../../../.gitignore");
        if (File.Exists(gitIgnorePath))
        {
            var text = File.ReadAllText(gitIgnorePath);
            Assert.Contains("appsettings.Development.json", text);
            Assert.Contains("*.env", text);
            Assert.Contains("secrets.json", text);
            Assert.Contains("**/bin/", text);
            Assert.Contains("**/obj/", text);
            Assert.Contains("*.pdf", text);
        }
    }

    [Theory]
    [InlineData("s7-cron-secret-key-change-in-production-2026", "s7-cron-secret-key-change-in-production-2026", true)]
    [InlineData("Bearer s7-cron-secret-key-change-in-production-2026", "s7-cron-secret-key-change-in-production-2026", false)] // raw bearer prefix handled in controller
    [InlineData(" s7-cron-secret-key-change-in-production-2026 \r\n", "s7-cron-secret-key-change-in-production-2026", true)]
    [InlineData("\"s7-cron-secret-key-change-in-production-2026\"", "s7-cron-secret-key-change-in-production-2026", true)]
    [InlineData("'s7-cron-secret-key-change-in-production-2026'", "s7-cron-secret-key-change-in-production-2026", true)]
    [InlineData("invalid-key", "s7-cron-secret-key-change-in-production-2026", false)]
    [InlineData("", "s7-cron-secret-key-change-in-production-2026", false)]
    [InlineData(null, "s7-cron-secret-key-change-in-production-2026", false)]
    [InlineData("s7-cron-secret-key-change-in-production-2026", "custom-production-secret-999", false)] // Backdoor attempt must fail
    [InlineData("default-cron-secret", "custom-production-secret-999", false)] // Backdoor attempt must fail
    [InlineData("custom-production-secret-999", "custom-production-secret-999", true)]
    public void IsValidCronKey_ShouldValidateAndSanitizeKeysCorrectly(string? provided, string expected, bool shouldBeValid)
    {
        var result = S7JobSeeker.Api.Controllers.JobsController.IsValidCronKey(provided, expected);
        Assert.Equal(shouldBeValid, result);
    }

    [Fact]
    public void CronAndMigrationEndpoints_MustNotContainHardcodedBypassSecrets()
    {
        // ARCHITECTURAL INTENT: Prevent backdoor bypasses in cron job synchronization and database migration
        var healthPath = Path.Combine(AppContext.BaseDirectory, "../../../../../src/Backend/S7JobSeeker.Api/Controllers/HealthController.cs");
        var jobsPath = Path.Combine(AppContext.BaseDirectory, "../../../../../src/Backend/S7JobSeeker.Api/Controllers/JobsController.cs");

        if (File.Exists(healthPath))
        {
            var text = File.ReadAllText(healthPath);
            Assert.DoesNotContain("default-cron-secret", text, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("s7-cron-secret-key-change-in-production-2026", text, StringComparison.OrdinalIgnoreCase);
        }

        if (File.Exists(jobsPath))
        {
            var text = File.ReadAllText(jobsPath);
            Assert.DoesNotContain("default-cron-secret", text, StringComparison.OrdinalIgnoreCase);
        }
    }

    [Fact]
    public void AuthController_MustNotContainHardcodedPersonalDeveloperEmails()
    {
        // ARCHITECTURAL INTENT (LOCK: Anti-Privilege-Escalation & Secrets Hygiene):
        // Personal developer emails must NEVER be hardcoded to grant administrative privileges.
        var authPath = Path.Combine(AppContext.BaseDirectory, "../../../../../src/Backend/S7JobSeeker.Api/Controllers/AuthController.cs");
        if (File.Exists(authPath))
        {
            var text = File.ReadAllText(authPath);
            Assert.DoesNotContain("formal.teams7@gmail.com", text, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("sagir@teams7.com", text, StringComparison.OrdinalIgnoreCase);
        }
    }

    [Fact]
    public void AuthController_Register_MustLockZeroAdminEscalation()
    {
        // ARCHITECTURAL INTENT: Public registration must strictly create standard candidate accounts
        var authPath = Path.Combine(AppContext.BaseDirectory, "../../../../../src/Backend/S7JobSeeker.Api/Controllers/AuthController.cs");
        if (File.Exists(authPath))
        {
            var text = File.ReadAllText(authPath);
            Assert.Contains("IsAdmin = false", text);
            Assert.Contains("IsReservedAdminEmail", text);
            Assert.DoesNotContain("IsAdmin = isMaster", text);
            Assert.DoesNotContain("user.IsAdmin = true", text);
        }
    }
}
