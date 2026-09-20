using FinanceApp.API.Controllers;
using FinanceApp.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApp.Tests;

public class FixedExpensesControllerTests : TestBase
{
    private const string CategoryId = "cat-1";

    private FixedExpensesController Controller(string userId = UserId) =>
        WithUser(new FixedExpensesController(Context), userId);

    public FixedExpensesControllerTests()
    {
        GivenCategory(CategoryId, UserId, "Vivienda");
    }

    private static SaveFixedExpenseRequest ValidRequest() => new()
    {
        Nombre = "Alquiler",
        Amount = 800_000,
        PaymentDay = 5,
        CategoryId = null
    };

    [Fact]
    public void CreateFixedExpense_guarda_el_recibo_del_usuario()
    {
        var result = Controller().CreateFixedExpense(ValidRequest()) as CreatedAtActionResult;

        Assert.NotNull(result);
        var dto = Assert.IsType<FixedExpenseDto>(result!.Value);
        Assert.Equal("Alquiler", dto.Nombre);
        Assert.Equal(5, dto.PaymentDay);

        Assert.Equal(UserId, Context.FixedExpenses.Single().UserId);
    }

    [Fact]
    public void CreateFixedExpense_recorta_los_espacios_del_nombre()
    {
        var request = ValidRequest();
        request.Nombre = "  Internet  ";

        Controller().CreateFixedExpense(request);

        Assert.Equal("Internet", Context.FixedExpenses.Single().Nombre);
    }

    [Fact]
    public void CreateFixedExpense_guarda_la_marca_de_reparto()
    {
        var request = ValidRequest();
        request.SplitBetweenPaydays = true;

        var result = Controller().CreateFixedExpense(request) as CreatedAtActionResult;
        var dto = Assert.IsType<FixedExpenseDto>(result!.Value);

        Assert.True(dto.SplitBetweenPaydays);
        Assert.True(Context.FixedExpenses.Single().SplitBetweenPaydays);
    }

    [Fact]
    public void CreateFixedExpense_acepta_recibos_sin_categoria()
    {
        var result = Controller().CreateFixedExpense(ValidRequest());

        Assert.IsType<CreatedAtActionResult>(result);
        Assert.Null(Context.FixedExpenses.Single().CategoryId);
    }

    [Fact]
    public void CreateFixedExpense_asocia_la_categoria_indicada()
    {
        var request = ValidRequest();
        request.CategoryId = CategoryId;

        var result = Controller().CreateFixedExpense(request) as CreatedAtActionResult;
        var dto = Assert.IsType<FixedExpenseDto>(result!.Value);

        Assert.Equal("Vivienda", dto.CategoryName);
    }

    [Fact]
    public void CreateFixedExpense_rechaza_una_categoria_de_otro_usuario()
    {
        GivenCategory("cat-ajena", OtherUserId);

        var request = ValidRequest();
        request.CategoryId = "cat-ajena";

        Assert.IsType<BadRequestObjectResult>(Controller().CreateFixedExpense(request));
        Assert.Empty(Context.FixedExpenses);
    }

    [Theory]
    [InlineData("", 800_000, 5)]
    [InlineData("   ", 800_000, 5)]
    [InlineData("Alquiler", 0, 5)]
    [InlineData("Alquiler", -100, 5)]
    [InlineData("Alquiler", 800_000, 0)]
    [InlineData("Alquiler", 800_000, 32)]
    public void CreateFixedExpense_rechaza_datos_invalidos(string nombre, decimal amount, int day)
    {
        var request = ValidRequest();
        request.Nombre = nombre;
        request.Amount = amount;
        request.PaymentDay = day;

        Assert.IsType<BadRequestObjectResult>(Controller().CreateFixedExpense(request));
        Assert.Empty(Context.FixedExpenses);
    }

    [Fact]
    public void GetFixedExpenses_solo_devuelve_los_propios()
    {
        Controller(UserId).CreateFixedExpense(ValidRequest());

        var ajeno = ValidRequest();
        ajeno.Nombre = "Recibo ajeno";
        Controller(OtherUserId).CreateFixedExpense(ajeno);

        var result = Controller(UserId).GetFixedExpenses() as OkObjectResult;
        var expenses = Assert.IsAssignableFrom<IEnumerable<FixedExpenseDto>>(result!.Value);

        Assert.Equal("Alquiler", Assert.Single(expenses).Nombre);
    }

    [Fact]
    public void GetFixedExpenses_ordena_por_dia_de_pago()
    {
        var tarde = ValidRequest();
        tarde.Nombre = "Internet";
        tarde.PaymentDay = 22;
        Controller().CreateFixedExpense(tarde);

        Controller().CreateFixedExpense(ValidRequest());

        var result = Controller().GetFixedExpenses() as OkObjectResult;
        var expenses = Assert.IsAssignableFrom<IEnumerable<FixedExpenseDto>>(result!.Value).ToList();

        Assert.Equal(5, expenses[0].PaymentDay);
        Assert.Equal(22, expenses[1].PaymentDay);
    }

    [Fact]
    public void UpdateFixedExpense_no_permite_tocar_el_recibo_de_otro_usuario()
    {
        Controller(OtherUserId).CreateFixedExpense(ValidRequest());
        var ajeno = Context.FixedExpenses.Single();

        var request = ValidRequest();
        request.Nombre = "Secuestrado";

        Assert.IsType<NotFoundObjectResult>(Controller(UserId).UpdateFixedExpense(ajeno.Id, request));
        Assert.Equal("Alquiler", Context.FixedExpenses.Single().Nombre);
    }

    [Fact]
    public void UpdateFixedExpense_permite_activar_el_reparto()
    {
        Controller().CreateFixedExpense(ValidRequest());
        var expense = Context.FixedExpenses.Single();

        var request = ValidRequest();
        request.SplitBetweenPaydays = true;
        Controller().UpdateFixedExpense(expense.Id, request);

        Assert.True(Context.FixedExpenses.Single().SplitBetweenPaydays);
    }

    [Fact]
    public void DeleteFixedExpense_da_de_baja_sin_borrar_el_registro()
    {
        Controller().CreateFixedExpense(ValidRequest());
        var expense = Context.FixedExpenses.Single();

        Assert.IsType<NoContentResult>(Controller().DeleteFixedExpense(expense.Id));
        Assert.False(Context.FixedExpenses.Single().Activo);

        var listado = Controller().GetFixedExpenses() as OkObjectResult;
        Assert.Empty(Assert.IsAssignableFrom<IEnumerable<FixedExpenseDto>>(listado!.Value));
    }
}
