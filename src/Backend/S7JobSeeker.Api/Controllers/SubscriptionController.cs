using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using S7JobSeeker.Api.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubscriptionController : ControllerBase
{
    private readonly IApplicationDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<SubscriptionController> _logger;

    public SubscriptionController(
        IApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        ILogger<SubscriptionController> logger)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _logger = logger;
    }

    private static readonly List<CreditBundleDto> Bundles =
    [
        new(1, "Starter Pack", 5, 50.00m, "Starter", false),
        new(2, "Pro Pack", 15, 100.00m, "Best Value", true),
        new(3, "Power Pack", 35, 200.00m, "Maximum Savings", false)
    ];

    [HttpGet("bundles")]
    public ActionResult<List<CreditBundleDto>> GetBundles()
    {
        return Ok(Bundles);
    }

    [HttpGet("platform-settings")]
    public async Task<ActionResult<SaaSPlatformSettingDto>> GetPlatformPaymentSettings(CancellationToken cancellationToken)
    {
        var settings = await _dbContext.PlatformSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == 1, cancellationToken);

        if (settings == null)
        {
            settings = new SaaSPlatformSetting();
        }

        return Ok(new SaaSPlatformSettingDto(
            settings.Id,
            settings.BkashNumber,
            settings.NagadNumber,
            settings.RocketNumber,
            settings.PaymentInstructions,
            settings.WelcomeCredits,
            settings.TrialDays,
            settings.UpdatedAt
        ));
    }

    [Authorize]
    [HttpGet("status")]
    public async Task<ActionResult<SubscriptionStatusDto>> GetStatus(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        var recentTransactions = await _dbContext.CreditTransactions
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t => new CreditTransactionDto(
                t.Id,
                t.UserId,
                user.Email ?? "",
                user.FullName,
                t.CreditsAmount,
                t.AmountPaidBdt,
                t.Method.ToString(),
                t.SenderNumber,
                t.TransactionId,
                t.Status.ToString(),
                t.AdminNote,
                t.CreatedAt,
                t.ReviewedAt
            ))
            .ToListAsync(cancellationToken);

        var isTrialActive = user.TrialEndsAt > DateTime.UtcNow;
        var trialDaysRemaining = isTrialActive
            ? Math.Max(0, (int)Math.Ceiling((user.TrialEndsAt - DateTime.UtcNow).TotalDays))
            : 0;

        return Ok(new SubscriptionStatusDto(
            user.AiCredits,
            user.TrialEndsAt,
            isTrialActive,
            trialDaysRemaining,
            user.IsAdmin,
            recentTransactions
        ));
    }

    [Authorize]
    [HttpPost("submit-payment")]
    public async Task<IActionResult> SubmitPayment(
        [FromBody] SubmitPaymentRequestDto dto,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        var bundle = Bundles.FirstOrDefault(b => b.Id == dto.BundleId);
        if (bundle == null)
        {
            return BadRequest(new { message = "Invalid credit bundle selected." });
        }

        var cleanTrxId = dto.TransactionId.Trim().ToUpperInvariant();
        var cleanSender = dto.SenderNumber.Trim();

        // ARCHITECTURAL INTENT (LOCK 4): Fail-safe duplicate TrxID guard
        var exists = await _dbContext.CreditTransactions
            .AnyAsync(t => t.TransactionId == cleanTrxId, cancellationToken);

        if (exists)
        {
            return BadRequest(new { message = "This Transaction ID (TrxID) has already been submitted and is currently in verification or processed." });
        }

        var transaction = new CreditTransaction
        {
            UserId = userId,
            CreditsAmount = bundle.Credits,
            AmountPaidBdt = bundle.PriceBdt,
            Method = dto.Method,
            SenderNumber = cleanSender,
            TransactionId = cleanTrxId,
            Status = TransactionStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.CreditTransactions.Add(transaction);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("New payment submitted: TrxID {TrxId}, Amount {Amount} BDT by User {UserId}",
            cleanTrxId, bundle.PriceBdt, userId);

        return Ok(new
        {
            message = "Payment submission received. Your credits will be activated immediately once verified by the Director.",
            transactionId = transaction.Id,
            status = TransactionStatus.Pending.ToString()
        });
    }
}
