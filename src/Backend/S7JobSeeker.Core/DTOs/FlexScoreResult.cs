namespace S7JobSeeker.Core.DTOs;

public record FlexScoreResult(
    int OverallFlexScore,
    int WhereScore,
    int WhenScore,
    int HowScore,
    bool IsWorkFromAnywhere,
    string TimezoneRequirements,
    string FlexibilityNotes
);
