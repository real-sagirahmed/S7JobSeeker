namespace S7JobSeeker.Core.DTOs;

public record JobMatchResultDto(
    Guid JobId,
    string Title,
    string Company,
    string Location,
    bool IsRemote,
    string? JobType,
    string? SalaryRange,
    string? Url,
    DateTime? PublishedAt,
    double OverallScore,
    double SemanticSimilarityScore,
    double SkillMatchScore,
    List<string> MatchingSkills,
    List<string> MissingSkills,
    string? Recommendations,
    bool IsBookmarked
);
