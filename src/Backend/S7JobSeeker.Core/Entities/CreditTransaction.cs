using S7JobSeeker.Core.Enums;

namespace S7JobSeeker.Core.Entities;

public class CreditTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    public int CreditsAmount { get; set; }
    public decimal AmountPaidBdt { get; set; }
    public PaymentMethod Method { get; set; }
    public string SenderNumber { get; set; } = string.Empty;
    public string TransactionId { get; set; } = string.Empty;
    public TransactionStatus Status { get; set; } = TransactionStatus.Pending;
    public string? AdminNote { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
}
