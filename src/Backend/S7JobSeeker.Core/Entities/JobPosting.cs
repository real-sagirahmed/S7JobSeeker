using S7JobSeeker.Core.Enums;

namespace S7JobSeeker.Core.Entities;

public class JobPosting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ExternalId { get; set; } = string.Empty;
    public JobSource Source { get; set; } = JobSource.CustomPaste;
    public string Title { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public bool IsRemote { get; set; }
    public string? JobType { get; set; }
    public string? SalaryRange { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? TagsJson { get; set; }
    public Guid? QdrantPointId { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<JobMatchScore> MatchScores { get; set; } = [];
    public ICollection<TailoredApplication> TailoredApplications { get; set; } = [];
}
