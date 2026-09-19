namespace FinanceApp.Domain.Entities;

/// <summary>
/// Entidad Deuda - Un préstamo o tarjeta que el usuario está pagando
/// </summary>
public class Debt
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;

    /// <summary>Saldo pendiente actual</summary>
    public decimal Balance { get; set; }

    /// <summary>Importe con el que nació la deuda</summary>
    public decimal OriginalAmount { get; set; }

    /// <summary>Tasa de interés anual en porcentaje (24.5 = 24,5%)</summary>
    public decimal AnnualRate { get; set; }

    public decimal MinimumPayment { get; set; }

    /// <summary>Día del mes en que se paga la cuota</summary>
    public int PaymentDay { get; set; }

    public bool Activo { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
