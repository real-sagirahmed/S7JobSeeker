using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.Api.Controllers;

[ApiController]
[Route("api/cbs-sprint")]
public class CbsSprintController : ControllerBase
{
    private readonly ICbsSprintService _sprintService;
    private readonly ILogger<CbsSprintController> _logger;

    public CbsSprintController(
        ICbsSprintService sprintService,
        ILogger<CbsSprintController> logger)
    {
        _sprintService = sprintService;
        _logger = logger;
    }

    /// <summary>
    /// Gets the high-level 14-day curriculum overview.
    /// </summary>
    [HttpGet("curriculum")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyList<CbsCurriculumItemDto>), StatusCodes.Status200OK)]
    public IActionResult GetCurriculum()
    {
        var list = _sprintService.GetCurriculum();
        return Ok(list);
    }

    /// <summary>
    /// Gets the full lesson, labs, scenario, and quizzes for a specific day (1-14).
    /// </summary>
    [HttpGet("day/{dayNumber:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CbsDayLessonDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetDayLesson(int dayNumber)
    {
        if (dayNumber < 1 || dayNumber > 14)
        {
            return BadRequest(new { message = "Day number must be between 1 and 14." });
        }

        var lesson = _sprintService.GetLessonForDay(dayNumber);
        if (lesson == null)
        {
            return NotFound(new { message = $"Lesson for Day {dayNumber} not found." });
        }

        return Ok(lesson);
    }

    /// <summary>
    /// Gets the user's progress for the 14-day sprint. Returns empty if guest.
    /// </summary>
    [HttpGet("progress")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CbsProgressDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProgress(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            // Anonymous / guest user gets default empty progress
            return Ok(new CbsProgressDto());
        }

        var progress = await _sprintService.GetUserProgressAsync(userId, cancellationToken);
        return Ok(progress);
    }

    /// <summary>
    /// Updates completion, quiz score, or checklist for a day. Requires authentication.
    /// </summary>
    [HttpPost("progress")]
    [Authorize]
    [ProducesResponseType(typeof(CbsProgressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateProgress([FromBody] CbsProgressUpdateDto dto, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (dto.DayNumber < 1 || dto.DayNumber > 14)
        {
            return BadRequest(new { message = "Day number must be between 1 and 14." });
        }

        var updated = await _sprintService.UpdateUserProgressAsync(userId, dto, cancellationToken);
        return Ok(updated);
    }

    /// <summary>
    /// On-demand AI doubt clearing using Gemini API for a given day's concept.
    /// </summary>
    [HttpPost("ask-ai")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CbsAiDoubtResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> AskAi([FromBody] CbsAiDoubtRequestDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Question))
        {
            return BadRequest(new { message = "Question is required." });
        }

        var response = await _sprintService.AskAiDoubtAsync(request, cancellationToken);
        return Ok(response);
    }
}
