using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using S7JobSeeker.AI.Services;
using S7JobSeeker.Api.Controllers;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Infrastructure.Data;
using Xunit;

namespace S7JobSeeker.Tests;

public class JobPreparationTests
{
    [Fact]
    public async Task JobPreparationService_FallbackSynthesis_GeneratesCompleteFourStageBlueprint()
    {
        // Arrange
        var config = new ConfigurationBuilder().Build();
        var prepService = new JobPreparationService(
            new DummyChatCompletionService(),
            config,
            NullLogger<JobPreparationService>.Instance
        );

        var candidateProfile = new ResumeParsedProfileDto(
            FullName: "Ashraful Islam",
            Email: "ashraful@teams7.com",
            Phone: "+8801700000000",
            TargetRole: "Junior Software Engineer",
            TotalYearsOfExperience: 1,
            Summary: "Fresh CS graduate with strong SQL and basic Linux skills",
            Skills: [
                new ExtractedSkillDto("SQL", SkillCategory.Database, 1, true),
                new ExtractedSkillDto("C#", SkillCategory.Backend, 1, true),
                new ExtractedSkillDto("Linux", SkillCategory.CloudAndDevOps, 1, false)
            ],
            Experiences: []
        );

        var missingSkills = new List<string> { "Docker", "Core Banking Systems (CBS)", "Basic Accounting", "EOD Batch Monitoring" };

        // Act
        var result = await prepService.GeneratePreparationGuideAsync(
            "Junior Software Engineer - Service (CBS Support)",
            "LEADS Corporation Limited",
            "Core banking support, SQL practical test, Basic accounting, Linux troubleshooting, Docker ops, EOD batch activities.",
            candidateProfile,
            missingSkills
        );

        // Assert: 4-Stage Architectural Structure Integrity
        Assert.NotNull(result);
        Assert.Equal("Junior Software Engineer - Service (CBS Support)", result.TargetRole);
        Assert.Equal("LEADS Corporation Limited", result.CompanyName);

        // Stage 1: Domain Fundamentals
        Assert.NotNull(result.DomainFundamentals);
        Assert.False(string.IsNullOrWhiteSpace(result.DomainFundamentals.Overview));
        Assert.NotEmpty(result.DomainFundamentals.CoreTopics);
        Assert.Contains(result.DomainFundamentals.CoreTopics, t => t.Title.Contains("Accounting", StringComparison.OrdinalIgnoreCase) || t.Title.Contains("CBS", StringComparison.OrdinalIgnoreCase));

        // Stage 2: Diagnostic Labs
        Assert.NotNull(result.DiagnosticLabs);
        Assert.NotEmpty(result.DiagnosticLabs.SqlQueries);
        Assert.NotEmpty(result.DiagnosticLabs.LinuxCommands);
        Assert.NotEmpty(result.DiagnosticLabs.DockerOps);
        Assert.Contains(result.DiagnosticLabs.SqlQueries, s => s.CommandOrCode.Contains("SELECT", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(result.DiagnosticLabs.LinuxCommands, l => l.CommandOrCode.Contains("grep", StringComparison.OrdinalIgnoreCase) || l.CommandOrCode.Contains("tail", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(result.DiagnosticLabs.DockerOps, d => d.CommandOrCode.Contains("docker", StringComparison.OrdinalIgnoreCase));

        // Stage 3: Mock Assessment
        Assert.NotNull(result.MockAssessment);
        Assert.NotEmpty(result.MockAssessment.TechnicalQuestions);
        Assert.NotEmpty(result.MockAssessment.ScenarioTroubleshooting);
        Assert.NotEmpty(result.MockAssessment.BehavioralAgility);

        // Stage 4: Readiness Checklist & Export
        Assert.NotNull(result.ReadinessChecklist);
        Assert.NotEmpty(result.ReadinessChecklist.PreTestActions);
        Assert.NotEmpty(result.ReadinessChecklist.PracticalDrills);
        Assert.NotEmpty(result.ReadinessChecklist.ResumeKeywordsToHighlight);
        Assert.False(string.IsNullOrWhiteSpace(result.ExportMarkdown));
    }

    [Fact]
    public async Task JobsController_PreparationGuide_DeductsCredit_AndCachesForZeroCreditReplay()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"PrepDb_{Guid.NewGuid()}")
            .Options;

        var db = new ApplicationDbContext(options);
        var testUserId = Guid.NewGuid().ToString();

        // Candidate with 2 credits
        var user = new ApplicationUser
        {
            Id = testUserId,
            UserName = "candidate@teams7.com",
            Email = "candidate@teams7.com",
            FullName = "Candidate One",
            AiCredits = 2,
            IsAdmin = false
        };
        db.Users.Add(user);

        var jobId = Guid.NewGuid();
        var jobPosting = new JobPosting
        {
            Id = jobId,
            Title = "Junior Software Engineer - Service",
            Company = "LEADS Corporation",
            Description = "SQL test, Linux, Docker, Accounting, CBS",
            Location = "Dhaka",
            Source = JobSource.CustomPaste,
            CreatedAt = DateTime.UtcNow
        };
        db.JobPostings.Add(jobPosting);
        await db.SaveChangesAsync();

        var config = new ConfigurationBuilder().Build();
        var prepService = new DummyJobPreparationService();
        var matcherService = new JobMatcherService(
            new DummyChatCompletionService(),
            new DummyEmbeddingService(),
            config,
            NullLogger<JobMatcherService>.Instance
        );

        var controller = new JobsController(
            db,
            [],
            new DummyVectorService(),
            matcherService,
            prepService,
            config,
            new DummyWebHostEnvironment(),
            NullLogger<JobsController>.Instance
        );

        var claims = new ClaimsPrincipal(new ClaimsIdentity([
            new Claim(ClaimTypes.NameIdentifier, testUserId),
            new Claim(ClaimTypes.Email, "candidate@teams7.com")
        ], "mock"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claims }
        };

        // Act 1: Initial Generation
        var firstResult = await controller.GeneratePreparationGuide(jobId, CancellationToken.None);
        var okFirst = Assert.IsType<OkObjectResult>(firstResult);
        var firstDto = Assert.IsType<JobPrepGuideDto>(okFirst.Value);

        Assert.Equal("Junior Software Engineer - Service", firstDto.TargetRole);
        var updatedUserAfterFirst = await db.Users.FindAsync(testUserId);
        Assert.Equal(1, updatedUserAfterFirst!.AiCredits); // Deducted 1 credit (2 -> 1)

        // Act 2: 0-Credit Replay (Subsequent call for same job)
        var secondResult = await controller.GeneratePreparationGuide(jobId, CancellationToken.None);
        var okSecond = Assert.IsType<OkObjectResult>(secondResult);
        var secondDto = Assert.IsType<JobPrepGuideDto>(okSecond.Value);

        Assert.Equal("Junior Software Engineer - Service", secondDto.TargetRole);
        var updatedUserAfterSecond = await db.Users.FindAsync(testUserId);
        Assert.Equal(1, updatedUserAfterSecond!.AiCredits); // ARCHITECTURAL INTENT: Cached replay costs 0 credits!

        // Act 3: Get existing guide endpoint
        var getResult = await controller.GetPreparationGuide(jobId, CancellationToken.None);
        var okGet = Assert.IsType<OkObjectResult>(getResult);
        var getDto = Assert.IsType<JobPrepGuideDto>(okGet.Value);
        Assert.Equal("Junior Software Engineer - Service", getDto.TargetRole);
    }
}
