using FinanceApp.API.Controllers;
using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;
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

    /// <summary>Recibo con categoría: sin ella no se puede registrar el pago.</summary>
    private static SaveFixedExpenseRequest PayableRequest()
    {
        var request = ValidRequest();
        request.CategoryId = CategoryId;
        return request;
    }

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
    public void PayFixedExpense_registra_el_pago_como_gasto()
    {
        var request = ValidRequest();
        request.CategoryId = CategoryId;
        Controller().CreateFixedExpense(request);
        var expense = Context.FixedExpenses.Single();

        var result = Controller().PayFixedExpense(expense.Id, null) as OkObjectResult;

        Assert.NotNull(result);
        var transaction = Assert.Single(Context.Transactions);
        Assert.Equal(TransactionKind.Expense, transaction.Kind);
        Assert.Equal(expense.Id, transaction.FixedExpenseId);
        Assert.Equal(CategoryId, transaction.CategoryId);
        // El gasto se guarda en negativo, como el resto de gastos
        Assert.Equal(-800_000, transaction.Amount);
    }

    [Fact]
    public void PayFixedExpense_exige_que_el_recibo_tenga_categoria()
    {
        // Sin categoría no se sabe a qué presupuesto imputarlo
        Controller().CreateFixedExpense(ValidRequest());
        var expense = Context.FixedExpenses.Single();

        var result = Controller().PayFixedExpense(expense.Id, null);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(Context.Transactions);
    }

    [Fact]
    public void PayFixedExpense_marca_el_recibo_como_pagado_este_mes()
    {
        var request = ValidRequest();
        request.CategoryId = CategoryId;
        Controller().CreateFixedExpense(request);
        var expense = Context.FixedExpenses.Single();

        Controller().PayFixedExpense(expense.Id, null);

        var listado = Controller().GetFixedExpenses() as OkObjectResult;
        var dto = Assert.Single(Assert.IsAssignableFrom<IEnumerable<FixedExpenseDto>>(listado!.Value));

        Assert.True(dto.PaidThisMonth);
    }

    [Fact]
    public void PayFixedExpense_no_deja_pagar_dos_veces_el_mismo_mes()
    {
        Controller().CreateFixedExpense(PayableRequest());
        var expense = Context.FixedExpenses.Single();

        Controller().PayFixedExpense(expense.Id, null);
        var segundo = Controller().PayFixedExpense(expense.Id, null);

        Assert.IsType<BadRequestObjectResult>(segundo);
        Assert.Single(Context.Transactions);
    }

    [Fact]
    public void PayFixedExpense_permite_pagarlo_de_nuevo_en_otro_mes()
    {
        Controller().CreateFixedExpense(PayableRequest());
        var expense = Context.FixedExpenses.Single();

        Controller().PayFixedExpense(expense.Id, new PayFixedExpenseRequest
        {
            Date = DateTime.UtcNow.AddMonths(-1)
        });
        var esteMes = Controller().PayFixedExpense(expense.Id, null);

        Assert.IsType<OkObjectResult>(esteMes);
        Assert.Equal(2, Context.Transactions.Count());
    }

    [Fact]
    public void PayFixedExpense_acepta_un_importe_distinto_al_previsto()
    {
        Controller().CreateFixedExpense(PayableRequest());
        var expense = Context.FixedExpenses.Single();

        Controller().PayFixedExpense(expense.Id, new PayFixedExpenseRequest { Amount = 850_000 });

        Assert.Equal(-850_000, Context.Transactions.Single().Amount);
    }

    [Fact]
    public void PayFixedExpense_no_permite_pagar_el_recibo_de_otro_usuario()
    {
        Controller(OtherUserId).CreateFixedExpense(ValidRequest());
        var ajeno = Context.FixedExpenses.Single();

        var result = Controller(UserId).PayFixedExpense(ajeno.Id, null);

        Assert.IsType<NotFoundObjectResult>(result);
        Assert.Empty(Context.Transactions);
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
