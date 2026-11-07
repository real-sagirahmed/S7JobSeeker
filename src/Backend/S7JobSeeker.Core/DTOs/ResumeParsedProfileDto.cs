using S7JobSeeker.Core.Enums;

namespace S7JobSeeker.Core.DTOs;

public record ExtractedSkillDto(
    string Name,
    SkillCategory Category,
    int? YearsOfExperience,
    bool IsPrimary
);

public record ExtractedExperienceDto(
    string Company,
    string Role,
    string? Duration,
    string? Description
);

public record ResumeParsedProfileDto(
    string FullName,
    string? Email,
    string? Phone,
    string? TargetRole,
    int? TotalYearsOfExperience,
    string Summary,
    List<ExtractedSkillDto> Skills,
    List<ExtractedExperienceDto> Experiences
);
