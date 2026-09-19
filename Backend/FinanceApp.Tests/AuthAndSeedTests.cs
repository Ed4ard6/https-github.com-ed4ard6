using FinanceApp.API.Controllers;
using FinanceApp.API.Data;
using FinanceApp.Domain.Entities;

namespace FinanceApp.Tests;

public class NormalizeEmailTests
{
    [Theory]
    [InlineData("Demo@Example.com", "demo@example.com")]
    [InlineData("  demo@example.com  ", "demo@example.com")]
    [InlineData("DEMO@EXAMPLE.COM", "demo@example.com")]
    [InlineData("demo@example.com", "demo@example.com")]
    public void Normaliza_mayusculas_y_espacios(string entrada, string esperado)
    {
        Assert.Equal(esperado, AuthController.NormalizeEmail(entrada));
    }

    [Fact]
    public void Devuelve_cadena_vacia_si_el_email_es_nulo()
    {
        Assert.Equal(string.Empty, AuthController.NormalizeEmail(null));
    }
}

public class DataSeederTests : TestBase
{
    [Fact]
    public void SeedCategoriesForUser_crea_el_set_por_defecto()
    {
        DataSeeder.SeedCategoriesForUser(Context, UserId);

        var categorias = Context.Categories.Where(c => c.UserId == UserId).ToList();

        Assert.Equal(5, categorias.Count);
        Assert.Contains(categorias, c => c.Nombre == "Salario" && c.Kind == CategoryKind.Income);
        Assert.Contains(categorias, c => c.Nombre == "Ahorros" && c.Kind == CategoryKind.Saving);
        Assert.Equal(3, categorias.Count(c => c.Kind == CategoryKind.Expense));
    }

    [Fact]
    public void SeedCategoriesForUser_no_duplica_si_ya_tiene_categorias()
    {
        DataSeeder.SeedCategoriesForUser(Context, UserId);
        DataSeeder.SeedCategoriesForUser(Context, UserId);

        Assert.Equal(5, Context.Categories.Count(c => c.UserId == UserId));
    }

    [Fact]
    public void SeedCategoriesForUser_da_categorias_propias_a_cada_usuario()
    {
        DataSeeder.SeedCategoriesForUser(Context, UserId);
        DataSeeder.SeedCategoriesForUser(Context, OtherUserId);

        var propias = Context.Categories.Where(c => c.UserId == UserId).Select(c => c.Id).ToList();
        var ajenas = Context.Categories.Where(c => c.UserId == OtherUserId).Select(c => c.Id).ToList();

        Assert.Equal(5, propias.Count);
        Assert.Equal(5, ajenas.Count);
        // Los ids no se comparten entre usuarios
        Assert.Empty(propias.Intersect(ajenas));
    }

    [Fact]
    public void SeedData_normaliza_los_emails_ya_guardados()
    {
        Context.Users.Add(new User
        {
            Id = "user-3",
            Nombre = "Mayúsculas",
            Email = "  Mixto@Example.COM ",
            PasswordHash = "x"
        });
        Context.SaveChanges();

        DataSeeder.SeedData(Context);

        var user = Context.Users.Single(u => u.Id == "user-3");
        Assert.Equal("mixto@example.com", user.Email);
    }
}
