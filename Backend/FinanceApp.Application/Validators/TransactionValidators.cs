using FluentValidation;
using FinanceApp.Application.DTOs;

namespace FinanceApp.Application.Validators;

public class CreateTransactionRequestValidator : AbstractValidator<CreateTransactionRequest>
{
    public CreateTransactionRequestValidator()
    {
        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Categoría es requerida");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Monto debe ser mayor a 0");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Descripción máximo 500 caracteres");

        RuleFor(x => x.Date)
            .LessThanOrEqualTo(DateTime.UtcNow).WithMessage("Fecha no puede ser futura");

        RuleFor(x => x.Kind)
            .Must(k => new[] { "income", "expense", "saving", "debt" }.Contains(k))
            .WithMessage("Tipo debe ser: income, expense, saving o debt");
    }
}
