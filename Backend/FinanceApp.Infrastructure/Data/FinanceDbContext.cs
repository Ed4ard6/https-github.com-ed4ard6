using FinanceApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Infrastructure.Data;

/// <summary>
/// DbContext principal para Finance App
/// Configura todas las entidades y sus relaciones con PostgreSQL
/// </summary>
public class FinanceDbContext : DbContext
{
    public FinanceDbContext(DbContextOptions<FinanceDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<Transaction> Transactions { get; set; } = null!;
    public DbSet<Salary> Salaries { get; set; } = null!;
    public DbSet<Debt> Debts { get; set; } = null!;
    public DbSet<Budget> Budgets { get; set; } = null!;
    public DbSet<FixedExpense> FixedExpenses { get; set; } = null!;
    public DbSet<SavingsGoal> SavingsGoals { get; set; } = null!;
    public DbSet<AdminAuditLog> AdminAuditLogs { get; set; } = null!;
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuración de User
        modelBuilder.Entity<User>()
            .HasKey(u => u.Id);
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Configuración de Category
        modelBuilder.Entity<Category>()
            .HasKey(c => c.Id);
        modelBuilder.Entity<Category>()
            .HasOne(c => c.User)
            .WithMany(u => u.Categories)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configuración de Transaction
        modelBuilder.Entity<Transaction>()
            .HasKey(t => t.Id);
        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.User)
            .WithMany(u => u.Transactions)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.Category)
            .WithMany(c => c.Transactions)
            .HasForeignKey(t => t.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configuración de Salary
        modelBuilder.Entity<Salary>()
            .HasKey(s => s.Id);
        modelBuilder.Entity<Salary>()
            .HasOne(s => s.User)
            .WithMany(u => u.Salaries)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configuración de Debt
        modelBuilder.Entity<Debt>()
            .HasKey(d => d.Id);
        modelBuilder.Entity<Debt>()
            .HasOne(d => d.User)
            .WithMany(u => u.Debts)
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configuración de Budget
        modelBuilder.Entity<Budget>()
            .HasKey(b => b.Id);
        modelBuilder.Entity<Budget>()
            .HasOne(b => b.User)
            .WithMany(u => u.Budgets)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Budget>()
            .HasOne(b => b.Category)
            .WithMany()
            .HasForeignKey(b => b.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
        // Un solo presupuesto por categoría y mes
        modelBuilder.Entity<Budget>()
            .HasIndex(b => new { b.UserId, b.CategoryId, b.Year, b.Month })
            .IsUnique();

        // Configuración de FixedExpense
        modelBuilder.Entity<FixedExpense>()
            .HasKey(f => f.Id);
        modelBuilder.Entity<FixedExpense>()
            .HasOne(f => f.User)
            .WithMany(u => u.FixedExpenses)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<FixedExpense>()
            .HasOne(f => f.Category)
            .WithMany()
            .HasForeignKey(f => f.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        // Configuración de SavingsGoal
        modelBuilder.Entity<SavingsGoal>()
            .HasKey(g => g.Id);
        modelBuilder.Entity<SavingsGoal>()
            .HasOne(g => g.User)
            .WithMany(u => u.SavingsGoals)
            .HasForeignKey(g => g.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Al borrar una meta, sus aportes siguen existiendo como ahorro suelto
        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.SavingsGoal)
            .WithMany()
            .HasForeignKey(t => t.SavingsGoalId)
            .OnDelete(DeleteBehavior.SetNull);

        // Igual con los recibos: el pago registrado sobrevive al gasto fijo
        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.FixedExpense)
            .WithMany()
            .HasForeignKey(t => t.FixedExpenseId)
            .OnDelete(DeleteBehavior.SetNull);

        // El registro de auditoría guarda emails copiados a propósito: debe
        // seguir siendo legible aunque la cuenta afectada se elimine.
        modelBuilder.Entity<AdminAuditLog>()
            .HasKey(a => a.Id);
        modelBuilder.Entity<AdminAuditLog>()
            .HasIndex(a => a.CreatedAt);

        // Los permisos de recuperación mueren con la cuenta, y se buscan por
        // hash: ese es el único dato que llega desde fuera.
        modelBuilder.Entity<PasswordResetToken>()
            .HasKey(t => t.Id);
        modelBuilder.Entity<PasswordResetToken>()
            .HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<PasswordResetToken>()
            .HasIndex(t => t.TokenHash)
            .IsUnique();
    }
}
