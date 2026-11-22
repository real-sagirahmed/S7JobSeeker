using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using S7JobSeeker.AI.Parsers;
using S7JobSeeker.AI.Services;
using S7JobSeeker.Api.Controllers;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Infrastructure.Data;
using Xunit;

namespace S7JobSeeker.Tests;

public class FileUploadSecurityTests
{
    private readonly ApplicationDbContext _db;
    private readonly ProfileController _controller;
    private readonly ApplicationUser _testUser;

    public FileUploadSecurityTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"FileUploadSecurity_{Guid.NewGuid()}")
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

        _testUser = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            UserName = $"security_test_{Guid.NewGuid()}@teams7.com",
            Email = $"security_test_{Guid.NewGuid()}@teams7.com",
            FullName = "Security Test Candidate",
            SecurityStamp = Guid.NewGuid().ToString(),
            ConcurrencyStamp = Guid.NewGuid().ToString()
        };

        _db.Users.Add(_testUser);
        _db.SaveChanges();

        var claims = new ClaimsPrincipal(new ClaimsIdentity([
            new Claim(ClaimTypes.NameIdentifier, _testUser.Id),
            new Claim(ClaimTypes.Email, _testUser.Email!)
        ], "mock"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claims }
        };
    }

    [Theory]
    [InlineData("malicious.exe")]
    [InlineData("script.sh")]
    [InlineData("exploit.bin")]
    [InlineData("payload.dll")]
    [InlineData("unknown_file")]
    public async Task UploadResume_WithUnsupportedExtension_ReturnsBadRequest(string fileName)
    {
        var content = Encoding.UTF8.GetBytes("Binary executable contents simulated");
        using var stream = new MemoryStream(content);
        var formFile = new FormFile(stream, 0, stream.Length, "file", fileName);

        var result = await _controller.UploadResume(formFile, CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequest.Value);
        var message = badRequest.Value.ToString();
        Assert.Contains("Unsupported file type", message);
    }

    [Fact]
    public async Task UploadResume_WithInvalidPdfMagicBytes_ReturnsBadRequest()
    {
        // A file with .pdf extension but corrupted magic bytes (not %PDF)
        var corruptedPdfBytes = new byte[] { 0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66 };
        using var stream = new MemoryStream(corruptedPdfBytes);
        var formFile = new FormFile(stream, 0, stream.Length, "file", "fake.pdf");

        var result = await _controller.UploadResume(formFile, CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequest.Value);
        var message = badRequest.Value.ToString();
        Assert.Contains("Invalid PDF file structure or corrupted document", message);
    }

    [Fact]
    public async Task UploadResume_WithFileSizeExceeding10MB_ReturnsBadRequest()
    {
        // 11 MB simulated file
        const int elevenMegabytes = 11 * 1024 * 1024;
        var dummyStream = new MemoryStream(new byte[16]); // Header stream

        var formFile = new FormFile(dummyStream, 0, elevenMegabytes, "file", "large_resume.pdf");

        var result = await _controller.UploadResume(formFile, CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequest.Value);
        var message = badRequest.Value.ToString();
        Assert.Contains("10MB limit", message);
    }
}
