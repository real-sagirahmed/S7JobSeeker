using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using S7JobSeeker.AI.Services;
using S7JobSeeker.Api.Controllers;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Infrastructure.Data;
using Xunit;

namespace S7JobSeeker.Tests;

public class CbsSprintTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public void CbsSprintService_LoadsCurriculum_ContainsAll14Days()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new CbsSprintService(
            db,
            new DummyChatCompletionService(),
            NullLogger<CbsSprintService>.Instance
        );

        // Act
        var curriculum = service.GetCurriculum();

        // Assert
        Assert.NotNull(curriculum);
        Assert.Equal(14, curriculum.Count);
        for (int i = 1; i <= 14; i++)
        {
            var item = curriculum.FirstOrDefault(c => c.DayNumber == i);
            Assert.NotNull(item);
            Assert.False(string.IsNullOrWhiteSpace(item.Title));
            Assert.True(item.EstimatedMinutes > 0);
        }
    }

    [Theory]
    [InlineData(1)]
    [InlineData(6)]
    [InlineData(10)]
    [InlineData(12)]
    [InlineData(14)]
    public void CbsSprintService_GetLessonForDay_ReturnsDetailedContent(int dayNumber)
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new CbsSprintService(
            db,
            new DummyChatCompletionService(),
            NullLogger<CbsSprintService>.Instance
        );

        // Act
        var lesson = service.GetLessonForDay(dayNumber);

        // Assert
        Assert.NotNull(lesson);
        Assert.Equal(dayNumber, lesson.DayNumber);
        Assert.False(string.IsNullOrWhiteSpace(lesson.Title));
        Assert.NotEmpty(lesson.Objectives);
        Assert.False(string.IsNullOrWhiteSpace(lesson.ExportMarkdown));
        Assert.NotEmpty(lesson.CommonMistakes);
    }

    [Fact]
    public async Task CbsSprintController_ProgressTracking_UpdatesAndPersistsState()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new CbsSprintService(
            db,
            new DummyChatCompletionService(),
            NullLogger<CbsSprintService>.Instance
        );
        var controller = new CbsSprintController(
            service,
            NullLogger<CbsSprintController>.Instance
        );

        var userId = "test-user-cbs-101";
        var user = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Name, "cbs_candidate@teams7.com")
        ], "mock"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        // Act 1: Initial progress (should be empty)
        var initResult = await controller.GetProgress(default);
        var okInit = Assert.IsType<OkObjectResult>(initResult);
        var progress = Assert.IsType<CbsProgressDto>(okInit.Value);
        Assert.Empty(progress.CompletedDays);

        // Act 2: Update progress (mark Day 1 complete, quiz score 100)
        var updateDto = new CbsProgressUpdateDto
        {
            DayNumber = 1,
            MarkCompleted = true,
            QuizScore = 100,
            ChecklistUpdates = new Dictionary<string, bool> { { "1-1", true } }
        };
        var updateResult = await controller.UpdateProgress(updateDto, default);
        var okUpdate = Assert.IsType<OkObjectResult>(updateResult);
        var updatedProgress = Assert.IsType<CbsProgressDto>(okUpdate.Value);

        // Assert
        Assert.Contains(1, updatedProgress.CompletedDays);
        Assert.Equal(100, updatedProgress.QuizScores["1"]);
        Assert.True(updatedProgress.Checklist["1-1"]);
        Assert.Equal(1, updatedProgress.LastAccessedDay);
    }

    [Fact]
    public async Task CompletingAll14Days_GeneratesAndPersistsPermanentCertificateId()
    {
        using var db = CreateInMemoryDbContext();
        var service = new CbsSprintService(db, new DummyChatCompletionService(), NullLogger<CbsSprintService>.Instance);
        var userId = "user-graduating-14";

        // Mark days 1 through 13 complete
        for (int day = 1; day <= 13; day++)
        {
            await service.UpdateUserProgressAsync(userId, new CbsProgressUpdateDto
            {
                DayNumber = day,
                MarkCompleted = true,
                QuizScore = 90
            });
        }

        var progress13 = await service.GetUserProgressAsync(userId);
        Assert.Null(progress13.CertificateId);

        // Mark day 14 complete
        var progress14 = await service.UpdateUserProgressAsync(userId, new CbsProgressUpdateDto
        {
            DayNumber = 14,
            MarkCompleted = true,
            QuizScore = 95
        });

        Assert.NotNull(progress14.CertificateId);
        Assert.StartsWith("S7-CBS-", progress14.CertificateId);
        Assert.NotNull(progress14.CertificateIssuedAt);
    }

    [Fact]
    public async Task CertificateId_IsIdempotent_AndNeverRegeneratedOnSubsequentUpdates()
    {
        using var db = CreateInMemoryDbContext();
        var service = new CbsSprintService(db, new DummyChatCompletionService(), NullLogger<CbsSprintService>.Instance);
        var userId = "user-idempotent-cbs";

        for (int day = 1; day <= 14; day++)
        {
            await service.UpdateUserProgressAsync(userId, new CbsProgressUpdateDto
            {
                DayNumber = day,
                MarkCompleted = true,
                QuizScore = 100
            });
        }

        var initialProgress = await service.GetUserProgressAsync(userId);
        var originalCertId = initialProgress.CertificateId;
        var originalIssuedAt = initialProgress.CertificateIssuedAt;
        Assert.NotNull(originalCertId);

        // Subsequent update (e.g. retaking a quiz or accessing a day)
        var updatedProgress = await service.UpdateUserProgressAsync(userId, new CbsProgressUpdateDto
        {
            DayNumber = 5,
            QuizScore = 95
        });

        Assert.Equal(originalCertId, updatedProgress.CertificateId);
        Assert.Equal(originalIssuedAt, updatedProgress.CertificateIssuedAt);
    }

    [Fact]
    public async Task VerifyCertificate_ValidId_ReturnsFullCandidateCredentialDto()
    {
        using var db = CreateInMemoryDbContext();
        var service = new CbsSprintService(db, new DummyChatCompletionService(), NullLogger<CbsSprintService>.Instance);
        var controller = new CbsSprintController(service, NullLogger<CbsSprintController>.Instance);

        var userId = "candidate-verified-cbs";
        db.Users.Add(new Core.Entities.ApplicationUser
        {
            Id = userId,
            UserName = "candidate@s7jobseeker.com",
            Email = "candidate@s7jobseeker.com",
            FullName = "Md. Verified Candidate"
        });
        await db.SaveChangesAsync();

        for (int day = 1; day <= 14; day++)
        {
            await service.UpdateUserProgressAsync(userId, new CbsProgressUpdateDto
            {
                DayNumber = day,
                MarkCompleted = true,
                QuizScore = 90
            });
        }

        var progress = await service.GetUserProgressAsync(userId);
        var certId = progress.CertificateId;
        Assert.NotNull(certId);

        // Public verification
        var actionResult = await controller.VerifyCertificate(certId, default);
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var certDto = Assert.IsType<CbsCertificateVerificationDto>(okResult.Value);

        Assert.True(certDto.IsValid);
        Assert.Equal(certId, certDto.CertificateId);
        Assert.Equal(14, certDto.CompletedDaysCount);
        Assert.NotEmpty(certDto.Competencies);
    }

    [Fact]
    public async Task VerifyCertificate_NonExistentId_ReturnsNotFound()
    {
        using var db = CreateInMemoryDbContext();
        var service = new CbsSprintService(db, new DummyChatCompletionService(), NullLogger<CbsSprintService>.Instance);
        var controller = new CbsSprintController(service, NullLogger<CbsSprintController>.Instance);

        var actionResult = await controller.VerifyCertificate("S7-CBS-FAKE-9999", default);
        var notFound = Assert.IsType<NotFoundObjectResult>(actionResult);
        Assert.NotNull(notFound.Value);
    }

    [Fact]
    public void GetFullExport_CompilesAll14Days_WithCorrectHeaderAndLength()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new CbsSprintService(db, new DummyChatCompletionService(), NullLogger<CbsSprintService>.Instance);

        // Act
        var export = service.GetFullExport();

        // Assert
        Assert.NotNull(export);
        Assert.Equal(14, export.TotalDays);
        Assert.Equal("CBS-Support-14-Day-Specialization-Blueprint.md", export.FileName);
        Assert.NotEmpty(export.FullContent);
        Assert.Contains("14-Day Comprehensive Specialization Master Blueprint", export.FullContent);

        // Verify all 14 days are present in markdown compilation
        for (int day = 1; day <= 14; day++)
        {
            Assert.Contains($"# Day {day}/14", export.FullContent);
        }
    }

    [Fact]
    public void ExportAllLessons_Endpoint_HasAllowAnonymous_AndReturns200Ok()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new CbsSprintService(db, new DummyChatCompletionService(), NullLogger<CbsSprintService>.Instance);
        var controller = new CbsSprintController(service, NullLogger<CbsSprintController>.Instance);

        // Verify AllowAnonymousAttribute presence on action method
        var methodInfo = typeof(CbsSprintController).GetMethod(nameof(CbsSprintController.ExportAllLessons));
        Assert.NotNull(methodInfo);
        var hasAllowAnonymous = methodInfo.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AllowAnonymousAttribute), inherit: true).Any();
        Assert.True(hasAllowAnonymous, "ExportAllLessons must be publicly accessible via [AllowAnonymous]");

        // Act
        var actionResult = controller.ExportAllLessons();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var exportDto = Assert.IsType<CbsFullExportDto>(okResult.Value);
        Assert.Equal(14, exportDto.TotalDays);
        Assert.NotEmpty(exportDto.FullContent);
    }
}
