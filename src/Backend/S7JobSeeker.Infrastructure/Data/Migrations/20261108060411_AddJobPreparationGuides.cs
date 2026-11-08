using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace S7JobSeeker.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddJobPreparationGuides : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JobPreparationGuides",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    JobId = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    TargetRole = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    CompanyName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ContentJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExportMarkdown = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobPreparationGuides", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobPreparationGuides_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JobPreparationGuides_CreatedAt",
                table: "JobPreparationGuides",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_JobPreparationGuides_UserId_JobId",
                table: "JobPreparationGuides",
                columns: new[] { "UserId", "JobId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobPreparationGuides");
        }
    }
}
