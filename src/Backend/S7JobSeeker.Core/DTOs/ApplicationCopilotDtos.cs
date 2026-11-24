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

public record FreelanceProposalRequest(
    Guid? JobId,
    string? ProjectTitle,
    string? ClientName,
    string? ProjectDescription,
    string? TargetPlatform,
    string? CustomAngle
);

public record FreelanceProposalResponse(
    string Hook,
    string RelevantExperienceProof,
    string TechnicalSolutionAndMilestones,
    string CallToAction,
    string FullProposalText,
    List<string> ClarifyingQuestions,
    int CreditsRemaining
);

