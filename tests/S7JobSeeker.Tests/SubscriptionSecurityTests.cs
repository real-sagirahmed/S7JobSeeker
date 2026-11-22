using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using S7JobSeeker.Api.Controllers;
using S7JobSeeker.Api.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Infrastructure.Data;
using Xunit;

namespace S7JobSeeker.Tests;

public class SubscriptionSecurityTests
{
    private (ApplicationDbContext dbContext, UserManager<ApplicationUser> userManager) CreateServices()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<ApplicationDbContext>(opt =>
            opt.UseInMemoryDatabase($"SubSecurity_{Guid.NewGuid()}"));

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
    public void SubmitPayment_MustEnforcePublicRateLimitingPolicy()
    {
        var method = typeof(SubscriptionController).GetMethod(
            nameof(SubscriptionController.SubmitPayment),
            BindingFlags.Public | BindingFlags.Instance);

        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<EnableRateLimitingAttribute>();
        Assert.NotNull(attr);
        Assert.Equal("PublicPolicy", attr.PolicyName);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("TRX1")]
    [InlineData("SHORT7")]
    public async Task SubmitPayment_WithTooShortTransactionId_ReturnsBadRequest(string shortTrxId)
    {
        var (db, userManager) = CreateServices();
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            UserName = "subscriber@example.com",
            Email = "subscriber@example.com"
        };
        await userManager.CreateAsync(user, "Password123!");

        var controller = new SubscriptionController(db, userManager, NullLogger<SubscriptionController>.Instance);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity([
                    new Claim(ClaimTypes.NameIdentifier, user.Id),
                    new Claim(ClaimTypes.Email, user.Email!)
                ], "mock"))
            }
        };

        var request = new SubmitPaymentRequestDto(
            BundleId: 1,
            Method: PaymentMethod.Bkash,
            SenderNumber: "01700000000",
            TransactionId: shortTrxId
        );

        var response = await controller.SubmitPayment(request, CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(response);
        Assert.NotNull(badRequest.Value);
        var message = badRequest.Value.ToString();
        Assert.Contains("between 8 and 30 alphanumeric characters", message);
    }

    [Fact]
    public async Task SubmitPayment_WithTooLongTransactionId_ReturnsBadRequest()
    {
        var (db, userManager) = CreateServices();
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            UserName = "subscriber2@example.com",
            Email = "subscriber2@example.com"
        };
        await userManager.CreateAsync(user, "Password123!");

        var controller = new SubscriptionController(db, userManager, NullLogger<SubscriptionController>.Instance);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity([
                    new Claim(ClaimTypes.NameIdentifier, user.Id),
                    new Claim(ClaimTypes.Email, user.Email!)
                ], "mock"))
            }
        };

        var request = new SubmitPaymentRequestDto(
            BundleId: 1,
            Method: PaymentMethod.Bkash,
            SenderNumber: "01700000000",
            TransactionId: new string('A', 35) // > 30 chars
        );

        var response = await controller.SubmitPayment(request, CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(response);
        Assert.NotNull(badRequest.Value);
        var message = badRequest.Value.ToString();
        Assert.Contains("between 8 and 30 alphanumeric characters", message);
    }
}
