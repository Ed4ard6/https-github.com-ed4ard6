using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;
using FinanceApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

    private string GetUserId() => User.FindFirst("sub")?.Value ?? string.Empty;

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

        if (!Enum.TryParse<CategoryKind>(request.Kind, true, out var kind))
            return BadRequest("Kind inválido");

        var category = new Category
        {
            UserId = userId,
            Nombre = request.Nombre,
            Kind = kind,
            Color = request.Color,
            Activo = request.Activo
        };

        _context.Categories.Add(category);
        _context.SaveChanges();

        return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, category);
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
