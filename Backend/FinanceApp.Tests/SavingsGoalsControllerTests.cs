using FinanceApp.API.Controllers;
using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApp.Tests;

public class SavingsGoalsControllerTests : TestBase
{
    private SavingsGoalsController Controller(string userId = UserId) =>
        WithUser(new SavingsGoalsController(Context), userId);

    public SavingsGoalsControllerTests()
    {
        // Los aportes necesitan una categoría de ahorro donde imputarse
        GivenCategory("cat-ahorro", UserId, "Ahorros", CategoryKind.Saving);
    }

    private static SaveSavingsGoalRequest ValidRequest() => new()
    {
        Nombre = "Viaje",
        TargetAmount = 6_000_000,
        TargetDate = DateTime.UtcNow.AddMonths(5),
        InitialAmount = 0
    };

    private SavingsGoalDto Create(SaveSavingsGoalRequest? request = null, string userId = UserId)
    {
        var result = Controller(userId).CreateGoal(request ?? ValidRequest()) as CreatedAtActionResult;
        return Assert.IsType<SavingsGoalDto>(result!.Value);
    }

    [Fact]
    public void CreateGoal_guarda_la_meta_del_usuario()
    {
        var dto = Create();

        Assert.Equal("Viaje", dto.Nombre);
        Assert.Equal(6_000_000, dto.TargetAmount);
        Assert.Equal(UserId, Context.SavingsGoals.Single().UserId);
    }

    [Fact]
    public void CreateGoal_cuenta_lo_ya_apartado_como_progreso()
    {
        var request = ValidRequest();
        request.InitialAmount = 1_500_000;

        var dto = Create(request);

        Assert.Equal(1_500_000, dto.CurrentAmount);
        Assert.Equal(4_500_000, dto.Remaining);
        Assert.Equal(25, dto.ProgressPercentage);
    }

    [Theory]
    [InlineData("", 6_000_000)]
    [InlineData("   ", 6_000_000)]
    [InlineData("Viaje", 0)]
    [InlineData("Viaje", -100)]
    public void CreateGoal_rechaza_datos_invalidos(string nombre, decimal target)
    {
        var request = ValidRequest();
        request.Nombre = nombre;
        request.TargetAmount = target;

        Assert.IsType<BadRequestObjectResult>(Controller().CreateGoal(request));
        Assert.Empty(Context.SavingsGoals);
    }

    [Fact]
    public void CreateGoal_exige_fecha_limite()
    {
        var request = ValidRequest();
        request.TargetDate = default;

        Assert.IsType<BadRequestObjectResult>(Controller().CreateGoal(request));
    }

    [Fact]
    public void GetGoals_solo_devuelve_las_propias()
    {
        Create();

        var ajena = ValidRequest();
        ajena.Nombre = "Meta ajena";
        Create(ajena, OtherUserId);

        var result = Controller(UserId).GetGoals() as OkObjectResult;
        var goals = Assert.IsAssignableFrom<IEnumerable<SavingsGoalDto>>(result!.Value);

        Assert.Equal("Viaje", Assert.Single(goals).Nombre);
    }

    [Fact]
    public void AddContribution_crea_una_transaccion_de_ahorro_vinculada()
    {
        var goal = Create();

        Controller().AddContribution(goal.Id, new AddContributionRequest { Amount = 500_000 });

        var transaction = Assert.Single(Context.Transactions);
        Assert.Equal(TransactionKind.Saving, transaction.Kind);
        Assert.Equal(goal.Id, transaction.SavingsGoalId);
        Assert.Equal(500_000, transaction.Amount);
        Assert.Equal(UserId, transaction.UserId);
    }

    [Fact]
    public void AddContribution_suma_al_progreso_de_la_meta()
    {
        var goal = Create();

        var result = Controller().AddContribution(goal.Id, new AddContributionRequest { Amount = 600_000 })
            as OkObjectResult;
        var actualizada = Assert.IsType<SavingsGoalDto>(result!.Value);

        Assert.Equal(600_000, actualizada.CurrentAmount);
        Assert.Equal(5_400_000, actualizada.Remaining);
        Assert.Equal(600_000, actualizada.SavedThisMonth);
    }

    [Fact]
    public void AddContribution_acumula_varios_aportes()
    {
        var goal = Create();

        Controller().AddContribution(goal.Id, new AddContributionRequest { Amount = 300_000 });
        var result = Controller().AddContribution(goal.Id, new AddContributionRequest { Amount = 200_000 })
            as OkObjectResult;

        Assert.Equal(500_000, Assert.IsType<SavingsGoalDto>(result!.Value).CurrentAmount);
        Assert.Equal(2, Context.Transactions.Count());
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5000)]
    public void AddContribution_exige_un_importe_positivo(decimal amount)
    {
        var goal = Create();

        var result = Controller().AddContribution(goal.Id, new AddContributionRequest { Amount = amount });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(Context.Transactions);
    }

    [Fact]
    public void AddContribution_no_permite_aportar_a_la_meta_de_otro()
    {
        var ajena = Create(ValidRequest(), OtherUserId);

        var result = Controller(UserId).AddContribution(ajena.Id, new AddContributionRequest { Amount = 100_000 });

        Assert.IsType<NotFoundObjectResult>(result);
        Assert.Empty(Context.Transactions);
    }

    [Fact]
    public void AddContribution_avisa_si_falta_una_categoria_de_ahorro()
    {
        // Este usuario no tiene categoría de tipo ahorro
        var goal = Create(ValidRequest(), OtherUserId);

        var result = Controller(OtherUserId).AddContribution(goal.Id, new AddContributionRequest { Amount = 100_000 });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public void La_meta_se_marca_completada_al_alcanzar_el_objetivo()
    {
        var request = ValidRequest();
        request.TargetAmount = 500_000;
        var goal = Create(request);

        var result = Controller().AddContribution(goal.Id, new AddContributionRequest { Amount = 500_000 })
            as OkObjectResult;
        var actualizada = Assert.IsType<SavingsGoalDto>(result!.Value);

        Assert.True(actualizada.Completed);
        Assert.True(actualizada.OnTrack);
        Assert.Equal(0, actualizada.Remaining);
        Assert.Equal(100, actualizada.ProgressPercentage);
    }

    [Fact]
    public void El_progreso_no_pasa_del_cien_por_cien_aunque_se_aporte_de_mas()
    {
        var request = ValidRequest();
        request.TargetAmount = 500_000;
        var goal = Create(request);

        var result = Controller().AddContribution(goal.Id, new AddContributionRequest { Amount = 900_000 })
            as OkObjectResult;
        var actualizada = Assert.IsType<SavingsGoalDto>(result!.Value);

        Assert.Equal(100, actualizada.ProgressPercentage);
        Assert.Equal(0, actualizada.Remaining);
    }

    [Fact]
    public void La_cuota_mensual_reparte_lo_que_falta_entre_los_meses_restantes()
    {
        var request = ValidRequest();
        request.TargetAmount = 1_200_000;
        // Tres meses por delante, más el mes en curso
        request.TargetDate = DateTime.UtcNow.AddMonths(3);

        var dto = Create(request);

        Assert.Equal(4, dto.MonthsLeft);
        Assert.Equal(300_000, dto.MonthlyTarget);
    }

    [Fact]
    public void La_cuota_mensual_baja_tras_aportar()
    {
        var request = ValidRequest();
        request.TargetAmount = 1_200_000;
        request.TargetDate = DateTime.UtcNow.AddMonths(3);
        var goal = Create(request);

        var result = Controller().AddContribution(goal.Id, new AddContributionRequest { Amount = 400_000 })
            as OkObjectResult;
        var actualizada = Assert.IsType<SavingsGoalDto>(result!.Value);

        // Quedan 800.000 en 4 meses
        Assert.Equal(200_000, actualizada.MonthlyTarget);
    }

    [Fact]
    public void Va_al_dia_cuando_lo_aportado_este_mes_cubre_la_cuota()
    {
        var request = ValidRequest();
        request.TargetAmount = 1_200_000;
        request.TargetDate = DateTime.UtcNow.AddMonths(3);
        var goal = Create(request);

        var sinAportar = Controller().GetGoal(goal.Id) as OkObjectResult;
        Assert.False(Assert.IsType<SavingsGoalDto>(sinAportar!.Value).OnTrack);

        var result = Controller().AddContribution(goal.Id, new AddContributionRequest { Amount = 300_000 })
            as OkObjectResult;

        Assert.True(Assert.IsType<SavingsGoalDto>(result!.Value).OnTrack);
    }

    [Fact]
    public void Una_meta_vencida_sin_cumplir_se_marca_como_atrasada()
    {
        var request = ValidRequest();
        request.TargetDate = DateTime.UtcNow.AddMonths(-2);

        var dto = Create(request);

        Assert.True(dto.Overdue);
        Assert.False(dto.Completed);
        Assert.Equal(0, dto.MonthsLeft);
    }

    [Fact]
    public void DeleteGoal_da_de_baja_la_meta_pero_conserva_los_aportes()
    {
        var goal = Create();
        Controller().AddContribution(goal.Id, new AddContributionRequest { Amount = 250_000 });

        Assert.IsType<NoContentResult>(Controller().DeleteGoal(goal.Id));

        var listado = Controller().GetGoals() as OkObjectResult;
        Assert.Empty(Assert.IsAssignableFrom<IEnumerable<SavingsGoalDto>>(listado!.Value));

        // El dinero apartado sigue registrado como ahorro
        var transaction = Assert.Single(Context.Transactions);
        Assert.Equal(250_000, transaction.Amount);
        Assert.Equal(TransactionKind.Saving, transaction.Kind);
    }
}
