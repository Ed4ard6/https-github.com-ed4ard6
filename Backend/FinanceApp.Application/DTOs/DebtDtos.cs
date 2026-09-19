namespace FinanceApp.Application.DTOs;

public class DebtDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public decimal OriginalAmount { get; set; }
    public decimal AnnualRate { get; set; }
    public decimal MinimumPayment { get; set; }
    public int PaymentDay { get; set; }
    public bool Activo { get; set; }
}

public class SaveDebtRequest
{
    public string Nombre { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public decimal OriginalAmount { get; set; }
    public decimal AnnualRate { get; set; }
    public decimal MinimumPayment { get; set; }
    public int PaymentDay { get; set; } = 1;
}
