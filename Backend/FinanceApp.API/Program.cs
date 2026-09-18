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
var jwtKey = builder.Configuration["Jwt:Key"] ?? "super-secret-key";
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

// Seeding de datos (solo en desarrollo)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
    FinanceApp.API.Data.DataSeeder.SeedData(db);
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

