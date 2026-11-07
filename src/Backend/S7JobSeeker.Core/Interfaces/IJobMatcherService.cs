using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Entities;

namespace S7JobSeeker.Core.Interfaces;

public record TailoredApplicationResult(
    string CoverLetter,
    string ResumeTips
);

public interface IJobMatcherService
{
    Task<JobMatchResultDto> EvaluateMatchAsync(
        ResumeParsedProfileDto profile,
        JobPosting job,
        float? vectorSimilarity = null,
        CancellationToken cancellationToken = default);

    Task<TailoredApplicationResult> GenerateTailoredApplicationAsync(
        ResumeParsedProfileDto profile,
        JobPosting job,
        CancellationToken cancellationToken = default);

    Task<ReadOnlyMemory<float>> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default);
}

public interface IJobFetcherService
{
    string SourceName { get; }
    Task<IReadOnlyList<JobPosting>> FetchLatestJobsAsync(CancellationToken cancellationToken = default);
}
