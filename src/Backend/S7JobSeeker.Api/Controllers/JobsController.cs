using System.Diagnostics;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobsController : ControllerBase
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IEnumerable<IJobFetcherService> _jobFetchers;
    private readonly IQdrantVectorService _vectorService;
    private readonly IJobMatcherService _matcherService;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<JobsController> _logger;

    public JobsController(
        IApplicationDbContext dbContext,
        IEnumerable<IJobFetcherService> jobFetchers,
        IQdrantVectorService vectorService,
        IJobMatcherService matcherService,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger<JobsController> logger)
    {
        _dbContext = dbContext;
        _jobFetchers = jobFetchers;
        _vectorService = vectorService;
        _matcherService = matcherService;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    // ARCHITECTURAL INTENT: Filter out non-technical roles to keep the candidate matching catalog strictly tech-focused
    private static readonly string[] NonTechExclusions =
    [
        "account executive", "sales representative", "sales manager", "business development representative",
        "customer success", "customer support", "call center", "telemarketer", "office assistant",
        "human resources", "talent acquisition", "recruiter", "accountant", "receptionist",
        "branch manager", "store manager", "merchandiser", "cashier", "medical officer", "pharmacist"
    ];

    private static bool IsTechJob(string title)
    {
        if (string.IsNullOrWhiteSpace(title)) return false;
        return !NonTechExclusions.Any(ex => title.Contains(ex, StringComparison.OrdinalIgnoreCase));
    }

    [HttpPost("sync")]
    public async Task<IActionResult> SyncJobs(CancellationToken cancellationToken)
    {
        var isDev = _environment.IsDevelopment();
        var expectedKey = _configuration["CronSettings:SecretKey"] ?? "default-cron-secret";

        // In production, allow either valid CronKey OR authenticated user
        if (!isDev)
        {
            var hasValidCron = Request.Headers.TryGetValue("X-Cron-Key", out var providedKey) && providedKey == expectedKey;
            var isAuthenticated = User.Identity?.IsAuthenticated ?? false;

            if (!hasValidCron && !isAuthenticated)
            {
                _logger.LogWarning("Unauthorized job sync trigger attempt.");
                return Unauthorized(new { message = "Invalid or missing X-Cron-Key header or authentication token." });
            }
        }

        var sw = Stopwatch.StartNew();
        _logger.LogInformation("Starting job sync pipeline (IsDev: {IsDev})...", isDev);

        // Ensure Qdrant collection exists (resilient check)
        try
        {
            await _vectorService.EnsureCollectionExistsAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Qdrant collection check skipped ({Message}). Jobs will still be stored in SQL database.", ex.Message);
        }

        int totalFetched = 0;
        int totalNew = 0;

        foreach (var fetcher in _jobFetchers)
        {
            try
            {
                var jobs = await fetcher.FetchLatestJobsAsync(cancellationToken);
                totalFetched += jobs.Count;

                var techJobs = jobs.Where(j => IsTechJob(j.Title)).ToList();
                if (techJobs.Count == 0) continue;

                var extIds = techJobs.Select(j => j.ExternalId).ToList();
                var firstSource = techJobs[0].Source;
                var existingExtIds = await _dbContext.JobPostings
                    .Where(j => j.Source == firstSource && extIds.Contains(j.ExternalId))
                    .Select(j => j.ExternalId)
                    .ToListAsync(cancellationToken);

                var existingSet = new HashSet<string>(existingExtIds, StringComparer.OrdinalIgnoreCase);

                var newJobs = techJobs.Where(j => !existingSet.Contains(j.ExternalId)).ToList();
                if (newJobs.Count == 0) continue;

                // ARCHITECTURAL INTENT: Defensive truncation to protect against SQL Server "String or binary data would be truncated"
                foreach (var job in newJobs)
                {
                    if (job.Location?.Length > 200) job.Location = job.Location[..197] + "...";
                    if (job.Title?.Length > 300) job.Title = job.Title[..297] + "...";
                    if (job.Company?.Length > 200) job.Company = job.Company[..197] + "...";
                    if (job.ExternalId?.Length > 200) job.ExternalId = job.ExternalId[..200];
                    if (job.JobType?.Length > 100) job.JobType = job.JobType[..100];
                    if (job.SalaryRange?.Length > 100) job.SalaryRange = job.SalaryRange[..100];
                }

                // ARCHITECTURAL INTENT: Relational-first persistence. Add and save all new jobs to MSSQL
                // immediately before vector indexing so that network latency or Gemini 15 RPM
                // rate limits never starve the relational database or cause HTTP sync timeouts.
                _dbContext.JobPostings.AddRange(newJobs);
                await _dbContext.SaveChangesAsync(cancellationToken);
                totalNew += newJobs.Count;

                // Index a selective sample (up to 5 per fetcher per sync) into Qdrant to stay within Gemini 15 RPM quota
                int vectorCount = 0;
                foreach (var job in newJobs)
                {
                    if (vectorCount >= 5) break;

                    try
                    {
                        var embeddingText = $"{job.Title} at {job.Company}. {job.Description}";
                        var embedding = await _matcherService.GenerateEmbeddingAsync(embeddingText, cancellationToken);

                        var pointId = Guid.NewGuid();
                        job.QdrantPointId = pointId;

                        var metadata = new Dictionary<string, string>
                        {
                            ["JobId"] = job.Id.ToString(),
                            ["Title"] = job.Title,
                            ["Company"] = job.Company,
                            ["IsRemote"] = job.IsRemote.ToString(),
                            ["Source"] = job.Source.ToString()
                        };

                        await _vectorService.UpsertJobVectorAsync(pointId, embedding, metadata, cancellationToken);
                        vectorCount++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning("Vector indexing skipped for job {Title}: {Message}", job.Title, ex.Message);
                    }
                }

                if (vectorCount > 0)
                {
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fetcher {SourceName} failed during sync", fetcher.SourceName);
            }
        }

        sw.Stop();
        _logger.LogInformation("Job sync complete. Fetched: {Total}, New: {New}, Time: {Elapsed}ms", totalFetched, totalNew, sw.ElapsedMilliseconds);

        return Ok(new
        {
            totalFetched,
            totalNew,
            elapsedMilliseconds = sw.ElapsedMilliseconds
        });
    }

    [Authorize]
    [HttpGet("matches")]
    public async Task<ActionResult<List<JobMatchResultDto>>> GetMatchedJobs(
        [FromQuery] int limit = 20,
        [FromQuery] JobSource? source = null,
        [FromQuery] bool? remoteOnly = null,
        CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var profile = await _dbContext.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (profile == null || string.IsNullOrEmpty(profile.ParsedProfileJson))
        {
            return BadRequest(new { message = "Please upload your resume first to view job matches." });
        }

        var parsedProfile = JsonSerializer.Deserialize<ResumeParsedProfileDto>(profile.ParsedProfileJson);
        if (parsedProfile == null)
        {
            return BadRequest(new { message = "Invalid profile data." });
        }

        // Generate profile embedding
        var profileSearchText = $"{parsedProfile.TargetRole}. {parsedProfile.Summary} Skills: {string.Join(", ", parsedProfile.Skills.Select(s => s.Name))}";
        var profileEmbedding = await _matcherService.GenerateEmbeddingAsync(profileSearchText, cancellationToken);

        // Query Qdrant for semantic top matches
        var vectorMatches = await _vectorService.SearchSimilarJobsAsync(profileEmbedding, limit, cancellationToken);

        var query = _dbContext.JobPostings.AsNoTracking();
        if (source.HasValue && source.Value != 0)
        {
            query = query.Where(j => j.Source == source.Value);
        }
        if (remoteOnly.HasValue && remoteOnly.Value)
        {
            query = query.Where(j => j.IsRemote);
        }

        var matchedJobs = new List<JobMatchResultDto>();

        var bookmarkedIds = await _dbContext.JobMatchScores
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.IsBookmarked)
            .Select(m => m.JobPostingId)
            .ToListAsync(cancellationToken);

        if (vectorMatches.Count > 0)
        {
            var jobGuids = vectorMatches.Select(v => Guid.TryParse(v.Payload.GetValueOrDefault("JobId"), out var gid) ? gid : Guid.Empty)
                                        .Where(g => g != Guid.Empty)
                                        .ToList();

            var jobs = await query
                .Where(j => jobGuids.Contains(j.Id))
                .ToListAsync(cancellationToken);

            // ARCHITECTURAL INTENT: Multi-source augmentation.
            // If vector search yielded fewer jobs than limit (or user filtered by specific source not saturated in Qdrant),
            // supplement from MSSQL for fresh representation across all sources.
            if (jobs.Count < limit)
            {
                var existingJobIds = jobs.Select(j => j.Id).ToList();
                var needed = limit - jobs.Count;
                var extraJobs = await query
                    .Where(j => !existingJobIds.Contains(j.Id))
                    .OrderByDescending(j => j.CreatedAt)
                    .Take(needed)
                    .ToListAsync(cancellationToken);

                jobs.AddRange(extraJobs);
            }

            foreach (var job in jobs)
            {
                var vMatch = vectorMatches.FirstOrDefault(v => v.Payload.GetValueOrDefault("JobId") == job.Id.ToString());
                float? score = vMatch?.Score;

                var evaluation = await _matcherService.EvaluateMatchAsync(parsedProfile, job, score, cancellationToken);
                var isBookmarked = bookmarkedIds.Contains(job.Id);

                matchedJobs.Add(evaluation with { IsBookmarked = isBookmarked });
            }
        }
        else
        {
            // Fallback: If Qdrant is empty or during local dev without vectors, evaluate recent jobs from MSSQL
            var recentJobs = await query
                .OrderByDescending(j => j.CreatedAt)
                .Take(limit)
                .ToListAsync(cancellationToken);

            foreach (var job in recentJobs)
            {
                var evaluation = await _matcherService.EvaluateMatchAsync(parsedProfile, job, null, cancellationToken);
                var isBookmarked = bookmarkedIds.Contains(job.Id);
                matchedJobs.Add(evaluation with { IsBookmarked = isBookmarked });
            }
        }

        return Ok(matchedJobs.OrderByDescending(m => m.OverallScore).ToList());
    }

    [Authorize]
    [HttpGet("saved")]
    public async Task<ActionResult<List<JobMatchResultDto>>> GetSavedJobs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var savedScores = await _dbContext.JobMatchScores
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.IsBookmarked)
            .OrderByDescending(m => m.AnalyzedAt)
            .Skip((Math.Max(1, page) - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        if (savedScores.Count == 0)
        {
            return Ok(new List<JobMatchResultDto>());
        }

        var jobIds = savedScores.Select(s => s.JobPostingId).ToList();

        var jobs = await _dbContext.JobPostings
            .AsNoTracking()
            .Where(j => jobIds.Contains(j.Id))
            .ToDictionaryAsync(j => j.Id, cancellationToken);

        var profile = await _dbContext.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        var parsedProfile = !string.IsNullOrEmpty(profile?.ParsedProfileJson)
            ? JsonSerializer.Deserialize<ResumeParsedProfileDto>(profile.ParsedProfileJson)
            : null;

        var results = new List<JobMatchResultDto>();
        foreach (var score in savedScores)
        {
            if (jobs.TryGetValue(score.JobPostingId, out var job))
            {
                var eval = parsedProfile != null
                    ? await _matcherService.EvaluateMatchAsync(parsedProfile, job, (float)score.SemanticSimilarityScore, cancellationToken)
                    : new JobMatchResultDto(
                        job.Id,
                        job.Title,
                        job.Company,
                        job.Location,
                        job.IsRemote,
                        job.JobType,
                        job.SalaryRange,
                        job.Url,
                        job.CreatedAt,
                        (int)score.OverallScore,
                        score.SemanticSimilarityScore,
                        (int)score.SkillMatchScore,
                        [],
                        [],
                        "",
                        true,
                        job.Source,
                        job.Source switch
                        {
                            JobSource.Bdjobs => "BDJobs",
                            JobSource.Jobicy => "Jobicy",
                            JobSource.Himalayas => "Himalayas",
                            JobSource.WeWorkRemotely => "We Work Remotely",
                            JobSource.Remotive => "Remotive",
                            JobSource.Arbeitnow => "Arbeitnow",
                            _ => "Custom Paste"
                        });

                results.Add(eval with { IsBookmarked = true });
            }
        }

        return Ok(results);
    }

    private static string ExtractTitleFromText(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return "Custom Opportunity";
        var lines = text.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var first = lines.FirstOrDefault(l => l.Length >= 4 && !l.StartsWith("http", StringComparison.OrdinalIgnoreCase));
        if (first != null)
        {
            return first.Length > 80 ? first[..77] + "..." : first;
        }
        return "Custom Opportunity";
    }

    public record PasteAndMatchRequest(string? Title, string? Company, string Description, string? Url = null);

    [Authorize]
    [HttpPost("paste-and-match")]
    public async Task<ActionResult<JobMatchResultDto>> PasteAndMatch(
        [FromBody] PasteAndMatchRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest(new { message = "Job description cannot be empty." });
        }

        var profile = await _dbContext.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (profile == null || string.IsNullOrEmpty(profile.ParsedProfileJson))
        {
            return BadRequest(new { message = "Please upload your resume first." });
        }

        var parsedProfile = JsonSerializer.Deserialize<ResumeParsedProfileDto>(profile.ParsedProfileJson);
        if (parsedProfile == null) return BadRequest(new { message = "Invalid profile." });

        var title = string.IsNullOrWhiteSpace(request.Title)
            ? ExtractTitleFromText(request.Description)
            : request.Title.Trim();
        var company = string.IsNullOrWhiteSpace(request.Company)
            ? "Target Employer"
            : request.Company.Trim();

        var job = new JobPosting
        {
            Id = Guid.NewGuid(),
            ExternalId = $"paste-{Guid.NewGuid():N}",
            Source = JobSource.CustomPaste,
            Title = title.Length > 300 ? title[..297] + "..." : title,
            Company = company.Length > 200 ? company[..197] + "..." : company,
            Location = "Custom / Remote",
            IsRemote = true,
            Description = request.Description.Trim(),
            Url = string.IsNullOrWhiteSpace(request.Url) ? null : request.Url.Trim(),
            JobType = "Full-time",
            CreatedAt = DateTime.UtcNow
        };

        // ARCHITECTURAL INTENT: Persist pasted job to database to ensure Bookmark and
        // Tailored Application generation succeed without Foreign Key constraint violations.
        _dbContext.JobPostings.Add(job);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var matchResult = await _matcherService.EvaluateMatchAsync(parsedProfile, job, null, cancellationToken);
        return Ok(matchResult);
    }

    [Authorize]
    [HttpPost("{id:guid}/tailored-application")]
    public async Task<ActionResult<TailoredApplicationResult>> GenerateTailoredApplication(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var job = await _dbContext.JobPostings.FindAsync([id], cancellationToken);
        if (job == null) return NotFound(new { message = "Job not found." });

        var profile = await _dbContext.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (profile == null || string.IsNullOrEmpty(profile.ParsedProfileJson))
        {
            return BadRequest(new { message = "Please upload your resume first." });
        }

        var parsedProfile = JsonSerializer.Deserialize<ResumeParsedProfileDto>(profile.ParsedProfileJson);
        if (parsedProfile == null) return BadRequest(new { message = "Invalid profile." });

        var application = await _matcherService.GenerateTailoredApplicationAsync(parsedProfile, job, cancellationToken);

        // Save to DB
        var existing = await _dbContext.TailoredApplications
            .FirstOrDefaultAsync(t => t.UserId == userId && t.JobPostingId == id, cancellationToken);

        if (existing == null)
        {
            _dbContext.TailoredApplications.Add(new TailoredApplication
            {
                UserId = userId,
                JobPostingId = id,
                TailoredCoverLetter = application.CoverLetter,
                ResumeOptimizationTips = application.ResumeTips,
                GeneratedAt = DateTime.UtcNow
            });
        }
        else
        {
            existing.TailoredCoverLetter = application.CoverLetter;
            existing.ResumeOptimizationTips = application.ResumeTips;
            existing.GeneratedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(application);
    }

    [Authorize]
    [HttpPost("{id:guid}/bookmark")]
    public async Task<IActionResult> ToggleBookmark(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var matchScore = await _dbContext.JobMatchScores
            .FirstOrDefaultAsync(m => m.UserId == userId && m.JobPostingId == id, cancellationToken);

        if (matchScore == null)
        {
            matchScore = new JobMatchScore
            {
                UserId = userId,
                JobPostingId = id,
                IsBookmarked = true,
                OverallScore = 0
            };
            _dbContext.JobMatchScores.Add(matchScore);
        }
        else
        {
            matchScore.IsBookmarked = !matchScore.IsBookmarked;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { isBookmarked = matchScore.IsBookmarked });
    }
}
