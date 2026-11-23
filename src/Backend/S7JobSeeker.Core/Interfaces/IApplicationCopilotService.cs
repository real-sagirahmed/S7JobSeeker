using S7JobSeeker.Core.DTOs;

namespace S7JobSeeker.Core.Interfaces;

public interface IApplicationCopilotService
{
    Task<ApplicationCopilotResponse> GenerateAnswersAsync(
        ApplicationCopilotRequest request,
        ResumeParsedProfileDto profile,
        int creditsRemaining,
        CancellationToken cancellationToken = default);
}
