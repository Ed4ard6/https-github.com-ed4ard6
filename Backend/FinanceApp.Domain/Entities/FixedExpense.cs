namespace FinanceApp.Domain.Entities;

/// <summary>
/// Gasto fijo recurrente: un recibo que se repite cada mes el mismo día
/// (alquiler, internet, suscripciones). A diferencia del presupuesto, tiene
/// fecha de pago, y por eso el planificador sabe en qué quincena colocarlo.
/// </summary>
public class FixedExpense
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;

    /// <summary>Categoría a la que se imputa, opcional</summary>
    public string? CategoryId { get; set; }

    public string Nombre { get; set; } = string.Empty;
    public decimal Amount { get; set; }

    /// <summary>Día del mes en que se paga, de 1 a 31</summary>
    public int PaymentDay { get; set; }

    public bool Activo { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public Category? Category { get; set; }
}
