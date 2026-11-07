using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using S7JobSeeker.Api.Controllers;
using S7JobSeeker.Api.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Infrastructure.Data;
using Xunit;

namespace S7JobSeeker.Tests;

public class SaaSCreditWorkflowTests
{
    private (ApplicationDbContext dbContext, UserManager<ApplicationUser> userManager) CreateServices()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<ApplicationDbContext>(opt =>
            opt.UseInMemoryDatabase($"SaaS_Test_{Guid.NewGuid()}"));

        services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.Password.RequireDigit = false;
            options.Password.RequireLowercase = false;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequireUppercase = false;
            options.Password.RequiredLength = 6;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>();

        var provider = services.BuildServiceProvider();
        var db = provider.GetRequiredService<ApplicationDbContext>();
        var userManager = provider.GetRequiredService<UserManager<ApplicationUser>>();

        return (db, userManager);
    }

    [Fact]
    public async Task Registration_CandidateReceives_20CreditsAnd30DaysTrial()
    {
        var (db, userManager) = CreateServices();
        var inMemorySettings = new Dictionary<string, string?>
        {
            ["AdminSettings:MasterEmail"] = "director@teams7.com",
            ["JwtSettings:Secret"] = "VerySecretKeyForTestingSaaSCredits1234567890!",
            ["JwtSettings:Issuer"] = "test",
            ["JwtSettings:Audience"] = "test"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemorySettings).Build();

        var controller = new AuthController(userManager, config, NullLogger<AuthController>.Instance);

        var response = await controller.Register(new RegisterRequestDto(
            "candidate@example.com",
            "Password123!",
            "John Candidate",
            "Software Engineer"
        ));

        var actionResult = Assert.IsType<ActionResult<AuthResponseDto>>(response);
        var authResponse = actionResult.Value;
        Assert.NotNull(authResponse);

        Assert.Equal(20, authResponse.AiCredits);
        Assert.False(authResponse.IsAdmin);
        Assert.True(authResponse.TrialEndsAt > DateTime.UtcNow.AddDays(29));

        var userInDb = await userManager.FindByEmailAsync("candidate@example.com");
        Assert.NotNull(userInDb);
        Assert.Equal(20, userInDb.AiCredits);
        Assert.False(userInDb.IsAdmin);
    }

    [Fact]
    public async Task Registration_MasterEmail_ReceivesAdminPrivilegesAndUnlimitedCredits()
    {
        var (db, userManager) = CreateServices();
        var inMemorySettings = new Dictionary<string, string?>
        {
            ["AdminSettings:MasterEmail"] = "director@teams7.com",
            ["JwtSettings:Secret"] = "VerySecretKeyForTestingSaaSCredits1234567890!",
            ["JwtSettings:Issuer"] = "test",
            ["JwtSettings:Audience"] = "test"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemorySettings).Build();

        var controller = new AuthController(userManager, config, NullLogger<AuthController>.Instance);

        var response = await controller.Register(new RegisterRequestDto(
            "director@teams7.com",
            "MasterPassword123!",
            "Sagir Ahmed",
            "Director & Architect"
        ));

        var actionResult = Assert.IsType<ActionResult<AuthResponseDto>>(response);
        var authResponse = actionResult.Value;
        Assert.NotNull(authResponse);

        Assert.True(authResponse.IsAdmin);
        Assert.Equal(999999, authResponse.AiCredits);

        var adminInDb = await userManager.FindByEmailAsync("director@teams7.com");
        Assert.NotNull(adminInDb);
        Assert.True(adminInDb.IsAdmin);
        Assert.Equal(999999, adminInDb.AiCredits);
    }

    [Fact]
    public async Task PaymentSubmission_CreatesPendingTransaction_AndPreventsDuplicates()
    {
        var (db, userManager) = CreateServices();

        var candidate = new ApplicationUser
        {
            UserName = "candidate@example.com",
            Email = "candidate@example.com",
            FullName = "Jane Candidate",
            AiCredits = 5
        };
        await userManager.CreateAsync(candidate, "Password123!");

        var controller = new SubscriptionController(db, userManager, NullLogger<SubscriptionController>.Instance);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim(ClaimTypes.NameIdentifier, candidate.Id),
                    new Claim(ClaimTypes.Email, candidate.Email)
                ], "TestAuth"))
            }
        };

        // Submit first transaction (Pro pack: 15 credits, 100 Tk)
        var submitResult = await controller.SubmitPayment(new SubmitPaymentRequestDto(
            BundleId: 2,
            Method: PaymentMethod.Bkash,
            SenderNumber: "01711223344",
            TransactionId: "TRX987654321"
        ), CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(submitResult);
        Assert.NotNull(okResult.Value);

        var savedTrx = await db.CreditTransactions.FirstOrDefaultAsync(t => t.TransactionId == "TRX987654321");
        Assert.NotNull(savedTrx);
        Assert.Equal(TransactionStatus.Pending, savedTrx.Status);
        Assert.Equal(15, savedTrx.CreditsAmount);
        Assert.Equal(100.00m, savedTrx.AmountPaidBdt);

        // Submit second transaction with SAME TrxID (must fail duplicate guard LOCK 4)
        var duplicateResult = await controller.SubmitPayment(new SubmitPaymentRequestDto(
            BundleId: 2,
            Method: PaymentMethod.Bkash,
            SenderNumber: "01711223344",
            TransactionId: "TRX987654321"
        ), CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(duplicateResult);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task DirectorApproval_IncrementsCandidateCredits_AndMarksApproved()
    {
        var (db, userManager) = CreateServices();

        var candidate = new ApplicationUser
        {
            UserName = "buyer@example.com",
            Email = "buyer@example.com",
            FullName = "Buyer Candidate",
            AiCredits = 2
        };
        await userManager.CreateAsync(candidate, "Password123!");

        var trx = new CreditTransaction
        {
            Id = Guid.NewGuid(),
            UserId = candidate.Id,
            User = candidate,
            CreditsAmount = 35,
            AmountPaidBdt = 200m,
            Method = PaymentMethod.Nagad,
            SenderNumber = "01811223344",
            TransactionId = "TRXNAGAD554433",
            Status = TransactionStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        db.CreditTransactions.Add(trx);
        await db.SaveChangesAsync();

        var adminController = new AdminController(db, userManager, NullLogger<AdminController>.Instance);

        var approveResult = await adminController.ApprovePayment(
            trx.Id,
            new AdminReviewPaymentDto("Verified bKash merchant statement"),
            CancellationToken.None
        );

        var okResult = Assert.IsType<OkObjectResult>(approveResult);
        Assert.NotNull(okResult.Value);

        var updatedTrx = await db.CreditTransactions.FindAsync(trx.Id);
        Assert.NotNull(updatedTrx);
        Assert.Equal(TransactionStatus.Approved, updatedTrx.Status);
        Assert.NotNull(updatedTrx.ReviewedAt);
        Assert.Equal("Verified bKash merchant statement", updatedTrx.AdminNote);

        // Candidate balance should be 2 + 35 = 37
        Assert.Equal(37, candidate.AiCredits);
    }

    [Fact]
    public async Task DirectorGiftsCredits_AddsBalance_AndLogsAuditTransaction()
    {
        var (db, userManager) = CreateServices();

        var candidate = new ApplicationUser
        {
            UserName = "grateful@example.com",
            Email = "grateful@example.com",
            FullName = "Grateful Candidate",
            AiCredits = 0
        };
        await userManager.CreateAsync(candidate, "Password123!");

        var adminController = new AdminController(db, userManager, NullLogger<AdminController>.Instance);

        var giftResult = await adminController.GiftCredits(
            candidate.Id,
            new GiftCreditsDto(10, "Director promotion bonus"),
            CancellationToken.None
        );

        var okResult = Assert.IsType<OkObjectResult>(giftResult);
        var refreshedCandidate = await userManager.FindByIdAsync(candidate.Id);
        Assert.NotNull(refreshedCandidate);
        Assert.Equal(10, refreshedCandidate.AiCredits);

        var giftTrx = await db.CreditTransactions.FirstOrDefaultAsync(t => t.UserId == candidate.Id);
        Assert.NotNull(giftTrx);
        Assert.Equal(PaymentMethod.AdminGift, giftTrx.Method);
        Assert.Equal(10, giftTrx.CreditsAmount);
        Assert.Equal(TransactionStatus.Approved, giftTrx.Status);
    }
}
