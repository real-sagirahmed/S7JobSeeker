namespace S7JobSeeker.Core.DTOs;

public class JobPrepGuideDto
{
    public Guid Id { get; set; }
    public string JobId { get; set; } = string.Empty;
    public string TargetRole { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;

    public DomainFundamentalsSection DomainFundamentals { get; set; } = new();
    public DiagnosticLabsSection DiagnosticLabs { get; set; } = new();
    public MockAssessmentSection MockAssessment { get; set; } = new();
    public ReadinessChecklistSection ReadinessChecklist { get; set; } = new();

    public string ExportMarkdown { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class DomainFundamentalsSection
{
    public string Overview { get; set; } = string.Empty;
    public List<TopicItem> CoreTopics { get; set; } = new();
    public List<string> CandidateGapHighlights { get; set; } = new();
}

public class TopicItem
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string WhyItMattersInRole { get; set; } = string.Empty;
}

public class DiagnosticLabsSection
{
    public List<CodeSnippetItem> SqlQueries { get; set; } = new();
    public List<CodeSnippetItem> LinuxCommands { get; set; } = new();
    public List<CodeSnippetItem> DockerOps { get; set; } = new();
}

public class CodeSnippetItem
{
    public string Scenario { get; set; } = string.Empty;
    public string CommandOrCode { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public string ExpectedOutputOrAction { get; set; } = string.Empty;
}

public class MockAssessmentSection
{
    public List<InterviewQuestionItem> TechnicalQuestions { get; set; } = new();
    public List<InterviewQuestionItem> ScenarioTroubleshooting { get; set; } = new();
    public List<InterviewQuestionItem> BehavioralAgility { get; set; } = new();
}

public class InterviewQuestionItem
{
    public string Question { get; set; } = string.Empty;
    public string SeniorAnswerGuide { get; set; } = string.Empty;
    public string CommonPitfallsToAvoid { get; set; } = string.Empty;
}

public class ReadinessChecklistSection
{
    public List<string> PreTestActions { get; set; } = new();
    public List<string> PracticalDrills { get; set; } = new();
    public List<string> ResumeKeywordsToHighlight { get; set; } = new();
}

public class CustomJobPrepRequest
{
    public string Title { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
