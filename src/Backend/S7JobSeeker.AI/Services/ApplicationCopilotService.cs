using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using S7JobSeeker.AI.Security;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.AI.Services;

public class ApplicationCopilotService : IApplicationCopilotService
{
    private readonly IChatCompletionService _chatCompletionService;
    private readonly ILogger<ApplicationCopilotService> _logger;
    private readonly string _apiKey;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public ApplicationCopilotService(
        IChatCompletionService chatCompletionService,
        IConfiguration configuration,
        ILogger<ApplicationCopilotService> logger)
    {
        _chatCompletionService = chatCompletionService;
        _logger = logger;
        _apiKey = configuration["GeminiSettings:ApiKey"] ?? string.Empty;
    }

    public async Task<ApplicationCopilotResponse> GenerateAnswersAsync(
        ApplicationCopilotRequest request,
        ResumeParsedProfileDto profile,
        int creditsRemaining,
        CancellationToken cancellationToken = default)
    {
        var company = string.IsNullOrWhiteSpace(request.CompanyName) ? "Target Employer" : request.CompanyName.Trim();
        var title = string.IsNullOrWhiteSpace(request.JobTitle) ? "Software Engineer" : request.JobTitle.Trim();
        var questions = request.ScreeningQuestions
            .Where(q => !string.IsNullOrWhiteSpace(q))
            .Take(5)
            .ToList();

        if (questions.Count == 0)
        {
            questions.Add("Why are you interested in this role and company?");
            questions.Add("Describe a technical challenge you solved relevant to this position.");
        }

        // Build Boolean search query for candidate to find hiring decision makers
        var recruiterSearchUrl = $"https://www.linkedin.com/search/results/people/?keywords={Uri.EscapeDataString($"(\"Engineering Manager\" OR \"Technical Recruiter\" OR \"Head of Engineering\") AND \"{company}\"")}";

        // Candidate skill overview
        var candidateSkills = profile.Skills.Count > 0
            ? string.Join(", ", profile.Skills.Take(8).Select(s => s.Name))
            : ".NET, C#, SQL Server, Microservices, REST APIs";

        // Generate tailored cold outreach pitch
        var coldPitch = $"Hi [Hiring Manager / Recruiter Name],\n\n" +
            $"I noticed {company}'s opening for {title}. With {Math.Max(1, profile.TotalYearsOfExperience ?? 1)}+ years of hands-on experience specializing in {candidateSkills}, I have delivered production-grade, highly reliable systems with strong architectural rigor.\n\n" +
            $"I would love to learn more about your engineering roadmap and discuss how my background can add immediate value to your team.\n\n" +
            $"Best regards,\n{profile.FullName}";

        // If no Gemini API key or demo key, produce deterministic high-quality response
        if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey.StartsWith("DEMO"))
        {
            var mockAnswers = GenerateDeterministicAnswers(questions, title, company, profile, candidateSkills);
            return new ApplicationCopilotResponse(mockAnswers, creditsRemaining, recruiterSearchUrl, coldPitch);
        }

        try
        {
            var safeTitle = PromptSecuritySanitizer.Sanitize(title, 100);
            var safeCompany = PromptSecuritySanitizer.Sanitize(company, 100);
            var wrappedCandidate = PromptSecuritySanitizer.WrapUntrusted("candidate_profile",
                $"Name: {profile.FullName}\nTarget Role: {profile.TargetRole}\nExperience: {profile.TotalYearsOfExperience} years\nCore Skills: {candidateSkills}\nSummary: {profile.Summary}",
                maxLength: 2000);
            var wrappedJob = PromptSecuritySanitizer.WrapUntrusted("job_context",
                request.JobDescription ?? $"{safeTitle} at {safeCompany}",
                maxLength: 3000);
            var wrappedQuestions = PromptSecuritySanitizer.WrapUntrusted("questions_json",
                JsonSerializer.Serialize(questions),
                maxLength: 2000);

            var prompt = $$"""
            You are an elite Senior Staff Engineer and Career Coach for S7JobSeeker.
            Draft concise, persuasive, and technically grounded answers for employer screening questions.

            TARGET ROLE: {{safeTitle}}
            TARGET COMPANY: {{safeCompany}}

            CANDIDATE INFORMATION:
            {{wrappedCandidate}}

            JOB DETAILS:
            {{wrappedJob}}

            SCREENING QUESTIONS TO ANSWER:
            {{wrappedQuestions}}

            CRITICAL GUIDELINES:
            1. Every answer must sound like a thoughtful, experienced human engineer wrote it naturally.
            2. Never use generic AI fluff or empty marketing jargon (e.g. 'passionate', 'fast-paced world', 'delve into', 'unwavering commitment').
            3. Ground answers in real software engineering metrics (latency, reliability, clean architecture, test coverage, scalability).
            4. Keep each answer between 60 to 120 words.
            5. Return STRICT JSON with this exact schema:
            [
              {
                "question": "The original question",
                "answer": "The tailored, high-impact answer",
                "keyHighlights": ["Highlight 1", "Highlight 2"]
              }
            ]
            """;

            var history = new ChatHistory();
            history.AddUserMessage(prompt);

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(20));

            var response = await _chatCompletionService.GetChatMessageContentsAsync(
                history,
                cancellationToken: cts.Token);

            var rawContent = response.FirstOrDefault()?.Content ?? string.Empty;
            var cleanedJson = ExtractJsonArray(rawContent);

            var parsedAnswers = JsonSerializer.Deserialize<List<CopilotAnswerDto>>(cleanedJson, JsonOptions);
            if (parsedAnswers != null && parsedAnswers.Count > 0)
            {
                return new ApplicationCopilotResponse(parsedAnswers, creditsRemaining, recruiterSearchUrl, coldPitch);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "LLM copilot answer generation failed, using deterministic fallback.");
        }

        // Fallback
        var fallbackAnswers = GenerateDeterministicAnswers(questions, title, company, profile, candidateSkills);
        return new ApplicationCopilotResponse(fallbackAnswers, creditsRemaining, recruiterSearchUrl, coldPitch);
    }

    private static List<CopilotAnswerDto> GenerateDeterministicAnswers(
        List<string> questions,
        string title,
        string company,
        ResumeParsedProfileDto profile,
        string candidateSkills)
    {
        var list = new List<CopilotAnswerDto>();

        foreach (var q in questions)
        {
            string answer;
            var qLower = q.ToLowerInvariant();

            if (qLower.Contains("why") || qLower.Contains("interest") || qLower.Contains("join"))
            {
                answer = $"I am drawn to {company}'s focus on engineering excellence and robust product architecture. With over {Math.Max(1, profile.TotalYearsOfExperience ?? 1)} years building scalable applications using {candidateSkills}, I thrive in collaborative environments where performance, maintainability, and clean architecture are treated as first-class citizens. The technical challenges in this {title} role closely align with my career trajectory and depth.";
            }
            else if (qLower.Contains("salary") || qLower.Contains("compensation") || qLower.Contains("expectation"))
            {
                answer = $"My target compensation is competitive and aligned with the market rate for a Senior {title} role, taking into account the total rewards package, remote flexibility, and growth opportunities at {company}. I am open to discussing specific numbers based on the full scope and responsibilities.";
            }
            else if (qLower.Contains("notice") || qLower.Contains("start") || qLower.Contains("availability"))
            {
                answer = $"I am available to transition with standard professional notice (typically 2 to 4 weeks), and can ensure a seamless handover with my current commitments. If required, I am open to discussing an accelerated onboarding timeline.";
            }
            else if (qLower.Contains("challenge") || qLower.Contains("project") || qLower.Contains("experience"))
            {
                answer = $"In my recent work, I spearheaded the optimization and hardening of core backend workflows. By introducing strict architectural patterns, query optimization, and structured error handling in {candidateSkills}, we significantly cut down P99 latency and eliminated regression bugs in production. I bring this same pragmatic discipline to {company}.";
            }
            else
            {
                answer = $"With a strong engineering background in {candidateSkills} and {Math.Max(1, profile.TotalYearsOfExperience ?? 1)}+ years delivering production-grade software, I approach this requirement by breaking down technical constraints, enforcing clean design, and delivering reliable, well-tested solutions aligned with business priorities.";
            }

            list.Add(new CopilotAnswerDto(
                Question: q,
                Answer: answer,
                KeyHighlights: [$"Specialization in {candidateSkills.Split(',').FirstOrDefault()?.Trim() ?? ".NET"}", $"{Math.Max(1, profile.TotalYearsOfExperience ?? 1)}+ Years Experience", "Clean Architecture & High Reliability"]
            ));
        }

        return list;
    }

    private static string ExtractJsonArray(string content)
    {
        var start = content.IndexOf('[');
        var end = content.LastIndexOf(']');
        if (start >= 0 && end > start)
        {
            return content.Substring(start, end - start + 1);
        }
        return "[]";
    }
}
