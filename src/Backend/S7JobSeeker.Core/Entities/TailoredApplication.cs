namespace S7JobSeeker.Core.Entities;

public class TailoredApplication
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public Guid JobPostingId { get; set; }
    public string TailoredCoverLetter { get; set; } = string.Empty;
    public string? ResumeOptimizationTips { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser? User { get; set; }
    public JobPosting? JobPosting { get; set; }
}
