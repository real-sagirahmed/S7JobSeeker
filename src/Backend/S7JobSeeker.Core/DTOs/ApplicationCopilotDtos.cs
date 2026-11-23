namespace S7JobSeeker.Core.DTOs;

public record ApplicationCopilotRequest(
    Guid? JobId,
    string? JobTitle,
    string? CompanyName,
    string? JobDescription,
    List<string> ScreeningQuestions,
    string? CustomNotes
);

public record CopilotAnswerDto(
    string Question,
    string Answer,
    List<string> KeyHighlights
);

public record ApplicationCopilotResponse(
    List<CopilotAnswerDto> Answers,
    int CreditsRemaining,
    string? RecruiterSearchUrl,
    string? ColdEmailPitch
);
