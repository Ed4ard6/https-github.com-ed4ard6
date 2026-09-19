namespace FinanceApp.Application.DTOs;

public class BudgetDto
{
    public string Id { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryColor { get; set; } = string.Empty;
    public decimal Amount { get; set; }

    /// <summary>Gasto real registrado en esa categoría durante el mes</summary>
    public decimal Spent { get; set; }

    public int Month { get; set; }
    public int Year { get; set; }
}

public class SaveBudgetRequest
{
    public string CategoryId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
}
