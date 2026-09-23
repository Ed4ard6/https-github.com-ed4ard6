using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;
using FinanceApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Security.Cryptography;

namespace FinanceApp.API.Controllers;

/// <summary>
/// Panel de administración de cuentas.
///
/// Deliberadamente no expone nada financiero: no hay forma de leer las
/// transacciones, deudas ni ahorros de otra persona. El administrador
/// gestiona el acceso, no el dinero. Cada acción queda auditada.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = nameof(UserRole.Admin))]
public class AdminController : ControllerBase
{
    private readonly FinanceDbContext _context;

    public AdminController(FinanceDbContext context)
    {
        _context = context;
    }

    private string GetUserId() =>
        User.FindFirst("sub")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? string.Empty;

    [HttpGet("users")]
    public IActionResult GetUsers()
    {
        var users = _context.Users.ToList();

        var conteos = _context.Transactions
            .GroupBy(t => t.UserId)
            .Select(g => new { UserId = g.Key, Total = g.Count() })
            .ToDictionary(x => x.UserId, x => x.Total);

        return Ok(users
            .Select(u => ToDto(u, conteos.GetValueOrDefault(u.Id)))
            .OrderByDescending(u => u.CreatedAt));
    }

    [HttpGet("stats")]
    public IActionResult GetStats()
    {
        var users = _context.Users.ToList();
        var hace30Dias = DateTime.UtcNow.AddDays(-30);

        return Ok(new AdminStatsDto
        {
            TotalUsers = users.Count,
            ActiveUsers = users.Count(u => u.Activo),
            Admins = users.Count(u => u.Role == UserRole.Admin),
            ActiveLast30Days = users.Count(u => u.LastLoginAt >= hace30Dias),
            TotalTransactions = _context.Transactions.Count()
        });
    }

    [HttpPut("users/{id}/status")]
    public IActionResult SetUserStatus(string id, [FromBody] SetUserStatusRequest request)
    {
        var adminId = GetUserId();

        // Desactivarse a uno mismo dejaría el panel sin dueño
        if (id == adminId)
            return BadRequest(new { message = "No puedes desactivar tu propia cuenta" });

        var user = _context.Users.FirstOrDefault(u => u.Id == id);
        if (user == null)
            return NotFound(new { message = "Usuario no encontrado" });

        if (user.Activo == request.Activo)
            return Ok(ToDto(user, CuentaTransacciones(user.Id)));

        // Quedarse sin ningún administrador activo bloquearía el panel
        if (!request.Activo && user.Role == UserRole.Admin && AdminsActivos() <= 1)
            return BadRequest(new { message = "Debe quedar al menos un administrador activo" });

        user.Activo = request.Activo;
        user.UpdatedAt = DateTime.UtcNow;

        Auditar(user, request.Activo ? AdminAction.ActivateUser : AdminAction.DeactivateUser,
            request.Activo ? "Cuenta reactivada" : "Cuenta desactivada");

        _context.SaveChanges();

        return Ok(ToDto(user, CuentaTransacciones(user.Id)));
    }

    /// <summary>
    /// Genera una contraseña provisional. No devuelve la anterior porque no
    /// existe: solo se guarda su hash, que es irreversible.
    /// </summary>
    [HttpPost("users/{id}/reset-password")]
    public IActionResult ResetPassword(string id)
    {
        var user = _context.Users.FirstOrDefault(u => u.Id == id);
        if (user == null)
            return NotFound(new { message = "Usuario no encontrado" });

        var temporal = GenerarPasswordTemporal();

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(temporal);
        user.MustChangePassword = true;
        user.UpdatedAt = DateTime.UtcNow;

        Auditar(user, AdminAction.ResetPassword, "Contraseña restablecida por un administrador");

        _context.SaveChanges();

        return Ok(new ResetPasswordResponse { TemporaryPassword = temporal });
    }

    [HttpGet("audit")]
    public IActionResult GetAuditLog()
    {
        var logs = _context.AdminAuditLogs
            .OrderByDescending(a => a.CreatedAt)
            .Take(100)
            .ToList();

        return Ok(logs.Select(a => new AdminAuditLogDto
        {
            Id = a.Id,
            AdminEmail = a.AdminEmail,
            TargetEmail = a.TargetEmail,
            Action = a.Action.ToString(),
            Details = a.Details,
            CreatedAt = a.CreatedAt
        }));
    }

    private void Auditar(User target, AdminAction action, string details)
    {
        var adminId = GetUserId();
        var admin = _context.Users.FirstOrDefault(u => u.Id == adminId);

        _context.AdminAuditLogs.Add(new AdminAuditLog
        {
            Id = Guid.NewGuid().ToString(),
            AdminUserId = adminId,
            AdminEmail = admin?.Email ?? "desconocido",
            TargetUserId = target.Id,
            TargetEmail = target.Email,
            Action = action,
            Details = details,
            CreatedAt = DateTime.UtcNow
        });
    }

    private int AdminsActivos() =>
        _context.Users.Count(u => u.Role == UserRole.Admin && u.Activo);

    private int CuentaTransacciones(string userId) =>
        _context.Transactions.Count(t => t.UserId == userId);

    /// <summary>Contraseña aleatoria con generador criptográfico, no con Random.</summary>
    private static string GenerarPasswordTemporal()
    {
        const string alfabeto = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var bytes = RandomNumberGenerator.GetBytes(12);

        return new string(bytes.Select(b => alfabeto[b % alfabeto.Length]).ToArray());
    }

    private static AdminUserDto ToDto(User user, int transactionCount) => new()
    {
        Id = user.Id,
        Nombre = user.Nombre,
        Email = user.Email,
        Role = user.Role.ToString().ToLowerInvariant(),
        Activo = user.Activo,
        MustChangePassword = user.MustChangePassword,
        CreatedAt = user.CreatedAt,
        LastLoginAt = user.LastLoginAt,
        TransactionCount = transactionCount
    };
}
