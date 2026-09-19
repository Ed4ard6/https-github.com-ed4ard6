using Microsoft.AspNetCore.Mvc;
using FinanceApp.Infrastructure.Data;

namespace FinanceApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DebugController : ControllerBase
{
    private readonly FinanceDbContext _context;
    private readonly IWebHostEnvironment _env;

    public DebugController(FinanceDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    // Expone datos de todos los usuarios: fuera de desarrollo no debe existir.
    private bool IsAvailable => _env.IsDevelopment();

    [HttpGet("users")]
    public IActionResult GetUsers()
    {
        if (!IsAvailable) return NotFound();

        var users = _context.Users.Select(u => new
        {
            u.Id,
            u.Nombre,
            u.Email,
            u.CreatedAt
        }).ToList();

        return Ok(users);
    }

    [HttpGet("categories")]
    public IActionResult GetCategories()
    {
        if (!IsAvailable) return NotFound();

        var categories = _context.Categories.Select(c => new
        {
            c.Id,
            c.Nombre,
            c.Kind,
            c.UserId
        }).ToList();

        return Ok(categories);
    }
}
