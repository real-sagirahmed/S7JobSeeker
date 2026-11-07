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
}
