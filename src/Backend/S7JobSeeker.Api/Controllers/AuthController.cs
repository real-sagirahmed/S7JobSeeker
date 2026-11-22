using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using S7JobSeeker.Api.DTOs;
using S7JobSeeker.Core.Entities;

namespace S7JobSeeker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _configuration = configuration;
        _logger = logger;
    }

    private bool IsReservedAdminEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        var cleanEmail = email.Trim();
        var masterEmail = _configuration["AdminSettings:MasterEmail"] ?? "admin@s7jobseeker.com";
        return string.Equals(cleanEmail, masterEmail.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    [EnableRateLimiting("AuthPolicy")]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto dto)
    {
        // ARCHITECTURAL INTENT (LOCK: Zero Privilege Escalation in Public Registration):
        // Public registration MUST NEVER grant administrator rights under any circumstances.
        // Reserved administrator emails cannot be claimed via the public registration form.
        if (IsReservedAdminEmail(dto.Email))
        {
            return BadRequest(new { message = "This email address is reserved for system administration. Please sign in directly." });
        }

        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "Email already registered." });
        }

        var user = new ApplicationUser
        {
            UserName = dto.Email.Trim(),
            Email = dto.Email.Trim(),
            FullName = dto.FullName.Trim(),
            TargetRole = dto.TargetRole?.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsAdmin = false,
            AiCredits = 20,
            TrialEndsAt = DateTime.UtcNow.AddDays(30)
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return BadRequest(new { message = errors });
        }

        return GenerateAuthResponse(user);
    }

    [EnableRateLimiting("AuthPolicy")]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        return GenerateAuthResponse(user);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        return new UserDto(
            user.Id,
            user.Email ?? "",
            user.FullName,
            user.TargetRole,
            user.YearsOfExperience,
            user.IsAdmin,
            user.AiCredits,
            user.TrialEndsAt
        );
    }

    private AuthResponseDto GenerateAuthResponse(ApplicationUser user)
    {
        var secret = _configuration["JwtSettings:Secret"] ?? "SuperSecretKeyForS7JobSeekerAuthenticationMustBeAtLeast32CharactersLong2026!";
        var issuer = _configuration["JwtSettings:Issuer"] ?? "s7job-seeker-api";
        var audience = _configuration["JwtSettings:Audience"] ?? "s7job-seeker-client";
        var expiryDays = int.TryParse(_configuration["JwtSettings:ExpiryDays"], out var days) ? days : 7;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddDays(expiryDays);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? ""),
            new(ClaimTypes.Name, user.FullName)
        };

        if (user.IsAdmin)
        {
            claims.Add(new Claim(ClaimTypes.Role, "Admin"));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new AuthResponseDto(
            Token: new JwtSecurityTokenHandler().WriteToken(token),
            Email: user.Email ?? "",
            FullName: user.FullName,
            TargetRole: user.TargetRole,
            IsAdmin: user.IsAdmin,
            AiCredits: user.AiCredits,
            TrialEndsAt: user.TrialEndsAt,
            ExpiresAt: expires
        );
    }
}
