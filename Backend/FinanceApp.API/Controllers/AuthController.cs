using FinanceApp.API.Data;
using FinanceApp.API.Services;
using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;
using FinanceApp.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace FinanceApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    /// <summary>Margen de vida del enlace de recuperación.</summary>
    private static readonly TimeSpan VidaDelToken = TimeSpan.FromMinutes(30);

    private readonly FinanceDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IPasswordResetDelivery _delivery;
    private readonly IWebHostEnvironment _environment;

    public AuthController(
        FinanceDbContext context,
        IConfiguration configuration,
        IPasswordResetDelivery delivery,
        IWebHostEnvironment environment)
    {
        _context = context;
        _configuration = configuration;
        _delivery = delivery;
        _environment = environment;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        // El email se guarda normalizado, así que "Demo@Example.com" y
        // "demo@example.com " entran igual.
        var email = NormalizeEmail(request.Email);
        var user = _context.Users.FirstOrDefault(u => u.Email == email);

        // Mismo mensaje en ambos casos: no revelar qué emails existen.
        if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Email o contraseña incorrectos" });

        // Una cuenta desactivada por un administrador no entra, aunque la
        // contraseña sea correcta.
        if (!user.Activo)
            return Unauthorized(new { message = "Esta cuenta está desactivada" });

        user.LastLoginAt = DateTime.UtcNow;
        _context.SaveChanges();

        var token = GenerateToken(user);
        return Ok(new AuthResponse
        {
            Token = token,
            User = ToDto(user)
        });
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterRequest request)
    {
        var nombre = request.Nombre?.Trim() ?? string.Empty;
        var email = NormalizeEmail(request.Email);

        if (string.IsNullOrWhiteSpace(nombre))
            return BadRequest(new { message = "El nombre es obligatorio" });

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            return BadRequest(new { message = "El email no es válido" });

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return BadRequest(new { message = "La contraseña debe tener al menos 6 caracteres" });

        if (_context.Users.Any(u => u.Email == email))
            return BadRequest(new { message = "El email ya está registrado" });

        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Nombre = nombre,
            Email = email,
            PasswordHash = HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        _context.SaveChanges();
        DataSeeder.SeedCategoriesForUser(_context, user.Id);

        var token = GenerateToken(user);
        return Ok(new AuthResponse
        {
            Token = token,
            User = ToDto(user)
        });
    }

    /// <summary>
    /// Pide un enlace de recuperación. Responde siempre lo mismo, exista el
    /// email o no, para que nadie pueda usar esto como buscador de cuentas.
    /// </summary>
    [HttpPost("forgot-password")]
    public IActionResult ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var respuesta = new ForgotPasswordResponse
        {
            Message = "Si el correo corresponde a una cuenta, en unos instantes recibirás " +
                      "un enlace para elegir una contraseña nueva."
        };

        var email = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(email)) return Ok(respuesta);

        var user = _context.Users.FirstOrDefault(u => u.Email == email);

        // Una cuenta desactivada tampoco recupera: reactivarla es cosa del
        // administrador, no de quien conoce el correo.
        if (user == null || !user.Activo) return Ok(respuesta);

        var ahora = DateTime.UtcNow;

        // Pedirlo otra vez invalida el enlace anterior: sólo uno vivo a la vez.
        var pendientes = _context.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null)
            .ToList();
        foreach (var pendiente in pendientes) pendiente.UsedAt = ahora;

        var token = GenerarToken();
        _context.PasswordResetTokens.Add(new PasswordResetToken
        {
            Id = Guid.NewGuid().ToString(),
            UserId = user.Id,
            TokenHash = HashToken(token),
            ExpiresAt = ahora.Add(VidaDelToken),
            CreatedAt = ahora
        });
        _context.SaveChanges();

        var baseUrl = (_configuration["PasswordReset:AppUrl"] ?? "http://localhost:4200").TrimEnd('/');
        var resetUrl = $"{baseUrl}/auth/reset-password?token={Uri.EscapeDataString(token)}";

        _delivery.Enviar(user.Email, resetUrl, VidaDelToken);

        // Sin servidor de correo, en desarrollo el enlace se devuelve también
        // aquí para poder probar el flujo de principio a fin.
        if (RevelarTokenEnRespuesta())
        {
            respuesta.ResetUrl = resetUrl;
            respuesta.Token = token;
        }

        return Ok(respuesta);
    }

    /// <summary>
    /// Canjea el enlace por una contraseña nueva. No pide la anterior: quien
    /// llega aquí demuestra el acceso con el token.
    /// </summary>
    [HttpPost("reset-password")]
    public IActionResult ResetPasswordWithToken([FromBody] ResetPasswordWithTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(new { message = "La contraseña debe tener al menos 6 caracteres" });

        var hash = HashToken(request.Token ?? string.Empty);
        var registro = _context.PasswordResetTokens.FirstOrDefault(t => t.TokenHash == hash);
        var ahora = DateTime.UtcNow;

        // Mismo mensaje para un token inventado, caducado o ya gastado: el
        // detalle no ayuda a quien no tiene el enlace.
        if (registro == null || !registro.EsUtilizable(ahora))
            return BadRequest(new { message = "El enlace ya no es válido. Pide uno nuevo." });

        var user = _context.Users.FirstOrDefault(u => u.Id == registro.UserId);
        if (user == null || !user.Activo)
            return BadRequest(new { message = "El enlace ya no es válido. Pide uno nuevo." });

        user.PasswordHash = HashPassword(request.NewPassword);
        // Ya eligió una contraseña suya: nada que forzar en el siguiente acceso.
        user.MustChangePassword = false;
        user.UpdatedAt = ahora;
        registro.UsedAt = ahora;
        _context.SaveChanges();

        return Ok(new { message = "Contraseña actualizada. Ya puedes iniciar sesión." });
    }

    private bool RevelarTokenEnRespuesta()
    {
        var configurado = _configuration["PasswordReset:RevealTokenInResponse"];
        if (bool.TryParse(configurado, out var valor)) return valor && _environment.IsDevelopment();

        return _environment.IsDevelopment();
    }

    /// <summary>Token de un solo uso, 32 bytes aleatorios en base64url.</summary>
    private static string GenerarToken()
    {
        var bytes = System.Security.Cryptography.RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    private static string HashToken(string token)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }

    private static UserDto ToDto(User user) => new()
    {
        Id = user.Id,
        Nombre = user.Nombre,
        Email = user.Email,
        CreatedAt = user.CreatedAt,
        Role = user.Role.ToString().ToLowerInvariant(),
        MustChangePassword = user.MustChangePassword
    };

    private string GenerateToken(User user)
    {
        // Mismo fallback que Program.cs; en producción la clave es obligatoria y se valida al arrancar.
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:Key"] ?? "dev-only-local-signing-key-do-not-use-in-production"));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("sub", user.Id),
            new Claim("email", user.Email),
            new Claim("nombre", user.Nombre),
            // El rol va firmado en el token: el cliente no puede falsearlo
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "finance-app",
            audience: _configuration["Jwt:Audience"] ?? "finance-app",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string NormalizeEmail(string? email) =>
        email?.Trim().ToLowerInvariant() ?? string.Empty;

    private string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    private bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
