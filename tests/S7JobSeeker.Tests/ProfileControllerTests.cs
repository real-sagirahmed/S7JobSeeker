using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using S7JobSeeker.AI.Parsers;
using S7JobSeeker.AI.Services;
using S7JobSeeker.Api.Controllers;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;
using S7JobSeeker.Infrastructure.Data;
using Xunit;

namespace S7JobSeeker.Tests;

public class ProfileControllerTests
{
    private readonly ApplicationDbContext _db;
    private readonly ProfileController _controller;

    public ProfileControllerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=S7JobSeekerDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;")
            .LogTo(Console.WriteLine, LogLevel.Information)
            .Options;

        _db = new ApplicationDbContext(options);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["GeminiSettings:ApiKey"] = "DEMO_KEY"
            })
            .Build();

        var resumeParser = new ResumeParserService(NullLogger<ResumeParserService>.Instance);
        var skillExtractor = new SkillExtractorService(
            new DummyChatCompletionService(),
            config,
            NullLogger<SkillExtractorService>.Instance
        );

        _controller = new ProfileController(
            _db,
            resumeParser,
            skillExtractor,
            NullLogger<ProfileController>.Instance
        );
    }

    [Fact]
    public async Task UploadResume_CanUploadAndReupload_WithoutConcurrencyException()
    {
        // 1. Create a distinct test user in DB
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            UserName = $"test_{Guid.NewGuid()}@teams7.com",
            Email = $"test_{Guid.NewGuid()}@teams7.com",
            FullName = "Concurrency Test Candidate",
            SecurityStamp = Guid.NewGuid().ToString(),
            ConcurrencyStamp = Guid.NewGuid().ToString()
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Setup controller user context
        var claims = new ClaimsPrincipal(new ClaimsIdentity([
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!)
        ], "mock"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claims }
        };

        var resumeContent = "John Doe\nSenior .NET Developer\nSkills: C#, ASP.NET Core, EF Core, SQL Server, Docker";
        var stream = new MemoryStream(Encoding.UTF8.GetBytes(resumeContent));
        var formFile = new FormFile(stream, 0, stream.Length, "file", "resume.txt")
        {
            Headers = new HeaderDictionary(),
            ContentType = "text/plain"
        };

        // 2. First upload (Create new profile)
        var firstResult = await _controller.UploadResume(formFile, CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(firstResult.Result);
        Assert.NotNull(okResult.Value);

        // 3. Second upload (Update existing profile)
        var stream2 = new MemoryStream(Encoding.UTF8.GetBytes(resumeContent));
        var formFile2 = new FormFile(stream2, 0, stream2.Length, "file", "resume_updated.txt")
        {
            Headers = new HeaderDictionary(),
            ContentType = "text/plain"
        };

        var secondResult = await _controller.UploadResume(formFile2, CancellationToken.None);
        var okResult2 = Assert.IsType<OkObjectResult>(secondResult.Result);
        Assert.NotNull(okResult2.Value);
    }
}
