using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using S7JobSeeker.AI.Services;
using S7JobSeeker.Api.Controllers;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;
using S7JobSeeker.Infrastructure.Data;
using Xunit;

namespace S7JobSeeker.Tests;

public class DummyWebHostEnvironment : IWebHostEnvironment
{
    public string EnvironmentName { get; set; } = "Development";
    public string ApplicationName { get; set; } = "S7JobSeeker.Api";
    public string WebRootPath { get; set; } = string.Empty;
    public IFileProvider WebRootFileProvider { get; set; } = null!;
    public string ContentRootPath { get; set; } = string.Empty;
    public IFileProvider ContentRootFileProvider { get; set; } = null!;
}

public class DummyVectorService : IQdrantVectorService
{
    public Task EnsureCollectionExistsAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task UpsertJobVectorAsync(Guid pointId, ReadOnlyMemory<float> embedding, Dictionary<string, string> metadata, CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task<IReadOnlyList<VectorSearchResult>> SearchSimilarJobsAsync(ReadOnlyMemory<float> queryEmbedding, int limit = 20, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<VectorSearchResult>>([]);
}

public class DummyJobPreparationService : IJobPreparationService
{
    public Task<JobPrepGuideDto> GeneratePreparationGuideAsync(
        string targetRole,
        string companyName,
        string jobDescription,
        ResumeParsedProfileDto? candidateProfile,
        List<string>? missingSkills,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new JobPrepGuideDto
        {
            TargetRole = targetRole,
            CompanyName = companyName,
            DomainFundamentals = new DomainFundamentalsSection
            {
                Overview = "Test Overview"
            }
        });
    }
}

public class PasteAndAnalyzeWorkflowTests
{
    private readonly ApplicationDbContext _db;
    private readonly JobsController _controller;
    private readonly string _testUserId;

    public PasteAndAnalyzeWorkflowTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"PasteTestDb_{Guid.NewGuid()}")
            .Options;

        _db = new ApplicationDbContext(options);
        _testUserId = Guid.NewGuid().ToString();

        // Seed candidate user and profile
        var user = new ApplicationUser
        {
            Id = _testUserId,
            UserName = "test@teams7.com",
            Email = "test@teams7.com",
            FullName = "Test Candidate"
        };
        _db.Users.Add(user);

        var parsedProfile = new ResumeParsedProfileDto(
            FullName: "Test Candidate",
            Email: "test@teams7.com",
            Phone: "+8801700000000",
            TargetRole: "Senior .NET Developer",
            TotalYearsOfExperience: 5,
            Summary: "Experienced C# and .NET developer",
            Skills: [
                new ExtractedSkillDto("C#", SkillCategory.Backend, 5, true),
                new ExtractedSkillDto(".NET", SkillCategory.Backend, 5, true),
                new ExtractedSkillDto("SQL Server", SkillCategory.Database, 4, true)
            ],
            Experiences: []
        );

        var profile = new UserProfile
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            ParsedProfileJson = JsonSerializer.Serialize(parsedProfile),
            UpdatedAt = DateTime.UtcNow
        };
        _db.UserProfiles.Add(profile);
        _db.SaveChanges();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["GeminiSettings:ApiKey"] = "DEMO_KEY"
            })
            .Build();

        var matcherService = new JobMatcherService(
            new DummyChatCompletionService(),
            new DummyEmbeddingService(),
            config,
            NullLogger<JobMatcherService>.Instance
        );

        _controller = new JobsController(
            _db,
            [],
            new DummyVectorService(),
            matcherService,
            new DummyJobPreparationService(),
            config,
            new DummyWebHostEnvironment(),
            NullLogger<JobsController>.Instance
        );

        var claims = new ClaimsPrincipal(new ClaimsIdentity([
            new Claim(ClaimTypes.NameIdentifier, _testUserId),
            new Claim(ClaimTypes.Email, "test@teams7.com")
        ], "mock"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claims }
        };
    }

    [Fact]
    public async Task PasteAndMatch_PersistsJobToDatabase_AndReturnsEvaluation()
    {
        var request = new JobsController.PasteAndMatchRequest(
            Title: "Lead .NET Architect",
            Company: "Fintech Innovation Ltd",
            Description: "Seeking experienced developer with C#, .NET, Docker, and Kubernetes knowledge.",
            Url: "https://fintech.example.com/jobs/lead-architect"
        );

        var response = await _controller.PasteAndMatch(request, CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var match = Assert.IsType<JobMatchResultDto>(okResult.Value);

        Assert.Equal("Lead .NET Architect", match.Title);
        Assert.Equal("Fintech Innovation Ltd", match.Company);
        Assert.Contains("C#", match.MatchingSkills);
        Assert.Contains("Docker", match.MissingSkills);

        // Verify persisted in DB
        var savedJob = await _db.JobPostings.FirstOrDefaultAsync(j => j.Id == match.JobId);
        Assert.NotNull(savedJob);
        Assert.Equal(JobSource.CustomPaste, savedJob.Source);
        Assert.Equal("https://fintech.example.com/jobs/lead-architect", savedJob.Url);
    }

    [Fact]
    public async Task PasteAndMatch_AllowsSubsequentBookmarkAndTailoredApplication_WithoutForeignConstraintFailure()
    {
        var request = new JobsController.PasteAndMatchRequest(
            Title: "Full Stack Engineer",
            Company: "Global Cloud Tech",
            Description: "Looking for C#, .NET, SQL Server developer.",
            Url: null
        );

        var response = await _controller.PasteAndMatch(request, CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var match = Assert.IsType<JobMatchResultDto>(okResult.Value);

        // 1. Toggle Bookmark for this pasted job
        var bookmarkResponse = await _controller.ToggleBookmark(match.JobId, CancellationToken.None);
        var bookmarkResult = Assert.IsType<OkObjectResult>(bookmarkResponse);
        Assert.NotNull(bookmarkResult.Value);

        var savedScore = await _db.JobMatchScores.FirstOrDefaultAsync(s => s.JobPostingId == match.JobId && s.UserId == _testUserId);
        Assert.NotNull(savedScore);
        Assert.True(savedScore.IsBookmarked);

        // 2. Generate Tailored Application for this pasted job
        var appResponse = await _controller.GenerateTailoredApplication(match.JobId, CancellationToken.None);
        var appResult = Assert.IsType<OkObjectResult>(appResponse.Result);
        var app = Assert.IsType<TailoredApplicationResult>(appResult.Value);
        Assert.False(string.IsNullOrWhiteSpace(app.CoverLetter));

        var savedApp = await _db.TailoredApplications.FirstOrDefaultAsync(a => a.JobPostingId == match.JobId && a.UserId == _testUserId);
        Assert.NotNull(savedApp);
        Assert.Equal(match.JobId, savedApp.JobPostingId);
    }

    [Fact]
    public async Task PasteAndMatch_AutoExtractsTitle_WhenTitleOmitted()
    {
        var request = new JobsController.PasteAndMatchRequest(
            Title: null,
            Company: null,
            Description: "Principal Cloud Systems Engineer\nWe are looking for a top-tier engineer to build distributed services."
        );

        var response = await _controller.PasteAndMatch(request, CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var match = Assert.IsType<JobMatchResultDto>(okResult.Value);

        Assert.Equal("Principal Cloud Systems Engineer", match.Title);
        Assert.Equal("Target Employer", match.Company);
    }
}
