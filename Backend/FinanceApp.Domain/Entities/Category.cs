namespace FinanceApp.Domain.Entities;

public enum CategoryKind
{
    Income,
    Expense,
    Debt,
    Saving
}

/// <summary>
/// Entidad Categoría - Categorización de transacciones
/// </summary>
public class Category
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public CategoryKind Kind { get; set; }
    public string Color { get; set; } = "#a78bfa";
    public string? ParentId { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Relaciones
    public User? User { get; set; }
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
