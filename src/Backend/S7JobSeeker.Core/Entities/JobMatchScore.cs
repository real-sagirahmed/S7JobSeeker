namespace S7JobSeeker.Core.Entities;

public class JobMatchScore
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public Guid JobPostingId { get; set; }
    public double OverallScore { get; set; }
    public double SemanticSimilarityScore { get; set; }
    public double SkillMatchScore { get; set; }
    public string MatchingSkillsJson { get; set; } = "[]";
    public string MissingSkillsJson { get; set; } = "[]";
    public string? Recommendations { get; set; }
    public bool IsBookmarked { get; set; }
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser User { get; set; } = null!;
    public JobPosting JobPosting { get; set; } = null!;
}
