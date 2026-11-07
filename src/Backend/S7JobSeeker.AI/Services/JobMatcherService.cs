using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Embeddings;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.AI.Services;

public class JobMatcherService : IJobMatcherService
{
    private readonly IChatCompletionService _chatCompletionService;
    private readonly ITextEmbeddingGenerationService _embeddingService;
    private readonly ILogger<JobMatcherService> _logger;
    private readonly string _apiKey;
    private bool _isEmbeddingAvailable = true;

    public JobMatcherService(
        IChatCompletionService chatCompletionService,
        ITextEmbeddingGenerationService embeddingService,
        IConfiguration configuration,
        ILogger<JobMatcherService> logger)
    {
        _chatCompletionService = chatCompletionService;
        _embeddingService = embeddingService;
        _logger = logger;
        _apiKey = configuration["GeminiSettings:ApiKey"] ?? string.Empty;
    }

    public async Task<ReadOnlyMemory<float>> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default)
    {
        // Fail-fast guard: if no API key is configured or previous calls failed with auth error
        if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey.StartsWith("DEMO") || !_isEmbeddingAvailable)
        {
            return new float[768];
        }

        try
        {
            var truncated = text.Length > 2000 ? text[..2000] : text;
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(3));

            var embeddings = await _embeddingService.GenerateEmbeddingsAsync([truncated], cancellationToken: cts.Token);
            return embeddings.FirstOrDefault();
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Gemini embedding call skipped ({Message}). Relational mode active until valid key is set.", ex.Message);
            _isEmbeddingAvailable = false;
            return new float[768];
        }
    }

    public async Task<JobMatchResultDto> EvaluateMatchAsync(
        ResumeParsedProfileDto profile,
        JobPosting job,
        float? vectorSimilarity = null,
        CancellationToken cancellationToken = default)
    {
        var candidateSkills = string.Join(", ", profile.Skills.Select(s => s.Name));

        // If no real API key, use fast deterministic keyword/skill matching fallback
        if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey.StartsWith("DEMO"))
        {
            return EvaluateMatchDeterministic(profile, job, vectorSimilarity);
        }

        var prompt = $$"""
        You are a Principal Engineering Hiring Evaluator and Career Advisor.
        Evaluate the suitability of the candidate for the given job opening.

        CANDIDATE PROFILE:
        - Target Role: {{profile.TargetRole}}
        - Experience: {{profile.TotalYearsOfExperience}} years
        - Skills: {{candidateSkills}}
        - Summary: {{profile.Summary}}

        JOB POSTING:
        - Title: {{job.Title}}
        - Company: {{job.Company}}
        - Description:
        \"\"\"
        {{(job.Description.Length > 2500 ? job.Description[..2500] : job.Description)}}
        \"\"\"

        Respond strictly in valid JSON matching this structure:
        {
          "skillMatchScore": 85.0,
          "matchingSkills": ["C#", ".NET Core", "SQL Server"],
          "missingSkills": ["Kubernetes", "AWS"],
          "recommendations": "2-3 actionable sentences highlighting strengths and how to bridge the missing skills for this specific role."
        }

        Do NOT wrap in markdown code blocks. Return ONLY valid raw JSON.
        """;

        var chatHistory = new ChatHistory();
        chatHistory.AddSystemMessage("You evaluate technical job matches. Output strictly valid JSON.");
        chatHistory.AddUserMessage(prompt);

        double skillScore = 70.0;
        var matchingSkills = new List<string>();
        var missingSkills = new List<string>();
        string recommendations = "The candidate's core background aligns with the responsibilities.";

        try
        {
            var response = await _chatCompletionService.GetChatMessageContentAsync(chatHistory, cancellationToken: cancellationToken);
            var rawJson = response.Content?.Trim() ?? string.Empty;

            if (rawJson.StartsWith("```json")) rawJson = rawJson[7..];
            if (rawJson.StartsWith("```")) rawJson = rawJson[3..];
            if (rawJson.EndsWith("```")) rawJson = rawJson[..^3];
            rawJson = rawJson.Trim();

            using var doc = JsonDocument.Parse(rawJson);
            var root = doc.RootElement;

            if (root.TryGetProperty("skillMatchScore", out var sProp)) skillScore = sProp.GetDouble();
            if (root.TryGetProperty("recommendations", out var rProp)) recommendations = rProp.GetString() ?? recommendations;

            if (root.TryGetProperty("matchingSkills", out var mProp))
            {
                foreach (var el in mProp.EnumerateArray())
                {
                    var val = el.GetString();
                    if (!string.IsNullOrWhiteSpace(val)) matchingSkills.Add(val);
                }
            }

            if (root.TryGetProperty("missingSkills", out var misProp))
            {
                foreach (var el in misProp.EnumerateArray())
                {
                    var val = el.GetString();
                    if (!string.IsNullOrWhiteSpace(val)) missingSkills.Add(val);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to evaluate match details via LLM. Using deterministic fallback.");
            return EvaluateMatchDeterministic(profile, job, vectorSimilarity);
        }

        double vectorScore = vectorSimilarity.HasValue ? Math.Clamp(vectorSimilarity.Value * 100.0, 0.0, 100.0) : skillScore;
        double overallScore = Math.Round((vectorScore * 0.5) + (skillScore * 0.5), 1);

        return new JobMatchResultDto(
            JobId: job.Id,
            Title: job.Title,
            Company: job.Company,
            Location: job.Location,
            IsRemote: job.IsRemote,
            JobType: job.JobType,
            SalaryRange: job.SalaryRange,
            Url: job.Url,
            PublishedAt: job.PublishedAt,
            OverallScore: overallScore,
            SemanticSimilarityScore: Math.Round(vectorScore, 1),
            SkillMatchScore: Math.Round(skillScore, 1),
            MatchingSkills: matchingSkills,
            MissingSkills: missingSkills,
            Recommendations: recommendations,
            IsBookmarked: false,
            Source: job.Source,
            SourceName: GetSourceName(job.Source)
        );
    }

    // ARCHITECTURAL INTENT: Normalized Tech Skill Catalog for Deterministic Extraction
    // Used for mathematical set-difference (A \ B) to identify true missing skills without LLM hallucinations.
    private static readonly (string Name, string Pattern)[] KnownTechCatalog =
    [
        ("C#", @"(?<=^|\W)c#(?=\W|$)|csharp\b"),
        (".NET", @"(?<=^|\W)\.net(?=\W|$)|dotnet\b|asp\.net\b"),
        ("SQL Server", @"\b(sql\s*server|mssql|t-sql)\b"),
        ("PostgreSQL", @"\b(postgres|postgresql)\b"),
        ("React", @"\b(react|reactjs)\b"),
        ("Angular", @"\b(angular)\b"),
        ("TypeScript", @"\b(typescript|ts)\b"),
        ("JavaScript", @"\b(javascript|js|es6)\b"),
        ("Node.js", @"\b(node|nodejs)\b"),
        ("Docker", @"\b(docker|container)\b"),
        ("Kubernetes", @"\b(kubernetes|k8s)\b"),
        ("Azure", @"\b(azure)\b"),
        ("AWS", @"\b(aws|amazon\s*web\s*services)\b"),
        ("GCP", @"\b(gcp|google\s*cloud)\b"),
        ("Git", @"\b(git|github|gitlab)\b"),
        ("Python", @"\b(python)\b"),
        ("Clean Architecture", @"\b(clean\s*architecture|solid|cqrs)\b"),
        ("REST API", @"\b(rest|web\s*api|restful)\b"),
        ("GraphQL", @"\b(graphql)\b"),
        ("Redis", @"\b(redis)\b"),
        ("MongoDB", @"\b(mongodb|mongo)\b"),
        ("Tailwind CSS", @"\b(tailwind)\b")
    ];

    private JobMatchResultDto EvaluateMatchDeterministic(
        ResumeParsedProfileDto profile,
        JobPosting job,
        float? vectorSimilarity)
    {
        // ARCHITECTURAL INTENT: Deterministic Skill Gap Set-Difference
        // Missing skills = Skills required by the job which the candidate DOES NOT possess.
        var candidateSkillsSet = new HashSet<string>(
            profile.Skills.Select(s => s.Name.ToLowerInvariant().Trim()),
            StringComparer.OrdinalIgnoreCase
        );

        var matched = new List<string>();
        var missing = new List<string>();

        var jobText = $"{job.Title} {job.Description}";

        // 1. Detect required tech skills from job circular
        foreach (var tech in KnownTechCatalog)
        {
            if (System.Text.RegularExpressions.Regex.IsMatch(jobText, tech.Pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            {
                if (candidateSkillsSet.Contains(tech.Name) || candidateSkillsSet.Any(c => c.Contains(tech.Name, StringComparison.OrdinalIgnoreCase)))
                {
                    if (!matched.Contains(tech.Name)) matched.Add(tech.Name);
                }
                else
                {
                    if (!missing.Contains(tech.Name)) missing.Add(tech.Name);
                }
            }
        }

        // 2. Also check if candidate has any unique profile skills directly mentioned in the job description
        foreach (var skill in profile.Skills)
        {
            if (!matched.Contains(skill.Name, StringComparer.OrdinalIgnoreCase) &&
                jobText.Contains(skill.Name, StringComparison.OrdinalIgnoreCase))
            {
                matched.Add(skill.Name);
            }
        }

        // Calculate skill match percentage based on required skills
        int totalRequiredSkills = matched.Count + missing.Count;
        double skillScore;

        if (totalRequiredSkills > 0)
        {
            skillScore = Math.Round(((double)matched.Count / totalRequiredSkills) * 100.0, 1);
            skillScore = Math.Clamp(skillScore, 30.0, 98.0);
        }
        else
        {
            // If job description doesn't explicitly list standard keywords, default to baseline
            skillScore = profile.Skills.Count > 0 ? 70.0 : 50.0;
        }

        double vectorScore = vectorSimilarity.HasValue ? Math.Clamp(vectorSimilarity.Value * 100.0, 0.0, 100.0) : skillScore;
        double overallScore = Math.Round((vectorScore * 0.5) + (skillScore * 0.5), 1);

        string recommendations = missing.Count > 0
            ? $"Target employer requires expertise in {string.Join(", ", missing.Take(3))}. Consider showcasing hands-on projects or certifications in these areas."
            : $"Excellent match! Candidate satisfies all {matched.Count} identified requirements for {job.Title} at {job.Company}.";

        return new JobMatchResultDto(
            JobId: job.Id,
            Title: job.Title,
            Company: job.Company,
            Location: job.Location,
            IsRemote: job.IsRemote,
            JobType: job.JobType,
            SalaryRange: job.SalaryRange,
            Url: job.Url,
            PublishedAt: job.PublishedAt,
            OverallScore: overallScore,
            SemanticSimilarityScore: Math.Round(vectorScore, 1),
            SkillMatchScore: Math.Round(skillScore, 1),
            MatchingSkills: matched,
            MissingSkills: missing,
            Recommendations: recommendations,
            IsBookmarked: false,
            Source: job.Source,
            SourceName: GetSourceName(job.Source)
        );
    }

    private static string GetSourceName(JobSource source) => source switch
    {
        JobSource.Bdjobs => "BDJobs",
        JobSource.LinkedIn => "LinkedIn",
        JobSource.Jobicy => "Jobicy",
        JobSource.Himalayas => "Himalayas",
        JobSource.WeWorkRemotely => "We Work Remotely",
        JobSource.Remotive => "Remotive",
        JobSource.Arbeitnow => "Arbeitnow",
        JobSource.CustomPaste => "Custom Paste",
        _ => source.ToString()
    };

    public async Task<TailoredApplicationResult> GenerateTailoredApplicationAsync(
        ResumeParsedProfileDto profile,
        JobPosting job,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey.StartsWith("DEMO"))
        {
            return new TailoredApplicationResult(
                CoverLetter: $"Dear Hiring Team at {job.Company},\n\nI am writing to express my strong enthusiasm for the {job.Title} position. With my background as a {profile.TargetRole} and {profile.TotalYearsOfExperience ?? 0}+ years of experience in software development, I am confident in my ability to contribute effectively to your engineering team.\n\nMy primary skills include {string.Join(", ", profile.Skills.Take(5).Select(s => s.Name))}. I look forward to discussing how my experience aligns with your goals at {job.Company}.\n\nSincerely,\n{profile.FullName}",
                ResumeTips: $"1. Tailor your headline to mirror '{job.Title}'.\n2. Highlight accomplishments involving {string.Join(", ", profile.Skills.Take(3).Select(s => s.Name))}.\n3. Quantify impact for projects similar to {job.Company}'s tech stack."
            );
        }

        var candidateSkills = string.Join(", ", profile.Skills.Select(s => s.Name));

        var prompt = $$"""
        You are a Senior Executive Career Coach and Technical Writing Consultant.
        Draft a high-impact, professional, and personalized Cover Letter and 3 targeted Resume Enhancement Tips for the candidate applying for this job.

        CANDIDATE:
        - Name: {{profile.FullName}}
        - Role: {{profile.TargetRole}}
        - Experience: {{profile.TotalYearsOfExperience}} years
        - Top Skills: {{candidateSkills}}
        - Summary: {{profile.Summary}}

        TARGET JOB:
        - Title: {{job.Title}}
        - Company: {{job.Company}}
        - Description:
        \"\"\"
        {{(job.Description.Length > 2000 ? job.Description[..2000] : job.Description)}}
        \"\"\"

        Respond strictly in valid JSON matching this structure:
        {
          "coverLetter": "Tailored cover letter text with formal greeting, relevant project highlights, and call to action.",
          "resumeTips": "Bullet 1: Emphasize X experience; Bullet 2: Highlight proficiency in Y; Bullet 3: Rephrase achievement Z."
        }

        Do NOT wrap in markdown code blocks. Return ONLY pure raw JSON.
        """;

        var chatHistory = new ChatHistory();
        chatHistory.AddSystemMessage("You draft high-converting job application materials. Return strictly raw JSON.");
        chatHistory.AddUserMessage(prompt);

        try
        {
            var response = await _chatCompletionService.GetChatMessageContentAsync(chatHistory, cancellationToken: cancellationToken);
            var rawJson = response.Content?.Trim() ?? string.Empty;

            if (rawJson.StartsWith("```json")) rawJson = rawJson[7..];
            if (rawJson.StartsWith("```")) rawJson = rawJson[3..];
            if (rawJson.EndsWith("```")) rawJson = rawJson[..^3];
            rawJson = rawJson.Trim();

            using var doc = JsonDocument.Parse(rawJson);
            var root = doc.RootElement;

            var coverLetter = root.TryGetProperty("coverLetter", out var cProp) ? cProp.GetString() : "Dear Hiring Manager...";
            var resumeTips = root.TryGetProperty("resumeTips", out var rProp) ? rProp.GetString() : "Align your top projects with the company tech stack.";

            return new TailoredApplicationResult(coverLetter ?? "", resumeTips ?? "");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate tailored application materials.");
            return new TailoredApplicationResult(
                CoverLetter: $"Dear Hiring Team at {job.Company},\n\nI am writing to express my strong interest in the {job.Title} role. With my background in {profile.TargetRole}, I look forward to bringing impact to your team.",
                ResumeTips: "Ensure your primary skills and recent achievements are prominently displayed at the top of your resume."
            );
        }
    }
}
