using FinanceApp.Application.DTOs;
using FinanceApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinanceApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly FinanceDbContext _context;

    public UsersController(FinanceDbContext context)
    {
        _context = context;
    }

    private string GetUserId() =>
        User.FindFirst("sub")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? string.Empty;

    // EF no sabe traducir GetUserId() a SQL, así que se resuelve antes de consultar.
    private Domain.Entities.User? FindCurrentUser()
    {
        var userId = GetUserId();
        return _context.Users.FirstOrDefault(u => u.Id == userId);
    }

    [HttpGet("me")]
    public IActionResult GetProfile()
    {
        var user = FindCurrentUser();
        if (user == null)
            return NotFound(new { message = "Usuario no encontrado" });

        return Ok(ToDto(user));
    }

    [HttpPut("me")]
    public IActionResult UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var user = FindCurrentUser();
        if (user == null)
            return NotFound(new { message = "Usuario no encontrado" });

        var nombre = request.Nombre?.Trim() ?? string.Empty;
        var email = AuthController.NormalizeEmail(request.Email);

        if (string.IsNullOrWhiteSpace(nombre))
            return BadRequest(new { message = "El nombre es obligatorio" });

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            return BadRequest(new { message = "El email no es válido" });

        if (_context.Users.Any(u => u.Email == email && u.Id != user.Id))
            return BadRequest(new { message = "Ese email ya está en uso" });

        user.Nombre = nombre;
        user.Email = email;
        user.UpdatedAt = DateTime.UtcNow;
        _context.SaveChanges();

        return Ok(ToDto(user));
    }

    [HttpPut("me/password")]
    public IActionResult ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var user = FindCurrentUser();
        if (user == null)
            return NotFound(new { message = "Usuario no encontrado" });

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "La contraseña actual no es correcta" });

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(new { message = "La nueva contraseña debe tener al menos 6 caracteres" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        // Ya eligió una propia: deja de arrastrar la provisional del admin
        user.MustChangePassword = false;
        user.UpdatedAt = DateTime.UtcNow;
        _context.SaveChanges();

        return NoContent();
    }

    private static UserDto ToDto(Domain.Entities.User user) => new()
    {
        Id = user.Id,
        Nombre = user.Nombre,
        Email = user.Email,
        CreatedAt = user.CreatedAt
    };
}
