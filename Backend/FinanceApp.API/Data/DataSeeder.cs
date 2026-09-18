using FinanceApp.Domain.Entities;
using FinanceApp.Infrastructure.Data;

namespace FinanceApp.API.Data;

public class DataSeeder
{
    public static void SeedData(FinanceDbContext context)
    {
        if (context.Users.Any()) return;

        var demoUser = new User
        {
            Id = "demo-user-001",
            Nombre = "Usuario Demo",
            Email = "demo@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("demo123"),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Users.Add(demoUser);
        context.SaveChanges();

        var categories = new[]
        {
            new Category { Id = "cat-001", UserId = demoUser.Id, Nombre = "Salario", Kind = CategoryKind.Income, Color = "#10b981", Activo = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Category { Id = "cat-002", UserId = demoUser.Id, Nombre = "Alimentación", Kind = CategoryKind.Expense, Color = "#f59e0b", Activo = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Category { Id = "cat-003", UserId = demoUser.Id, Nombre = "Transporte", Kind = CategoryKind.Expense, Color = "#3b82f6", Activo = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Category { Id = "cat-004", UserId = demoUser.Id, Nombre = "Entretenimiento", Kind = CategoryKind.Expense, Color = "#8b5cf6", Activo = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Category { Id = "cat-005", UserId = demoUser.Id, Nombre = "Ahorros", Kind = CategoryKind.Saving, Color = "#06b6d4", Activo = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        context.Categories.AddRange(categories);
        context.SaveChanges();

        var now = DateTime.UtcNow;
        var transactions = new[]
        {
            new Transaction { Id = "txn-001", UserId = demoUser.Id, CategoryId = "cat-001", Amount = 3000000, Description = "Salario mensual", Date = now.AddDays(-10), Kind = TransactionKind.Income, CreatedAt = now, UpdatedAt = now },
            new Transaction { Id = "txn-002", UserId = demoUser.Id, CategoryId = "cat-002", Amount = -150000, Description = "Supermercado", Date = now.AddDays(-5), Kind = TransactionKind.Expense, CreatedAt = now, UpdatedAt = now },
            new Transaction { Id = "txn-003", UserId = demoUser.Id, CategoryId = "cat-003", Amount = -50000, Description = "Gasolina", Date = now.AddDays(-4), Kind = TransactionKind.Expense, CreatedAt = now, UpdatedAt = now },
            new Transaction { Id = "txn-004", UserId = demoUser.Id, CategoryId = "cat-004", Amount = -80000, Description = "Cine", Date = now.AddDays(-3), Kind = TransactionKind.Expense, CreatedAt = now, UpdatedAt = now },
            new Transaction { Id = "txn-005", UserId = demoUser.Id, CategoryId = "cat-005", Amount = 500000, Description = "Ahorro mensual", Date = now.AddDays(-2), Kind = TransactionKind.Saving, CreatedAt = now, UpdatedAt = now }
        };

        context.Transactions.AddRange(transactions);
        context.SaveChanges();
    }
}
