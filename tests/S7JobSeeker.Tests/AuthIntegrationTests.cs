using System.IdentityModel.Tokens.Jwt;
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
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Infrastructure.Data;
using Xunit;

namespace S7JobSeeker.Tests;

public class AuthIntegrationTests
{
    private readonly ServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;

    public AuthIntegrationTests()
    {
        var services = new ServiceCollection();
        services.AddLogging();

        // Isolated in-memory database per test suite execution
        services.AddDbContext<ApplicationDbContext>(opts =>
            opts.UseInMemoryDatabase($"AuthTestDb_{Guid.NewGuid()}"));

        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            options.Password.RequireDigit = false;
            options.Password.RequiredLength = 6;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequireUppercase = false;
            options.Password.RequireLowercase = false;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        var configData = new Dictionary<string, string?>
        {
            ["JwtSettings:Secret"] = "SuperSecretKeyForS7JobSeekerAuthenticationMustBeAtLeast32CharactersLong2026!",
            ["JwtSettings:Issuer"] = "s7job-seeker-api",
            ["JwtSettings:Audience"] = "s7job-seeker-client",
            ["JwtSettings:ExpiryDays"] = "7",
            ["AdminSettings:MasterEmail"] = "admin@s7jobseeker.com"
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        _serviceProvider = services.BuildServiceProvider();
    }

    private (AuthController Controller, UserManager<ApplicationUser> UserManager, ApplicationDbContext DbContext) CreateContext()
    {
        var scope = _serviceProvider.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var controller = new AuthController(userManager, _configuration, NullLogger<AuthController>.Instance);
        return (controller, userManager, db);
    }

    [Fact]
    public async Task Register_ValidCandidate_CreatesUser_Assigns20Credits_AndReturnsValidJwt()
    {
        var (controller, userManager, _) = CreateContext();

        var dto = new RegisterRequestDto(
            Email: "newcandidate@s7jobseeker.com",
            Password: "SecurePassword123!",
            FullName: "Md. Candidate",
            TargetRole: ".NET Backend Engineer"
        );

        var result = await controller.Register(dto);

        var okResult = Assert.IsType<ActionResult<AuthResponseDto>>(result);
        var authResponse = okResult.Value;
        Assert.NotNull(authResponse);

        // Assert contract: 20 trial credits, 30-day trial, not admin
        Assert.Equal("newcandidate@s7jobseeker.com", authResponse.Email);
        Assert.Equal("Md. Candidate", authResponse.FullName);
        Assert.False(authResponse.IsAdmin);
        Assert.Equal(20, authResponse.AiCredits);
        Assert.True(authResponse.TrialEndsAt > DateTime.UtcNow.AddDays(29));
        Assert.NotEmpty(authResponse.Token);

        // Verify database persistence
        var dbUser = await userManager.FindByEmailAsync("newcandidate@s7jobseeker.com");
        Assert.NotNull(dbUser);
        Assert.Equal(20, dbUser.AiCredits);
        Assert.False(dbUser.IsAdmin);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsBadRequest()
    {
        var (controller, _, _) = CreateContext();

        var dto = new RegisterRequestDto(
            Email: "duplicate@s7jobseeker.com",
            Password: "SecurePassword123!",
            FullName: "Original User",
            TargetRole: "Fullstack"
        );

        // First registration
        await controller.Register(dto);

        // Attempt second registration with same email
        var duplicateResult = await controller.Register(dto);

        var badRequest = Assert.IsType<BadRequestObjectResult>(duplicateResult.Result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task Register_ReservedMasterAdminEmail_BlockedByZeroAdminPolicy()
    {
        var (controller, _, _) = CreateContext();

        var dto = new RegisterRequestDto(
            Email: "admin@s7jobseeker.com",
            Password: "AttemptedHackerPassword123!",
            FullName: "Attacker",
            TargetRole: "Director"
        );

        var result = await controller.Register(dto);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsValidJwt_WithExpectedClaimsAndIssuer()
    {
        var (controller, _, _) = CreateContext();

        var email = "login_success@s7jobseeker.com";
        var pass = "ValidPassword123!";
        await controller.Register(new RegisterRequestDto(email, pass, "Login Success User", "QA"));

        // Act
        var loginResult = await controller.Login(new LoginRequestDto(email, pass));

        // Assert
        var okResult = Assert.IsType<ActionResult<AuthResponseDto>>(loginResult);
        var auth = okResult.Value;
        Assert.NotNull(auth);
        Assert.NotEmpty(auth.Token);

        // Decode and validate JWT token claims and signature metadata
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwt = tokenHandler.ReadJwtToken(auth.Token);

        Assert.Equal("s7job-seeker-api", jwt.Issuer);
        Assert.Contains("s7job-seeker-client", jwt.Audiences);

        var emailClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email);
        Assert.NotNull(emailClaim);
        Assert.Equal(email, emailClaim.Value);

        var nameClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name);
        Assert.NotNull(nameClaim);
        Assert.Equal("Login Success User", nameClaim.Value);
    }

    [Fact]
    public async Task Login_InvalidPassword_ReturnsUnauthorized()
    {
        var (controller, _, _) = CreateContext();

        var email = "wrongpass@s7jobseeker.com";
        await controller.Register(new RegisterRequestDto(email, "CorrectPass123!", "User", "Dev"));

        var loginResult = await controller.Login(new LoginRequestDto(email, "IncorrectPassword!"));

        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(loginResult.Result);
        Assert.NotNull(unauthorized.Value);
    }

    [Fact]
    public async Task Login_NonExistentEmail_ReturnsUnauthorized()
    {
        var (controller, _, _) = CreateContext();

        var loginResult = await controller.Login(new LoginRequestDto("nobody@s7jobseeker.com", "AnyPassword!"));

        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(loginResult.Result);
        Assert.NotNull(unauthorized.Value);
    }

    [Fact]
    public async Task GetCurrentUser_WithAuthenticatedClaimsPrincipal_ReturnsFullUserProfile()
    {
        var (controller, userManager, _) = CreateContext();

        var email = "getme_test@s7jobseeker.com";
        var regResult = await controller.Register(new RegisterRequestDto(email, "Pass123!", "Profile User", "DevOps"));
        var user = await userManager.FindByEmailAsync(email);
        Assert.NotNull(user);

        // Simulate authenticated HttpContext
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.FullName)
        };
        var identity = new ClaimsIdentity(claims, "Bearer");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };

        // Act
        var result = await controller.GetCurrentUser();

        // Assert
        var okResult = Assert.IsType<ActionResult<UserDto>>(result);
        var userDto = okResult.Value;
        Assert.NotNull(userDto);
        Assert.Equal(user.Id, userDto.Id);
        Assert.Equal(email, userDto.Email);
        Assert.Equal("Profile User", userDto.FullName);
        Assert.Equal(20, userDto.AiCredits);
    }

    [Fact]
    public async Task GetCurrentUser_WithoutNameIdentifierClaim_ReturnsUnauthorized()
    {
        var (controller, _, _) = CreateContext();

        // Unauthenticated empty HttpContext
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity()) }
        };

        var result = await controller.GetCurrentUser();

        Assert.IsType<UnauthorizedResult>(result.Result);
    }
}
