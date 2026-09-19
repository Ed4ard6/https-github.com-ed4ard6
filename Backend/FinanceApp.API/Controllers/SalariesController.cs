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
public class SalariesController : ControllerBase
{
    private readonly FinanceDbContext _context;

    public SalariesController(FinanceDbContext context)
    {
        _context = context;
    }

    private string GetUserId() =>
        User.FindFirst("sub")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? string.Empty;

    [HttpGet]
    public IActionResult GetSalaries()
    {
        var userId = GetUserId();
        var salaries = _context.Salaries
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.Date)
            .ToList();

        return Ok(salaries.Select(ToDto));
    }

    /// <summary>Último salario registrado, que es el que se usa para planificar.</summary>
    [HttpGet("current")]
    public IActionResult GetCurrentSalary()
    {
        var userId = GetUserId();
        var salary = _context.Salaries
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.Date)
            .FirstOrDefault();

        if (salary == null)
            return NoContent();

        return Ok(ToDto(salary));
    }

    [HttpPost]
    public IActionResult SaveSalary([FromBody] SaveSalaryRequest request)
    {
        var userId = GetUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Usuario no identificado" });

        if (request.Amount <= 0)
            return BadRequest(new { message = "El salario debe ser mayor que cero" });

        var salary = new Salary
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Amount = request.Amount,
            Date = request.Date ?? DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.Salaries.Add(salary);
        _context.SaveChanges();

        return CreatedAtAction(nameof(GetCurrentSalary), ToDto(salary));
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteSalary(string id)
    {
        var userId = GetUserId();
        var salary = _context.Salaries.FirstOrDefault(s => s.Id == id && s.UserId == userId);

        if (salary == null)
            return NotFound(new { message = "Registro no encontrado" });

        _context.Salaries.Remove(salary);
        _context.SaveChanges();

        return NoContent();
    }

    private static SalaryDto ToDto(Salary salary) => new()
    {
        Id = salary.Id,
        Amount = salary.Amount,
        Date = salary.Date
    };
}
