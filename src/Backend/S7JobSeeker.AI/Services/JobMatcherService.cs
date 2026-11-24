using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using S7JobSeeker.AI.Security;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;
using S7JobSeeker.Core.Services;

namespace S7JobSeeker.AI.Services;

public class JobMatcherService : IJobMatcherService
{
    private readonly IChatCompletionService _chatCompletionService;
    private readonly IEmbeddingGenerator<string, Embedding<float>> _embeddingGenerator;
    private readonly ILogger<JobMatcherService> _logger;
    private readonly IFlexScoreCalculator _flexScoreCalculator;
    private readonly string _apiKey;
    private bool _isEmbeddingAvailable = true;

    public JobMatcherService(
        IChatCompletionService chatCompletionService,
        IEmbeddingGenerator<string, Embedding<float>> embeddingGenerator,
        IConfiguration configuration,
        ILogger<JobMatcherService> logger,
        IFlexScoreCalculator? flexScoreCalculator = null)
    {
        _chatCompletionService = chatCompletionService;
        _embeddingGenerator = embeddingGenerator;
        _logger = logger;
        _flexScoreCalculator = flexScoreCalculator ?? new FlexScoreCalculator();
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

            var generatedEmbeddings = await _embeddingGenerator.GenerateAsync([truncated], cancellationToken: cts.Token);
            var first = generatedEmbeddings.FirstOrDefault();
            return first != null ? first.Vector : new float[768];
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Gemini embedding call skipped ({Message}). Relational mode active until valid key is set.", ex.Message);
            _isEmbeddingAvailable = false;
            return new float[768];
        }
    }

    public Task<JobMatchResultDto> EvaluateMatchAsync(
        ResumeParsedProfileDto profile,
        JobPosting job,
        float? vectorSimilarity = null,
        CancellationToken cancellationToken = default)
    {
        // ARCHITECTURAL INTENT (LOCK: Determinism First & Denial-of-Wallet Defense):
        // Match evaluation across catalog jobs is strictly deterministic (mathematical set-difference).
        // Calling LLMs sequentially in bulk search loops causes unacceptable latency (30-50s) and blows through
        // the 15 RPM rate limit of the Gemini free tier. Heavy LLM generation is strictly reserved for
        // on-demand single actions: Tailored Cover Letter (GenerateTailoredApplicationAsync) and 4-Stage Prep Guide.
        var result = EvaluateMatchDeterministic(profile, job, vectorSimilarity);
        return Task.FromResult(result);
    }

    private static Regex CreateCompiledRegex(string pattern) =>
        new(pattern, RegexOptions.IgnoreCase | RegexOptions.Compiled, TimeSpan.FromMilliseconds(250));

    // ARCHITECTURAL INTENT: Pre-Compiled Tech Skill Catalog for High-Throughput Deterministic Matching
    // Storing pre-compiled Regex instances prevents runtime regex compilation latency and protects against ReDoS.
    private static readonly (string Name, Regex Regex)[] KnownTechCatalog =
    [
        // .NET Ecosystem & Languages
        ("C#", CreateCompiledRegex(@"(?<=^|\W)c#(?=\W|$)|csharp\b")),
        (".NET", CreateCompiledRegex(@"(?<=^|\W)\.net(?=\W|$)|dotnet\b|asp\.net\b")),
        ("ASP.NET Core", CreateCompiledRegex(@"\b(asp\.net\s*core|aspnetcore)\b")),
        ("EF Core", CreateCompiledRegex(@"\b(ef\s*core|entity\s*framework(\s*core)?)\b")),
        ("Dapper", CreateCompiledRegex(@"\b(dapper)\b")),
        ("Blazor", CreateCompiledRegex(@"\b(blazor)\b")),
        ("MediatR", CreateCompiledRegex(@"\b(mediatr)\b")),
        ("SignalR", CreateCompiledRegex(@"\b(signalr)\b")),
        ("Python", CreateCompiledRegex(@"\b(python)\b")),
        ("TypeScript", CreateCompiledRegex(@"\b(typescript|ts)\b")),
        ("JavaScript", CreateCompiledRegex(@"\b(javascript|js|es6)\b")),
        ("Node.js", CreateCompiledRegex(@"\b(node|nodejs)\b")),

        // Databases & Caching
        ("SQL Server", CreateCompiledRegex(@"\b(sql\s*server|mssql|t-sql)\b")),
        ("PostgreSQL", CreateCompiledRegex(@"\b(postgres|postgresql)\b")),
        ("MySQL", CreateCompiledRegex(@"\b(mysql)\b")),
        ("Oracle", CreateCompiledRegex(@"\b(oracle|pl/sql)\b")),
        ("Redis", CreateCompiledRegex(@"\b(redis)\b")),
        ("MongoDB", CreateCompiledRegex(@"\b(mongodb|mongo)\b")),
        ("Elasticsearch", CreateCompiledRegex(@"\b(elastic\s*search|elasticsearch)\b")),

        // Frontend & UI
        ("React", CreateCompiledRegex(@"\b(react|reactjs)\b")),
        ("Next.js", CreateCompiledRegex(@"\b(next\.?js)\b")),
        ("Angular", CreateCompiledRegex(@"\b(angular)\b")),
        ("Vue.js", CreateCompiledRegex(@"\b(vue|vue\.?js)\b")),
        ("Tailwind CSS", CreateCompiledRegex(@"\b(tailwind(\s*css)?)\b")),

        // Backend Architecture, APIs & Messaging
        ("Clean Architecture", CreateCompiledRegex(@"\b(clean\s*architecture|solid|cqrs)\b")),
        ("REST API", CreateCompiledRegex(@"\b(rest|web\s*api|restful)\b")),
        ("GraphQL", CreateCompiledRegex(@"\b(graphql)\b")),
        ("gRPC", CreateCompiledRegex(@"\b(grpc)\b")),
        ("RabbitMQ", CreateCompiledRegex(@"\b(rabbitmq|rabbit\s*mq)\b")),
        ("Kafka", CreateCompiledRegex(@"\b(kafka|apache\s*kafka)\b")),
        ("Microservices", CreateCompiledRegex(@"\b(microservices?)\b")),
        ("Design Patterns", CreateCompiledRegex(@"\b(design\s*patterns?)\b")),
        ("System Design", CreateCompiledRegex(@"\b(system\s*design|distributed\s*systems?)\b")),

        // Cloud, Containers & DevOps
        ("Docker", CreateCompiledRegex(@"\b(docker|containers?)\b")),
        ("Kubernetes", CreateCompiledRegex(@"\b(kubernetes|k8s)\b")),
        ("Azure", CreateCompiledRegex(@"\b(azure)\b")),
        ("AWS", CreateCompiledRegex(@"\b(aws|amazon\s*web\s*services)\b")),
        ("GCP", CreateCompiledRegex(@"\b(gcp|google\s*cloud)\b")),
        ("Linux", CreateCompiledRegex(@"\b(linux|ubuntu|debian|centos|rhel)\b")),
        ("Git", CreateCompiledRegex(@"\b(git|github|gitlab)\b")),
        ("CI/CD", CreateCompiledRegex(@"\b(ci[\s/-]?cd|github\s*actions|gitlab\s*ci)\b")),
        ("Terraform", CreateCompiledRegex(@"\b(terraform)\b")),

        // Banking & CBS Domain
        ("Core Banking (CBS)", CreateCompiledRegex(@"\b(cbs|core\s*banking|finacle|t24|flora\s*bank)\b")),
        ("Fintech Clearing", CreateCompiledRegex(@"\b(npsb|beftn|rtgs|bach)\b"))
    ];

    private JobMatchResultDto EvaluateMatchDeterministic(
        ResumeParsedProfileDto profile,
        JobPosting job,
        float? vectorSimilarity)
    {
        // ARCHITECTURAL INTENT: Deterministic Skill Gap Set-Difference
        // Missing skills = Skills required by the job which the candidate DOES NOT possess.
        var candidateSkillsSet = new HashSet<string>(
            (profile.Skills ?? []).Where(s => !string.IsNullOrWhiteSpace(s?.Name)).Select(s => s.Name.ToLowerInvariant().Trim()),
            StringComparer.OrdinalIgnoreCase
        );

        var matched = new List<string>();
        var missing = new List<string>();

        var jobText = $"{job.Title} {job.Description}";

        // 1. Detect required tech skills from job circular
        foreach (var tech in KnownTechCatalog)
        {
            if (tech.Regex.IsMatch(jobText))
            {
                // Strict matching: candidate has the exact skill name OR candidate's skill token satisfies the pre-compiled regex.
                // Prevents false positive substring matches (e.g., 'Digital Marketing' accidentally matching 'Git').
                bool candidateHasSkill = candidateSkillsSet.Contains(tech.Name) ||
                                         candidateSkillsSet.Any(c => tech.Regex.IsMatch(c));

                if (candidateHasSkill)
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
        foreach (var skill in profile.Skills ?? [])
        {
            if (!string.IsNullOrWhiteSpace(skill?.Name) && !matched.Contains(skill.Name, StringComparer.OrdinalIgnoreCase))
            {
                // Word boundary check for custom candidate skills to prevent partial word hits
                var escapedSkill = Regex.Escape(skill.Name);
                if (Regex.IsMatch(jobText, $@"(?<=^|\W){escapedSkill}(?=\W|$)", RegexOptions.IgnoreCase))
                {
                    matched.Add(skill.Name);
                }
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
            skillScore = (profile.Skills?.Count ?? 0) > 0 ? 70.0 : 50.0;
        }

        double vectorScore = vectorSimilarity.HasValue ? Math.Clamp(vectorSimilarity.Value * 100.0, 0.0, 100.0) : skillScore;
        double overallScore = Math.Round((vectorScore * 0.5) + (skillScore * 0.5), 1);

        string recommendations = missing.Count > 0
            ? $"Target employer requires expertise in {string.Join(", ", missing.Take(3))}. Consider showcasing hands-on projects or certifications in these areas."
            : $"Excellent match! Candidate satisfies all {matched.Count} identified requirements for {job.Title} at {job.Company}.";

        var flexScore = job.FlexScore;
        var flexWhere = job.FlexWhereScore;
        var flexWhen = job.FlexWhenScore;
        var flexHow = job.FlexHowScore;
        var isWfa = job.IsWorkFromAnywhere;
        var tzReq = job.TimezoneRequirements;
        var flexNotes = job.FlexibilityNotes;

        if (!flexScore.HasValue)
        {
            var res = _flexScoreCalculator.CalculateFlexScore(job.Location, job.Description, job.IsRemote);
            flexScore = res.OverallFlexScore;
            flexWhere = res.WhereScore;
            flexWhen = res.WhenScore;
            flexHow = res.HowScore;
            isWfa = res.IsWorkFromAnywhere;
            tzReq = res.TimezoneRequirements;
            flexNotes = res.FlexibilityNotes;
        }

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
            SourceName: GetSourceName(job.Source),
            FlexScore: flexScore,
            FlexWhereScore: flexWhere,
            FlexWhenScore: flexWhen,
            FlexHowScore: flexHow,
            IsWorkFromAnywhere: isWfa,
            TimezoneRequirements: tzReq,
            FlexibilityNotes: flexNotes,
            ExperienceLevel: job.ExperienceLevel
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
        JobSource.Jobgether => "Jobgether (Remote)",
        JobSource.SkillJobs => "Skill.Jobs",
        JobSource.Careerjet => "Careerjet",
        JobSource.Wellfound => "Wellfound",
        JobSource.Freelancer => "Freelancer",
        JobSource.Upwork => "Upwork",
        JobSource.Fiverr => "Fiverr",
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

        var safeJobTitle = PromptSecuritySanitizer.Sanitize(job.Title, 150);
        var safeCompany = PromptSecuritySanitizer.Sanitize(job.Company, 150);
        var wrappedJobDesc = PromptSecuritySanitizer.WrapUntrusted("job_description", job.Description, maxLength: 3000);
        var wrappedCandidate = PromptSecuritySanitizer.WrapUntrusted(
            "candidate_profile",
            $"Name: {profile.FullName}\nRole: {profile.TargetRole}\nExperience: {profile.TotalYearsOfExperience ?? 0} years\nTop Skills: {candidateSkills}\nSummary: {profile.Summary}",
            maxLength: 2000);

        var prompt = $$"""
        You are a Senior Executive Career Coach and Technical Writing Consultant.
        Draft a high-impact, professional, and personalized Cover Letter and 3 targeted Resume Enhancement Tips for the candidate applying for this job.

        CANDIDATE:
        {{wrappedCandidate}}

        TARGET JOB:
        - Title: {{safeJobTitle}}
        - Company: {{safeCompany}}
        - Description:
        {{wrappedJobDesc}}

        Respond strictly in valid JSON matching this structure:
        {
          "coverLetter": "Tailored cover letter text with formal greeting, relevant project highlights, and call to action.",
          "resumeTips": "Bullet 1: Emphasize X experience; Bullet 2: Highlight proficiency in Y; Bullet 3: Rephrase achievement Z."
        }

        Do NOT wrap in markdown code blocks. Return ONLY pure raw JSON.
        """;

        var chatHistory = new ChatHistory();
        chatHistory.AddSystemMessage($"You draft high-converting job application materials. Return strictly raw JSON.\n\n{PromptSecuritySanitizer.SystemDefenseClause}");
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

    public async Task<FreelanceProposalResponse> GenerateFreelanceProposalAsync(
        ResumeParsedProfileDto profile,
        string projectTitle,
        string clientName,
        string projectDescription,
        string? targetPlatform = null,
        string? customAngle = null,
        CancellationToken cancellationToken = default)
    {
        var platform = string.IsNullOrWhiteSpace(targetPlatform) ? "Upwork" : targetPlatform;
        var topSkills = string.Join(", ", profile.Skills.Take(6).Select(s => s.Name));
        var safeTitle = PromptSecuritySanitizer.Sanitize(projectTitle, 150);
        var safeClient = string.IsNullOrWhiteSpace(clientName) ? "Client" : PromptSecuritySanitizer.Sanitize(clientName, 100);

        if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey.StartsWith("DEMO"))
        {
            var fallbackHook = $"I noticed your project regarding \"{safeTitle}\" and can deliver a clean, maintainable solution using {topSkills}.";
            var fallbackProof = $"As a {profile.TargetRole} with {profile.TotalYearsOfExperience ?? 1}+ years of hands-on experience, I have built and optimized production applications using {topSkills}.";
            var fallbackSolution = "1. Technical audit and requirements alignment\n2. Implementation and clean architecture setup\n3. Comprehensive testing and milestone deployment";
            var fallbackCta = "Let's connect in chat to discuss the details and get started on Milestone 1.";
            var fallbackFull = $"{fallbackHook}\n\n{fallbackProof}\n\nProposed Action Plan:\n{fallbackSolution}\n\n{fallbackCta}\n\nBest regards,\n{profile.FullName}";

            return new FreelanceProposalResponse(
                Hook: fallbackHook,
                RelevantExperienceProof: fallbackProof,
                TechnicalSolutionAndMilestones: fallbackSolution,
                CallToAction: fallbackCta,
                FullProposalText: fallbackFull,
                ClarifyingQuestions:
                [
                    "Do you have existing API documentation or database schema for this project?",
                    "What is your target deadline for the initial working milestone?"
                ],
                CreditsRemaining: 0
            );
        }

        var wrappedJobDesc = PromptSecuritySanitizer.WrapUntrusted("project_brief", projectDescription, maxLength: 3000);
        var wrappedCandidate = PromptSecuritySanitizer.WrapUntrusted(
            "candidate_profile",
            $"Name: {profile.FullName}\nRole: {profile.TargetRole}\nExperience: {profile.TotalYearsOfExperience ?? 0} years\nCore Skills: {topSkills}\nSummary: {profile.Summary}",
            maxLength: 2000);

        var prompt = $$"""
        You are a Top-Rated Freelance Proposal Strategist on Upwork, Freelancer, and Fiverr.
        Craft a winning, high-converting client proposal tailored to this project using the candidate's verified skills.

        PLATFORM: {{platform}}
        CANDIDATE:
        {{wrappedCandidate}}

        CLIENT PROJECT:
        - Title: {{safeTitle}}
        - Client: {{safeClient}}
        - Angle/Notes: {{customAngle ?? "Focus on immediate technical capability and reliability"}}
        - Brief:
        {{wrappedJobDesc}}

        STRICT PROPOSAL RULES:
        1. NO generic greetings like "Dear Hiring Manager" or "I am excited to apply".
        2. Hook: Start immediately with the client's problem and how the candidate solves it in 1-2 punchy sentences.
        3. Proof of Past Work: Cite 1-2 concrete competencies or past achievements from the candidate's profile.
        4. Technical Plan: Outline a concise 3-step execution plan or milestones.
        5. Clarifying Questions: Provide 2 smart, highly relevant technical questions that prove domain mastery.
        6. Call to Action: Low-friction closing invitation.

        Respond strictly in valid JSON matching this schema:
        {
          "hook": "1-2 sentence solution hook",
          "relevantExperienceProof": "Proof citing candidate's relevant skills/experience",
          "technicalSolutionAndMilestones": "Step 1: ... Step 2: ... Step 3: ...",
          "callToAction": "Direct closing statement",
          "fullProposalText": "Complete ready-to-paste proposal combining hook, proof, plan, questions, and CTA",
          "clarifyingQuestions": ["Question 1?", "Question 2?"]
        }

        Do NOT wrap in markdown code blocks. Return ONLY pure raw JSON.
        """;

        var chatHistory = new ChatHistory();
        chatHistory.AddSystemMessage($"You draft elite freelance proposals. Return strictly raw JSON.\n\n{PromptSecuritySanitizer.SystemDefenseClause}");
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

            var hook = root.TryGetProperty("hook", out var hProp) ? hProp.GetString() ?? "" : "";
            var proof = root.TryGetProperty("relevantExperienceProof", out var pProp) ? pProp.GetString() ?? "" : "";
            var solution = root.TryGetProperty("technicalSolutionAndMilestones", out var sProp) ? sProp.GetString() ?? "" : "";
            var cta = root.TryGetProperty("callToAction", out var cProp) ? cProp.GetString() ?? "" : "";
            var fullProposal = root.TryGetProperty("fullProposalText", out var fProp) ? fProp.GetString() ?? "" : "";

            var questions = new List<string>();
            if (root.TryGetProperty("clarifyingQuestions", out var qProp) && qProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var q in qProp.EnumerateArray())
                {
                    var qStr = q.GetString();
                    if (!string.IsNullOrWhiteSpace(qStr)) questions.Add(qStr);
                }
            }

            if (questions.Count == 0)
            {
                questions.Add("Do you have specific architectural guidelines or an existing repository?");
                questions.Add("What is your timeline for the first phase?");
            }

            if (string.IsNullOrWhiteSpace(fullProposal))
            {
                fullProposal = $"{hook}\n\n{proof}\n\nPlan:\n{solution}\n\nQuestions:\n- " + string.Join("\n- ", questions) + $"\n\n{cta}\n\nBest regards,\n{profile.FullName}";
            }

            return new FreelanceProposalResponse(
                Hook: hook,
                RelevantExperienceProof: proof,
                TechnicalSolutionAndMilestones: solution,
                CallToAction: cta,
                FullProposalText: fullProposal,
                ClarifyingQuestions: questions,
                CreditsRemaining: 0
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate AI freelance proposal.");
            var fallbackHook = $"I reviewed your {safeTitle} brief and have the exact experience in {topSkills} to solve this.";
            var fallbackFull = $"{fallbackHook}\n\nAs a {profile.TargetRole}, I specialize in building reliable, scalable software solutions.\n\nLet's discuss your timeline and milestones in chat.\n\nBest regards,\n{profile.FullName}";

            return new FreelanceProposalResponse(
                Hook: fallbackHook,
                RelevantExperienceProof: $"Hands-on experience in {topSkills}.",
                TechnicalSolutionAndMilestones: "Step 1: Requirements analysis\nStep 2: Core implementation\nStep 3: Verification and testing",
                CallToAction: "Ready to discuss in chat.",
                FullProposalText: fallbackFull,
                ClarifyingQuestions: ["What is your preferred deployment environment?"],
                CreditsRemaining: 0
            );
        }
    }
}
