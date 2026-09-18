using Microsoft.AspNetCore.Mvc;
using FinanceApp.Infrastructure.Data;

namespace FinanceApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DebugController : ControllerBase
{
    private readonly FinanceDbContext _context;

    public DebugController(FinanceDbContext context)
    {
        _context = context;
    }

    [HttpGet("users")]
    public IActionResult GetUsers()
    {
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
