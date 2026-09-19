using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;
using FinanceApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FinanceApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BudgetsController : ControllerBase
{
    private readonly FinanceDbContext _context;

    public BudgetsController(FinanceDbContext context)
    {
        _context = context;
    }

    private string GetUserId() =>
        User.FindFirst("sub")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? string.Empty;

    [HttpGet]
    public IActionResult GetBudgets([FromQuery] int? month, [FromQuery] int? year)
    {
        var userId = GetUserId();
        var now = DateTime.UtcNow;
        var mes = month ?? now.Month;
        var anio = year ?? now.Year;

        var budgets = _context.Budgets
            .Include(b => b.Category)
            .Where(b => b.UserId == userId && b.Month == mes && b.Year == anio)
            .ToList();

        var gastado = GastoPorCategoria(userId, mes, anio);

        return Ok(budgets
            .Select(b => ToDto(b, gastado.GetValueOrDefault(b.CategoryId)))
            .OrderByDescending(b => b.Amount));
    }

    [HttpGet("{id}")]
    public IActionResult GetBudget(string id)
    {
        var userId = GetUserId();
        var budget = _context.Budgets
            .Include(b => b.Category)
            .FirstOrDefault(b => b.Id == id && b.UserId == userId);

        if (budget == null)
            return NotFound(new { message = "Presupuesto no encontrado" });

        var gastado = GastoPorCategoria(userId, budget.Month, budget.Year);
        return Ok(ToDto(budget, gastado.GetValueOrDefault(budget.CategoryId)));
    }

    [HttpPost]
    public IActionResult CreateBudget([FromBody] SaveBudgetRequest request)
    {
        var userId = GetUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Usuario no identificado" });

        var error = Validate(request, userId);
        if (error != null)
            return BadRequest(new { message = error });

        var yaExiste = _context.Budgets.Any(b =>
            b.UserId == userId &&
            b.CategoryId == request.CategoryId &&
            b.Month == request.Month &&
            b.Year == request.Year);

        if (yaExiste)
            return BadRequest(new { message = "Ya existe un presupuesto para esa categoría en ese mes" });

        var now = DateTime.UtcNow;
        var budget = new Budget
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            CategoryId = request.CategoryId,
            Amount = request.Amount,
            Month = request.Month,
            Year = request.Year,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Budgets.Add(budget);
        _context.SaveChanges();

        _context.Entry(budget).Reference(b => b.Category).Load();
        var gastado = GastoPorCategoria(userId, budget.Month, budget.Year);

        return CreatedAtAction(nameof(GetBudget), new { id = budget.Id },
            ToDto(budget, gastado.GetValueOrDefault(budget.CategoryId)));
    }

    [HttpPut("{id}")]
    public IActionResult UpdateBudget(string id, [FromBody] SaveBudgetRequest request)
    {
        var userId = GetUserId();
        var budget = _context.Budgets.FirstOrDefault(b => b.Id == id && b.UserId == userId);

        if (budget == null)
            return NotFound(new { message = "Presupuesto no encontrado" });

        var error = Validate(request, userId);
        if (error != null)
            return BadRequest(new { message = error });

        budget.CategoryId = request.CategoryId;
        budget.Amount = request.Amount;
        budget.Month = request.Month;
        budget.Year = request.Year;
        budget.UpdatedAt = DateTime.UtcNow;
        _context.SaveChanges();

        _context.Entry(budget).Reference(b => b.Category).Load();
        var gastado = GastoPorCategoria(userId, budget.Month, budget.Year);

        return Ok(ToDto(budget, gastado.GetValueOrDefault(budget.CategoryId)));
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteBudget(string id)
    {
        var userId = GetUserId();
        var budget = _context.Budgets.FirstOrDefault(b => b.Id == id && b.UserId == userId);

        if (budget == null)
            return NotFound(new { message = "Presupuesto no encontrado" });

        _context.Budgets.Remove(budget);
        _context.SaveChanges();

        return NoContent();
    }

    /// <summary>
    /// Gasto real del mes agrupado por categoría. Se suma en memoria porque
    /// SQLite guarda decimal como texto y no lo agrega bien en SQL.
    /// </summary>
    private Dictionary<string, decimal> GastoPorCategoria(string userId, int mes, int anio)
    {
        return _context.Transactions
            .Where(t => t.UserId == userId
                        && t.Date.Year == anio
                        && t.Date.Month == mes
                        && (t.Kind == TransactionKind.Expense || t.Kind == TransactionKind.Debt))
            .ToList()
            .GroupBy(t => t.CategoryId)
            .ToDictionary(g => g.Key, g => g.Sum(t => Math.Abs(t.Amount)));
    }

    private string? Validate(SaveBudgetRequest request, string userId)
    {
        if (request.Amount <= 0)
            return "El importe debe ser mayor que cero";

        if (request.Month < 1 || request.Month > 12)
            return "El mes debe estar entre 1 y 12";

        if (request.Year < 2000 || request.Year > 2100)
            return "El año no es válido";

        var categoriaValida = _context.Categories
            .Any(c => c.Id == request.CategoryId && c.UserId == userId);

        if (!categoriaValida)
            return "La categoría no existe para este usuario";

        return null;
    }

    private static BudgetDto ToDto(Budget budget, decimal spent) => new()
    {
        Id = budget.Id,
        CategoryId = budget.CategoryId,
        CategoryName = budget.Category?.Nombre ?? string.Empty,
        CategoryColor = budget.Category?.Color ?? string.Empty,
        Amount = budget.Amount,
        Spent = spent,
        Month = budget.Month,
        Year = budget.Year
    };
}
