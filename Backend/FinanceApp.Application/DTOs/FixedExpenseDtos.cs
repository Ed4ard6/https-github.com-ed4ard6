namespace FinanceApp.Application.DTOs;

public class FixedExpenseDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int PaymentDay { get; set; }
    public bool SplitBetweenPaydays { get; set; }
    public string? CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public bool Activo { get; set; }
}

public class SaveFixedExpenseRequest
{
    public string Nombre { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int PaymentDay { get; set; } = 1;
    public bool SplitBetweenPaydays { get; set; }
    public string? CategoryId { get; set; }
}
