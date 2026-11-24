using System.Reflection;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using S7JobSeeker.Api.Controllers;
using S7JobSeeker.Core.DTOs;
using S7JobSeeker.Core.Enums;
using Xunit;

namespace S7JobSeeker.Tests;

public class JobMatchingPaginationTests
{
    [Fact]
    public void PagedJobMatchesDto_PropertiesAndSerialization_PreservesAllFields()
    {
        // Arrange
        var mockItems = new List<JobMatchResultDto>
        {
            new(
                Guid.NewGuid(),
                "Senior .NET Core Engineer",
                "Brain Station 23",
                "Dhaka, Bangladesh",
                false,
                "Full-time",
                "৳120,000 - ৳180,000",
                "https://example.com/job1",
                DateTime.UtcNow,
                92.5,
                88.0,
                95.0,
                ["C#", ".NET", "SQL Server", "EF Core"],
                ["Docker"],
                "Highlight high-throughput microservices experience.",
                false,
                JobSource.Bdjobs,
                "BDJobs"
            )
        };

        var pagedDto = new PagedJobMatchesDto(
            Items: mockItems,
            TotalCount: 45,
            Page: 1,
            PageSize: 20,
            HasMore: true
        );

        // Act
        var json = JsonSerializer.Serialize(pagedDto);
        var deserialized = JsonSerializer.Deserialize<PagedJobMatchesDto>(json);

        // Assert
        Assert.NotNull(deserialized);
        Assert.Equal(45, deserialized.TotalCount);
        Assert.Equal(1, deserialized.Page);
        Assert.Equal(20, deserialized.PageSize);
        Assert.True(deserialized.HasMore);
        Assert.Single(deserialized.Items);
        Assert.Equal("Senior .NET Core Engineer", deserialized.Items[0].Title);
        Assert.Equal("Brain Station 23", deserialized.Items[0].Company);
        Assert.Equal(JobSource.Bdjobs, deserialized.Items[0].Source);
    }

    [Fact]
    public void GetMatchedJobs_EndpointSignature_ReturnsPagedJobMatchesDto_AndHasAuthorizeAttribute()
    {
        // Arrange
        var method = typeof(JobsController).GetMethod(nameof(JobsController.GetMatchedJobs));

        // Assert
        Assert.NotNull(method);

        // 1. Must be guarded by [Authorize]
        var authorizeAttr = method.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authorizeAttr);

        // 2. Must be GET matches
        var httpGetAttr = method.GetCustomAttribute<HttpGetAttribute>();
        Assert.NotNull(httpGetAttr);
        Assert.Equal("matches", httpGetAttr.Template);

        // 3. Return type must be Task<ActionResult<PagedJobMatchesDto>>
        Assert.Equal(typeof(Task<ActionResult<PagedJobMatchesDto>>), method.ReturnType);

        // 4. Verify pagination parameters
        var parameters = method.GetParameters();
        var pageParam = parameters.FirstOrDefault(p => p.Name == "page");
        var pageSizeParam = parameters.FirstOrDefault(p => p.Name == "pageSize");

        Assert.NotNull(pageParam);
        Assert.Equal(1, pageParam.DefaultValue);

        Assert.NotNull(pageSizeParam);
        Assert.Equal(20, pageSizeParam.DefaultValue);
    }

    [Theory]
    [InlineData(100, 1, 20, 20, true)]   // Page 1 of 5 -> HasMore is true
    [InlineData(100, 5, 20, 20, false)]  // Page 5 of 5 -> HasMore is false (100 evaluated)
    [InlineData(45, 3, 20, 5, false)]    // Page 3 of 3 (last page with 5 items) -> HasMore is false
    [InlineData(15, 1, 20, 15, false)]   // Only 15 total items, page size 20 -> HasMore is false
    [InlineData(0, 1, 20, 0, false)]     // Empty result -> HasMore is false
    public void PaginationLogic_HasMoreCalculation_EvaluatesCorrectly(
        int totalCount,
        int page,
        int pageSize,
        int returnedItemsCount,
        bool expectedHasMore)
    {
        // Arrange
        var skip = (page - 1) * pageSize;

        // Act
        var hasMore = (skip + returnedItemsCount) < totalCount;

        // Assert
        Assert.Equal(expectedHasMore, hasMore);
    }

    [Theory]
    [InlineData(-5, 1)]      // Negative page clamps to 1
    [InlineData(0, 1)]       // Zero page clamps to 1
    [InlineData(1, 1)]       // Valid page remains 1
    [InlineData(10, 10)]     // Valid page remains 10
    public void PageClamping_EnforcesMinimumOfOne(int inputPage, int expectedPage)
    {
        var clamped = Math.Max(1, inputPage);
        Assert.Equal(expectedPage, clamped);
    }

    [Theory]
    [InlineData(-10, 1)]     // Negative size clamps to min 1
    [InlineData(0, 1)]       // Zero size clamps to min 1
    [InlineData(20, 20)]     // Normal size remains 20
    [InlineData(50, 50)]     // Max allowed 50 remains 50
    [InlineData(100, 50)]    // Excessive size clamps to max 50 (Denial-of-Service / Memory Protection)
    public void PageSizeClamping_EnforcesBoundsBetween1And50(int inputPageSize, int expectedPageSize)
    {
        var clamped = Math.Clamp(inputPageSize, 1, 50);
        Assert.Equal(expectedPageSize, clamped);
    }

    [Fact]
    public void SyncJobs_EndpointSignature_SupportsSourceParameter()
    {
        var method = typeof(JobsController).GetMethod(nameof(JobsController.SyncJobs));
        Assert.NotNull(method);

        var httpPostAttr = method.GetCustomAttribute<HttpPostAttribute>();
        Assert.NotNull(httpPostAttr);
        Assert.Equal("sync", httpPostAttr.Template);

        var parameters = method.GetParameters();
        var sourceParam = parameters.FirstOrDefault(p => p.Name == "source");
        Assert.NotNull(sourceParam);
        Assert.Equal(typeof(string), sourceParam.ParameterType);
    }

    [Fact]
    public void CareerjetJobFetcher_IsConfigured_ReflectsMissingApiKeySafely()
    {
        var config = new Microsoft.Extensions.Configuration.ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["CareerjetSettings:ApiKey"] = ""
            })
            .Build();

        var fetcher = new S7JobSeeker.Infrastructure.JobFetchers.CareerjetJobFetcher(
            new System.Net.Http.HttpClient(),
            config,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<S7JobSeeker.Infrastructure.JobFetchers.CareerjetJobFetcher>.Instance
        );

        Assert.False(fetcher.IsConfigured);
    }
}
