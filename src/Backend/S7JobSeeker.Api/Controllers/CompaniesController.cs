using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Infrastructure.Data;

namespace S7JobSeeker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IChatCompletionService _chatCompletionService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CompaniesController> _logger;

    public CompaniesController(
        ApplicationDbContext dbContext,
        IChatCompletionService chatCompletionService,
        IConfiguration configuration,
        ILogger<CompaniesController> logger)
    {
        _dbContext = dbContext;
        _chatCompletionService = chatCompletionService;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<CompanyListResponse>> GetCompanies(
        [FromQuery] string? search = null,
        [FromQuery] CompanyCategory? category = null,
        [FromQuery] string? tech = null,
        [FromQuery] string? workModel = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.BdTechCompanies.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(c => c.Name.Contains(term) ||
                                     c.Description.Contains(term) ||
                                     c.GlobalProducts.Contains(term) ||
                                     c.PrimaryTechStackJson.Contains(term));
        }

        if (category.HasValue)
        {
            query = query.Where(c => c.Category == category.Value);
        }

        if (!string.IsNullOrWhiteSpace(tech))
        {
            var techTerm = tech.Trim();
            query = query.Where(c => c.PrimaryTechStackJson.Contains(techTerm));
        }

        if (!string.IsNullOrWhiteSpace(workModel) && !workModel.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(c => c.WorkModel.Equals(workModel.Trim()));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageClamped = Math.Max(1, page);
        var pageSizeClamped = Math.Clamp(pageSize, 6, 100);
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSizeClamped);

        var companies = await query
            .OrderBy(c => c.Name)
            .Skip((pageClamped - 1) * pageSizeClamped)
            .Take(pageSizeClamped)
            .ToListAsync(cancellationToken);

        // Pre-fetch active jobs count by company name
        var companyNames = companies.Select(c => c.Name).ToList();
        var activeJobCounts = await _dbContext.JobPostings
            .AsNoTracking()
            .Where(j => companyNames.Contains(j.Company))
            .GroupBy(j => j.Company)
            .Select(g => new { Company = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.Company, g => g.Count, StringComparer.OrdinalIgnoreCase, cancellationToken);

        var items = companies.Select(c =>
        {
            var stack = !string.IsNullOrEmpty(c.PrimaryTechStackJson)
                ? JsonSerializer.Deserialize<List<string>>(c.PrimaryTechStackJson) ?? []
                : new List<string>();

            var count = activeJobCounts.GetValueOrDefault(c.Name, 0);

            return new BdCompanyDto(
                c.Id,
                c.Name,
                c.Slug,
                c.Website,
                c.CareersUrl,
                c.LinkedInUrl,
                c.Category,
                c.GlobalProducts,
                c.Description,
                stack,
                c.Headquarters,
                c.GlobalOffices,
                c.WorkModel,
                c.EmployeeCountRange,
                c.IsVerified,
                count
            );
        }).ToList();

        return Ok(new CompanyListResponse(items, totalCount, pageClamped, pageSizeClamped, totalPages));
    }

    [Authorize]
    [HttpGet("top-matches")]
    public async Task<ActionResult<List<BdCompanyDto>>> GetTopMatches(
        [FromQuery] int limit = 30,
        CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var profile = await _dbContext.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (profile == null || string.IsNullOrEmpty(profile.ParsedProfileJson))
        {
            return BadRequest(new { message = "Please upload your resume first to view tech fit matching." });
        }

        var parsedProfile = JsonSerializer.Deserialize<ResumeParsedProfileDto>(profile.ParsedProfileJson);
        if (parsedProfile == null || parsedProfile.Skills.Count == 0)
        {
            return BadRequest(new { message = "No extracted skills found in your profile." });
        }

        var candidateSkillsSet = new HashSet<string>(
            parsedProfile.Skills.Select(s => s.Name.Trim()),
            StringComparer.OrdinalIgnoreCase
        );

        var companies = await _dbContext.BdTechCompanies
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var companyNames = companies.Select(c => c.Name).ToList();
        var activeJobCounts = await _dbContext.JobPostings
            .AsNoTracking()
            .Where(j => companyNames.Contains(j.Company))
            .GroupBy(j => j.Company)
            .Select(g => new { Company = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.Company, g => g.Count, StringComparer.OrdinalIgnoreCase, cancellationToken);

        var scored = new List<BdCompanyDto>();

        foreach (var c in companies)
        {
            var stack = !string.IsNullOrEmpty(c.PrimaryTechStackJson)
                ? JsonSerializer.Deserialize<List<string>>(c.PrimaryTechStackJson) ?? []
                : new List<string>();

            if (stack.Count == 0) continue;

            var matching = stack.Where(s => candidateSkillsSet.Contains(s) || candidateSkillsSet.Any(cs => cs.Contains(s, StringComparison.OrdinalIgnoreCase))).ToList();
            var missing = stack.Except(matching, StringComparer.OrdinalIgnoreCase).ToList();

            // Fit score based on candidate coverage of company stack
            int fitScore = (int)Math.Round(((double)matching.Count / stack.Count) * 100.0);
            fitScore = Math.Clamp(fitScore, 10, 100);

            var count = activeJobCounts.GetValueOrDefault(c.Name, 0);

            scored.Add(new BdCompanyDto(
                c.Id,
                c.Name,
                c.Slug,
                c.Website,
                c.CareersUrl,
                c.LinkedInUrl,
                c.Category,
                c.GlobalProducts,
                c.Description,
                stack,
                c.Headquarters,
                c.GlobalOffices,
                c.WorkModel,
                c.EmployeeCountRange,
                c.IsVerified,
                count,
                fitScore,
                matching,
                missing
            ));
        }

        var results = scored
            .OrderByDescending(s => s.FitScore)
            .ThenByDescending(s => s.ActiveJobsCount)
            .Take(Math.Clamp(limit, 5, 100))
            .ToList();

        return Ok(results);
    }

    [HttpGet("{id}/active-jobs")]
    public async Task<ActionResult<List<JobPosting>>> GetCompanyActiveJobs(Guid id, CancellationToken cancellationToken = default)
    {
        var company = await _dbContext.BdTechCompanies
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (company == null) return NotFound(new { message = "Company not found." });

        var jobs = await _dbContext.JobPostings
            .AsNoTracking()
            .Where(j => j.Company.Contains(company.Name) || company.Name.Contains(j.Company))
            .OrderByDescending(j => j.CreatedAt)
            .Take(20)
            .ToListAsync(cancellationToken);

        return Ok(jobs);
    }

    [Authorize]
    [HttpPost("{id}/generate-pitch")]
    public async Task<ActionResult<TailoredPitchDto>> GenerateTargetedPitch(
        Guid id,
        [FromBody] GeneratePitchRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var company = await _dbContext.BdTechCompanies
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (company == null) return NotFound(new { message = "Company not found." });

        var profile = await _dbContext.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (profile == null || string.IsNullOrEmpty(profile.ParsedProfileJson))
        {
            return BadRequest(new { message = "Please upload your resume first to generate a tailored pitch." });
        }

        var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        var candidateName = user?.FullName ?? "Candidate";

        var parsedProfile = JsonSerializer.Deserialize<ResumeParsedProfileDto>(profile.ParsedProfileJson);
        var companyStack = !string.IsNullOrEmpty(company.PrimaryTechStackJson)
            ? JsonSerializer.Deserialize<List<string>>(company.PrimaryTechStackJson) ?? []
            : new List<string>();

        var candidateSkills = parsedProfile?.Skills.Select(s => s.Name).ToList() ?? [];
        var matchingSkills = companyStack.Intersect(candidateSkills, StringComparer.OrdinalIgnoreCase).ToList();

        var isColdEmail = request.PitchType.Equals("ColdEmail", StringComparison.OrdinalIgnoreCase);

        var apiKey = _configuration["GeminiSettings:ApiKey"];
        var isDemoOrUnconfigured = string.IsNullOrWhiteSpace(apiKey) || apiKey.Contains("Dummy") || apiKey.StartsWith("DEMO");

        if (isDemoOrUnconfigured)
        {
            var fallbackSubject = isColdEmail
                ? $"Application / Engineering Inquiry – {candidateName} ({string.Join(", ", matchingSkills.Take(3))})"
                : $"Expression of Interest for Engineering Opportunities at {company.Name}";

            var fallbackContent = isColdEmail
                ? $"""
                Dear Hiring Team at {company.Name},

                I have been following {company.Name}'s technological innovations in {company.GlobalProducts} and deeply admire your engineering footprint in Bangladesh and globally.

                As a {parsedProfile?.TargetRole ?? "Software Engineer"} with hands-on expertise in {string.Join(", ", matchingSkills.DefaultIfEmpty(".NET, Cloud and Modern Web Technologies"))}, I specialize in building performant, scalable distributed systems. 

                My core background aligns strongly with your tech stack ({string.Join(", ", companyStack)}):
                - {parsedProfile?.Summary ?? "Proven software engineering background with a focus on code quality, clean architecture, and rapid feature delivery."}
                - Strong alignment with {company.Name}'s product engineering culture.

                I would welcome an opportunity for a brief conversation to explore how my experience can contribute to upcoming projects at {company.Name}. 

                My resume and portfolio are available for your review. Thank you for your time and consideration.

                Sincerely,
                {candidateName}
                """
                : $"""
                Dear Hiring Manager,

                I am writing to express my strong enthusiasm for joining {company.Name} as a {parsedProfile?.TargetRole ?? "Software Engineer"}. Having closely tracked {company.Name}'s engineering accomplishments, particularly around {company.GlobalProducts}, I am excited by your commitment to technical excellence.

                With experience across {string.Join(", ", matchingSkills.DefaultIfEmpty("Software Engineering, Cloud, and Web Architecture"))}, I bring a track record of:
                1. Designing reliable, maintainable software architectures.
                2. Collaborating in agile, high-velocity engineering environments.
                3. Rapidly mastering domain constraints to deliver business value.

                Given {company.Name}'s use of {string.Join(", ", companyStack)}, I am confident in my ability to hit the ground running and make an immediate impact on your team.

                Thank you for reviewing my application. I look forward to the possibility of discussing how my skills align with your engineering goals.

                Warm regards,
                {candidateName}
                """;

            return Ok(new TailoredPitchDto(
                CompanyName: company.Name,
                PitchType: isColdEmail ? "Cold Email Outreach" : "Cover Letter",
                Subject: fallbackSubject,
                Content: fallbackContent.Trim(),
                HighlightedSkills: matchingSkills
            ));
        }

        // Live LLM Pitch Generation
        var prompt = $$"""
        You are an elite Senior Tech Career Architect.
        Write a high-converting, professional, human-sounding {{request.PitchType}} for candidate '{{candidateName}}' targeting '{{company.Name}}'.

        COMPANY CONTEXT:
        - Name: {{company.Name}}
        - Headquarters: {{company.Headquarters}}
        - Key Products / Domain: {{company.GlobalProducts}}
        - Description: {{company.Description}}
        - Tech Stack: {{string.Join(", ", companyStack)}}

        CANDIDATE CONTEXT:
        - Target Role: {{parsedProfile?.TargetRole}}
        - Experience Years: {{parsedProfile?.TotalYearsOfExperience}}
        - Overlapping Tech Skills: {{string.Join(", ", matchingSkills)}}
        - Professional Summary: {{parsedProfile?.Summary}}

        INSTRUCTIONS:
        - Keep the tone confident, humble, direct, and technically credible.
        - Naturally reference the company's real products and how the candidate's specific overlapping skills can deliver value.
        - Avoid corporate cliches ("in today's fast-paced world", "I am thrilled to apply").
        - Format with a clear Subject line at the very top (e.g. 'SUBJECT: ...') followed by the body.
        """;

        var chat = new ChatHistory();
        chat.AddSystemMessage("You write compelling, bespoke tech pitches and outreach letters for software professionals.");
        chat.AddUserMessage(prompt);

        try
        {
            var reply = await _chatCompletionService.GetChatMessageContentAsync(chat, cancellationToken: cancellationToken);
            var text = reply.Content?.Trim() ?? string.Empty;

            var subject = $"Engineering Opportunity – {candidateName} at {company.Name}";
            var body = text;

            var subjectMatch = System.Text.RegularExpressions.Regex.Match(text, @"SUBJECT:\s*(.+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (subjectMatch.Success)
            {
                subject = subjectMatch.Groups[1].Value.Trim();
                body = text.Replace(subjectMatch.Value, "").Trim();
            }

            return Ok(new TailoredPitchDto(
                CompanyName: company.Name,
                PitchType: isColdEmail ? "Cold Email Outreach" : "Cover Letter",
                Subject: subject,
                Content: body,
                HighlightedSkills: matchingSkills
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate LLM pitch for company {Company}", company.Name);
            return StatusCode(500, new { message = "Failed to generate tailored pitch." });
        }
    }
}
