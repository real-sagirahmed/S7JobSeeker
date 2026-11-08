using S7JobSeeker.Core.DTOs;

namespace S7JobSeeker.Core.Interfaces;

public interface IJobPreparationService
{
    Task<JobPrepGuideDto> GeneratePreparationGuideAsync(
        string targetRole,
        string companyName,
        string jobDescription,
        ResumeParsedProfileDto? candidateProfile,
        List<string>? missingSkills,
        CancellationToken cancellationToken = default);
}
