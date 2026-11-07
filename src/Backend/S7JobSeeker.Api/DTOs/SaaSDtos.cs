using System.ComponentModel.DataAnnotations;
using S7JobSeeker.Core.Enums;

namespace S7JobSeeker.Api.DTOs;

public record CreditBundleDto(
    int Id,
    string Name,
    int Credits,
    decimal PriceBdt,
    string BadgeText,
    bool IsPopular
);

public record SubscriptionStatusDto(
    int AiCredits,
    DateTime TrialEndsAt,
    bool IsTrialActive,
    int TrialDaysRemaining,
    bool IsAdmin,
    List<CreditTransactionDto> RecentTransactions
);

public record CreditTransactionDto(
    Guid Id,
    string UserId,
    string UserEmail,
    string UserFullName,
    int CreditsAmount,
    decimal AmountPaidBdt,
    string Method,
    string SenderNumber,
    string TransactionId,
    string Status,
    string? AdminNote,
    DateTime CreatedAt,
    DateTime? ReviewedAt
);

public record SubmitPaymentRequestDto(
    [Required] int BundleId,
    [Required] PaymentMethod Method,
    [Required, MinLength(10), MaxLength(20)] string SenderNumber,
    [Required, MinLength(4), MaxLength(50)] string TransactionId
);

public record AdminReviewPaymentDto(
    string? AdminNote
);

public record GiftCreditsDto(
    [Range(1, 10000)] int Credits,
    string? Note
);

public record AdminUserItemDto(
    string Id,
    string Email,
    string FullName,
    string? TargetRole,
    bool IsAdmin,
    int AiCredits,
    DateTime TrialEndsAt,
    bool IsTrialActive,
    DateTime CreatedAt,
    int TotalTransactions
);

public record AdminMetricsDto(
    int TotalUsers,
    int ActiveCandidates,
    int TotalJobs,
    int PendingPaymentsCount,
    int ApprovedPaymentsCount,
    decimal TotalRevenueBdt
);

public record SaaSPlatformSettingDto(
    int Id,
    string BkashNumber,
    string NagadNumber,
    string RocketNumber,
    string PaymentInstructions,
    int WelcomeCredits,
    int TrialDays,
    DateTime UpdatedAt
);

public record UpdatePlatformSettingRequestDto(
    [Required, MaxLength(100)] string BkashNumber,
    [Required, MaxLength(100)] string NagadNumber,
    [Required, MaxLength(100)] string RocketNumber,
    [Required, MaxLength(1000)] string PaymentInstructions,
    [Range(1, 100)] int WelcomeCredits,
    [Range(1, 365)] int TrialDays
);
