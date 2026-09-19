using FinanceApp.Domain.Entities;
using FinanceApp.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FinanceApp.Tests;

/// <summary>
/// Base para los tests de controllers. Usa SQLite en memoria en lugar del
/// proveedor InMemory para que aparezcan las limitaciones reales de SQLite
/// (por ejemplo, que no ordena decimales).
/// </summary>
public abstract class TestBase : IDisposable
{
    private readonly SqliteConnection _connection;
    protected readonly FinanceDbContext Context;

    protected const string UserId = "user-1";
    protected const string OtherUserId = "user-2";

    protected TestBase()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseSqlite(_connection)
            .Options;

        Context = new FinanceDbContext(options);
        Context.Database.EnsureCreated();

        SeedUsers();
    }

    private void SeedUsers()
    {
        Context.Users.AddRange(
            new User { Id = UserId, Nombre = "Usuario", Email = "user@test.com", PasswordHash = "x" },
            new User { Id = OtherUserId, Nombre = "Otro", Email = "otro@test.com", PasswordHash = "x" }
        );
        Context.SaveChanges();
    }

    /// <summary>Coloca en el controller el usuario autenticado que usan los endpoints.</summary>
    protected static T WithUser<T>(T controller, string userId) where T : ControllerBase
    {
        var identity = new ClaimsIdentity(new[] { new Claim("sub", userId) }, "test");

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };

        return controller;
    }

    protected Category GivenCategory(string id, string userId, string nombre = "Transporte",
        CategoryKind kind = CategoryKind.Expense)
    {
        var category = new Category
        {
            Id = id,
            UserId = userId,
            Nombre = nombre,
            Kind = kind,
            Color = "#fff",
            Activo = true
        };

        Context.Categories.Add(category);
        Context.SaveChanges();
        return category;
    }

    protected Transaction GivenTransaction(string categoryId, string userId, decimal amount,
        DateTime date, TransactionKind kind = TransactionKind.Expense)
    {
        var transaction = new Transaction
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            CategoryId = categoryId,
            Amount = amount,
            Description = "test",
            Date = date,
            Kind = kind
        };

        Context.Transactions.Add(transaction);
        Context.SaveChanges();
        return transaction;
    }

    public void Dispose()
    {
        Context.Dispose();
        _connection.Dispose();
        GC.SuppressFinalize(this);
    }
}
