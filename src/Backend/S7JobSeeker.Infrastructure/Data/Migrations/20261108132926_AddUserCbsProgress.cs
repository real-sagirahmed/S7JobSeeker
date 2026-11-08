using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace S7JobSeeker.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserCbsProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserCbsProgresses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CompletedDaysJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QuizScoresJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ChecklistJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastAccessedDay = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserCbsProgresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserCbsProgresses_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserCbsProgresses_UserId",
                table: "UserCbsProgresses",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserCbsProgresses");
        }
    }
}
