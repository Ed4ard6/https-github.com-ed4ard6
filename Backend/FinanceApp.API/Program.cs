using FinanceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

// Sin esto, .NET renombra el claim "sub" a ClaimTypes.NameIdentifier
// y User.FindFirst("sub") devuelve null en los controllers.
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

var builder = WebApplication.CreateBuilder(args);

// Agregar servicios
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Entity Framework Core con SQLite
builder.Services.AddDbContext<FinanceDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// JWT Authentication
// Fuera de desarrollo la clave llega por variable de entorno (Jwt__Key).
// Arrancar con una clave por defecto permitiría a cualquiera forjar tokens.
var jwtKey = builder.Configuration["Jwt:Key"];
if (!builder.Environment.IsDevelopment() && (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32))
{
    throw new InvalidOperationException(
        "Falta Jwt:Key o es demasiado corta. Define la variable de entorno Jwt__Key con al menos 32 caracteres.");
}
jwtKey ??= "dev-only-local-signing-key-do-not-use-in-production";

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "finance-app";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "finance-app";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// CORS - Restrict to environment
builder.Services.AddCors(options =>
{
    var corsOrigins = builder.Configuration["CORS_Origins"]?.Split(';')
        ?? new[] { "http://localhost:4200", "https://localhost:4200" };

    options.AddPolicy("AllowAngular", policyBuilder =>
    {
        policyBuilder
            .WithOrigins(corsOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Seed");

    // Sin esto, una tabla nueva no llega a una base de datos ya creada.
    db.Database.Migrate();
    FinanceApp.API.Data.DataSeeder.SeedData(db);

    // La cuenta de administración se crea aparte de la de demostración, con
    // la contraseña que diga la configuración o una generada al vuelo.
    FinanceApp.API.Data.DataSeeder.EnsureAdminExists(
        db,
        builder.Configuration["Admin:Email"],
        builder.Configuration["Admin:Password"],
        mensaje => logger.LogWarning("{Mensaje}", mensaje));
}

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngular");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

