using FinanceApp.API.Data;
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
    private readonly FinanceDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(FinanceDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
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
