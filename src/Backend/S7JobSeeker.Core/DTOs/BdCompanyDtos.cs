using S7JobSeeker.Core.Enums;

namespace S7JobSeeker.Core.DTOs;

public record BdCompanyDto(
    Guid Id,
    string Name,
    string Slug,
    string Website,
    string CareersUrl,
    string? LinkedInUrl,
    CompanyCategory Category,
    string GlobalProducts,
    string Description,
    List<string> PrimaryTechStack,
    string Headquarters,
    string GlobalOffices,
    string WorkModel,
    string EmployeeCountRange,
    bool IsVerified,
    int ActiveJobsCount,
    int? FitScore = null,
    List<string>? MatchingSkills = null,
    List<string>? MissingSkills = null
);

public record CompanyListResponse(
    List<BdCompanyDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

public record GeneratePitchRequest(string PitchType = "ColdEmail"); // ColdEmail or CoverLetter

public record TailoredPitchDto(
    string CompanyName,
    string PitchType,
    string Subject,
    string Content,
    List<string> HighlightedSkills
);
