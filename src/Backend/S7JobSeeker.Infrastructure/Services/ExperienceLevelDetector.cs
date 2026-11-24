using System.Text.RegularExpressions;

namespace S7JobSeeker.Infrastructure.Services;

public static class ExperienceLevelDetector
{
    private static readonly Regex FresherRegex = new(
        @"\b(fresher|entry[\s\-]level|graduate|intern|internship|trainee|apprentice|fresh\s+graduate|no\s+experience)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(200));

    private static readonly Regex JuniorRegex = new(
        @"\b(junior|jr\.?|associate|engineer\s+1|developer\s+1|engineer\s+i\b|developer\s+i\b|level\s+1|level\s+i\b|1[\s\-]2\s*year|1[\s\-]3\s*year|0[\s\-]2\s*year)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(200));

    private static readonly Regex SeniorRegex = new(
        @"\b(senior|sr\.?|lead|principal|staff|architect|director|manager|head\s+of|5\+\s*year|expert)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(200));

    private static readonly Regex MidRegex = new(
        @"\b(mid[\s\-]level|intermediate|engineer\s+2|developer\s+2|engineer\s+ii\b|developer\s+ii\b|2[\s\-]5\s*year|3[\s\-]5\s*year)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(200));

    /// <summary>
    /// Analyzes the job title, description, and source-provided raw experience to determine standard experience level:
    /// "Fresher", "Junior", "Mid", or "Senior".
    /// </summary>
    public static string? Detect(string? title, string? description = null, string? rawExperience = null)
    {
        // 1. Evaluate explicit rawExperience metadata from structured source APIs
        if (!string.IsNullOrWhiteSpace(rawExperience))
        {
            var raw = rawExperience.Trim().ToLowerInvariant();
            if (raw.Contains("entry") || raw.Contains("graduate") || raw.Contains("intern") || raw.Contains("trainee") || raw.Contains("0 to 1") || raw.Contains("0-1"))
                return "Fresher";
            if (raw.Contains("junior") || raw.Contains("1 to 2") || raw.Contains("1-2") || raw.Contains("1 to 3") || raw.Contains("1-3") || raw.Contains("0 to 2"))
                return "Junior";
            if (raw.Contains("mid") || raw.Contains("2 to 5") || raw.Contains("2-5") || raw.Contains("3 to 5"))
                return "Mid";
            if (raw.Contains("senior") || raw.Contains("expert") || raw.Contains("5+") || raw.Contains("5 to 10") || raw.Contains(">10"))
                return "Senior";
        }

        // 2. High-precision check on Title (Title carries strongest employer intent)
        var safeTitle = title ?? "";
        if (FresherRegex.IsMatch(safeTitle))
            return "Fresher";
        if (JuniorRegex.IsMatch(safeTitle))
            return "Junior";
        if (SeniorRegex.IsMatch(safeTitle))
            return "Senior";
        if (MidRegex.IsMatch(safeTitle))
            return "Mid";

        // 3. Fallback to description analysis
        if (!string.IsNullOrWhiteSpace(description))
        {
            if (FresherRegex.IsMatch(description))
                return "Fresher";
            if (JuniorRegex.IsMatch(description))
                return "Junior";
            if (SeniorRegex.IsMatch(description))
                return "Senior";
            if (MidRegex.IsMatch(description))
                return "Mid";
        }

        return null;
    }
}
