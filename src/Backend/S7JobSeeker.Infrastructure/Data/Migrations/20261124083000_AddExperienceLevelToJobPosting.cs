using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace S7JobSeeker.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExperienceLevelToJobPosting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExperienceLevel",
                table: "JobPostings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobPostings_ExperienceLevel",
                table: "JobPostings",
                column: "ExperienceLevel");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_JobPostings_ExperienceLevel",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "ExperienceLevel",
                table: "JobPostings");
        }
    }
}
