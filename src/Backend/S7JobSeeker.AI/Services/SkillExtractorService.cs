using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.AI.Services;

public class SkillExtractorService : ISkillExtractorService
{
    private readonly IChatCompletionService _chatCompletionService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SkillExtractorService> _logger;

    public SkillExtractorService(
        IChatCompletionService chatCompletionService,
        IConfiguration configuration,
        ILogger<SkillExtractorService> logger)
    {
        _chatCompletionService = chatCompletionService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<ResumeParsedProfileDto> ExtractStructuredProfileAsync(string resumeText, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Extracting structured skills and experience from resume text (length: {Length})...", resumeText.Length);

        var apiKey = _configuration["GeminiSettings:ApiKey"];
        var isKeyConfigured = !string.IsNullOrWhiteSpace(apiKey) && !apiKey.Contains("Dummy") && !apiKey.StartsWith("DEMO");

        if (!isKeyConfigured)
        {
            _logger.LogInformation("Gemini API key unconfigured or demo. Using deterministic keyword extraction.");
            return ExtractDeterministicProfile(resumeText);
        }

        var prompt = $$"""
        You are an elite Senior Technical Recruiter and Career Architect AI.
        Analyze the following candidate resume text and extract the candidate's structured profile, professional summary, skills, and work experience.

        RESUME TEXT:
        \"\"\"
        {{resumeText}}
        \"\"\"

        Skill Categories (use integer values):
        1 = Backend
        2 = Frontend
        3 = Database
        4 = CloudAndDevOps
        5 = AIAndData
        6 = Mobile
        7 = ArchitectureAndDesign
        8 = SoftSkill
        9 = Other

        Respond strictly in valid JSON matching this exact structure:
        {
          "fullName": "Candidate Name",
          "email": "email@example.com",
          "phone": "+8801...",
          "targetRole": "Full Stack .NET & AI Engineer",
          "totalYearsOfExperience": 5,
          "summary": "Concise 2-3 sentence executive professional summary.",
          "skills": [
            {
              "name": "C#",
              "category": 1,
              "yearsOfExperience": 5,
              "isPrimary": true
            }
          ],
          "experiences": [
            {
              "company": "Company Name",
              "role": "Role Title",
              "duration": "2021 - Present",
              "description": "Key contributions and tech stack."
            }
          ]
        }

        Do NOT wrap the response in markdown code blocks or triple backticks. Return ONLY pure raw JSON.
        """;

        var chatHistory = new ChatHistory();
        chatHistory.AddSystemMessage("You extract structured JSON profiles from resumes. Output only valid JSON without explanation or formatting tags.");
        chatHistory.AddUserMessage(prompt);

        try
        {
            var response = await _chatCompletionService.GetChatMessageContentAsync(chatHistory, cancellationToken: cancellationToken);
            var rawJson = response.Content?.Trim() ?? string.Empty;

            // Strip accidental code fences if present
            if (rawJson.StartsWith("```json"))
            {
                rawJson = rawJson[7..];
            }
            if (rawJson.StartsWith("```"))
            {
                rawJson = rawJson[3..];
            }
            if (rawJson.EndsWith("```"))
            {
                rawJson = rawJson[..^3];
            }
            rawJson = rawJson.Trim();

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var parsed = JsonSerializer.Deserialize<ResumeParsedProfileDto>(rawJson, options);
            if (parsed != null)
            {
                return parsed;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse structured profile via LLM. Falling back to deterministic parser.");
        }

        return ExtractDeterministicProfile(resumeText);
    }

    private static ResumeParsedProfileDto ExtractDeterministicProfile(string resumeText)
    {
        var text = resumeText ?? string.Empty;

        // Try extracting email cleanly (stop at valid TLD boundaries)
        var emailMatch = Regex.Match(text, @"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|io|ai|dev|co|me|xyz|info|tech|biz|bd|co\.uk)\b", RegexOptions.IgnoreCase);
        var email = emailMatch.Success ? emailMatch.Value : null;

        // Try extracting phone
        var phoneMatch = Regex.Match(text, @"(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}");
        var phone = phoneMatch.Success ? phoneMatch.Value : null;

        // Detect known skills
        var skills = new List<ExtractedSkillDto>();
        var skillCatalog = new (string Name, SkillCategory Category, string Pattern)[]
        {
            ("C#", SkillCategory.Backend, @"\b(c#|csharp)\b"),
            (".NET", SkillCategory.Backend, @"\b(\.net|dotnet|asp\.net)\b"),
            ("SQL Server", SkillCategory.Database, @"\b(sql\s*server|mssql|t-sql)\b"),
            ("React", SkillCategory.Frontend, @"\b(react|reactjs)\b"),
            ("TypeScript", SkillCategory.Frontend, @"\b(typescript|ts)\b"),
            ("JavaScript", SkillCategory.Frontend, @"\b(javascript|js|es6)\b"),
            ("Entity Framework", SkillCategory.Backend, @"\b(ef\s*core|entity\s*framework)\b"),
            ("Docker", SkillCategory.CloudAndDevOps, @"\b(docker|container)\b"),
            ("Azure", SkillCategory.CloudAndDevOps, @"\b(azure)\b"),
            ("Git", SkillCategory.CloudAndDevOps, @"\b(git|github|gitlab)\b"),
            ("Python", SkillCategory.Backend, @"\b(python)\b"),
            ("REST API", SkillCategory.ArchitectureAndDesign, @"\b(rest|web\s*api|restful)\b"),
            ("Clean Architecture", SkillCategory.ArchitectureAndDesign, @"\b(clean\s*architecture|solid|cqrs)\b"),
            ("Tailwind CSS", SkillCategory.Frontend, @"\b(tailwind)\b")
        };

        foreach (var item in skillCatalog)
        {
            if (Regex.IsMatch(text, item.Pattern, RegexOptions.IgnoreCase))
            {
                skills.Add(new ExtractedSkillDto(item.Name, item.Category, 3, true));
            }
        }

        // Extract Name: check first short line or name pattern
        var lines = text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        string fullName = "Candidate";
        foreach (var line in lines.Take(5))
        {
            var trimmed = line.Trim();
            if (trimmed.Length >= 3 && trimmed.Length <= 40 && !trimmed.Contains("@") && !trimmed.Contains("http") && !trimmed.Contains("Resume"))
            {
                fullName = trimmed;
                break;
            }
        }

        // Extract Summary: find section heading if present
        string summary = "";
        var summaryRegex = Regex.Match(text, @"(?:PROFESSIONAL SUMMARY|EXECUTIVE SUMMARY|SUMMARY|PROFILE|ABOUT ME)[\s:]+(.+?)(?=(?:SKILLS|TECHNICAL SKILLS|EXPERIENCE|WORK EXPERIENCE|EDUCATION|PROJECTS|$))", RegexOptions.Singleline | RegexOptions.IgnoreCase);
        if (summaryRegex.Success && summaryRegex.Groups[1].Value.Trim().Length > 20)
        {
            summary = summaryRegex.Groups[1].Value.Trim();
            if (summary.Length > 400) summary = summary[..400] + "...";
        }
        else
        {
            summary = text.Length > 250 ? text[..250] + "..." : text;
        }

        return new ResumeParsedProfileDto(
            FullName: fullName,
            Email: email,
            Phone: phone,
            TargetRole: ".NET & Full Stack Developer",
            TotalYearsOfExperience: 3,
            Summary: summary,
            Skills: skills,
            Experiences: []
        );
    }
}
