using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.SemanticKernel;
using S7JobSeeker.AI.Parsers;
using S7JobSeeker.AI.Services;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Interfaces;
using S7JobSeeker.Infrastructure.Data;
using S7JobSeeker.Infrastructure.JobFetchers;
using S7JobSeeker.Infrastructure.Vector;

var builder = WebApplication.CreateBuilder(args);

// Load user secrets and environment variables safely
builder.Configuration.AddUserSecrets<Program>(optional: true);
builder.Configuration.AddEnvironmentVariables();

// Controllers & JSON
builder.Services.AddControllers();
builder.Services.AddProblemDetails();

// Defensive Rate Limiting (LLM Denial-of-Wallet & Upload DoS Protection)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("UploadPolicy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User.Identity?.Name ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 15,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

// Database Context (SQL Server)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=(localdb)\\mssqllocaldb;Database=S7JobSeekerDb;Trusted_Connection=True;TrustServerCertificate=True;";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

// Identity Setup
builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<ApplicationDbContext>();

// JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? "SuperSecretKeyForS7JobSeekerAuthenticationMustBeAtLeast32CharactersLong2026!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "s7job-seeker-api",
            ValidAudience = builder.Configuration["JwtSettings:Audience"] ?? "s7job-seeker-client",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();

// HttpClient & Job Fetchers with Browser-grade User-Agent & resilient timeouts
builder.Services.AddHttpClient<RemotiveJobFetcher>(client =>
{
    client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    client.Timeout = TimeSpan.FromSeconds(15);
});
builder.Services.AddHttpClient<ArbeitnowJobFetcher>(client =>
{
    client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    client.Timeout = TimeSpan.FromSeconds(15);
});
builder.Services.AddHttpClient<JobicyJobFetcher>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
});
builder.Services.AddHttpClient<HimalayasJobFetcher>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
});
builder.Services.AddHttpClient<WwrJobFetcher>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
});
builder.Services.AddHttpClient<BdjobsJobFetcher>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
});
builder.Services.AddHttpClient<LinkedinJobFetcher>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
});

builder.Services.AddScoped<IJobFetcherService, BdjobsJobFetcher>();
builder.Services.AddScoped<IJobFetcherService, LinkedinJobFetcher>();
builder.Services.AddScoped<IJobFetcherService, JobicyJobFetcher>();
builder.Services.AddScoped<IJobFetcherService, HimalayasJobFetcher>();
builder.Services.AddScoped<IJobFetcherService, WwrJobFetcher>();
builder.Services.AddScoped<IJobFetcherService, RemotiveJobFetcher>();
builder.Services.AddScoped<IJobFetcherService, ArbeitnowJobFetcher>();

// Qdrant Vector Service
builder.Services.AddSingleton<IQdrantVectorService, QdrantVectorService>();

// Resume Parser
builder.Services.AddScoped<IResumeParserService, ResumeParserService>();

// Semantic Kernel & Gemini AI Services (with non-empty fallback format to prevent DI activation failure when unconfigured)
var rawGeminiApiKey = builder.Configuration["GeminiSettings:ApiKey"];
var geminiApiKey = string.IsNullOrWhiteSpace(rawGeminiApiKey) ? "AIzaSyDummyKeyForFallbackWhenUnconfigured12345" : rawGeminiApiKey;
var geminiChatModel = builder.Configuration["GeminiSettings:ModelId"] ?? "gemini-2.0-flash";
var geminiEmbedModel = builder.Configuration["GeminiSettings:EmbeddingModelId"] ?? "text-embedding-004";

builder.Services.AddGoogleAIGeminiChatCompletion(geminiChatModel, geminiApiKey);
builder.Services.AddGoogleAIEmbeddingGeneration(geminiEmbedModel, geminiApiKey);

builder.Services.AddScoped<ISkillExtractorService, SkillExtractorService>();
builder.Services.AddScoped<IJobMatcherService, JobMatcherService>();

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "s7job-seeker API",
        Version = "v1",
        Description = "AI-Powered Semantic & RAG Job Seeker Platform"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Standard RFC 7807 ProblemDetails Global Exception Handler
app.UseExceptionHandler();

// Configure OpenAPI / Swagger for API testing
app.UseSwagger();
app.UseSwaggerUI();

// Conditional HTTPS redirection (disabled by default on shared hosts like MonsterASP to avoid SSL handshake resets)
if (builder.Configuration.GetValue<bool>("EnableHttpsRedirection", false))
{
    app.UseHttpsRedirection();
}

// Rate Limiter
app.UseRateLimiter();

// Serve React SPA files from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Client-side fallback routing for React Router
app.MapFallbackToFile("index.html");

// Auto-apply database migrations on startup (crucial for shared hosting environments like MonsterASP)
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        if (dbContext.Database.IsRelational())
        {
            logger.LogInformation("Applying pending database migrations...");
            dbContext.Database.Migrate();
            logger.LogInformation("Database migrations applied successfully.");
        }

        // Auto-seed BD Global Tech Companies if empty
        if (!dbContext.BdTechCompanies.Any())
        {
            logger.LogInformation("Seeding curated BD Global Tech Companies master registry...");
            var seedCompanies = S7JobSeeker.Infrastructure.Data.Seed.BdTechCompaniesData.GetSeedCompanies();
            dbContext.BdTechCompanies.AddRange(seedCompanies);
            dbContext.SaveChanges();
            logger.LogInformation("Seeded {Count} verified BD Tech Companies successfully.", seedCompanies.Count);
        }

        // Auto-heal legacy BDJobs URLs in JobPostings table to modern Angular SPA details route
        if (dbContext.Database.IsRelational())
        {
            try
            {
                var rowsUpdated = dbContext.Database.ExecuteSqlRaw(
                    "UPDATE JobPostings SET Url = REPLACE(REPLACE(Url, 'https://jobs.bdjobs.com/jobdetails.asp?id=', 'https://bdjobs.com/h/details/'), 'https://bdjobs.com/h/jobdetails/', 'https://bdjobs.com/h/details/') WHERE Source = 7 AND Url NOT LIKE '%/h/details/%';"
                );
                if (rowsUpdated > 0)
                {
                    logger.LogInformation("Auto-healed {Count} BDJobs URLs to modern SPA details route.", rowsUpdated);
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to auto-heal BDJobs URLs on startup.");
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Database migration on startup was skipped or failed. Ensure database server is accessible.");
    }
}

app.Run();
