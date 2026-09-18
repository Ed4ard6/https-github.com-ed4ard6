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
public class CategoriesController : ControllerBase
{
    private readonly FinanceDbContext _context;

    public CategoriesController(FinanceDbContext context)
    {
        _context = context;
    }

    private string GetUserId() =>
        User.FindFirst("sub")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? string.Empty;

    [HttpGet]
    public IActionResult GetCategories()
    {
        var userId = GetUserId();
        var categories = _context.Categories
            .Where(c => c.UserId == userId && c.Activo)
            .ToList();

        return Ok(categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Nombre = c.Nombre,
            Kind = c.Kind.ToString(),
            Color = c.Color,
            Activo = c.Activo
        }));
    }

    [HttpPost]
    public IActionResult CreateCategory([FromBody] CategoryDto request)
    {
        var userId = GetUserId();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Usuario no identificado" });

        if (!Enum.TryParse<CategoryKind>(request.Kind, true, out var kind))
            return BadRequest(new { message = $"Tipo de categoría inválido: '{request.Kind}'" });

        var now = DateTime.UtcNow;
        var category = new Category
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Nombre = request.Nombre,
            Kind = kind,
            Color = request.Color,
            Activo = request.Activo,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Categories.Add(category);
        _context.SaveChanges();

        return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, new CategoryDto
        {
            Id = category.Id,
            Nombre = category.Nombre,
            Kind = category.Kind.ToString(),
            Color = category.Color,
            Activo = category.Activo
        });
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteCategory(string id)
    {
        var userId = GetUserId();
        var category = _context.Categories.FirstOrDefault(c => c.Id == id && c.UserId == userId);

        if (category == null)
            return NotFound();

        category.Activo = false;
        _context.SaveChanges();

        return NoContent();
    }
}
