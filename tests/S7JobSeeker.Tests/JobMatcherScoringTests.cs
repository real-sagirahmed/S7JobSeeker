using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
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

public class ThrowingChatCompletionService : IChatCompletionService
{
    public IReadOnlyDictionary<string, object?> Attributes => new Dictionary<string, object?>();
    public Task<IReadOnlyList<ChatMessageContent>> GetChatMessageContentsAsync(
        ChatHistory chatHistory,
        PromptExecutionSettings? executionSettings = null,
        Kernel? kernel = null,
        CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException("CRITICAL ARCHITECTURAL REGRESSION: IChatCompletionService was invoked during bulk job matching!");
    }

    public IAsyncEnumerable<StreamingChatMessageContent> GetStreamingChatMessageContentsAsync(
        ChatHistory chatHistory,
        PromptExecutionSettings? executionSettings = null,
        Kernel? kernel = null,
        CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException("CRITICAL ARCHITECTURAL REGRESSION: Streaming chat completion was invoked during bulk job matching!");
    }
}

public class DummyEmbeddingGenerator : IEmbeddingGenerator<string, Embedding<float>>
{
    public EmbeddingGeneratorMetadata Metadata => new("Dummy");

    public Task<GeneratedEmbeddings<Embedding<float>>> GenerateAsync(
        IEnumerable<string> values,
        EmbeddingGenerationOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        var list = values.Select(_ => new Embedding<float>(new float[768])).ToList();
        return Task.FromResult(new GeneratedEmbeddings<Embedding<float>>(list));
    }

    public object? GetService(Type serviceType, object? serviceKey = null) => null;
    public void Dispose() { }
}

public class DummyEmbeddingService : DummyEmbeddingGenerator
{
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
            new DummyEmbeddingGenerator(),
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

    [Theory]
    [InlineData(JobSource.Bdjobs, "BDJobs")]
    [InlineData(JobSource.LinkedIn, "LinkedIn")]
    [InlineData(JobSource.Jobicy, "Jobicy")]
    [InlineData(JobSource.Himalayas, "Himalayas")]
    [InlineData(JobSource.WeWorkRemotely, "We Work Remotely")]
    [InlineData(JobSource.Remotive, "Remotive")]
    [InlineData(JobSource.Arbeitnow, "Arbeitnow")]
    [InlineData(JobSource.Jobgether, "Jobgether (Remote)")]
    [InlineData(JobSource.SkillJobs, "Skill.Jobs")]
    [InlineData(JobSource.Careerjet, "Careerjet")]
    [InlineData(JobSource.CustomPaste, "Custom Paste")]
    public async Task EvaluateMatch_CorrectlyPreservesJobSourceAndFormattedSourceName(JobSource source, string expectedSourceName)
    {
        var profile = new ResumeParsedProfileDto(
            FullName: "Test Engineer",
            Email: "dev@teams7.com",
            Phone: "+8801700000000",
            TargetRole: "Software Engineer",
            TotalYearsOfExperience: 3,
            Summary: "Engineering profile",
            Skills: [new ExtractedSkillDto(".NET", SkillCategory.Backend, 3, true)],
            Experiences: []
        );

        var job = new JobPosting
        {
            Id = Guid.NewGuid(),
            ExternalId = $"job-{source}",
            Source = source,
            Title = "Software Developer",
            Company = "Tech Corp",
            Location = "Dhaka, Bangladesh",
            IsRemote = false,
            Description = "Looking for a skilled .NET developer.",
            CreatedAt = DateTime.UtcNow
        };

        var result = await _matcherService.EvaluateMatchAsync(profile, job);

        Assert.NotNull(result);
        Assert.Equal(source, result.Source);
        Assert.Equal(expectedSourceName, result.SourceName);
    }

    [Fact]
    public async Task EvaluateMatchAsync_NeverInvokesChatCompletionService_EvenWithActiveApiKey()
    {
        // ARCHITECTURAL INTENT: Zero-LLM Anti-Regression Lock for P0-1
        // Even when an active production Gemini API key is configured, bulk matching MUST NEVER invoke
        // IChatCompletionService. Any invocation throws ThrowingChatCompletionService exception.
        var liveConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["GeminiSettings:ApiKey"] = "AIzaSyFakeActiveProductionGeminiApiKeyForTesting12345"
            })
            .Build();

        var zeroLlmMatcher = new JobMatcherService(
            new ThrowingChatCompletionService(),
            new DummyEmbeddingService(),
            liveConfig,
            NullLogger<JobMatcherService>.Instance
        );

        var profile = new ResumeParsedProfileDto(
            FullName: "Performance Test Candidate",
            Email: "perf@teams7.com",
            Phone: "+8801700000000",
            TargetRole: "Senior .NET Engineer",
            TotalYearsOfExperience: 5,
            Summary: "High throughput candidate.",
            Skills:
            [
                new ExtractedSkillDto("C#", SkillCategory.Backend, 5, true),
                new ExtractedSkillDto(".NET", SkillCategory.Backend, 5, true),
                new ExtractedSkillDto("EF Core", SkillCategory.Backend, 5, true),
                new ExtractedSkillDto("RabbitMQ", SkillCategory.Backend, 3, true)
            ],
            Experiences: []
        );

        // Simulate 20 bulk jobs retrieved from catalog
        var bulkJobs = Enumerable.Range(1, 20).Select(i => new JobPosting
        {
            Id = Guid.NewGuid(),
            ExternalId = $"bulk-job-{i}",
            Source = JobSource.LinkedIn,
            Title = $"Senior Engineer {i}",
            Company = $"Enterprise Corp {i}",
            Location = "Remote",
            IsRemote = true,
            Description = "We are seeking a developer with C#, .NET, EF Core, RabbitMQ, and Kubernetes experience.",
            CreatedAt = DateTime.UtcNow
        }).ToList();

        // Warmup iteration to eliminate JIT compilation latency
        await zeroLlmMatcher.EvaluateMatchAsync(profile, bulkJobs[0]);

        var sw = System.Diagnostics.Stopwatch.StartNew();

        foreach (var job in bulkJobs)
        {
            var match = await zeroLlmMatcher.EvaluateMatchAsync(profile, job);
            Assert.NotNull(match);
            Assert.Contains("C#", match.MatchingSkills);
            Assert.Contains("EF Core", match.MatchingSkills);
            Assert.Contains("Kubernetes", match.MissingSkills);
            Assert.True(match.OverallScore > 0);
        }

        sw.Stop();

        // 20 jobs must evaluate in under 200 milliseconds without calling LLM
        Assert.True(sw.ElapsedMilliseconds < 200, $"Bulk evaluation took {sw.ElapsedMilliseconds}ms (must be < 200ms).");
    }

    [Fact]
    public async Task EvaluateMatchAsync_AccuratelyMatchesExpandedEnterpriseSkills_WithoutFalsePositives()
    {
        var profile = new ResumeParsedProfileDto(
            FullName: "Enterprise Architect",
            Email: "architect@teams7.com",
            Phone: "+8801700000000",
            TargetRole: "Lead Architect",
            TotalYearsOfExperience: 8,
            Summary: "Specialized in distributed systems and banking clearance.",
            Skills:
            [
                new ExtractedSkillDto("C#", SkillCategory.Backend, 8, true),
                new ExtractedSkillDto("EF Core", SkillCategory.Backend, 6, true),
                new ExtractedSkillDto("RabbitMQ", SkillCategory.Backend, 5, true),
                new ExtractedSkillDto("Kafka", SkillCategory.Backend, 4, true),
                new ExtractedSkillDto("Linux", SkillCategory.CloudAndDevOps, 6, true),
                new ExtractedSkillDto("CI/CD", SkillCategory.CloudAndDevOps, 5, true),
                new ExtractedSkillDto("Digital Marketing", SkillCategory.Other, 2, false) // Should NOT match 'Git'
            ],
            Experiences: []
        );

        var job = new JobPosting
        {
            Id = Guid.NewGuid(),
            ExternalId = "job-ent-1",
            Source = JobSource.Bdjobs,
            Title = "Senior Distributed Systems Engineer",
            Company = "Fintech Innovations Ltd",
            Location = "Dhaka",
            IsRemote = false,
            Description = "Must have deep expertise in C#, EF Core, RabbitMQ, Kafka, Linux, CI/CD, and Git for core clearing.",
            CreatedAt = DateTime.UtcNow
        };

        var result = await _matcherService.EvaluateMatchAsync(profile, job);

        Assert.NotNull(result);
        Assert.Contains("C#", result.MatchingSkills);
        Assert.Contains("EF Core", result.MatchingSkills);
        Assert.Contains("RabbitMQ", result.MatchingSkills);
        Assert.Contains("Kafka", result.MatchingSkills);
        Assert.Contains("Linux", result.MatchingSkills);
        Assert.Contains("CI/CD", result.MatchingSkills);

        // Boundary assertion: 'Digital Marketing' MUST NOT match 'Git'
        Assert.DoesNotContain("Git", result.MatchingSkills);
        Assert.Contains("Git", result.MissingSkills);
    }
}
