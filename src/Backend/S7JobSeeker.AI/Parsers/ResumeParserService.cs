using System.Text;
using Microsoft.Extensions.Logging;
using S7JobSeeker.Core.Interfaces;
using UglyToad.PdfPig;

namespace S7JobSeeker.AI.Parsers;

public class ResumeParserService : IResumeParserService
{
    private readonly ILogger<ResumeParserService> _logger;

    public ResumeParserService(ILogger<ResumeParserService> logger)
    {
        _logger = logger;
    }

    public async Task<string> ExtractTextFromDocumentAsync(Stream documentStream, string fileName, CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        _logger.LogInformation("Parsing resume file: {FileName} with extension: {Ext}", fileName, extension);

        if (extension == ".pdf")
        {
            return await Task.Run(() =>
            {
                var sb = new StringBuilder();
                using var document = PdfDocument.Open(documentStream);
                foreach (var page in document.GetPages())
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    sb.AppendLine(page.Text);
                }
                return sb.ToString().Trim();
            }, cancellationToken);
        }
        else if (extension == ".txt" || extension == ".md")
        {
            using var reader = new StreamReader(documentStream, Encoding.UTF8);
            return await reader.ReadToEndAsync(cancellationToken);
        }
        else
        {
            // For other formats or fallback
            using var reader = new StreamReader(documentStream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
            return await reader.ReadToEndAsync(cancellationToken);
        }
    }
}
