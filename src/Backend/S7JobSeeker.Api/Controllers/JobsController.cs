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

    [HttpPost("sync")]
    public async Task<IActionResult> SyncJobs(CancellationToken cancellationToken)
    {
        var isDev = _environment.IsDevelopment();
        var expectedKey = _configuration["CronSettings:SecretKey"] ?? "default-cron-secret";

        // In production, strictly enforce secret header
        if (!isDev)
        {
            if (!Request.Headers.TryGetValue("X-Cron-Key", out var providedKey) || providedKey != expectedKey)
            {
                _logger.LogWarning("Unauthorized job sync trigger attempt.");
                return Unauthorized(new { message = "Invalid or missing X-Cron-Key header." });
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
            var jobs = await fetcher.FetchLatestJobsAsync(cancellationToken);
            totalFetched += jobs.Count;

            foreach (var job in jobs)
            {
                var exists = await _dbContext.JobPostings
                    .AnyAsync(j => j.Source == job.Source && j.ExternalId == job.ExternalId, cancellationToken);

                if (exists) continue;

                // Attempt vector embedding & upsert with graceful fallback
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
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Vector indexing skipped for job {Title}: {Message}", job.Title, ex.Message);
                }

                _dbContext.JobPostings.Add(job);
                totalNew++;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
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

        var matchedJobs = new List<JobMatchResultDto>();

        if (vectorMatches.Count > 0)
        {
            var jobGuids = vectorMatches.Select(v => Guid.TryParse(v.Payload.GetValueOrDefault("JobId"), out var gid) ? gid : Guid.Empty)
                                        .Where(g => g != Guid.Empty)
                                        .ToList();

            var jobs = await _dbContext.JobPostings
                .AsNoTracking()
                .Where(j => jobGuids.Contains(j.Id))
                .ToListAsync(cancellationToken);

            var bookmarkedIds = await _dbContext.JobMatchScores
                .AsNoTracking()
                .Where(m => m.UserId == userId && m.IsBookmarked)
                .Select(m => m.JobPostingId)
                .ToListAsync(cancellationToken);

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
            var recentJobs = await _dbContext.JobPostings
                .AsNoTracking()
                .OrderByDescending(j => j.CreatedAt)
                .Take(limit)
                .ToListAsync(cancellationToken);

            foreach (var job in recentJobs)
            {
                var evaluation = await _matcherService.EvaluateMatchAsync(parsedProfile, job, null, cancellationToken);
                matchedJobs.Add(evaluation);
            }
        }

        return Ok(matchedJobs.OrderByDescending(m => m.OverallScore).ToList());
    }

    public record PasteAndMatchRequest(string Title, string Company, string Description);

    [Authorize]
    [HttpPost("paste-and-match")]
    public async Task<ActionResult<JobMatchResultDto>> PasteAndMatch(
        [FromBody] PasteAndMatchRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var profile = await _dbContext.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (profile == null || string.IsNullOrEmpty(profile.ParsedProfileJson))
        {
            return BadRequest(new { message = "Please upload your resume first." });
        }

        var parsedProfile = JsonSerializer.Deserialize<ResumeParsedProfileDto>(profile.ParsedProfileJson);
        if (parsedProfile == null) return BadRequest(new { message = "Invalid profile." });

        var tempJob = new JobPosting
        {
            Id = Guid.NewGuid(),
            ExternalId = Guid.NewGuid().ToString(),
            Source = JobSource.CustomPaste,
            Title = string.IsNullOrWhiteSpace(request.Title) ? "Custom Opportunity" : request.Title,
            Company = string.IsNullOrWhiteSpace(request.Company) ? "Target Employer" : request.Company,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow
        };

        var matchResult = await _matcherService.EvaluateMatchAsync(parsedProfile, tempJob, null, cancellationToken);
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
