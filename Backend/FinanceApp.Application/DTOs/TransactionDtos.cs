namespace FinanceApp.Application.DTOs;

public class CreateTransactionRequest
{
    public string CategoryId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string Kind { get; set; } = "expense";
}

public class TransactionDto
{
    public string Id { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Kind { get; set; } = string.Empty;
}

public class CategoryDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public bool Activo { get; set; }
}
