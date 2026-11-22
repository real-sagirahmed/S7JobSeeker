using System.Reflection;
using Microsoft.AspNetCore.RateLimiting;
using S7JobSeeker.Api.Controllers;
using Xunit;

namespace S7JobSeeker.Tests;

public class RateLimitingPolicyTests
{
    [Theory]
    [InlineData(nameof(AuthController.Register))]
    [InlineData(nameof(AuthController.Login))]
    public void AuthController_AuthenticationEndpoints_MustEnforceAuthRateLimitingPolicy(string methodName)
    {
        var method = typeof(AuthController).GetMethod(methodName, BindingFlags.Public | BindingFlags.Instance);
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<EnableRateLimitingAttribute>();
        Assert.NotNull(attr);
        Assert.Equal("AuthPolicy", attr.PolicyName);
    }

    [Theory]
    [InlineData(nameof(CbsSprintController.VerifyCertificate))]
    [InlineData(nameof(CbsSprintController.ExportAllLessons))]
    public void CbsSprintController_PublicEndpoints_MustEnforcePublicRateLimitingPolicy(string methodName)
    {
        var method = typeof(CbsSprintController).GetMethod(methodName, BindingFlags.Public | BindingFlags.Instance);
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<EnableRateLimitingAttribute>();
        Assert.NotNull(attr);
        Assert.Equal("PublicPolicy", attr.PolicyName);
    }

    [Fact]
    public void CompaniesController_SuggestCompany_MustEnforcePublicRateLimitingPolicy()
    {
        var method = typeof(CompaniesController).GetMethod(nameof(CompaniesController.SuggestCompany), BindingFlags.Public | BindingFlags.Instance);
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<EnableRateLimitingAttribute>();
        Assert.NotNull(attr);
        Assert.Equal("PublicPolicy", attr.PolicyName);
    }

    [Fact]
    public void ProfileController_UploadResume_MustEnforceUploadRateLimitingPolicy()
    {
        var method = typeof(ProfileController).GetMethod(nameof(ProfileController.UploadResume), BindingFlags.Public | BindingFlags.Instance);
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<EnableRateLimitingAttribute>();
        Assert.NotNull(attr);
        Assert.Equal("UploadPolicy", attr.PolicyName);
    }

    [Theory]
    [InlineData(nameof(JobsController.PasteAndMatch))]
    [InlineData(nameof(JobsController.GenerateTailoredApplication))]
    [InlineData(nameof(JobsController.GeneratePreparationGuide))]
    [InlineData(nameof(JobsController.GenerateCustomPreparationGuide))]
    public void JobsController_AiEndpoints_MustEnforceAiRateLimitingPolicy(string methodName)
    {
        var method = typeof(JobsController).GetMethod(methodName, BindingFlags.Public | BindingFlags.Instance);
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<EnableRateLimitingAttribute>();
        Assert.NotNull(attr);
        Assert.Equal("AiPolicy", attr.PolicyName);
    }

    [Fact]
    public void CompaniesController_GenerateTargetedPitch_MustEnforceAiRateLimitingPolicy()
    {
        var method = typeof(CompaniesController).GetMethod(nameof(CompaniesController.GenerateTargetedPitch), BindingFlags.Public | BindingFlags.Instance);
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<EnableRateLimitingAttribute>();
        Assert.NotNull(attr);
        Assert.Equal("AiPolicy", attr.PolicyName);
    }

    [Fact]
    public void CbsSprintController_AskAi_MustEnforceAiRateLimitingPolicy()
    {
        var method = typeof(CbsSprintController).GetMethod(nameof(CbsSprintController.AskAi), BindingFlags.Public | BindingFlags.Instance);
        Assert.NotNull(method);

        var attr = method.GetCustomAttribute<EnableRateLimitingAttribute>();
        Assert.NotNull(attr);
        Assert.Equal("AiPolicy", attr.PolicyName);
    }
}
