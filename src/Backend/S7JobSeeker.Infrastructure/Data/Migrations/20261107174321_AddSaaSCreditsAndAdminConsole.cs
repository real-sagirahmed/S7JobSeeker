using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace S7JobSeeker.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSaaSCreditsAndAdminConsole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AiCredits",
                table: "AspNetUsers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsAdmin",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "TrialEndsAt",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateTable(
                name: "CreditTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreditsAmount = table.Column<int>(type: "int", nullable: false),
                    AmountPaidBdt = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Method = table.Column<int>(type: "int", nullable: false),
                    SenderNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TransactionId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    AdminNote = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CreditTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CreditTransactions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlatformSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BkashNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NagadNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    RocketNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PaymentInstructions = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    WelcomeCredits = table.Column<int>(type: "int", nullable: false),
                    TrialDays = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformSettings", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "PlatformSettings",
                columns: new[] { "Id", "BkashNumber", "NagadNumber", "PaymentInstructions", "RocketNumber", "TrialDays", "UpdatedAt", "WelcomeCredits" },
                values: new object[] { 1, "017XXXXXXXX (Personal / Send Money)", "017XXXXXXXX (Personal / Send Money)", "বিকাশ বা নগদ সেন্ড মানি করে TrxID ও প্রেরক নম্বর নিচে সাবমিট করুন। অ্যাডমিন ভেরিফাই করে ক্রেডিট অনুমোদন করবেন।", "017XXXXXXXX (Personal / Send Money)", 30, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 20 });

            migrationBuilder.CreateIndex(
                name: "IX_CreditTransactions_CreatedAt",
                table: "CreditTransactions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CreditTransactions_Status",
                table: "CreditTransactions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_CreditTransactions_TransactionId",
                table: "CreditTransactions",
                column: "TransactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CreditTransactions_UserId",
                table: "CreditTransactions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CreditTransactions");

            migrationBuilder.DropTable(
                name: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "AiCredits",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsAdmin",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "TrialEndsAt",
                table: "AspNetUsers");
        }
    }
}
