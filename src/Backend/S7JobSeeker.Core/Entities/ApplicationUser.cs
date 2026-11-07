using Microsoft.AspNetCore.Identity;

namespace S7JobSeeker.Core.Entities;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public string? TargetRole { get; set; }
    public int? YearsOfExperience { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public UserProfile? Profile { get; set; }
    public ICollection<JobMatchScore> MatchScores { get; set; } = [];
    public ICollection<TailoredApplication> TailoredApplications { get; set; } = [];
}
