using System.Text.RegularExpressions;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.Core.Services;

// ARCHITECTURAL INTENT: S7 Remote Autonomy Index (S7 Flex Radar: 0-100) Engine.
// Pre-compiled regex heuristics evaluate WHERE, WHEN, and HOW dimensions deterministically.
// Processing hundreds of jobs takes <5ms with zero LLM API costs or token limits.
public class FlexScoreCalculator : IFlexScoreCalculator
{
    private static readonly TimeSpan RegexTimeout = TimeSpan.FromMilliseconds(250);

    // WHERE Patterns
    private static readonly Regex AnywherePattern = new(
        @"\b(work\s+from\s+anywhere|anywhere\s+in\s+the\s+world|worldwide|global\s+remote|any\s+location|100%\s+remote\s+anywhere|work\s+from\s+home\s+anywhere)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled, RegexTimeout);

    private static readonly Regex RegionalPattern = new(
        @"\b(emea(\s+only)?|apac(\s+only)?|latam(\s+only)?|europe\s+only|americas\s+only|eu\s+only)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled, RegexTimeout);

    private static readonly Regex CountryLockedPattern = new(
        @"\b(us\s+only|usa\s+only|united\s+states\s+only|uk\s+only|canada\s+only|germany\s+only|must\s+reside\s+in|resident\s+of|authorized\s+to\s+work\s+in\s+the\s+u\.?s\.?|us\s+citizens?\s+only)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled, RegexTimeout);

    private static readonly Regex HybridPattern = new(
        @"\b(hybrid|(\d+)\s+days?\s+(in[\s-]office|a\s+week\s+in\s+office|per\s+week\s+in\s+office)|office\s+attendance)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled, RegexTimeout);

    private static readonly Regex OnSitePattern = new(
        @"\b(on[\s-]site|onsite|strictly\s+in[\s-]office|relocation\s+required)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled, RegexTimeout);

    // WHEN Patterns
    private static readonly Regex AsyncPattern = new(
        @"\b(async|asynchronous|set\s+your\s+own\s+hours|flexible\s+hours|flexible\s+working\s+hours|results[\s-]oriented|no\s+core\s+hours|work\s+whenever)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled, RegexTimeout);

    private static readonly Regex OverlapPattern = new(
        @"\b((\d+)\s*(?:-|to)?\s*(\d+)?\s*hours?\s*(?:of\s+)?overlap|overlap\s+with|core\s+hours|available\s+between|timezone\s+overlap)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled, RegexTimeout);

    private static readonly Regex RigidHoursPattern = new(
        @"\b(9\s*(?:am)?\s*(?:-|to)\s*5\s*(?:pm)?|standard\s+business\s+hours|fixed\s+working\s+hours)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled, RegexTimeout);

    // HOW Patterns
    private static readonly Regex ContractorPattern = new(
        @"\b(contractor|b2b|deel|remote\.com|freelance|c2c|consultant|independent\s+contractor|contract\s+role)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled, RegexTimeout);

    private static readonly Regex RemotePerksPattern = new(
        @"\b(home\s+office\s+stipend|equipment\s+budget|coworking\s+stipend|learning\s+budget|wellness\s+stipend)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled, RegexTimeout);

    public FlexScoreResult CalculateFlexScore(string? location, string? description, bool isRemote)
    {
        var text = $"{location ?? string.Empty} {description ?? string.Empty}".Trim();

        // 1. Evaluate WHERE (Location Freedom - 40% Weight)
        int whereScore;
        bool isWfa = false;
        string timezoneReq = "Worldwide";

        if (OnSitePattern.IsMatch(text) && !isRemote)
        {
            whereScore = 15;
            timezoneReq = "On-site / In-Office";
        }
        else if (HybridPattern.IsMatch(text))
        {
            whereScore = 45;
            timezoneReq = "Hybrid";
        }
        else if (AnywherePattern.IsMatch(text) || (isRemote && (location?.Contains("anywhere", StringComparison.OrdinalIgnoreCase) ?? false)))
        {
            whereScore = 100;
            isWfa = true;
            timezoneReq = "Work From Anywhere (WFA)";
        }
        else if (CountryLockedPattern.IsMatch(text) || (location?.Contains("US", StringComparison.OrdinalIgnoreCase) ?? false && !location.Contains("Anywhere", StringComparison.OrdinalIgnoreCase)))
        {
            whereScore = 45;
            timezoneReq = "Country-Restricted (US/Local)";
        }
        else if (RegionalPattern.IsMatch(text))
        {
            whereScore = 70;
            timezoneReq = "Regional Remote (EMEA/APAC/Americas)";
        }
        else
        {
            // Default remote with unstated country
            whereScore = isRemote ? 85 : 35;
            timezoneReq = isRemote ? "Global Remote" : "Local Office";
            if (isRemote) isWfa = true;
        }

        // 2. Evaluate WHEN (Schedule & Time - 35% Weight)
        int whenScore;
        if (AsyncPattern.IsMatch(text))
        {
            whenScore = 100;
            if (!timezoneReq.Contains("WFA"))
                timezoneReq += " • Full Async";
        }
        else if (OverlapPattern.IsMatch(text))
        {
            whenScore = 68;
            timezoneReq += " • Overlap Required";
        }
        else if (RigidHoursPattern.IsMatch(text))
        {
            whenScore = isRemote ? 50 : 35;
        }
        else
        {
            whenScore = isRemote ? 80 : 45;
        }

        // 3. Evaluate HOW (Contract & Autonomy - 25% Weight)
        int howScore = 75;
        if (ContractorPattern.IsMatch(text))
        {
            howScore = 95;
        }
        if (RemotePerksPattern.IsMatch(text))
        {
            howScore = Math.Min(100, howScore + 10);
        }
        if (!isRemote)
        {
            howScore = Math.Min(howScore, 40);
        }

        // Weighted Overall Score (Clamped between 15 and 99)
        var overallScore = (int)Math.Round((whereScore * 0.40) + (whenScore * 0.35) + (howScore * 0.25));
        overallScore = Math.Clamp(overallScore, 15, 99);

        // Build concise notes for candidate tooltip
        var notes = isWfa
            ? "Worldwide geographic freedom with autonomous scheduling."
            : (whereScore < 50 ? "Restricted by physical location or country residency." : "Flexible remote role with standard regional hours.");

        return new FlexScoreResult(
            OverallFlexScore: overallScore,
            WhereScore: whereScore,
            WhenScore: whenScore,
            HowScore: howScore,
            IsWorkFromAnywhere: isWfa,
            TimezoneRequirements: timezoneReq,
            FlexibilityNotes: notes
        );
    }
}
