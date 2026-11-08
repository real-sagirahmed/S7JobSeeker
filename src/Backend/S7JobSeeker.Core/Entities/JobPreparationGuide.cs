namespace S7JobSeeker.Core.Entities;

public class JobPreparationGuide
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public string JobId { get; set; } = string.Empty;
    public string TargetRole { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;

    public string ContentJson { get; set; } = string.Empty;
    public string ExportMarkdown { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser? User { get; set; }
}
