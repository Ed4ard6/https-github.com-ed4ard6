using FinanceApp.API.Controllers;
using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApp.Tests;

public class DebtsControllerTests : TestBase
{
    private DebtsController Controller(string userId = UserId) =>
        WithUser(new DebtsController(Context), userId);

    private static SaveDebtRequest ValidRequest() => new()
    {
        Nombre = "Tarjeta",
        Balance = 1_000_000,
        OriginalAmount = 1_500_000,
        AnnualRate = 24.5m,
        MinimumPayment = 50_000,
        PaymentDay = 15
    };

    [Fact]
    public void CreateDebt_guarda_la_deuda_del_usuario_autenticado()
    {
        var result = Controller().CreateDebt(ValidRequest()) as CreatedAtActionResult;

        Assert.NotNull(result);
        var dto = Assert.IsType<DebtDto>(result!.Value);
        Assert.Equal("Tarjeta", dto.Nombre);

        var guardada = Assert.Single(Context.Debts);
        Assert.Equal(UserId, guardada.UserId);
    }

    [Fact]
    public void CreateDebt_recorta_los_espacios_del_nombre()
    {
        var request = ValidRequest();
        request.Nombre = "  Tarjeta  ";

        Controller().CreateDebt(request);

        Assert.Equal("Tarjeta", Context.Debts.Single().Nombre);
    }

    [Fact]
    public void CreateDebt_usa_el_saldo_como_importe_original_si_no_se_indica()
    {
        var request = ValidRequest();
        request.OriginalAmount = 0;

        Controller().CreateDebt(request);

        var debt = Context.Debts.Single();
        Assert.Equal(request.Balance, debt.OriginalAmount);
    }

    [Theory]
    [InlineData("", 24.5, 15, "nombre")]
    [InlineData("   ", 24.5, 15, "nombre")]
    [InlineData("Tarjeta", 250, 15, "tasa")]
    [InlineData("Tarjeta", -1, 15, "tasa")]
    [InlineData("Tarjeta", 24.5, 0, "día")]
    [InlineData("Tarjeta", 24.5, 32, "día")]
    public void CreateDebt_rechaza_datos_invalidos(string nombre, double tasa, int dia, string _)
    {
        var request = ValidRequest();
        request.Nombre = nombre;
        request.AnnualRate = (decimal)tasa;
        request.PaymentDay = dia;

        var result = Controller().CreateDebt(request);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(Context.Debts);
    }

    [Fact]
    public void GetDebts_solo_devuelve_las_deudas_propias()
    {
        Controller(UserId).CreateDebt(ValidRequest());

        var ajena = ValidRequest();
        ajena.Nombre = "Deuda ajena";
        Controller(OtherUserId).CreateDebt(ajena);

        var result = Controller(UserId).GetDebts() as OkObjectResult;
        var debts = Assert.IsAssignableFrom<IEnumerable<DebtDto>>(result!.Value);

        Assert.Equal("Tarjeta", Assert.Single(debts).Nombre);
    }

    [Fact]
    public void GetDebts_ordena_por_saldo_descendente()
    {
        var pequena = ValidRequest();
        pequena.Nombre = "Pequeña";
        pequena.Balance = 100_000;
        Controller().CreateDebt(pequena);

        var grande = ValidRequest();
        grande.Nombre = "Grande";
        grande.Balance = 5_000_000;
        Controller().CreateDebt(grande);

        var result = Controller().GetDebts() as OkObjectResult;
        var debts = Assert.IsAssignableFrom<IEnumerable<DebtDto>>(result!.Value).ToList();

        Assert.Equal("Grande", debts[0].Nombre);
        Assert.Equal("Pequeña", debts[1].Nombre);
    }

    [Fact]
    public void UpdateDebt_no_permite_tocar_la_deuda_de_otro_usuario()
    {
        Controller(OtherUserId).CreateDebt(ValidRequest());
        var ajena = Context.Debts.Single();

        var request = ValidRequest();
        request.Nombre = "Secuestrada";
        var result = Controller(UserId).UpdateDebt(ajena.Id, request);

        Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("Tarjeta", Context.Debts.Single().Nombre);
    }

    [Fact]
    public void DeleteDebt_da_de_baja_sin_borrar_el_registro()
    {
        Controller().CreateDebt(ValidRequest());
        var debt = Context.Debts.Single();

        var result = Controller().DeleteDebt(debt.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.False(Context.Debts.Single().Activo);

        var listado = Controller().GetDebts() as OkObjectResult;
        Assert.Empty(Assert.IsAssignableFrom<IEnumerable<DebtDto>>(listado!.Value));
    }
}
