namespace S7JobSeeker.Core.Entities;

public class UserCbsProgress
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public string CompletedDaysJson { get; set; } = "[]";
    public string QuizScoresJson { get; set; } = "{}";
    public string ChecklistJson { get; set; } = "{}";
    public int LastAccessedDay { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser? User { get; set; }
}
