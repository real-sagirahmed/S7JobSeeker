using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<UserSkill> UserSkills => Set<UserSkill>();
    public DbSet<JobPosting> JobPostings => Set<JobPosting>();
    public DbSet<JobMatchScore> JobMatchScores => Set<JobMatchScore>();
    public DbSet<TailoredApplication> TailoredApplications => Set<TailoredApplication>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // UserProfile
        builder.Entity<UserProfile>(b =>
        {
            b.HasKey(p => p.Id);
            b.HasOne(p => p.User)
             .WithOne(u => u.Profile)
             .HasForeignKey<UserProfile>(p => p.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            b.Property(p => p.RawResumeText).HasColumnType("nvarchar(max)");
            b.Property(p => p.ParsedProfileJson).HasColumnType("nvarchar(max)");
            b.Property(p => p.ProfessionalSummary).HasMaxLength(2000);
        });

        // UserSkill
        builder.Entity<UserSkill>(b =>
        {
            b.HasKey(s => s.Id);
            b.Property(s => s.SkillName).HasMaxLength(150).IsRequired();
            b.HasIndex(s => s.SkillName);
            b.HasOne(s => s.UserProfile)
             .WithMany(p => p.Skills)
             .HasForeignKey(s => s.UserProfileId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // JobPosting
        builder.Entity<JobPosting>(b =>
        {
            b.HasKey(j => j.Id);
            b.Property(j => j.ExternalId).HasMaxLength(200).IsRequired();
            b.Property(j => j.Title).HasMaxLength(300).IsRequired();
            b.Property(j => j.Company).HasMaxLength(200).IsRequired();
            b.Property(j => j.Location).HasMaxLength(200);
            b.Property(j => j.Description).HasColumnType("nvarchar(max)").IsRequired();
            b.Property(j => j.TagsJson).HasColumnType("nvarchar(max)");
            b.HasIndex(j => new { j.Source, j.ExternalId }).IsUnique();
            b.HasIndex(j => j.CreatedAt);
            b.HasIndex(j => j.IsRemote);
        });

        // JobMatchScore
        builder.Entity<JobMatchScore>(b =>
        {
            b.HasKey(m => m.Id);
            b.HasIndex(m => new { m.UserId, m.JobPostingId }).IsUnique();
            b.HasIndex(m => m.OverallScore);
            b.Property(m => m.MatchingSkillsJson).HasColumnType("nvarchar(max)");
            b.Property(m => m.MissingSkillsJson).HasColumnType("nvarchar(max)");
            b.Property(m => m.Recommendations).HasColumnType("nvarchar(max)");

            b.HasOne(m => m.User)
             .WithMany(u => u.MatchScores)
             .HasForeignKey(m => m.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(m => m.JobPosting)
             .WithMany(j => j.MatchScores)
             .HasForeignKey(m => m.JobPostingId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // TailoredApplication
        builder.Entity<TailoredApplication>(b =>
        {
            b.HasKey(t => t.Id);
            b.Property(t => t.TailoredCoverLetter).HasColumnType("nvarchar(max)").IsRequired();
            b.Property(t => t.ResumeOptimizationTips).HasColumnType("nvarchar(max)");

            b.HasOne(t => t.User)
             .WithMany(u => u.TailoredApplications)
             .HasForeignKey(t => t.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(t => t.JobPosting)
             .WithMany(j => j.TailoredApplications)
             .HasForeignKey(t => t.JobPostingId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
