using S7JobSeeker.Core.DTOs;

namespace S7JobSeeker.Core.Interfaces;

public interface ICbsSprintService
{
    IReadOnlyList<CbsCurriculumItemDto> GetCurriculum();
    CbsDayLessonDto? GetLessonForDay(int dayNumber);
    Task<CbsProgressDto> GetUserProgressAsync(string userId, CancellationToken cancellationToken = default);
    Task<CbsProgressDto> UpdateUserProgressAsync(string userId, CbsProgressUpdateDto dto, CancellationToken cancellationToken = default);
    Task<CbsAiDoubtResponseDto> AskAiDoubtAsync(CbsAiDoubtRequestDto request, CancellationToken cancellationToken = default);
}
