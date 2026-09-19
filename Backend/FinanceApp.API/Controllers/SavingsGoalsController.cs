using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;
using FinanceApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinanceApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SavingsGoalsController : ControllerBase
{
    private readonly FinanceDbContext _context;

    public SavingsGoalsController(FinanceDbContext context)
    {
        _context = context;
    }

    private string GetUserId() =>
        User.FindFirst("sub")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? string.Empty;

    private SavingsGoal? Find(string id)
    {
        var userId = GetUserId();
        return _context.SavingsGoals.FirstOrDefault(g => g.Id == id && g.UserId == userId);
    }

    [HttpGet]
    public IActionResult GetGoals()
    {
        var userId = GetUserId();
        var goals = _context.SavingsGoals
            .Where(g => g.UserId == userId && g.Activo)
            .ToList()
            .OrderBy(g => g.TargetDate);

        return Ok(goals.Select(g => ToDto(g, AportesDe(g.Id))));
    }

    [HttpGet("{id}")]
    public IActionResult GetGoal(string id)
    {
        var goal = Find(id);

        if (goal == null)
            return NotFound(new { message = "Meta no encontrada" });

        return Ok(ToDto(goal, AportesDe(goal.Id)));
    }

    [HttpPost]
    public IActionResult CreateGoal([FromBody] SaveSavingsGoalRequest request)
    {
        var userId = GetUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Usuario no identificado" });

        var error = Validate(request);
        if (error != null)
            return BadRequest(new { message = error });

        var now = DateTime.UtcNow;
        var goal = new SavingsGoal
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Nombre = request.Nombre.Trim(),
            TargetAmount = request.TargetAmount,
            TargetDate = request.TargetDate,
            InitialAmount = Math.Max(0, request.InitialAmount),
            Activo = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.SavingsGoals.Add(goal);
        _context.SaveChanges();

        return CreatedAtAction(nameof(GetGoal), new { id = goal.Id }, ToDto(goal, new List<Transaction>()));
    }

    [HttpPut("{id}")]
    public IActionResult UpdateGoal(string id, [FromBody] SaveSavingsGoalRequest request)
    {
        var goal = Find(id);

        if (goal == null)
            return NotFound(new { message = "Meta no encontrada" });

        var error = Validate(request);
        if (error != null)
            return BadRequest(new { message = error });

        goal.Nombre = request.Nombre.Trim();
        goal.TargetAmount = request.TargetAmount;
        goal.TargetDate = request.TargetDate;
        goal.InitialAmount = Math.Max(0, request.InitialAmount);
        goal.UpdatedAt = DateTime.UtcNow;
        _context.SaveChanges();

        return Ok(ToDto(goal, AportesDe(goal.Id)));
    }

    /// <summary>
    /// Registra un aporte. Crea una transacción de ahorro vinculada a la meta,
    /// para que el dinero apartado aparezca también en el resto de la app.
    /// </summary>
    [HttpPost("{id}/contributions")]
    public IActionResult AddContribution(string id, [FromBody] AddContributionRequest request)
    {
        var userId = GetUserId();
        var goal = Find(id);

        if (goal == null)
            return NotFound(new { message = "Meta no encontrada" });

        if (request.Amount <= 0)
            return BadRequest(new { message = "El aporte debe ser mayor que cero" });

        var categoria = _context.Categories
            .FirstOrDefault(c => c.UserId == userId && c.Kind == CategoryKind.Saving && c.Activo);

        if (categoria == null)
            return BadRequest(new { message = "Necesitas una categoría de tipo ahorro para registrar aportes" });

        var now = DateTime.UtcNow;
        var transaction = new Transaction
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            CategoryId = categoria.Id,
            SavingsGoalId = goal.Id,
            Amount = request.Amount,
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? $"Aporte a {goal.Nombre}"
                : request.Description.Trim(),
            Date = request.Date ?? now,
            Kind = TransactionKind.Saving,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Transactions.Add(transaction);
        _context.SaveChanges();

        return Ok(ToDto(goal, AportesDe(goal.Id)));
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteGoal(string id)
    {
        var goal = Find(id);

        if (goal == null)
            return NotFound(new { message = "Meta no encontrada" });

        goal.Activo = false;
        goal.UpdatedAt = DateTime.UtcNow;
        _context.SaveChanges();

        return NoContent();
    }

    private List<Transaction> AportesDe(string goalId) =>
        _context.Transactions.Where(t => t.SavingsGoalId == goalId).ToList();

    private static string? Validate(SaveSavingsGoalRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            return "El nombre es obligatorio";

        if (request.TargetAmount <= 0)
            return "El objetivo debe ser mayor que cero";

        if (request.TargetDate == default)
            return "La fecha límite es obligatoria";

        return null;
    }

    private static SavingsGoalDto ToDto(SavingsGoal goal, List<Transaction> aportes)
    {
        var now = DateTime.UtcNow;

        var aportado = aportes.Sum(t => Math.Abs(t.Amount));
        var current = goal.InitialAmount + aportado;
        var remaining = Math.Max(0, goal.TargetAmount - current);
        var completed = current >= goal.TargetAmount;

        // Se cuenta el mes en curso, por eso el +1.
        var monthsLeft = Math.Max(0,
            ((goal.TargetDate.Year - now.Year) * 12) + goal.TargetDate.Month - now.Month + 1);

        var savedThisMonth = aportes
            .Where(t => t.Date.Year == now.Year && t.Date.Month == now.Month)
            .Sum(t => Math.Abs(t.Amount));

        var monthlyTarget = monthsLeft > 0 ? remaining / monthsLeft : remaining;

        return new SavingsGoalDto
        {
            Id = goal.Id,
            Nombre = goal.Nombre,
            TargetAmount = goal.TargetAmount,
            TargetDate = goal.TargetDate,
            CurrentAmount = current,
            Remaining = remaining,
            ProgressPercentage = goal.TargetAmount > 0
                ? Math.Min(100, current / goal.TargetAmount * 100)
                : 0,
            MonthsLeft = monthsLeft,
            MonthlyTarget = monthlyTarget,
            SavedThisMonth = savedThisMonth,
            OnTrack = completed || savedThisMonth >= monthlyTarget,
            Completed = completed,
            Overdue = !completed && goal.TargetDate.Date < now.Date
        };
    }
}
