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
public class TransactionsController : ControllerBase
{
    private readonly FinanceDbContext _context;

    public TransactionsController(FinanceDbContext context)
    {
        _context = context;
    }

    private string GetUserId() => User.FindFirst("sub")?.Value ?? string.Empty;

    [HttpGet]
    public IActionResult GetTransactions()
    {
        var userId = GetUserId();
        var transactions = _context.Transactions
            .Where(t => t.UserId == userId)
            .Include(t => t.Category)
            .OrderByDescending(t => t.Date)
            .ToList();

        return Ok(transactions.Select(t => new TransactionDto
        {
            Id = t.Id,
            CategoryId = t.CategoryId,
            CategoryName = t.Category?.Nombre ?? "",
            Amount = t.Amount,
            Description = t.Description,
            Date = t.Date,
            Kind = t.Kind.ToString()
        }));
    }

    [HttpPost]
    public IActionResult CreateTransaction([FromBody] CreateTransactionRequest request)
    {
        var userId = GetUserId();

        if (!Enum.TryParse<TransactionKind>(request.Kind, true, out var kind))
            return BadRequest("Kind inválido");

        var transaction = new Transaction
        {
            UserId = userId,
            CategoryId = request.CategoryId,
            Amount = request.Amount,
            Description = request.Description,
            Date = request.Date,
            Kind = kind
        };

        _context.Transactions.Add(transaction);
        _context.SaveChanges();

        return CreatedAtAction(nameof(GetTransactions), new { id = transaction.Id }, transaction);
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteTransaction(string id)
    {
        var userId = GetUserId();
        var transaction = _context.Transactions.FirstOrDefault(t => t.Id == id && t.UserId == userId);

        if (transaction == null)
            return NotFound();

        _context.Transactions.Remove(transaction);
        _context.SaveChanges();

        return NoContent();
    }
}
