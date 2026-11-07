using System.Text.Json;
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
    private readonly ILogger<SkillExtractorService> _logger;

    public SkillExtractorService(IChatCompletionService chatCompletionService, ILogger<SkillExtractorService> logger)
    {
        _chatCompletionService = chatCompletionService;
        _logger = logger;
    }

    public async Task<ResumeParsedProfileDto> ExtractStructuredProfileAsync(string resumeText, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Extracting structured skills and experience from resume text (length: {Length})...", resumeText.Length);

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
            _logger.LogError(ex, "Failed to parse structured profile via LLM.");
        }

        // Fallback profile if LLM extraction fails or is unconfigured
        return new ResumeParsedProfileDto(
            FullName: "Candidate",
            Email: null,
            Phone: null,
            TargetRole: "Software Engineer",
            TotalYearsOfExperience: 0,
            Summary: resumeText.Length > 200 ? resumeText[..200] + "..." : resumeText,
            Skills: [],
            Experiences: []
        );
    }
}
