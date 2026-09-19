namespace FinanceApp.Domain.Entities;

/// <summary>
/// Meta de ahorro con importe objetivo y fecha límite. Lo aportado no se
/// guarda aquí: se calcula sumando las transacciones de ahorro asociadas,
/// para que meta y movimientos no puedan descuadrarse.
/// </summary>
public class SavingsGoal
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;

    public string Nombre { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }

    /// <summary>Fecha en la que se quiere tener reunido el importe</summary>
    public DateTime TargetDate { get; set; }

    /// <summary>Lo ya reunido antes de empezar a registrarlo en la app</summary>
    public decimal InitialAmount { get; set; }

    public bool Activo { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
