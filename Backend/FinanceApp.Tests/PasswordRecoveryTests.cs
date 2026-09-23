using FinanceApp.API.Controllers;
using FinanceApp.API.Data;
using FinanceApp.API.Services;
using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace FinanceApp.Tests;

/// <summary>Guarda los enlaces en lugar de enviarlos, para poder mirarlos.</summary>
public class DeliveryDePrueba : IPasswordResetDelivery
{
    public List<(string Email, string Url, TimeSpan Validez)> Enviados { get; } = new();

    public void Enviar(string email, string resetUrl, TimeSpan validez) =>
        Enviados.Add((email, resetUrl, validez));
}

internal class EntornoDePrueba : IWebHostEnvironment
{
    public EntornoDePrueba(string nombre) => EnvironmentName = nombre;

    public string EnvironmentName { get; set; }
    public string ApplicationName { get; set; } = "tests";
    public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    public string WebRootPath { get; set; } = AppContext.BaseDirectory;
    public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
}

public class PasswordRecoveryTests : TestBase
{
    private const string Email = "user@test.com";
    private readonly DeliveryDePrueba _delivery = new();

    private AuthController Controller(string entorno = "Development", params (string, string?)[] config)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(config.Select(c =>
                new KeyValuePair<string, string?>(c.Item1, c.Item2)))
            .Build();

        return new AuthController(Context, configuration, _delivery, new EntornoDePrueba(entorno));
    }

    public PasswordRecoveryTests()
    {
        var user = Context.Users.Single(u => u.Id == UserId);
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword("laDeSiempre");
        Context.SaveChanges();
    }

    private string PedirEnlace(string email = Email)
    {
        var result = Controller().ForgotPassword(new ForgotPasswordRequest { Email = email }) as OkObjectResult;
        return Assert.IsType<ForgotPasswordResponse>(result!.Value).Token!;
    }

    private static string Password(User user) => user.PasswordHash;

    [Fact]
    public void ForgotPassword_entrega_un_enlace_al_dueno_del_correo()
    {
        var result = Controller().ForgotPassword(new ForgotPasswordRequest { Email = "USER@test.com  " })
            as OkObjectResult;
        var respuesta = Assert.IsType<ForgotPasswordResponse>(result!.Value);

        var enviado = Assert.Single(_delivery.Enviados);

        Assert.Equal(Email, enviado.Email);
        Assert.Contains("/auth/reset-password?token=", enviado.Url);
        Assert.Equal(TimeSpan.FromMinutes(30), enviado.Validez);
        Assert.NotNull(respuesta.Token);
    }

    [Fact]
    public void ForgotPassword_no_guarda_el_token_en_claro()
    {
        var token = PedirEnlace();

        var registro = Context.PasswordResetTokens.Single();

        Assert.NotEqual(token, registro.TokenHash);
        Assert.DoesNotContain(token, registro.TokenHash);
        Assert.Equal(64, registro.TokenHash.Length); // SHA-256 en hexadecimal
    }

    [Fact]
    public void ForgotPassword_responde_lo_mismo_si_el_correo_no_existe()
    {
        var conocido = Controller().ForgotPassword(new ForgotPasswordRequest { Email = Email }) as OkObjectResult;
        var desconocido = Controller().ForgotPassword(new ForgotPasswordRequest { Email = "nadie@test.com" })
            as OkObjectResult;

        var a = Assert.IsType<ForgotPasswordResponse>(conocido!.Value);
        var b = Assert.IsType<ForgotPasswordResponse>(desconocido!.Value);

        // El mensaje no delata qué correos tienen cuenta
        Assert.Equal(a.Message, b.Message);
        // …y para el desconocido no se genera ni se envía nada
        Assert.Single(_delivery.Enviados);
        Assert.Single(Context.PasswordResetTokens);
    }

    [Fact]
    public void ForgotPassword_ignora_las_cuentas_desactivadas()
    {
        var user = Context.Users.Single(u => u.Id == UserId);
        user.Activo = false;
        Context.SaveChanges();

        var result = Controller().ForgotPassword(new ForgotPasswordRequest { Email = Email }) as OkObjectResult;

        Assert.IsType<ForgotPasswordResponse>(result!.Value);
        Assert.Empty(_delivery.Enviados);
        Assert.Empty(Context.PasswordResetTokens);
    }

    [Fact]
    public void ForgotPassword_no_revela_el_token_fuera_de_desarrollo()
    {
        var result = Controller("Production").ForgotPassword(new ForgotPasswordRequest { Email = Email })
            as OkObjectResult;
        var respuesta = Assert.IsType<ForgotPasswordResponse>(result!.Value);

        Assert.Null(respuesta.Token);
        Assert.Null(respuesta.ResetUrl);
        // Pero el enlace sí se entrega por su canal
        Assert.Single(_delivery.Enviados);
    }

    [Fact]
    public void ForgotPassword_usa_la_direccion_configurada_para_el_enlace()
    {
        Controller("Development", ("PasswordReset:AppUrl", "https://finanzas.ejemplo.com/"))
            .ForgotPassword(new ForgotPasswordRequest { Email = Email });

        Assert.StartsWith("https://finanzas.ejemplo.com/auth/reset-password?token=",
            _delivery.Enviados.Single().Url);
    }

    [Fact]
    public void ForgotPassword_anula_el_enlace_anterior_al_pedir_otro()
    {
        var primero = PedirEnlace();
        var segundo = PedirEnlace();

        Assert.IsType<BadRequestObjectResult>(Controller().ResetPasswordWithToken(
            new ResetPasswordWithTokenRequest { Token = primero, NewPassword = "nueva123" }));

        Assert.IsType<OkObjectResult>(Controller().ResetPasswordWithToken(
            new ResetPasswordWithTokenRequest { Token = segundo, NewPassword = "nueva123" }));
    }

    [Fact]
    public void ResetPassword_cambia_la_contrasena_y_gasta_el_enlace()
    {
        var anterior = Password(Context.Users.Single(u => u.Id == UserId));
        var token = PedirEnlace();

        var result = Controller().ResetPasswordWithToken(
            new ResetPasswordWithTokenRequest { Token = token, NewPassword = "nuevaClave1" });

        Assert.IsType<OkObjectResult>(result);

        var user = Context.Users.Single(u => u.Id == UserId);
        Assert.NotEqual(anterior, user.PasswordHash);
        Assert.True(BCrypt.Net.BCrypt.Verify("nuevaClave1", user.PasswordHash));
        Assert.False(BCrypt.Net.BCrypt.Verify("laDeSiempre", user.PasswordHash));
        Assert.False(user.MustChangePassword);
        Assert.NotNull(Context.PasswordResetTokens.Single().UsedAt);
    }

    [Fact]
    public void ResetPassword_no_admite_el_mismo_enlace_dos_veces()
    {
        var token = PedirEnlace();

        Assert.IsType<OkObjectResult>(Controller().ResetPasswordWithToken(
            new ResetPasswordWithTokenRequest { Token = token, NewPassword = "primera1" }));

        var segunda = Controller().ResetPasswordWithToken(
            new ResetPasswordWithTokenRequest { Token = token, NewPassword = "segunda1" });

        Assert.IsType<BadRequestObjectResult>(segunda);
        // La contraseña sigue siendo la del primer canje
        Assert.True(BCrypt.Net.BCrypt.Verify("primera1",
            Context.Users.Single(u => u.Id == UserId).PasswordHash));
    }

    [Fact]
    public void ResetPassword_rechaza_un_enlace_caducado()
    {
        var token = PedirEnlace();

        var registro = Context.PasswordResetTokens.Single();
        registro.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
        Context.SaveChanges();

        var result = Controller().ResetPasswordWithToken(
            new ResetPasswordWithTokenRequest { Token = token, NewPassword = "nuevaClave1" });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.True(BCrypt.Net.BCrypt.Verify("laDeSiempre",
            Context.Users.Single(u => u.Id == UserId).PasswordHash));
    }

    [Fact]
    public void ResetPassword_rechaza_un_token_inventado()
    {
        var result = Controller().ResetPasswordWithToken(
            new ResetPasswordWithTokenRequest { Token = "me-lo-acabo-de-inventar", NewPassword = "nuevaClave1" });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public void ResetPassword_exige_una_contrasena_de_al_menos_6_caracteres()
    {
        var token = PedirEnlace();

        var result = Controller().ResetPasswordWithToken(
            new ResetPasswordWithTokenRequest { Token = token, NewPassword = "123" });

        Assert.IsType<BadRequestObjectResult>(result);
        // El enlace sigue vivo: el usuario puede reintentar con una válida
        Assert.Null(Context.PasswordResetTokens.Single().UsedAt);
    }

    [Fact]
    public void ResetPassword_no_sirve_si_la_cuenta_se_desactiva_mientras_tanto()
    {
        var token = PedirEnlace();

        var user = Context.Users.Single(u => u.Id == UserId);
        user.Activo = false;
        Context.SaveChanges();

        var result = Controller().ResetPasswordWithToken(
            new ResetPasswordWithTokenRequest { Token = token, NewPassword = "nuevaClave1" });

        Assert.IsType<BadRequestObjectResult>(result);
    }
}

/// <summary>
/// El rescate del administrador: la salida cuando nadie puede entrar.
/// </summary>
public class AdminRescueTests : TestBase
{
    private User DarDeAltaAdmin(string email = "admin@financeapp.local", bool activo = true)
    {
        var admin = new User
        {
            Id = "admin-rescate",
            Nombre = "Administrador",
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("perdida"),
            Role = UserRole.Admin,
            Activo = activo,
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };

        Context.Users.Add(admin);
        Context.SaveChanges();
        return admin;
    }

    [Fact]
    public void Restablecer_aplica_la_contrasena_indicada()
    {
        DarDeAltaAdmin();

        var aplicada = DataSeeder.RestablecerPasswordDeAdmin(Context, "admin@financeapp.local", "LaNueva123");

        Assert.Equal("LaNueva123", aplicada);

        var admin = Context.Users.Single(u => u.Id == "admin-rescate");
        Assert.True(BCrypt.Net.BCrypt.Verify("LaNueva123", admin.PasswordHash));
        Assert.False(BCrypt.Net.BCrypt.Verify("perdida", admin.PasswordHash));
        // Provisional: hay que cambiarla al entrar
        Assert.True(admin.MustChangePassword);
    }

    [Fact]
    public void Restablecer_genera_una_contrasena_si_no_se_indica_ninguna()
    {
        DarDeAltaAdmin();

        var primera = DataSeeder.RestablecerPasswordDeAdmin(Context);
        var segunda = DataSeeder.RestablecerPasswordDeAdmin(Context);

        Assert.NotNull(primera);
        Assert.NotEqual(primera, segunda);
        Assert.True(primera!.Length >= 10);
        Assert.True(BCrypt.Net.BCrypt.Verify(segunda,
            Context.Users.Single(u => u.Id == "admin-rescate").PasswordHash));
    }

    [Fact]
    public void Restablecer_reactiva_y_devuelve_el_rol_a_la_cuenta()
    {
        var admin = DarDeAltaAdmin(activo: false);
        admin.Role = UserRole.User;
        Context.SaveChanges();

        DataSeeder.RestablecerPasswordDeAdmin(Context, "admin@financeapp.local", "LaNueva123");

        var actualizado = Context.Users.Single(u => u.Id == "admin-rescate");
        Assert.True(actualizado.Activo);
        Assert.Equal(UserRole.Admin, actualizado.Role);
    }

    [Fact]
    public void Restablecer_sin_email_toma_el_administrador_mas_antiguo()
    {
        var antiguo = DarDeAltaAdmin();
        Context.Users.Add(new User
        {
            Id = "admin-nuevo",
            Nombre = "Segundo",
            Email = "admin2@test.com",
            PasswordHash = "x",
            Role = UserRole.Admin,
            Activo = true,
            CreatedAt = DateTime.UtcNow
        });
        Context.SaveChanges();

        var aplicada = DataSeeder.RestablecerPasswordDeAdmin(Context, null, "LaNueva123");

        Assert.Equal("LaNueva123", aplicada);
        Assert.True(BCrypt.Net.BCrypt.Verify("LaNueva123",
            Context.Users.Single(u => u.Id == antiguo.Id).PasswordHash));
        Assert.Equal("x", Context.Users.Single(u => u.Id == "admin-nuevo").PasswordHash);
    }

    [Fact]
    public void Restablecer_anula_los_enlaces_de_recuperacion_pendientes()
    {
        var admin = DarDeAltaAdmin();
        Context.PasswordResetTokens.Add(new PasswordResetToken
        {
            Id = "t1",
            UserId = admin.Id,
            TokenHash = "hash",
            ExpiresAt = DateTime.UtcNow.AddMinutes(20)
        });
        Context.SaveChanges();

        DataSeeder.RestablecerPasswordDeAdmin(Context, "admin@financeapp.local", "LaNueva123");

        Assert.NotNull(Context.PasswordResetTokens.Single().UsedAt);
    }

    [Fact]
    public void Restablecer_avisa_si_no_hay_ninguna_cuenta_de_administracion()
    {
        Assert.Null(DataSeeder.RestablecerPasswordDeAdmin(Context));
    }
}
