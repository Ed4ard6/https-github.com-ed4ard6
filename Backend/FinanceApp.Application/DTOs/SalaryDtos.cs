namespace FinanceApp.Application.DTOs;

public class SalaryDto
{
    public string Id { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
}

public class SaveSalaryRequest
{
    public decimal Amount { get; set; }
    public DateTime? Date { get; set; }
}
