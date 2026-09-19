using FinanceApp.Domain.Entities;
using FinanceApp.Infrastructure.Data;

namespace FinanceApp.API.Data;

public class DataSeeder
{
    private static readonly (string Nombre, CategoryKind Kind, string Color)[] DefaultCategories =
    {
        ("Salario", CategoryKind.Income, "#10b981"),
        ("Alimentación", CategoryKind.Expense, "#f59e0b"),
        ("Transporte", CategoryKind.Expense, "#3b82f6"),
        ("Entretenimiento", CategoryKind.Expense, "#8b5cf6"),
        ("Ahorros", CategoryKind.Saving, "#06b6d4")
    };

    public static void SeedData(FinanceDbContext context)
    {
        NormalizeExistingEmails(context);

        var isFirstRun = !context.Users.Any();

        if (isFirstRun)
        {
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

            SeedCategoriesForUser(context, demoUser.Id);
            SeedDemoTransactions(context, demoUser.Id);
        }

        // Un usuario sin categorías no puede registrar transacciones,
        // así que todos reciben el set por defecto.
        foreach (var userId in context.Users.Select(u => u.Id).ToList())
        {
            SeedCategoriesForUser(context, userId);
        }
    }

    // El login busca por email normalizado; las cuentas creadas antes de
    // esa regla quedarían fuera si conservan mayúsculas o espacios.
    private static void NormalizeExistingEmails(FinanceDbContext context)
    {
        var changed = false;

        foreach (var user in context.Users.ToList())
        {
            var normalized = user.Email.Trim().ToLowerInvariant();
            if (user.Email == normalized) continue;

            user.Email = normalized;
            changed = true;
        }

        if (changed) context.SaveChanges();
    }

    public static void SeedCategoriesForUser(FinanceDbContext context, string userId)
    {
        if (context.Categories.Any(c => c.UserId == userId)) return;

        var now = DateTime.UtcNow;
        var categories = DefaultCategories.Select(c => new Category
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Nombre = c.Nombre,
            Kind = c.Kind,
            Color = c.Color,
            Activo = true,
            CreatedAt = now,
            UpdatedAt = now
        }).ToList();

        context.Categories.AddRange(categories);
        context.SaveChanges();
    }

    private static void SeedDemoTransactions(FinanceDbContext context, string userId)
    {
        var categories = context.Categories
            .Where(c => c.UserId == userId)
            .ToDictionary(c => c.Nombre, c => c.Id);

        var now = DateTime.UtcNow;
        var transactions = new[]
        {
            NewTransaction(userId, categories["Salario"], 3000000, "Salario mensual", now.AddDays(-10), TransactionKind.Income),
            NewTransaction(userId, categories["Alimentación"], -150000, "Supermercado", now.AddDays(-5), TransactionKind.Expense),
            NewTransaction(userId, categories["Transporte"], -50000, "Gasolina", now.AddDays(-4), TransactionKind.Expense),
            NewTransaction(userId, categories["Entretenimiento"], -80000, "Cine", now.AddDays(-3), TransactionKind.Expense),
            NewTransaction(userId, categories["Ahorros"], 500000, "Ahorro mensual", now.AddDays(-2), TransactionKind.Saving)
        };

        context.Transactions.AddRange(transactions);
        context.SaveChanges();
    }

    private static Transaction NewTransaction(
        string userId, string categoryId, decimal amount, string description, DateTime date, TransactionKind kind)
    {
        var now = DateTime.UtcNow;
        return new Transaction
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            CategoryId = categoryId,
            Amount = amount,
            Description = description,
            Date = date,
            Kind = kind,
            CreatedAt = now,
            UpdatedAt = now
        };
    }
}
