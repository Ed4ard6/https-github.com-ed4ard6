using FinanceApp.API.Controllers;
using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApp.Tests;

public class BudgetsControllerTests : TestBase
{
    private const string CategoryId = "cat-1";

    private BudgetsController Controller(string userId = UserId) =>
        WithUser(new BudgetsController(Context), userId);

    public BudgetsControllerTests()
    {
        GivenCategory(CategoryId, UserId);
    }

    private static SaveBudgetRequest ValidRequest() => new()
    {
        CategoryId = CategoryId,
        Amount = 500_000,
        Month = 6,
        Year = 2026
    };

    [Fact]
    public void CreateBudget_guarda_el_presupuesto()
    {
        var result = Controller().CreateBudget(ValidRequest()) as CreatedAtActionResult;

        Assert.NotNull(result);
        var dto = Assert.IsType<BudgetDto>(result!.Value);
        Assert.Equal(500_000, dto.Amount);
        Assert.Equal("Transporte", dto.CategoryName);
    }

    [Fact]
    public void CreateBudget_rechaza_un_duplicado_de_la_misma_categoria_y_mes()
    {
        Controller().CreateBudget(ValidRequest());

        var result = Controller().CreateBudget(ValidRequest());

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Single(Context.Budgets);
    }

    [Fact]
    public void CreateBudget_permite_la_misma_categoria_en_meses_distintos()
    {
        Controller().CreateBudget(ValidRequest());

        var otroMes = ValidRequest();
        otroMes.Month = 7;

        Assert.IsType<CreatedAtActionResult>(Controller().CreateBudget(otroMes));
        Assert.Equal(2, Context.Budgets.Count());
    }

    [Fact]
    public void CreateBudget_rechaza_una_categoria_de_otro_usuario()
    {
        GivenCategory("cat-ajena", OtherUserId);

        var request = ValidRequest();
        request.CategoryId = "cat-ajena";

        var result = Controller().CreateBudget(request);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(Context.Budgets);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public void CreateBudget_exige_un_importe_positivo(decimal amount)
    {
        var request = ValidRequest();
        request.Amount = amount;

        Assert.IsType<BadRequestObjectResult>(Controller().CreateBudget(request));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(13)]
    public void CreateBudget_exige_un_mes_valido(int month)
    {
        var request = ValidRequest();
        request.Month = month;

        Assert.IsType<BadRequestObjectResult>(Controller().CreateBudget(request));
    }

    [Fact]
    public void GetBudgets_suma_como_gastado_solo_las_transacciones_de_ese_mes()
    {
        Controller().CreateBudget(ValidRequest());

        GivenTransaction(CategoryId, UserId, -100_000, new DateTime(2026, 6, 3));
        GivenTransaction(CategoryId, UserId, -50_000, new DateTime(2026, 6, 20));
        // Fuera del mes presupuestado: no debe contar
        GivenTransaction(CategoryId, UserId, -900_000, new DateTime(2026, 7, 1));

        var result = Controller().GetBudgets(6, 2026) as OkObjectResult;
        var budget = Assert.Single(Assert.IsAssignableFrom<IEnumerable<BudgetDto>>(result!.Value));

        Assert.Equal(150_000, budget.Spent);
    }

    [Fact]
    public void GetBudgets_no_cuenta_ingresos_ni_ahorros_como_gasto()
    {
        Controller().CreateBudget(ValidRequest());

        GivenTransaction(CategoryId, UserId, -80_000, new DateTime(2026, 6, 5));
        GivenTransaction(CategoryId, UserId, 500_000, new DateTime(2026, 6, 6), TransactionKind.Income);
        GivenTransaction(CategoryId, UserId, 200_000, new DateTime(2026, 6, 7), TransactionKind.Saving);

        var result = Controller().GetBudgets(6, 2026) as OkObjectResult;
        var budget = Assert.Single(Assert.IsAssignableFrom<IEnumerable<BudgetDto>>(result!.Value));

        Assert.Equal(80_000, budget.Spent);
    }

    [Fact]
    public void GetBudgets_no_mezcla_el_gasto_de_otro_usuario()
    {
        Controller().CreateBudget(ValidRequest());

        GivenTransaction(CategoryId, UserId, -30_000, new DateTime(2026, 6, 10));
        GivenTransaction(CategoryId, OtherUserId, -700_000, new DateTime(2026, 6, 11));

        var result = Controller().GetBudgets(6, 2026) as OkObjectResult;
        var budget = Assert.Single(Assert.IsAssignableFrom<IEnumerable<BudgetDto>>(result!.Value));

        Assert.Equal(30_000, budget.Spent);
    }
}
