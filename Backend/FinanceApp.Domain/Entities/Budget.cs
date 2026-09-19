namespace FinanceApp.Domain.Entities;

/// <summary>
/// Entidad Presupuesto - Límite de gasto para una categoría en un mes concreto
/// </summary>
public class Budget
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;

    /// <summary>Importe máximo previsto para el mes</summary>
    public decimal Amount { get; set; }

    /// <summary>Mes del presupuesto, de 1 a 12</summary>
    public int Month { get; set; }

    public int Year { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public Category? Category { get; set; }
}
