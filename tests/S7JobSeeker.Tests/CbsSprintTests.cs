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
}
