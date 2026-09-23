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
            // La cuenta de demostración es un usuario corriente: no debe tener
            // privilegios de administración.
            var demoUser = new User
            {
                Id = "demo-user-001",
                Nombre = "Usuario Demo",
                Email = "demo@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("demo123"),
                Role = UserRole.User,
                Activo = true,
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

    /// <summary>
    /// Crea la cuenta de administración si no hay ninguna. Es una cuenta
    /// aparte de la de demostración: un usuario de prueba no debe poder
    /// gestionar cuentas ajenas.
    ///
    /// La contraseña sale de la configuración (Admin:Password, o la variable
    /// de entorno Admin__Password). Si no se indica, se genera una al azar y
    /// se escribe en el log de arranque: así no queda ninguna credencial de
    /// administrador escrita en el repositorio.
    /// </summary>
    public static void EnsureAdminExists(
        FinanceDbContext context,
        string? configuredEmail = null,
        string? configuredPassword = null,
        Action<string>? log = null)
    {
        if (context.Users.Any(u => u.Role == UserRole.Admin && u.Activo)) return;

        var email = string.IsNullOrWhiteSpace(configuredEmail)
            ? "admin@financeapp.local"
            : configuredEmail.Trim().ToLowerInvariant();

        var existente = context.Users.FirstOrDefault(u => u.Email == email);
        if (existente != null)
        {
            existente.Role = UserRole.Admin;
            existente.Activo = true;
            existente.UpdatedAt = DateTime.UtcNow;
            context.SaveChanges();
            log?.Invoke($"La cuenta {email} ha sido promovida a administrador.");
            return;
        }

        var generada = string.IsNullOrWhiteSpace(configuredPassword);
        var password = generada ? GenerarPassword() : configuredPassword!;

        var now = DateTime.UtcNow;
        var admin = new User
        {
            Id = Guid.NewGuid().ToString(),
            Nombre = "Administrador",
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRole.Admin,
            Activo = true,
            // Obliga a cambiarla en cuanto entre por primera vez
            MustChangePassword = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        context.Users.Add(admin);
        context.SaveChanges();
        SeedCategoriesForUser(context, admin.Id);

        if (generada)
        {
            log?.Invoke(
                $"Cuenta de administrador creada: {email} / {password}\n" +
                "Anótala: no vuelve a mostrarse. Cámbiala al entrar.");
        }
        else
        {
            log?.Invoke($"Cuenta de administrador creada: {email} (contraseña tomada de la configuración).");
        }
    }

    /// <summary>
    /// Devuelve el acceso a la cuenta de administración desde el propio
    /// servidor. Es la salida al caso en que nadie puede entrar: el usuario
    /// depende del administrador, pero el administrador no tiene a nadie por
    /// encima, así que la autoridad recae en quien puede ejecutar el servidor.
    ///
    /// No abre ninguna puerta nueva: quien llega a ejecutar esto ya tiene el
    /// fichero de la base de datos delante.
    /// </summary>
    /// <param name="nuevaPassword">Si viene vacía, se genera una al azar.</param>
    /// <returns>La contraseña aplicada, o null si no hay ninguna cuenta que tocar.</returns>
    public static string? RestablecerPasswordDeAdmin(
        FinanceDbContext context,
        string? email = null,
        string? nuevaPassword = null)
    {
        var buscado = string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();

        // Con email, esa cuenta; sin email, el administrador más antiguo.
        var admin = buscado != null
            ? context.Users.FirstOrDefault(u => u.Email == buscado)
            : context.Users
                .Where(u => u.Role == UserRole.Admin)
                .OrderBy(u => u.CreatedAt)
                .FirstOrDefault();

        if (admin == null) return null;

        var password = string.IsNullOrWhiteSpace(nuevaPassword) ? GenerarPassword() : nuevaPassword!;

        admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        // Que sea administrador y pueda entrar es parte de la recuperación:
        // un admin desactivado por error dejaría la aplicación sin gestión.
        admin.Role = UserRole.Admin;
        admin.Activo = true;
        admin.MustChangePassword = true;
        admin.UpdatedAt = DateTime.UtcNow;

        // Los enlaces de recuperación pendientes de esa cuenta se anulan.
        foreach (var pendiente in context.PasswordResetTokens
                     .Where(t => t.UserId == admin.Id && t.UsedAt == null)
                     .ToList())
        {
            pendiente.UsedAt = DateTime.UtcNow;
        }

        context.SaveChanges();
        return password;
    }

    /// <summary>Contraseña aleatoria con generador criptográfico.</summary>
    private static string GenerarPassword()
    {
        const string alfabeto = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var bytes = System.Security.Cryptography.RandomNumberGenerator.GetBytes(14);

        return new string(bytes.Select(b => alfabeto[b % alfabeto.Length]).ToArray());
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
