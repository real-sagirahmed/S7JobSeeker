using S7JobSeeker.Core.Enums;

namespace S7JobSeeker.Core.Entities;

public class BdTechCompany
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string CareersUrl { get; set; } = string.Empty;
    public string? LinkedInUrl { get; set; }
    public CompanyCategory Category { get; set; }
    public string GlobalProducts { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PrimaryTechStackJson { get; set; } = "[]";
    public string Headquarters { get; set; } = "Dhaka, Bangladesh";
    public string GlobalOffices { get; set; } = string.Empty;
    public string WorkModel { get; set; } = "Hybrid"; // Remote, Hybrid, Onsite
    public string EmployeeCountRange { get; set; } = "50-200";
    public bool IsVerified { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
