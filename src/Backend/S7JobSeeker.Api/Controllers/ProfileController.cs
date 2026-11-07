using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Core.Interfaces;
using Microsoft.AspNetCore.RateLimiting;

namespace S7JobSeeker.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IResumeParserService _resumeParser;
    private readonly ISkillExtractorService _skillExtractor;
    private readonly ILogger<ProfileController> _logger;

    public ProfileController(
        IApplicationDbContext dbContext,
        IResumeParserService resumeParser,
        ISkillExtractorService skillExtractor,
        ILogger<ProfileController> logger)
    {
        _dbContext = dbContext;
        _resumeParser = resumeParser;
        _skillExtractor = skillExtractor;
        _logger = logger;
    }

    [EnableRateLimiting("UploadPolicy")]
    [HttpPost("upload-resume")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ResumeParsedProfileDto>> UploadResume(IFormFile file, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No resume file provided." });
            }

            // Limit file size to 10MB
            if (file.Length > 10 * 1024 * 1024)
            {
                return BadRequest(new { message = "Resume file exceeds 10MB limit." });
            }

            _logger.LogInformation("Processing resume upload for user: {UserId}, file: {FileName}", userId, file.FileName);

            string rawText;
            using (var stream = file.OpenReadStream())
            {
                rawText = await _resumeParser.ExtractTextFromDocumentAsync(stream, file.FileName, cancellationToken);
            }

            if (string.IsNullOrWhiteSpace(rawText))
            {
                return BadRequest(new { message = "Failed to extract text from the document. Ensure it is not an encrypted or scanned image PDF." });
            }

            var parsedProfile = await _skillExtractor.ExtractStructuredProfileAsync(rawText, cancellationToken);

            // Fetch or create profile
            var existingProfile = await _dbContext.UserProfiles
                .Include(p => p.Skills)
                .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

            if (existingProfile == null)
            {
                existingProfile = new UserProfile
                {
                    UserId = userId,
                    ResumeFileName = file.FileName,
                    RawResumeText = rawText,
                    ProfessionalSummary = parsedProfile.Summary,
                    ParsedProfileJson = JsonSerializer.Serialize(parsedProfile),
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.UserProfiles.Add(existingProfile);
            }
            else
            {
                existingProfile.ResumeFileName = file.FileName;
                existingProfile.RawResumeText = rawText;
                existingProfile.ProfessionalSummary = parsedProfile.Summary;
                existingProfile.ParsedProfileJson = JsonSerializer.Serialize(parsedProfile);
                existingProfile.UpdatedAt = DateTime.UtcNow;

                // Remove previous skills
                var oldSkills = existingProfile.Skills.ToList();
                foreach (var old in oldSkills)
                {
                    _dbContext.UserSkills.Remove(old);
                }
            }

            // Add extracted skills
            foreach (var skill in parsedProfile.Skills)
            {
                var newSkill = new UserSkill
                {
                    UserProfileId = existingProfile.Id,
                    SkillName = skill.Name,
                    Category = skill.Category,
                    YearsOfExperience = skill.YearsOfExperience,
                    IsPrimary = skill.IsPrimary
                };
                _dbContext.UserSkills.Add(newSkill);
            }

            // Also update User TargetRole if extracted
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user != null)
            {
                if (!string.IsNullOrWhiteSpace(parsedProfile.TargetRole)) user.TargetRole = parsedProfile.TargetRole;
                if (parsedProfile.TotalYearsOfExperience.HasValue) user.YearsOfExperience = parsedProfile.TotalYearsOfExperience.Value;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return Ok(parsedProfile);
        }
        catch (Exception ex)
        {
            var concurrencyDetails = "";
            if (ex is DbUpdateConcurrencyException concEx)
            {
                var entryInfos = concEx.Entries.Select(e => $"{e.Entity.GetType().Name} (State: {e.State})");
                concurrencyDetails = $" [Entries: {string.Join(", ", entryInfos)}]";
            }

            _logger.LogError(ex, "Failed to upload and parse resume");
            return StatusCode(500, new
            {
                message = "Resume processing encountered an error.",
                details = ex.Message + concurrencyDetails,
                innerDetails = ex.InnerException?.Message
            });
        }
    }

    [HttpGet]
    public async Task<ActionResult<ResumeParsedProfileDto>> GetProfile(CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var profile = await _dbContext.UserProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

            if (profile == null || string.IsNullOrEmpty(profile.ParsedProfileJson))
            {
                return NotFound(new { message = "Profile not found. Please upload a resume first." });
            }

            var parsed = JsonSerializer.Deserialize<ResumeParsedProfileDto>(profile.ParsedProfileJson);
            return Ok(parsed);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get profile");
            return StatusCode(500, new
            {
                message = "Failed to retrieve profile.",
                details = ex.Message,
                innerDetails = ex.InnerException?.Message
            });
        }
    }

    public record AddManualSkillRequest(string Name, SkillCategory Category = SkillCategory.Other, int YearsOfExperience = 1);

    [HttpPost("skills")]
    public async Task<ActionResult<ResumeParsedProfileDto>> AddSkill([FromBody] AddManualSkillRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Skill name cannot be empty." });
        }

        var profile = await _dbContext.UserProfiles
            .Include(p => p.Skills)
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (profile == null)
        {
            return NotFound(new { message = "Profile not found. Please upload a resume first." });
        }

        var trimmedName = request.Name.Trim();
        if (profile.Skills.Any(s => s.SkillName.Equals(trimmedName, StringComparison.OrdinalIgnoreCase)))
        {
            return BadRequest(new { message = $"Skill '{trimmedName}' already exists in your profile." });
        }

        var newSkill = new UserSkill
        {
            UserProfileId = profile.Id,
            SkillName = trimmedName,
            Category = request.Category,
            YearsOfExperience = request.YearsOfExperience,
            IsPrimary = true
        };

        profile.Skills.Add(newSkill);

        // Also update ParsedProfileJson for consistent cache retrieval
        var parsed = !string.IsNullOrEmpty(profile.ParsedProfileJson)
            ? JsonSerializer.Deserialize<ResumeParsedProfileDto>(profile.ParsedProfileJson)
            : null;

        if (parsed != null)
        {
            var updatedSkills = parsed.Skills.ToList();
            updatedSkills.Add(new ExtractedSkillDto(trimmedName, request.Category, request.YearsOfExperience, true));
            var updatedProfile = parsed with { Skills = updatedSkills };
            profile.ParsedProfileJson = JsonSerializer.Serialize(updatedProfile);
            profile.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
            return Ok(updatedProfile);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Skill added successfully." });
    }

    [HttpDelete("skills/{skillName}")]
    public async Task<ActionResult<ResumeParsedProfileDto>> DeleteSkill(string skillName, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var profile = await _dbContext.UserProfiles
            .Include(p => p.Skills)
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (profile == null)
        {
            return NotFound(new { message = "Profile not found." });
        }

        var decodedName = Uri.UnescapeDataString(skillName).Trim();
        var skill = profile.Skills.FirstOrDefault(s => s.SkillName.Equals(decodedName, StringComparison.OrdinalIgnoreCase));
        if (skill != null)
        {
            _dbContext.UserSkills.Remove(skill);
        }

        var parsed = !string.IsNullOrEmpty(profile.ParsedProfileJson)
            ? JsonSerializer.Deserialize<ResumeParsedProfileDto>(profile.ParsedProfileJson)
            : null;

        if (parsed != null)
        {
            var updatedSkills = parsed.Skills.Where(s => !s.Name.Equals(decodedName, StringComparison.OrdinalIgnoreCase)).ToList();
            var updatedProfile = parsed with { Skills = updatedSkills };
            profile.ParsedProfileJson = JsonSerializer.Serialize(updatedProfile);
            profile.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
            return Ok(updatedProfile);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Skill removed successfully." });
    }
}
