using System.ComponentModel.DataAnnotations;

namespace S7JobSeeker.Api.DTOs;

public record RegisterRequestDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Required] string FullName,
    string? TargetRole
);

public record LoginRequestDto(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponseDto(
    string Token,
    string Email,
    string FullName,
    string? TargetRole,
    bool IsAdmin,
    int AiCredits,
    DateTime TrialEndsAt,
    DateTime ExpiresAt
);

public record UserDto(
    string Id,
    string Email,
    string FullName,
    string? TargetRole,
    int? YearsOfExperience,
    bool IsAdmin,
    int AiCredits,
    DateTime TrialEndsAt
);
