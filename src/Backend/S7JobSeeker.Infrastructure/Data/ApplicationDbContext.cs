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
    public DbSet<BdTechCompany> BdTechCompanies => Set<BdTechCompany>();
    public DbSet<CreditTransaction> CreditTransactions => Set<CreditTransaction>();
    public DbSet<SaaSPlatformSetting> PlatformSettings => Set<SaaSPlatformSetting>();

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

        // BdTechCompany
        builder.Entity<BdTechCompany>(b =>
        {
            b.HasKey(c => c.Id);
            b.Property(c => c.Name).HasMaxLength(200).IsRequired();
            b.Property(c => c.Slug).HasMaxLength(200).IsRequired();
            b.Property(c => c.Website).HasMaxLength(500);
            b.Property(c => c.CareersUrl).HasMaxLength(500);
            b.Property(c => c.LinkedInUrl).HasMaxLength(500);
            b.Property(c => c.GlobalProducts).HasMaxLength(500);
            b.Property(c => c.Description).HasColumnType("nvarchar(max)");
            b.Property(c => c.PrimaryTechStackJson).HasColumnType("nvarchar(max)");
            b.Property(c => c.Headquarters).HasMaxLength(200);
            b.Property(c => c.GlobalOffices).HasMaxLength(300);
            b.Property(c => c.WorkModel).HasMaxLength(50);
            b.Property(c => c.EmployeeCountRange).HasMaxLength(50);

            b.HasIndex(c => c.Name);
            b.HasIndex(c => c.Slug).IsUnique();
            b.HasIndex(c => c.Category);
        });

        // CreditTransaction
        builder.Entity<CreditTransaction>(b =>
        {
            b.HasKey(t => t.Id);
            b.Property(t => t.SenderNumber).HasMaxLength(50).IsRequired();
            b.Property(t => t.TransactionId).HasMaxLength(100).IsRequired();
            b.Property(t => t.AmountPaidBdt).HasColumnType("decimal(18,2)");
            b.Property(t => t.AdminNote).HasMaxLength(500);

            // ARCHITECTURAL INTENT (LOCK 4): Unique index on TransactionId to prevent duplicate submission fraud
            b.HasIndex(t => t.TransactionId).IsUnique();
            b.HasIndex(t => t.Status);
            b.HasIndex(t => t.CreatedAt);

            b.HasOne(t => t.User)
             .WithMany(u => u.Transactions)
             .HasForeignKey(t => t.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // SaaSPlatformSetting
        builder.Entity<SaaSPlatformSetting>(b =>
        {
            b.HasKey(s => s.Id);
            b.Property(s => s.BkashNumber).HasMaxLength(100).IsRequired();
            b.Property(s => s.NagadNumber).HasMaxLength(100).IsRequired();
            b.Property(s => s.RocketNumber).HasMaxLength(100).IsRequired();
            b.Property(s => s.PaymentInstructions).HasMaxLength(1000).IsRequired();

            b.HasData(new SaaSPlatformSetting
            {
                Id = 1,
                BkashNumber = "017XXXXXXXX (Personal / Send Money)",
                NagadNumber = "017XXXXXXXX (Personal / Send Money)",
                RocketNumber = "017XXXXXXXX (Personal / Send Money)",
                PaymentInstructions = "বিকাশ বা নগদ সেন্ড মানি করে TrxID ও প্রেরক নম্বর নিচে সাবমিট করুন। অ্যাডমিন ভেরিফাই করে ক্রেডিট অনুমোদন করবেন।",
                WelcomeCredits = 20,
                TrialDays = 30,
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            });
        });
    }
}
