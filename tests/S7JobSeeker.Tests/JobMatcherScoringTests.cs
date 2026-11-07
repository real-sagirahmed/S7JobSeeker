using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Embeddings;
using S7JobSeeker.AI.Services;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using Xunit;

namespace S7JobSeeker.Tests;

public class DummyChatCompletionService : IChatCompletionService
{
    public IReadOnlyDictionary<string, object?> Attributes => new Dictionary<string, object?>();
    public Task<IReadOnlyList<ChatMessageContent>> GetChatMessageContentsAsync(
        ChatHistory chatHistory,
        PromptExecutionSettings? executionSettings = null,
        Kernel? kernel = null,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<ChatMessageContent>>([new ChatMessageContent(AuthorRole.Assistant, "{}")]);

    public IAsyncEnumerable<StreamingChatMessageContent> GetStreamingChatMessageContentsAsync(
        ChatHistory chatHistory,
        PromptExecutionSettings? executionSettings = null,
        Kernel? kernel = null,
        CancellationToken cancellationToken = default)
        => AsyncEnumerable.Empty<StreamingChatMessageContent>();
}

public class DummyEmbeddingService : ITextEmbeddingGenerationService
{
    public IReadOnlyDictionary<string, object?> Attributes => new Dictionary<string, object?>();
    public Task<IList<ReadOnlyMemory<float>>> GenerateEmbeddingsAsync(
        IList<string> data,
        Kernel? kernel = null,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IList<ReadOnlyMemory<float>>>([new float[768]]);
}

public class JobMatcherScoringTests
{
    private readonly JobMatcherService _matcherService;

    public JobMatcherScoringTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["GeminiSettings:ApiKey"] = "DEMO_KEY" // Forces deterministic engine
            })
            .Build();

        _matcherService = new JobMatcherService(
            new DummyChatCompletionService(),
            new DummyEmbeddingService(),
            config,
            NullLogger<JobMatcherService>.Instance
        );
    }

    [Fact]
    public async Task EvaluateMatch_IdentifiesMissingSkills_WhenCandidateLacksRequiredTech()
    {
        // Candidate only has React and TypeScript
        var profile = new ResumeParsedProfileDto(
            FullName: "Test Candidate",
            Email: "candidate@teams7.com",
            Phone: "+8801700000000",
            TargetRole: "Full Stack Developer",
            TotalYearsOfExperience: 3,
            Summary: "Passionate developer.",
            Skills:
            [
                new ExtractedSkillDto("React", SkillCategory.Frontend, 3, true),
                new ExtractedSkillDto("TypeScript", SkillCategory.Frontend, 3, true)
            ],
            Experiences: []
        );

        // Job requires C#, .NET, Docker, React, and TypeScript
        var job = new JobPosting
        {
            Id = Guid.NewGuid(),
            ExternalId = "job-101",
            Source = JobSource.Remotive,
            Title = "Senior Full Stack .NET & React Engineer",
            Company = "Tech Innovators",
            Location = "Remote",
            IsRemote = true,
            Description = "We are hiring! Looking for solid expertise in C#, .NET, Docker, React, and TypeScript.",
            CreatedAt = DateTime.UtcNow
        };

        // Act
        var result = await _matcherService.EvaluateMatchAsync(profile, job);

        // Assert
        Assert.NotNull(result);
        // Matching skills should contain React and TypeScript
        Assert.Contains("React", result.MatchingSkills);
        Assert.Contains("TypeScript", result.MatchingSkills);

        // Missing skills should contain C#, .NET, and Docker
        Assert.Contains("C#", result.MissingSkills);
        Assert.Contains(".NET", result.MissingSkills);
        Assert.Contains("Docker", result.MissingSkills);

        // Does NOT hallucinate missing skills as matching
        Assert.DoesNotContain("C#", result.MatchingSkills);
        Assert.DoesNotContain("Docker", result.MatchingSkills);
    }

    [Fact]
    public async Task EvaluateMatch_ScoresHigher_WhenCandidateSatisfiesAllJobRequirements()
    {
        var profile = new ResumeParsedProfileDto(
            FullName: "Principal Architect",
            Email: "architect@teams7.com",
            Phone: "+8801700000000",
            TargetRole: "Lead .NET Architect",
            TotalYearsOfExperience: 10,
            Summary: "Seasoned engineer.",
            Skills:
            [
                new ExtractedSkillDto("C#", SkillCategory.Backend, 10, true),
                new ExtractedSkillDto(".NET", SkillCategory.Backend, 10, true),
                new ExtractedSkillDto("SQL Server", SkillCategory.Database, 10, true),
                new ExtractedSkillDto("Docker", SkillCategory.CloudAndDevOps, 8, true)
            ],
            Experiences: []
        );

        var job = new JobPosting
        {
            Id = Guid.NewGuid(),
            ExternalId = "job-102",
            Source = JobSource.Arbeitnow,
            Title = "Senior Backend Engineer",
            Company = "SaaS Cloud Corp",
            Location = "Remote",
            IsRemote = true,
            Description = "Seeking strong developer with C#, .NET, SQL Server, and Docker background.",
            CreatedAt = DateTime.UtcNow
        };

        var result = await _matcherService.EvaluateMatchAsync(profile, job);

        Assert.NotNull(result);
        Assert.Empty(result.MissingSkills);
        Assert.Equal(4, result.MatchingSkills.Count);
        Assert.True(result.SkillMatchScore >= 90.0, $"Expected skill score >= 90, got {result.SkillMatchScore}");
    }

    [Fact]
    public async Task EvaluateMatch_DoesNotThrow_WhenProfileHasZeroSkills()
    {
        var profile = new ResumeParsedProfileDto(
            FullName: "New Graduate",
            Email: "grad@teams7.com",
            Phone: null,
            TargetRole: "Junior Developer",
            TotalYearsOfExperience: 0,
            Summary: "Fresh graduate.",
            Skills: [],
            Experiences: []
        );

        var job = new JobPosting
        {
            Id = Guid.NewGuid(),
            ExternalId = "job-103",
            Source = JobSource.CustomPaste,
            Title = "Junior Software Developer",
            Company = "StartUp Inc",
            Location = "Remote",
            IsRemote = true,
            Description = "Requires Python and Git knowledge.",
            CreatedAt = DateTime.UtcNow
        };

        var result = await _matcherService.EvaluateMatchAsync(profile, job);

        Assert.NotNull(result);
        Assert.Empty(result.MatchingSkills);
        Assert.Contains("Python", result.MissingSkills);
        Assert.Contains("Git", result.MissingSkills);
    }
}
