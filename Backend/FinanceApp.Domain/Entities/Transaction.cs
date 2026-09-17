namespace FinanceApp.Domain.Entities;

public enum TransactionKind
{
    Income,
    Expense,
    Debt,
    Saving
}

/// <summary>
/// Entidad Transacción - Ingresos, gastos, deudas, ahorros
/// </summary>
public class Transaction
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public TransactionKind Kind { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Relaciones
    public User? User { get; set; }
    public Category? Category { get; set; }
}
