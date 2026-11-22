using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace S7JobSeeker.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCbsCertificateFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CertificateId",
                table: "UserCbsProgresses",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CertificateIssuedAt",
                table: "UserCbsProgresses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserCbsProgresses_CertificateId",
                table: "UserCbsProgresses",
                column: "CertificateId");

            migrationBuilder.CreateIndex(
                name: "IX_JobPostings_Company",
                table: "JobPostings",
                column: "Company");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserCbsProgresses_CertificateId",
                table: "UserCbsProgresses");

            migrationBuilder.DropIndex(
                name: "IX_JobPostings_Company",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "CertificateId",
                table: "UserCbsProgresses");

            migrationBuilder.DropColumn(
                name: "CertificateIssuedAt",
                table: "UserCbsProgresses");
        }
    }
}
