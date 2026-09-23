namespace FinanceApp.Domain.Entities;

public enum AdminAction
{
    DeactivateUser,
    ActivateUser,
    ResetPassword,
    ChangeRole
}

/// <summary>
/// Deja rastro de cada acción de administración. Sin esto, tener un panel de
/// admin es tener una llave maestra que nadie sabe quién usó ni cuándo.
/// </summary>
public class AdminAuditLog
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>Administrador que realizó la acción</summary>
    public string AdminUserId { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;

    /// <summary>Cuenta afectada</summary>
    public string TargetUserId { get; set; } = string.Empty;
    public string TargetEmail { get; set; } = string.Empty;

    public AdminAction Action { get; set; }

    /// <summary>Detalle legible de lo ocurrido</summary>
    public string Details { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
