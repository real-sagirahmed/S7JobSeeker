using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using S7JobSeeker.AI.Parsers;
using S7JobSeeker.AI.Services;
using S7JobSeeker.Api.Controllers;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Interfaces;
using S7JobSeeker.Infrastructure.Data;
using S7JobSeeker.Infrastructure.JobFetchers;
using S7JobSeeker.Infrastructure.Vector;
using Xunit;

namespace S7JobSeeker.Tests;

public class TestWebHostEnvironment : IWebHostEnvironment
{
    public string WebRootPath { get; set; } = "";
    public IFileProvider WebRootFileProvider { get; set; } = null!;
    public string ApplicationName { get; set; } = "Test";
    public IFileProvider ContentRootFileProvider { get; set; } = null!;
    public string ContentRootPath { get; set; } = "";
    public string EnvironmentName { get; set; } = "Development";
}

public class DependencyInjectionTests
{
    [Fact]
    public void DI_CanResolve_ProfileController_And_JobsController()
    {
        var services = new ServiceCollection();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Server=(localdb)\\mssqllocaldb;Database=TestDb;Trusted_Connection=True;",
                ["JwtSettings:Secret"] = "TestSecretKeyAtLeast32CharactersLong2026!",
                ["GeminiSettings:ApiKey"] = "DEMO_KEY",
                ["GeminiSettings:ModelId"] = "gemini-2.0-flash",
                ["GeminiSettings:EmbeddingModelId"] = "text-embedding-004",
                ["QdrantSettings:Endpoint"] = "http://localhost:6334"
            })
            .Build();

        services.AddSingleton<IConfiguration>(configuration);
        services.AddLogging(l => l.AddConsole());

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer("Server=localhost;Database=Test;"));
        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

        services.AddHttpClient<RemotiveJobFetcher>();
        services.AddHttpClient<ArbeitnowJobFetcher>();
        services.AddScoped<IJobFetcherService, RemotiveJobFetcher>();
        services.AddScoped<IJobFetcherService, ArbeitnowJobFetcher>();

        services.AddSingleton<IQdrantVectorService, QdrantVectorService>();
        services.AddScoped<IResumeParserService, ResumeParserService>();

        services.AddGoogleAIGeminiChatCompletion("gemini-2.0-flash", "DEMO_KEY");
        services.AddGoogleAIEmbeddingGeneration("text-embedding-004", "DEMO_KEY");

        services.AddScoped<ISkillExtractorService, SkillExtractorService>();
        services.AddScoped<IJobMatcherService, JobMatcherService>();

        // Register Controllers
        services.AddScoped<ProfileController>();
        services.AddScoped<JobsController>();
        services.AddSingleton<IWebHostEnvironment, TestWebHostEnvironment>();

        var sp = services.BuildServiceProvider();

        // Act & Assert
        using var scope = sp.CreateScope();
        var profileController = scope.ServiceProvider.GetRequiredService<ProfileController>();
        Assert.NotNull(profileController);

        var jobsController = scope.ServiceProvider.GetRequiredService<JobsController>();
        Assert.NotNull(jobsController);
    }
}
