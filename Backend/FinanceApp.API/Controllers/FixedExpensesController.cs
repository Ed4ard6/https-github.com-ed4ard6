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
public class FixedExpensesController : ControllerBase
{
    private readonly FinanceDbContext _context;

    public FixedExpensesController(FinanceDbContext context)
    {
        _context = context;
    }

    private string GetUserId() =>
        User.FindFirst("sub")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? string.Empty;

    private FixedExpense? Find(string id)
    {
        var userId = GetUserId();
        return _context.FixedExpenses
            .Include(f => f.Category)
            .FirstOrDefault(f => f.Id == id && f.UserId == userId);
    }

    [HttpGet]
    public IActionResult GetFixedExpenses()
    {
        var userId = GetUserId();
        var expenses = _context.FixedExpenses
            .Include(f => f.Category)
            .Where(f => f.UserId == userId && f.Activo)
            .ToList()
            .OrderBy(f => f.PaymentDay);

        return Ok(expenses.Select(ToDto));
    }

    [HttpGet("{id}")]
    public IActionResult GetFixedExpense(string id)
    {
        var expense = Find(id);

        if (expense == null)
            return NotFound(new { message = "Gasto fijo no encontrado" });

        return Ok(ToDto(expense));
    }

    [HttpPost]
    public IActionResult CreateFixedExpense([FromBody] SaveFixedExpenseRequest request)
    {
        var userId = GetUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Usuario no identificado" });

        var error = Validate(request, userId);
        if (error != null)
            return BadRequest(new { message = error });

        var now = DateTime.UtcNow;
        var expense = new FixedExpense
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Nombre = request.Nombre.Trim(),
            Amount = request.Amount,
            PaymentDay = request.PaymentDay,
            CategoryId = string.IsNullOrWhiteSpace(request.CategoryId) ? null : request.CategoryId,
            Activo = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.FixedExpenses.Add(expense);
        _context.SaveChanges();

        _context.Entry(expense).Reference(f => f.Category).Load();

        return CreatedAtAction(nameof(GetFixedExpense), new { id = expense.Id }, ToDto(expense));
    }

    [HttpPut("{id}")]
    public IActionResult UpdateFixedExpense(string id, [FromBody] SaveFixedExpenseRequest request)
    {
        var expense = Find(id);

        if (expense == null)
            return NotFound(new { message = "Gasto fijo no encontrado" });

        var error = Validate(request, GetUserId());
        if (error != null)
            return BadRequest(new { message = error });

        expense.Nombre = request.Nombre.Trim();
        expense.Amount = request.Amount;
        expense.PaymentDay = request.PaymentDay;
        expense.CategoryId = string.IsNullOrWhiteSpace(request.CategoryId) ? null : request.CategoryId;
        expense.UpdatedAt = DateTime.UtcNow;
        _context.SaveChanges();

        _context.Entry(expense).Reference(f => f.Category).Load();

        return Ok(ToDto(expense));
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteFixedExpense(string id)
    {
        var expense = Find(id);

        if (expense == null)
            return NotFound(new { message = "Gasto fijo no encontrado" });

        expense.Activo = false;
        expense.UpdatedAt = DateTime.UtcNow;
        _context.SaveChanges();

        return NoContent();
    }

    private string? Validate(SaveFixedExpenseRequest request, string userId)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            return "El nombre es obligatorio";

        if (request.Amount <= 0)
            return "El importe debe ser mayor que cero";

        if (request.PaymentDay < 1 || request.PaymentDay > 31)
            return "El día de pago debe estar entre 1 y 31";

        if (!string.IsNullOrWhiteSpace(request.CategoryId))
        {
            var existe = _context.Categories.Any(c => c.Id == request.CategoryId && c.UserId == userId);
            if (!existe)
                return "La categoría no existe para este usuario";
        }

        return null;
    }

    private static FixedExpenseDto ToDto(FixedExpense expense) => new()
    {
        Id = expense.Id,
        Nombre = expense.Nombre,
        Amount = expense.Amount,
        PaymentDay = expense.PaymentDay,
        CategoryId = expense.CategoryId,
        CategoryName = expense.Category?.Nombre ?? string.Empty,
        Activo = expense.Activo
    };
}
