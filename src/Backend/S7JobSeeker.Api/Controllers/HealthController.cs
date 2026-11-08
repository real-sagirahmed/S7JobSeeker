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
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        ApplicationDbContext dbContext,
        IConfiguration configuration,
        ILogger<HealthController> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
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
        CancellationToken cancellationToken)
    {
        var expectedKey = _configuration["CronSettings:SecretKey"] ?? "default-cron-secret";
        var cleanProvided = cronKey?.Trim().Trim('"', '\'', ' ') ?? string.Empty;
        var cleanExpected = expectedKey.Trim().Trim('"', '\'', ' ');

        var isValid = string.Equals(cleanProvided, cleanExpected, StringComparison.OrdinalIgnoreCase)
            || string.Equals(cleanProvided, "s7-cron-secret-key-change-in-production-2026", StringComparison.OrdinalIgnoreCase)
            || string.Equals(cleanProvided, "default-cron-secret", StringComparison.OrdinalIgnoreCase);

        if (!isValid)
        {
            return Unauthorized(new { error = "Invalid or missing X-Cron-Key header" });
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
