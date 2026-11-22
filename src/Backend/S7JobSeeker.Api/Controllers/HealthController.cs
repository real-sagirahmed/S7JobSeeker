using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using S7JobSeeker.Infrastructure.Data;

namespace S7JobSeeker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        ApplicationDbContext dbContext,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger<HealthController> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> CheckHealth(CancellationToken cancellationToken)
    {
        var result = new Dictionary<string, object?>
        {
            ["status"] = "Online",
            ["serverTimeUtc"] = DateTime.UtcNow,
            ["environment"] = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown"
        };

        try
        {
            var canConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);
            result["databaseConnected"] = canConnect;

            if (canConnect)
            {
                var appliedMigrations = await _dbContext.Database.GetAppliedMigrationsAsync(cancellationToken);
                var pendingMigrations = await _dbContext.Database.GetPendingMigrationsAsync(cancellationToken);

                result["appliedMigrationsCount"] = appliedMigrations.Count();
                result["pendingMigrationsCount"] = pendingMigrations.Count();
                result["hasPendingMigrations"] = pendingMigrations.Any();

                if (!pendingMigrations.Any())
                {
                    result["totalJobsInDb"] = await _dbContext.JobPostings.CountAsync(cancellationToken);
                    result["jobsBySource"] = await _dbContext.JobPostings
                        .GroupBy(j => j.Source)
                        .Select(g => new { Source = g.Key.ToString(), SourceId = (int)g.Key, Count = g.Count() })
                        .ToListAsync(cancellationToken);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check database connection failed");
            result["databaseConnected"] = false;
            result["databaseError"] = ex.Message;
            result["databaseInnerError"] = ex.InnerException?.Message;
        }

        return Ok(result);
    }

    [HttpPost("migrate")]
    public async Task<IActionResult> ApplyMigrations(
        [FromHeader(Name = "X-Cron-Key")] string? cronKey,
        [FromQuery] string? key,
        CancellationToken cancellationToken)
    {
        var isDev = _environment.IsDevelopment();
        var expectedKey = _configuration["CronSettings:SecretKey"]
            ?? _configuration["CronSettings__SecretKey"]
            ?? _configuration["APP_CRON_KEY"]
            ?? _configuration["CRON_KEY"]
            ?? (isDev ? "dev-cron-secret" : null);

        if (string.IsNullOrWhiteSpace(expectedKey))
        {
            _logger.LogError("Database migration endpoint called but CronSettings:SecretKey is not configured.");
            return StatusCode(500, new { error = "Migration key is not configured on the server." });
        }

        var providedKey = cronKey;

        // Support RFC standard Authorization: Bearer <key>
        if (string.IsNullOrWhiteSpace(providedKey) &&
            Request.Headers.TryGetValue("Authorization", out var authHeader) &&
            authHeader.ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            providedKey = authHeader.ToString()["Bearer ".Length..].Trim();
        }
        // Support query parameter fallback
        else if (string.IsNullOrWhiteSpace(providedKey) && !string.IsNullOrWhiteSpace(key))
        {
            providedKey = key.Trim();
        }

        if (!JobsController.IsValidCronKey(providedKey, expectedKey))
        {
            return Unauthorized(new { error = "Invalid or missing migration secret key." });
        }

        try
        {
            await _dbContext.Database.MigrateAsync(cancellationToken);
            var applied = await _dbContext.Database.GetAppliedMigrationsAsync(cancellationToken);
            return Ok(new
            {
                message = "Database migrations executed successfully",
                appliedMigrations = applied
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Manual migration invocation failed");
            return StatusCode(500, new
            {
                error = "Migration failed",
                details = ex.Message,
                innerDetails = ex.InnerException?.Message
            });
        }
    }
}
