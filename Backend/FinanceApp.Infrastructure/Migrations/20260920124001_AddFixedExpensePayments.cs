using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFixedExpensePayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FixedExpenseId",
                table: "Transactions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_FixedExpenseId",
                table: "Transactions",
                column: "FixedExpenseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_FixedExpenses_FixedExpenseId",
                table: "Transactions",
                column: "FixedExpenseId",
                principalTable: "FixedExpenses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_FixedExpenses_FixedExpenseId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_FixedExpenseId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "FixedExpenseId",
                table: "Transactions");
        }
    }
}
