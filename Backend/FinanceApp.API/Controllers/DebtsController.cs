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
public class DebtsController : ControllerBase
{
    private readonly FinanceDbContext _context;

    public DebtsController(FinanceDbContext context)
    {
        _context = context;
    }

    private string GetUserId() =>
        User.FindFirst("sub")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? string.Empty;

    [HttpGet]
    public IActionResult GetDebts()
    {
        var debts = _context.Debts
            .Where(d => d.UserId == GetUserId() && d.Activo)
            .OrderByDescending(d => d.Balance)
            .ToList();

        return Ok(debts.Select(ToDto));
    }

    [HttpGet("{id}")]
    public IActionResult GetDebt(string id)
    {
        var debt = _context.Debts.FirstOrDefault(d => d.Id == id && d.UserId == GetUserId());

        if (debt == null)
            return NotFound(new { message = "Deuda no encontrada" });

        return Ok(ToDto(debt));
    }

    [HttpPost]
    public IActionResult CreateDebt([FromBody] SaveDebtRequest request)
    {
        var userId = GetUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Usuario no identificado" });

        var error = Validate(request);
        if (error != null)
            return BadRequest(new { message = error });

        var now = DateTime.UtcNow;
        var debt = new Debt
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Nombre = request.Nombre.Trim(),
            Balance = request.Balance,
            OriginalAmount = request.OriginalAmount > 0 ? request.OriginalAmount : request.Balance,
            AnnualRate = request.AnnualRate,
            MinimumPayment = request.MinimumPayment,
            PaymentDay = request.PaymentDay,
            Activo = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Debts.Add(debt);
        _context.SaveChanges();

        return CreatedAtAction(nameof(GetDebt), new { id = debt.Id }, ToDto(debt));
    }

    [HttpPut("{id}")]
    public IActionResult UpdateDebt(string id, [FromBody] SaveDebtRequest request)
    {
        var debt = _context.Debts.FirstOrDefault(d => d.Id == id && d.UserId == GetUserId());

        if (debt == null)
            return NotFound(new { message = "Deuda no encontrada" });

        var error = Validate(request);
        if (error != null)
            return BadRequest(new { message = error });

        debt.Nombre = request.Nombre.Trim();
        debt.Balance = request.Balance;
        debt.OriginalAmount = request.OriginalAmount > 0 ? request.OriginalAmount : debt.OriginalAmount;
        debt.AnnualRate = request.AnnualRate;
        debt.MinimumPayment = request.MinimumPayment;
        debt.PaymentDay = request.PaymentDay;
        debt.UpdatedAt = DateTime.UtcNow;
        _context.SaveChanges();

        return Ok(ToDto(debt));
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteDebt(string id)
    {
        var debt = _context.Debts.FirstOrDefault(d => d.Id == id && d.UserId == GetUserId());

        if (debt == null)
            return NotFound(new { message = "Deuda no encontrada" });

        debt.Activo = false;
        debt.UpdatedAt = DateTime.UtcNow;
        _context.SaveChanges();

        return NoContent();
    }

    private static string? Validate(SaveDebtRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            return "El nombre es obligatorio";

        if (request.Balance < 0)
            return "El saldo no puede ser negativo";

        if (request.AnnualRate < 0 || request.AnnualRate > 200)
            return "La tasa anual debe estar entre 0 y 200";

        if (request.MinimumPayment < 0)
            return "El pago mínimo no puede ser negativo";

        if (request.PaymentDay < 1 || request.PaymentDay > 31)
            return "El día de pago debe estar entre 1 y 31";

        return null;
    }

    private static DebtDto ToDto(Debt debt) => new()
    {
        Id = debt.Id,
        Nombre = debt.Nombre,
        Balance = debt.Balance,
        OriginalAmount = debt.OriginalAmount,
        AnnualRate = debt.AnnualRate,
        MinimumPayment = debt.MinimumPayment,
        PaymentDay = debt.PaymentDay,
        Activo = debt.Activo
    };
}
