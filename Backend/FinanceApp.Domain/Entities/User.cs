namespace FinanceApp.Domain.Entities;

/// <summary>
/// Entidad Usuario - Representa un usuario del sistema
/// </summary>
public enum UserRole
{
    /// <summary>Usuario normal: solo ve y gestiona lo suyo</summary>
    User,

    /// <summary>
    /// Administra cuentas: alta, baja y reinicio de contraseña. No tiene
    /// acceso a las finanzas de nadie; para eso no existe endpoint.
    /// </summary>
    Admin
}

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.User;

    /// <summary>Una cuenta desactivada no puede iniciar sesión</summary>
    public bool Activo { get; set; } = true;

    /// <summary>Obliga a cambiar la contraseña en el próximo acceso</summary>
    public bool MustChangePassword { get; set; }

    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Relaciones
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<Salary> Salaries { get; set; } = new List<Salary>();
    public ICollection<Debt> Debts { get; set; } = new List<Debt>();
    public ICollection<Budget> Budgets { get; set; } = new List<Budget>();
    public ICollection<FixedExpense> FixedExpenses { get; set; } = new List<FixedExpense>();
    public ICollection<SavingsGoal> SavingsGoals { get; set; } = new List<SavingsGoal>();
}
