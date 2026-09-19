namespace FinanceApp.Application.DTOs;

public class SavingsGoalDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public DateTime TargetDate { get; set; }

    /// <summary>Aporte inicial más todo lo aportado desde la app</summary>
    public decimal CurrentAmount { get; set; }

    public decimal Remaining { get; set; }
    public decimal ProgressPercentage { get; set; }

    /// <summary>Meses que faltan hasta la fecha límite; 0 si ya venció</summary>
    public int MonthsLeft { get; set; }

    /// <summary>Cuánto habría que apartar cada mes para llegar a tiempo</summary>
    public decimal MonthlyTarget { get; set; }

    /// <summary>Lo aportado en el mes en curso</summary>
    public decimal SavedThisMonth { get; set; }

    public bool OnTrack { get; set; }
    public bool Completed { get; set; }
    public bool Overdue { get; set; }
}

public class SaveSavingsGoalRequest
{
    public string Nombre { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public DateTime TargetDate { get; set; }
    public decimal InitialAmount { get; set; }
}

public class AddContributionRequest
{
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public DateTime? Date { get; set; }
}
