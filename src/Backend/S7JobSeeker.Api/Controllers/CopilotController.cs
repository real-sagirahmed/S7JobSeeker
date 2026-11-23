using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CopilotController : ControllerBase
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IApplicationCopilotService _copilotService;
    private readonly ILogger<CopilotController> _logger;

    public CopilotController(
        IApplicationDbContext dbContext,
        IApplicationCopilotService copilotService,
        ILogger<CopilotController> logger)
    {
        _dbContext = dbContext;
        _copilotService = copilotService;
        _logger = logger;
    }

    [HttpPost("screening-answers")]
    [EnableRateLimiting("LlmGenerationPolicy")]
    public async Task<ActionResult<ApplicationCopilotResponse>> GenerateScreeningAnswers(
        [FromBody] ApplicationCopilotRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var profile = await _dbContext.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (profile == null || string.IsNullOrEmpty(profile.ParsedProfileJson))
        {
            return BadRequest(new { message = "Please upload your resume first before using S7 Application Copilot." });
        }

        var parsedProfile = JsonSerializer.Deserialize<ResumeParsedProfileDto>(profile.ParsedProfileJson);
        if (parsedProfile == null)
        {
            return BadRequest(new { message = "Invalid profile data." });
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null) return Unauthorized();

        // ARCHITECTURAL INTENT: Metered AI quota check (1 credit per copilot invocation)
        if (!user.IsAdmin && user.AiCredits <= 0)
        {
            return StatusCode(StatusCodes.Status402PaymentRequired, new
            {
                message = "You have exhausted your AI Credits. Please purchase a credit pack to generate tailored application answers.",
                requiresCredits = true
            });
        }

        // Deduct 1 credit for non-admin candidate
        if (!user.IsAdmin)
        {
            user.AiCredits = Math.Max(0, user.AiCredits - 1);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        var result = await _copilotService.GenerateAnswersAsync(
            request,
            parsedProfile,
            creditsRemaining: user.AiCredits,
            cancellationToken: cancellationToken);

        _logger.LogInformation("Generated {Count} copilot answers for user {UserId}. Credits remaining: {Credits}",
            result.Answers.Count, userId, user.AiCredits);

        return Ok(result);
    }
}
