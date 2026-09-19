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
        var user = _context.Users.FirstOrDefault(u => u.Email == request.Email);

        // Mismo mensaje en ambos casos: no revelar qué emails existen.
        if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Email o contraseña incorrectos" });

        var token = GenerateToken(user);
        return Ok(new AuthResponse
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Nombre = user.Nombre,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            }
        });
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            return BadRequest(new { message = "El nombre es obligatorio" });

        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            return BadRequest(new { message = "El email no es válido" });

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return BadRequest(new { message = "La contraseña debe tener al menos 6 caracteres" });

        if (_context.Users.Any(u => u.Email == request.Email))
            return BadRequest(new { message = "El email ya está registrado" });

        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Nombre = request.Nombre,
            Email = request.Email,
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
            User = new UserDto
            {
                Id = user.Id,
                Nombre = user.Nombre,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            }
        });
    }

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
            new Claim("nombre", user.Nombre)
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

    private string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    private bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
