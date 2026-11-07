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
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IApplicationDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        IApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        ILogger<AdminController> logger)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _logger = logger;
    }

    [HttpGet("metrics")]
    public async Task<ActionResult<AdminMetricsDto>> GetMetrics(CancellationToken cancellationToken)
    {
        var totalUsers = await _dbContext.Users.CountAsync(cancellationToken);
        var activeCandidates = await _dbContext.Users.CountAsync(u => !u.IsAdmin, cancellationToken);
        var totalJobs = await _dbContext.JobPostings.CountAsync(cancellationToken);
        var pendingPayments = await _dbContext.CreditTransactions.CountAsync(t => t.Status == TransactionStatus.Pending, cancellationToken);
        var approvedPayments = await _dbContext.CreditTransactions.CountAsync(t => t.Status == TransactionStatus.Approved, cancellationToken);
        var totalRevenue = await _dbContext.CreditTransactions
            .Where(t => t.Status == TransactionStatus.Approved)
            .SumAsync(t => t.AmountPaidBdt, cancellationToken);

        return Ok(new AdminMetricsDto(
            totalUsers,
            activeCandidates,
            totalJobs,
            pendingPayments,
            approvedPayments,
            totalRevenue
        ));
    }

    [HttpGet("payments/pending")]
    public async Task<ActionResult<List<CreditTransactionDto>>> GetPendingPayments(CancellationToken cancellationToken)
    {
        var list = await _dbContext.CreditTransactions
            .AsNoTracking()
            .Include(t => t.User)
            .Where(t => t.Status == TransactionStatus.Pending)
            .OrderBy(t => t.CreatedAt)
            .Select(t => new CreditTransactionDto(
                t.Id,
                t.UserId,
                t.User != null ? (t.User.Email ?? "") : "",
                t.User != null ? t.User.FullName : "",
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

        return Ok(list);
    }

    [HttpPost("payments/{id:guid}/approve")]
    public async Task<IActionResult> ApprovePayment(
        Guid id,
        [FromBody] AdminReviewPaymentDto? dto,
        CancellationToken cancellationToken)
    {
        var transaction = await _dbContext.CreditTransactions
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (transaction == null)
        {
            return NotFound(new { message = "Transaction not found." });
        }

        if (transaction.Status != TransactionStatus.Pending)
        {
            return BadRequest(new { message = $"Transaction is already in status '{transaction.Status}'." });
        }

        transaction.Status = TransactionStatus.Approved;
        transaction.ReviewedAt = DateTime.UtcNow;
        transaction.AdminNote = dto?.AdminNote ?? "Approved by Director";

        // Increment user credits atomically
        if (transaction.User != null)
        {
            transaction.User.AiCredits += transaction.CreditsAmount;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Director approved transaction {TrxId} (+{Credits} credits for user {UserId})",
            transaction.TransactionId, transaction.CreditsAmount, transaction.UserId);

        return Ok(new
        {
            message = $"Payment verified successfully. Added {transaction.CreditsAmount} credits to user balance.",
            status = TransactionStatus.Approved.ToString()
        });
    }

    [HttpPost("payments/{id:guid}/reject")]
    public async Task<IActionResult> RejectPayment(
        Guid id,
        [FromBody] AdminReviewPaymentDto? dto,
        CancellationToken cancellationToken)
    {
        var transaction = await _dbContext.CreditTransactions
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (transaction == null)
        {
            return NotFound(new { message = "Transaction not found." });
        }

        if (transaction.Status != TransactionStatus.Pending)
        {
            return BadRequest(new { message = $"Transaction is already in status '{transaction.Status}'." });
        }

        transaction.Status = TransactionStatus.Rejected;
        transaction.ReviewedAt = DateTime.UtcNow;
        transaction.AdminNote = dto?.AdminNote ?? "TrxID not found or invalid sender details.";

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogWarning("Director rejected transaction {TrxId} (Reason: {Note})",
            transaction.TransactionId, transaction.AdminNote);

        return Ok(new
        {
            message = "Payment transaction was rejected.",
            status = TransactionStatus.Rejected.ToString()
        });
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<AdminUserItemDto>>> GetUsers(
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var clean = search.Trim();
            query = query.Where(u =>
                (u.Email != null && u.Email.Contains(clean)) ||
                u.FullName.Contains(clean) ||
                (u.TargetRole != null && u.TargetRole.Contains(clean)));
        }

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Take(100)
            .Select(u => new AdminUserItemDto(
                u.Id,
                u.Email ?? "",
                u.FullName,
                u.TargetRole,
                u.IsAdmin,
                u.AiCredits,
                u.TrialEndsAt,
                u.TrialEndsAt > DateTime.UtcNow,
                u.CreatedAt,
                u.Transactions.Count
            ))
            .ToListAsync(cancellationToken);

        return Ok(users);
    }

    [HttpPost("users/{userId}/gift-credits")]
    public async Task<IActionResult> GiftCredits(
        string userId,
        [FromBody] GiftCreditsDto dto,
        CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.AiCredits += dto.Credits;

        var giftTrx = new CreditTransaction
        {
            UserId = user.Id,
            CreditsAmount = dto.Credits,
            AmountPaidBdt = 0m,
            Method = PaymentMethod.AdminGift,
            SenderNumber = "SYSTEM-DIRECTOR",
            TransactionId = $"GIFT-{Guid.NewGuid().ToString("N")[..10].ToUpperInvariant()}",
            Status = TransactionStatus.Approved,
            AdminNote = dto.Note ?? "Complimentary Credits gifted by Director",
            CreatedAt = DateTime.UtcNow,
            ReviewedAt = DateTime.UtcNow
        };

        _dbContext.CreditTransactions.Add(giftTrx);
        await _userManager.UpdateAsync(user);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Director gifted {Credits} credits to user {UserId}", dto.Credits, userId);

        return Ok(new
        {
            message = $"Gifted {dto.Credits} AI credits to {user.FullName}. New balance: {user.AiCredits}",
            newBalance = user.AiCredits
        });
    }

    [HttpGet("settings")]
    public async Task<ActionResult<SaaSPlatformSettingDto>> GetSettings(CancellationToken cancellationToken)
    {
        var settings = await _dbContext.PlatformSettings
            .FirstOrDefaultAsync(s => s.Id == 1, cancellationToken);

        if (settings == null)
        {
            settings = new SaaSPlatformSetting();
            _dbContext.PlatformSettings.Add(settings);
            await _dbContext.SaveChangesAsync(cancellationToken);
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

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings(
        [FromBody] UpdatePlatformSettingRequestDto dto,
        CancellationToken cancellationToken)
    {
        var settings = await _dbContext.PlatformSettings
            .FirstOrDefaultAsync(s => s.Id == 1, cancellationToken);

        if (settings == null)
        {
            settings = new SaaSPlatformSetting();
            _dbContext.PlatformSettings.Add(settings);
        }

        settings.BkashNumber = dto.BkashNumber.Trim();
        settings.NagadNumber = dto.NagadNumber.Trim();
        settings.RocketNumber = dto.RocketNumber.Trim();
        settings.PaymentInstructions = dto.PaymentInstructions.Trim();
        settings.WelcomeCredits = dto.WelcomeCredits;
        settings.TrialDays = dto.TrialDays;
        settings.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Platform settings updated successfully." });
    }
}
