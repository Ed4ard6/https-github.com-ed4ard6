namespace FinanceApp.Domain.Entities;

/// <summary>
/// Permiso de un solo uso para cambiar la contraseña sin conocer la anterior.
///
/// Sólo se guarda el hash del token, nunca el token en claro: si alguien lee
/// la base de datos no puede reutilizar un enlace pendiente, igual que pasa
/// con las contraseñas.
/// </summary>
public class PasswordResetToken
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;

    /// <summary>SHA-256 del token en claro, en hexadecimal.</summary>
    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    /// <summary>Se rellena al canjearlo; un token usado ya no vale.</summary>
    public DateTime? UsedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }

    public bool EsUtilizable(DateTime ahora) => UsedAt == null && ExpiresAt > ahora;
}
