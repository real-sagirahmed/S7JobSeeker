using S7JobSeeker.Core.Enums;

namespace S7JobSeeker.Core.Entities;

public class UserSkill
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserProfileId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public SkillCategory Category { get; set; } = SkillCategory.Other;
    public int? YearsOfExperience { get; set; }
    public bool IsPrimary { get; set; }

    public UserProfile? UserProfile { get; set; }
}
