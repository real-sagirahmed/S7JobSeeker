using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using S7JobSeeker.Core.Entities;

namespace S7JobSeeker.Infrastructure.Data.Seed;

public static class AdminSeeder
{
    // ARCHITECTURAL INTENT (LOCK: Zero Privilege Escalation in Public Registration):
    // Master Administrator is exclusively provisioned or synchronized via startup configuration.
    // Public registration (POST /api/auth/register) MUST NEVER grant IsAdmin = true under any circumstances.
    public static async Task SeedMasterAdminAsync(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var logger = serviceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("AdminSeeder");

        var masterEmail = configuration["AdminSettings:MasterEmail"] ?? "admin@s7jobseeker.com";
        var initialPassword = configuration["AdminSettings:InitialPassword"] ?? "Admin@S7JobSeeker2026!Secure";

        if (string.IsNullOrWhiteSpace(masterEmail))
        {
            logger.LogWarning("AdminSettings:MasterEmail is not configured. Admin seeding skipped.");
            return;
        }

        var existingUser = await userManager.FindByEmailAsync(masterEmail.Trim());
        if (existingUser == null)
        {
            logger.LogInformation("Seeding master administrator account for {Email}...", masterEmail);
            var adminUser = new ApplicationUser
            {
                UserName = masterEmail.Trim(),
                Email = masterEmail.Trim(),
                FullName = "System Administrator",
                TargetRole = "Platform Administrator",
                CreatedAt = DateTime.UtcNow,
                IsAdmin = true,
                EmailConfirmed = true,
                AiCredits = 999999,
                TrialEndsAt = DateTime.UtcNow.AddYears(50)
            };

            var createResult = await userManager.CreateAsync(adminUser, initialPassword);
            if (createResult.Succeeded)
            {
                logger.LogInformation("Master administrator account successfully seeded.");
            }
            else
            {
                logger.LogError("Failed to seed master administrator: {Errors}", string.Join("; ", createResult.Errors.Select(e => e.Description)));
            }
        }
        else
        {
            // Ensure admin rights, email confirmation, and credit allocation are active for the configured master admin
            bool needsUpdate = false;
            if (!existingUser.IsAdmin)
            {
                existingUser.IsAdmin = true;
                needsUpdate = true;
            }
            if (existingUser.AiCredits < 999999)
            {
                existingUser.AiCredits = 999999;
                needsUpdate = true;
            }
            if (existingUser.TrialEndsAt < DateTime.UtcNow.AddYears(10))
            {
                existingUser.TrialEndsAt = DateTime.UtcNow.AddYears(50);
                needsUpdate = true;
            }
            if (!existingUser.EmailConfirmed)
            {
                existingUser.EmailConfirmed = true;
                needsUpdate = true;
            }

            if (needsUpdate)
            {
                await userManager.UpdateAsync(existingUser);
                logger.LogInformation("Master administrator account permissions synchronized successfully for {Email}.", masterEmail);
            }
        }
    }
}
