using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel.ChatCompletion;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.AI.Services;

public class CbsSprintService : ICbsSprintService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IChatCompletionService _chatCompletionService;
    private readonly ILogger<CbsSprintService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private static readonly List<CbsCurriculumItemDto> CurriculumList = [];
    private static readonly Dictionary<int, CbsDayLessonDto> LessonsDict = [];
    private static readonly object LoadLock = new();
    private static bool _isLoaded;

    public CbsSprintService(
        IApplicationDbContext dbContext,
        IChatCompletionService chatCompletionService,
        ILogger<CbsSprintService> logger)
    {
        _dbContext = dbContext;
        _chatCompletionService = chatCompletionService;
        _logger = logger;

        EnsureCurriculumLoaded();
    }

    private void EnsureCurriculumLoaded()
    {
        if (_isLoaded) return;

        lock (LoadLock)
        {
            if (_isLoaded) return;

            try
            {
                string jsonContent = string.Empty;

                // 1. Try reading from embedded resource
                var assembly = Assembly.GetExecutingAssembly();
                var resourceName = assembly.GetManifestResourceNames()
                    .FirstOrDefault(n => n.EndsWith("cbs_curriculum.json", StringComparison.OrdinalIgnoreCase));

                if (!string.IsNullOrEmpty(resourceName))
                {
                    using var stream = assembly.GetManifestResourceStream(resourceName);
                    if (stream != null)
                    {
                        using var reader = new StreamReader(stream);
                        jsonContent = reader.ReadToEnd();
                    }
                }

                // 2. Fallback to direct file read if stream empty
                if (string.IsNullOrWhiteSpace(jsonContent))
                {
                    var possiblePaths = new[]
                    {
                        Path.Combine(AppContext.BaseDirectory, "Resources", "cbs_curriculum.json"),
                        Path.Combine(Directory.GetCurrentDirectory(), "Resources", "cbs_curriculum.json"),
                        Path.Combine(Directory.GetCurrentDirectory(), "src", "Backend", "S7JobSeeker.AI", "Resources", "cbs_curriculum.json")
                    };

                    foreach (var path in possiblePaths)
                    {
                        if (File.Exists(path))
                        {
                            jsonContent = File.ReadAllText(path);
                            break;
                        }
                    }
                }

                if (!string.IsNullOrWhiteSpace(jsonContent))
                {
                    using var doc = JsonDocument.Parse(jsonContent);
                    var root = doc.RootElement;

                    if (root.TryGetProperty("curriculum", out var currElem))
                    {
                        var items = JsonSerializer.Deserialize<List<CbsCurriculumItemDto>>(currElem.GetRawText(), JsonOptions);
                        if (items != null)
                        {
                            CurriculumList.Clear();
                            CurriculumList.AddRange(items);
                        }
                    }

                    if (root.TryGetProperty("lessons", out var lessonsElem))
                    {
                        LessonsDict.Clear();
                        foreach (var prop in lessonsElem.EnumerateObject())
                        {
                            if (int.TryParse(prop.Name, out var dayNum))
                            {
                                var lesson = JsonSerializer.Deserialize<CbsDayLessonDto>(prop.Value.GetRawText(), JsonOptions);
                                if (lesson != null)
                                {
                                    LessonsDict[dayNum] = lesson;
                                }
                            }
                        }
                    }

                    _isLoaded = true;
                    _logger.LogInformation("CBS Sprint curriculum successfully loaded with {Days} days.", LessonsDict.Count);
                }
                else
                {
                    _logger.LogWarning("CBS Sprint curriculum file could not be found or read.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load CBS Sprint curriculum data.");
            }
        }
    }

    public IReadOnlyList<CbsCurriculumItemDto> GetCurriculum()
    {
        return CurriculumList.AsReadOnly();
    }

    public CbsDayLessonDto? GetLessonForDay(int dayNumber)
    {
        return LessonsDict.TryGetValue(dayNumber, out var lesson) ? lesson : null;
    }

    public async Task<CbsProgressDto> GetUserProgressAsync(string userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return new CbsProgressDto();
        }

        var progress = await _dbContext.UserCbsProgresses
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (progress == null)
        {
            return new CbsProgressDto();
        }

        return MapToDto(progress);
    }

    public async Task<CbsProgressDto> UpdateUserProgressAsync(
        string userId,
        CbsProgressUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("UserId is required to save progress.", nameof(userId));
        }

        var progress = await _dbContext.UserCbsProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (progress == null)
        {
            progress = new UserCbsProgress
            {
                UserId = userId,
                CompletedDaysJson = "[]",
                QuizScoresJson = "{}",
                ChecklistJson = "{}",
                LastAccessedDay = dto.DayNumber,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.UserCbsProgresses.Add(progress);
        }

        // Parse existing state
        var completedList = new HashSet<int>(DeserializeOrDefault<List<int>>(progress.CompletedDaysJson) ?? []);
        var quizDict = DeserializeOrDefault<Dictionary<string, int>>(progress.QuizScoresJson) ?? [];
        var checkDict = DeserializeOrDefault<Dictionary<string, bool>>(progress.ChecklistJson) ?? [];

        // Apply mutations
        if (dto.MarkCompleted.HasValue)
        {
            if (dto.MarkCompleted.Value)
            {
                completedList.Add(dto.DayNumber);
            }
            else
            {
                completedList.Remove(dto.DayNumber);
            }
        }

        if (dto.QuizScore.HasValue)
        {
            quizDict[dto.DayNumber.ToString()] = dto.QuizScore.Value;
        }

        if (dto.ChecklistUpdates != null)
        {
            foreach (var kvp in dto.ChecklistUpdates)
            {
                checkDict[kvp.Key] = kvp.Value;
            }
        }

        progress.LastAccessedDay = dto.DayNumber;
        progress.CompletedDaysJson = JsonSerializer.Serialize(completedList);
        progress.QuizScoresJson = JsonSerializer.Serialize(quizDict);
        progress.ChecklistJson = JsonSerializer.Serialize(checkDict);
        progress.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapToDto(progress);
    }

    public async Task<CbsAiDoubtResponseDto> AskAiDoubtAsync(
        CbsAiDoubtRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var lesson = GetLessonForDay(request.DayNumber);
        var dayContext = lesson != null
            ? $"Topic Context: Day {lesson.DayNumber} ({lesson.Title}). Objectives: {string.Join(", ", lesson.Objectives.Take(3))}."
            : $"Day {request.DayNumber} Topic: {request.Topic}";

        var prompt = $$"""
        You are a Senior Core Banking Solution (CBS) Systems Architect and Technical Support Lead.
        A student preparing for the role of Junior Software Engineer (Service) - CBS Support has a technical question on the following topic.

        {{dayContext}}
        USER QUESTION: "{{request.Question}}"
        ADDITIONAL CONTEXT / SNIPPET: "{{request.ContextSnippet ?? "None"}}"

        Instructions:
        1. Answer clearly, accurately, and practically in Bengali (use English for all technical terms, code, SQL, Linux commands, and error codes).
        2. Explain the architectural rationale or root cause.
        3. Emphasize operational discipline: read-only queries, audit trail, verifying before retry, escalation guidelines.
        4. Give 1 concise Senior Insight.
        5. Provide 2-3 related topics they should review.

        Respond in strict JSON:
        {
          "answer": "Detailed Bengali answer with English technical code/terms...",
          "seniorInsight": "One actionable architectural or operational rule of thumb...",
          "relatedTopicsToReview": ["Topic 1", "Topic 2"]
        }
        Do not wrap in markdown quotes. Return pure JSON.
        """;

        try
        {
            var chatHistory = new ChatHistory();
            chatHistory.AddSystemMessage("You are a Senior CBS Systems Architect. Respond strictly in valid JSON.");
            chatHistory.AddUserMessage(prompt);

            var result = await _chatCompletionService.GetChatMessageContentAsync(chatHistory, cancellationToken: cancellationToken);
            var raw = result.Content?.Trim() ?? string.Empty;

            if (raw.StartsWith("```json", StringComparison.OrdinalIgnoreCase)) raw = raw[7..];
            if (raw.StartsWith("```", StringComparison.OrdinalIgnoreCase)) raw = raw[3..];
            if (raw.EndsWith("```", StringComparison.OrdinalIgnoreCase)) raw = raw[..^3];
            raw = raw.Trim();

            var response = JsonSerializer.Deserialize<CbsAiDoubtResponseDto>(raw, JsonOptions);
            if (response != null && !string.IsNullOrWhiteSpace(response.Answer))
            {
                return response;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gemini AI doubt clearance failed for Day {Day}. Falling back to deterministic guidance.", request.DayNumber);
        }

        return new CbsAiDoubtResponseDto
        {
            Answer = $"Day {request.DayNumber} ({request.Topic}) প্রসঙ্গে: ব্যাংকিং সাপোর্ট সিস্টেমে যেকোনো ত্রুটি বা কনসেপ্ট ইনভেস্টিগেট করার সময় সর্বপ্রথম অ্যাপ্লিকেশন লগ ও ডেটাবেস ট্রানজ্যাকশন স্ট্যাটাস মিলিয়ে দেখতে হবে। সরাসরি ডেটা আপডেট না করে Read-Only কোয়েরি দিয়ে প্রমাণ সংগ্রহ করুন।",
            SeniorInsight = "CBS অপারেশনে অনুমান নয়, evidence-based ইনভেস্টিগেশনই গোল্ডেন রুল।",
            RelatedTopicsToReview = ["Transaction Idempotency", "Read-Only Database Diagnosis", "Audit Trail Verification"]
        };
    }

    private static CbsProgressDto MapToDto(UserCbsProgress entity)
    {
        return new CbsProgressDto
        {
            CompletedDays = DeserializeOrDefault<List<int>>(entity.CompletedDaysJson) ?? [],
            QuizScores = DeserializeOrDefault<Dictionary<string, int>>(entity.QuizScoresJson) ?? [],
            Checklist = DeserializeOrDefault<Dictionary<string, bool>>(entity.ChecklistJson) ?? [],
            LastAccessedDay = entity.LastAccessedDay,
            UpdatedAt = entity.UpdatedAt
        };
    }

    private static T? DeserializeOrDefault<T>(string json)
    {
        try
        {
            return string.IsNullOrWhiteSpace(json) ? default : JsonSerializer.Deserialize<T>(json, JsonOptions);
        }
        catch
        {
            return default;
        }
    }
}
