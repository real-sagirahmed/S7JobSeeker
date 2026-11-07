namespace S7JobSeeker.Core.Entities;

public class UserProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public string? ProfessionalSummary { get; set; }
    public string? RawResumeText { get; set; }
    public string? ResumeFileName { get; set; }
    public string? ParsedProfileJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ApplicationUser? User { get; set; }
    public ICollection<UserSkill> Skills { get; set; } = [];
}
