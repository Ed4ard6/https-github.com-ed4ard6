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

    /// <summary>Si ya se registró el pago de este recibo en el mes en curso</summary>
    public bool PaidThisMonth { get; set; }
}

public class PayFixedExpenseRequest
{
    /// <summary>Importe real pagado; si no se indica, se usa el del recibo</summary>
    public decimal? Amount { get; set; }
    public DateTime? Date { get; set; }
}

public class SaveFixedExpenseRequest
{
    public string Nombre { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int PaymentDay { get; set; } = 1;
    public bool SplitBetweenPaydays { get; set; }
    public string? CategoryId { get; set; }
}
