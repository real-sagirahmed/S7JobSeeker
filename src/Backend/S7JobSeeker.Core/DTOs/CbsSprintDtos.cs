namespace S7JobSeeker.Core.DTOs;

public class CbsCurriculumItemDto
{
    public int DayNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // SQL, Accounting, Linux, Docker, CBS, Operations, Assessment
    public int EstimatedMinutes { get; set; }
    public List<string> TopicTags { get; set; } = [];
}

public class CbsDayLessonDto
{
    public int DayNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string TargetRole { get; set; } = "Junior Software Engineer (Service) – CBS Support";
    public int EstimatedMinutes { get; set; }
    public List<string> Objectives { get; set; } = [];
    public List<CbsTheorySectionDto> TheorySections { get; set; } = [];
    public List<CbsLabExerciseDto> Labs { get; set; } = [];
    public CbsScenarioDto Scenario { get; set; } = new();
    public List<CbsQuizQuestionDto> Quizzes { get; set; } = [];
    public List<string> CommonMistakes { get; set; } = [];
    public List<string> HomeworkChecks { get; set; } = [];
    public string ExportMarkdown { get; set; } = string.Empty;
}

public class CbsTheorySectionDto
{
    public string Heading { get; set; } = string.Empty;
    public string ContentMarkdown { get; set; } = string.Empty;
    public string? CodeSnippet { get; set; }
    public string? Language { get; set; }
}

public class CbsLabExerciseDto
{
    public int Id { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string Hint { get; set; } = string.Empty;
    public string SolutionQueryOrCode { get; set; } = string.Empty;
    public string SolutionExplanation { get; set; } = string.Empty;
    public string Language { get; set; } = "sql";
}

public class CbsScenarioDto
{
    public string IncidentId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Severity { get; set; } = "P2 - Major";
    public string Context { get; set; } = string.Empty;
    public List<string> EngineerResponsibilities { get; set; } = [];
    public string InvestigationWorkflow { get; set; } = string.Empty;
    public string VerificationStepOrScript { get; set; } = string.Empty;
    public string ModelEscalationNote { get; set; } = string.Empty;
}

public class CbsQuizQuestionDto
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public List<string> Options { get; set; } = [];
    public int CorrectOptionIndex { get; set; }
    public string Explanation { get; set; } = string.Empty;
}

public class CbsProgressDto
{
    public List<int> CompletedDays { get; set; } = [];
    public Dictionary<string, int> QuizScores { get; set; } = [];
    public Dictionary<string, bool> Checklist { get; set; } = [];
    public int LastAccessedDay { get; set; } = 1;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class CbsProgressUpdateDto
{
    public int DayNumber { get; set; }
    public bool? MarkCompleted { get; set; }
    public int? QuizScore { get; set; }
    public Dictionary<string, bool>? ChecklistUpdates { get; set; }
}

public class CbsAiDoubtRequestDto
{
    public int DayNumber { get; set; }
    public string Topic { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string? ContextSnippet { get; set; }
}

public class CbsAiDoubtResponseDto
{
    public string Answer { get; set; } = string.Empty;
    public string SeniorInsight { get; set; } = string.Empty;
    public List<string> RelatedTopicsToReview { get; set; } = [];
}
