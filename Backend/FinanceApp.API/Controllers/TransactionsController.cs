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
public class TransactionsController : ControllerBase
{
    private readonly FinanceDbContext _context;

    public TransactionsController(FinanceDbContext context)
    {
        _context = context;
    }

    private string GetUserId() =>
        User.FindFirst("sub")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? string.Empty;

    [HttpGet]
    public IActionResult GetTransactions()
    {
        var userId = GetUserId();
        var transactions = _context.Transactions
            .Where(t => t.UserId == userId)
            .Include(t => t.Category)
            .OrderByDescending(t => t.Date)
            .ToList();

        return Ok(transactions.Select(t => ToDto(t, t.Category?.Nombre ?? string.Empty)));
    }

    [HttpPost]
    public IActionResult CreateTransaction([FromBody] CreateTransactionRequest request)
    {
        try
        {
            var userId = GetUserId();

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("Usuario no identificado");

            if (!Enum.TryParse<TransactionKind>(request.Kind, true, out var kind))
                return BadRequest(new { message = $"Tipo de transacción inválido: '{request.Kind}'" });

            var category = _context.Categories.FirstOrDefault(c => c.Id == request.CategoryId && c.UserId == userId);
            if (category == null)
                return BadRequest(new { message = $"La categoría '{request.CategoryId}' no existe para este usuario" });

            var transaction = new Transaction
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                CategoryId = request.CategoryId,
                Amount = request.Amount,
                Description = request.Description?.Trim() ?? string.Empty,
                Date = request.Date,
                Kind = kind,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Transactions.Add(transaction);
            _context.SaveChanges();

            // Devolver la entidad serializaría Category -> Transactions -> Category en ciclo.
            return CreatedAtAction(nameof(GetTransaction), new { id = transaction.Id }, ToDto(transaction, category.Nombre));
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error creating transaction: {ex.Message}");
            return StatusCode(500, new { message = $"Error interno: {ex.Message}" });
        }
    }

    [HttpGet("{id}")]
    public IActionResult GetTransaction(string id)
    {
        var userId = GetUserId();
        var transaction = _context.Transactions
            .Include(t => t.Category)
            .FirstOrDefault(t => t.Id == id && t.UserId == userId);

        if (transaction == null)
            return NotFound(new { message = "Transacción no encontrada" });

        return Ok(ToDto(transaction, transaction.Category?.Nombre ?? string.Empty));
    }

    [HttpPut("{id}")]
    public IActionResult UpdateTransaction(string id, [FromBody] CreateTransactionRequest request)
    {
        var userId = GetUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Usuario no identificado" });

        var transaction = _context.Transactions.FirstOrDefault(t => t.Id == id && t.UserId == userId);
        if (transaction == null)
            return NotFound(new { message = "Transacción no encontrada" });

        if (!Enum.TryParse<TransactionKind>(request.Kind, true, out var kind))
            return BadRequest(new { message = $"Tipo de transacción inválido: '{request.Kind}'" });

        var category = _context.Categories.FirstOrDefault(c => c.Id == request.CategoryId && c.UserId == userId);
        if (category == null)
            return BadRequest(new { message = $"La categoría '{request.CategoryId}' no existe para este usuario" });

        transaction.CategoryId = request.CategoryId;
        transaction.Amount = request.Amount;
        transaction.Description = request.Description?.Trim() ?? string.Empty;
        transaction.Date = request.Date;
        transaction.Kind = kind;
        transaction.UpdatedAt = DateTime.UtcNow;
        _context.SaveChanges();

        return Ok(ToDto(transaction, category.Nombre));
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

    private static TransactionDto ToDto(Transaction transaction, string categoryName) => new()
    {
        Id = transaction.Id,
        CategoryId = transaction.CategoryId,
        CategoryName = categoryName,
        Amount = transaction.Amount,
        Description = transaction.Description,
        Date = transaction.Date,
        Kind = transaction.Kind.ToString().ToLowerInvariant()
    };
}
