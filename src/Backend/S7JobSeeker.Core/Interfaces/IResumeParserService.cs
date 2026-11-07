using S7JobSeeker.Core.DTOs;

namespace S7JobSeeker.Core.Interfaces;

public interface IResumeParserService
{
    Task<string> ExtractTextFromDocumentAsync(Stream documentStream, string fileName, CancellationToken cancellationToken = default);
}

public interface ISkillExtractorService
{
    Task<ResumeParsedProfileDto> ExtractStructuredProfileAsync(string resumeText, CancellationToken cancellationToken = default);
}
