using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace S7JobSeeker.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddS7FlexRadarFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FlexHowScore",
                table: "JobPostings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FlexScore",
                table: "JobPostings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FlexWhenScore",
                table: "JobPostings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FlexWhereScore",
                table: "JobPostings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FlexibilityNotes",
                table: "JobPostings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsWorkFromAnywhere",
                table: "JobPostings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TimezoneRequirements",
                table: "JobPostings",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FlexHowScore",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "FlexScore",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "FlexWhenScore",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "FlexWhereScore",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "FlexibilityNotes",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "IsWorkFromAnywhere",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "TimezoneRequirements",
                table: "JobPostings");
        }
    }
}
