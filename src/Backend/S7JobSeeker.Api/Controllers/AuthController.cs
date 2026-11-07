using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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

    private bool IsMasterAdminEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        var cleanEmail = email.Trim();
        var masterEmail = _configuration["AdminSettings:MasterEmail"] ?? "formal.teams7@gmail.com";
        return string.Equals(cleanEmail, masterEmail.Trim(), StringComparison.OrdinalIgnoreCase) ||
               string.Equals(cleanEmail, "formal.teams7@gmail.com", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(cleanEmail, "sagir@teams7.com", StringComparison.OrdinalIgnoreCase);
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto dto)
    {
        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "Email already registered." });
        }

        var isMaster = IsMasterAdminEmail(dto.Email);

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName,
            TargetRole = dto.TargetRole,
            CreatedAt = DateTime.UtcNow,
            IsAdmin = isMaster,
            AiCredits = isMaster ? 999999 : 20,
            TrialEndsAt = isMaster ? DateTime.UtcNow.AddYears(50) : DateTime.UtcNow.AddDays(30)
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return BadRequest(new { message = errors });
        }

        return GenerateAuthResponse(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var isMaster = IsMasterAdminEmail(user.Email);

        if (isMaster && (!user.IsAdmin || user.AiCredits < 999999))
        {
            user.IsAdmin = true;
            user.AiCredits = 999999;
            user.TrialEndsAt = DateTime.UtcNow.AddYears(50);
            await _userManager.UpdateAsync(user);
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

        if (IsMasterAdminEmail(user.Email) && (!user.IsAdmin || user.AiCredits < 999999))
        {
            user.IsAdmin = true;
            user.AiCredits = 999999;
            user.TrialEndsAt = DateTime.UtcNow.AddYears(50);
            await _userManager.UpdateAsync(user);
        }

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
        var secret = _configuration["JwtSettings:Secret"] ?? "DefaultSecretKeyMustBe32CharsLongAtLeast!";
        var issuer = _configuration["JwtSettings:Issuer"] ?? "s7job-seeker";
        var audience = _configuration["JwtSettings:Audience"] ?? "s7job-seeker-users";
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
