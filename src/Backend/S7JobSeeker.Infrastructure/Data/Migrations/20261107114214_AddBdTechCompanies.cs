using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace S7JobSeeker.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBdTechCompanies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BdTechCompanies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Website = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CareersUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    LinkedInUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Category = table.Column<int>(type: "int", nullable: false),
                    GlobalProducts = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PrimaryTechStackJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Headquarters = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    GlobalOffices = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    WorkModel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EmployeeCountRange = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsVerified = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BdTechCompanies", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BdTechCompanies_Category",
                table: "BdTechCompanies",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_BdTechCompanies_Name",
                table: "BdTechCompanies",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_BdTechCompanies_Slug",
                table: "BdTechCompanies",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BdTechCompanies");
        }
    }
}
