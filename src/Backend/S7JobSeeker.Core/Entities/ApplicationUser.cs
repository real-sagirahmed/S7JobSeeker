using Microsoft.AspNetCore.Identity;

namespace S7JobSeeker.Core.Entities;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public string? TargetRole { get; set; }
    public int? YearsOfExperience { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public bool IsAdmin { get; set; } = false;
    public int AiCredits { get; set; } = 20;
    public DateTime TrialEndsAt { get; set; } = DateTime.UtcNow.AddDays(30);

    public UserProfile? Profile { get; set; }
    public ICollection<JobMatchScore> MatchScores { get; set; } = [];
    public ICollection<TailoredApplication> TailoredApplications { get; set; } = [];
    public ICollection<CreditTransaction> Transactions { get; set; } = [];
}
