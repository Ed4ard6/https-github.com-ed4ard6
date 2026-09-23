using FinanceApp.API.Controllers;
using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApp.Tests;

public class AdminControllerTests : TestBase
{
    private const string AdminId = "admin-1";

    private AdminController Controller(string userId = AdminId) =>
        WithUser(new AdminController(Context), userId);

    public AdminControllerTests()
    {
        Context.Users.Add(new User
        {
            Id = AdminId,
            Nombre = "Administrador",
            Email = "admin@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Role = UserRole.Admin,
            Activo = true
        });
        Context.SaveChanges();
    }

    private List<AdminUserDto> Users()
    {
        var result = Controller().GetUsers() as OkObjectResult;
        return Assert.IsAssignableFrom<IEnumerable<AdminUserDto>>(result!.Value).ToList();
    }

    private AdminUserDto Find(string email) => Users().Single(u => u.Email == email);

    [Fact]
    public void GetUsers_lista_las_cuentas_sin_exponer_su_dinero()
    {
        GivenCategory("cat-1", UserId);
        GivenTransaction("cat-1", UserId, -350_000, DateTime.UtcNow);

        var user = Find("user@test.com");

        Assert.Equal(1, user.TransactionCount);

        // La ficha no lleva importes ni saldos: el admin ve actividad, no dinero
        var propiedades = typeof(AdminUserDto).GetProperties().Select(p => p.Name).ToList();
        Assert.DoesNotContain("Balance", propiedades);
        Assert.DoesNotContain("Amount", propiedades);
        Assert.DoesNotContain("PasswordHash", propiedades);
    }

    [Fact]
    public void GetStats_resume_la_actividad_en_numeros_agregados()
    {
        GivenCategory("cat-1", UserId);
        GivenTransaction("cat-1", UserId, -100_000, DateTime.UtcNow);

        var result = Controller().GetStats() as OkObjectResult;
        var stats = Assert.IsType<AdminStatsDto>(result!.Value);

        Assert.Equal(3, stats.TotalUsers);
        Assert.Equal(1, stats.Admins);
        Assert.Equal(1, stats.TotalTransactions);
    }

    [Fact]
    public void SetUserStatus_desactiva_una_cuenta()
    {
        var user = Find("user@test.com");

        var result = Controller().SetUserStatus(user.Id, new SetUserStatusRequest { Activo = false })
            as OkObjectResult;

        Assert.False(Assert.IsType<AdminUserDto>(result!.Value).Activo);
        Assert.False(Context.Users.Single(u => u.Id == UserId).Activo);
    }

    [Fact]
    public void SetUserStatus_no_deja_que_el_admin_se_desactive_a_si_mismo()
    {
        var result = Controller().SetUserStatus(AdminId, new SetUserStatusRequest { Activo = false });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.True(Context.Users.Single(u => u.Id == AdminId).Activo);
    }

    [Fact]
    public void SetUserStatus_no_deja_la_aplicacion_sin_administradores()
    {
        // Otro admin intenta desactivar al único que queda además de él
        var segundo = new User
        {
            Id = "admin-2",
            Nombre = "Segundo",
            Email = "admin2@test.com",
            PasswordHash = "x",
            Role = UserRole.Admin,
            Activo = true
        };
        Context.Users.Add(segundo);
        Context.SaveChanges();

        // Con dos admins activos sí se puede desactivar a uno
        Assert.IsType<OkObjectResult>(
            Controller("admin-2").SetUserStatus(AdminId, new SetUserStatusRequest { Activo = false }));

        // Pero ya no queda margen para desactivar al último
        var result = Controller(AdminId).SetUserStatus("admin-2", new SetUserStatusRequest { Activo = false });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.True(Context.Users.Single(u => u.Id == "admin-2").Activo);
    }

    [Fact]
    public void ResetPassword_cambia_el_hash_y_obliga_a_elegir_una_nueva()
    {
        var user = Context.Users.Single(u => u.Id == UserId);
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword("laDeSiempre");
        Context.SaveChanges();
        var anterior = user.PasswordHash;

        var result = Controller().ResetPassword(UserId) as OkObjectResult;
        var respuesta = Assert.IsType<ResetPasswordResponse>(result!.Value);

        var actualizado = Context.Users.Single(u => u.Id == UserId);

        Assert.NotEqual(anterior, actualizado.PasswordHash);
        Assert.True(actualizado.MustChangePassword);
        // La provisional sirve; la vieja ya no
        Assert.True(BCrypt.Net.BCrypt.Verify(respuesta.TemporaryPassword, actualizado.PasswordHash));
        Assert.False(BCrypt.Net.BCrypt.Verify("laDeSiempre", actualizado.PasswordHash));
    }

    [Fact]
    public void ResetPassword_genera_una_contrasena_distinta_cada_vez()
    {
        var primera = Assert.IsType<ResetPasswordResponse>(
            (Controller().ResetPassword(UserId) as OkObjectResult)!.Value).TemporaryPassword;
        var segunda = Assert.IsType<ResetPasswordResponse>(
            (Controller().ResetPassword(UserId) as OkObjectResult)!.Value).TemporaryPassword;

        Assert.NotEqual(primera, segunda);
        Assert.True(primera.Length >= 10);
    }

    [Fact]
    public void Cada_accion_queda_registrada_con_quien_la_hizo()
    {
        Controller().SetUserStatus(UserId, new SetUserStatusRequest { Activo = false });
        Controller().ResetPassword(UserId);

        var result = Controller().GetAuditLog() as OkObjectResult;
        var logs = Assert.IsAssignableFrom<IEnumerable<AdminAuditLogDto>>(result!.Value).ToList();

        Assert.Equal(2, logs.Count);
        Assert.All(logs, l => Assert.Equal("admin@test.com", l.AdminEmail));
        Assert.All(logs, l => Assert.Equal("user@test.com", l.TargetEmail));
        Assert.Contains(logs, l => l.Action == nameof(AdminAction.DeactivateUser));
        Assert.Contains(logs, l => l.Action == nameof(AdminAction.ResetPassword));
    }

    [Fact]
    public void El_registro_no_guarda_la_contrasena_generada()
    {
        var respuesta = Assert.IsType<ResetPasswordResponse>(
            (Controller().ResetPassword(UserId) as OkObjectResult)!.Value);

        var log = Context.AdminAuditLogs.Single();

        Assert.DoesNotContain(respuesta.TemporaryPassword, log.Details);
    }

    [Fact]
    public void SetUserStatus_devuelve_no_encontrado_si_la_cuenta_no_existe()
    {
        var result = Controller().SetUserStatus("no-existe", new SetUserStatusRequest { Activo = false });

        Assert.IsType<NotFoundObjectResult>(result);
    }
}
