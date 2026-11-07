using Microsoft.EntityFrameworkCore;
using S7JobSeeker.Core.Entities;

namespace S7JobSeeker.Core.Interfaces;

public interface IApplicationDbContext
{
    DbSet<ApplicationUser> Users { get; }
    DbSet<UserProfile> UserProfiles { get; }
    DbSet<UserSkill> UserSkills { get; }
    DbSet<JobPosting> JobPostings { get; }
    DbSet<JobMatchScore> JobMatchScores { get; }
    DbSet<TailoredApplication> TailoredApplications { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
