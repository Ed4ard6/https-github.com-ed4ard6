namespace FinanceApp.Application.DTOs;

/// <summary>
/// Ficha de cuenta para el panel de administración. A propósito no incluye
/// nada financiero: el administrador gestiona accesos, no mira el dinero
/// de los demás.
/// </summary>
public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "user";
    public bool Activo { get; set; }
    public bool MustChangePassword { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    /// <summary>Cuántos movimientos tiene, como señal de uso. Sin importes.</summary>
    public int TransactionCount { get; set; }
}

public class AdminStatsDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int Admins { get; set; }

    /// <summary>Cuentas con algún acceso en los últimos 30 días</summary>
    public int ActiveLast30Days { get; set; }

    public int TotalTransactions { get; set; }
}

public class SetUserStatusRequest
{
    public bool Activo { get; set; }
}

public class ResetPasswordResponse
{
    /// <summary>
    /// Contraseña provisional que el administrador entrega al usuario. Se
    /// muestra una sola vez: después solo queda su hash.
    /// </summary>
    public string TemporaryPassword { get; set; } = string.Empty;
}

public class AdminAuditLogDto
{
    public string Id { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string TargetEmail { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
