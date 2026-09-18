using FluentValidation;
using FinanceApp.Application.DTOs;

namespace FinanceApp.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email es requerido")
            .EmailAddress().WithMessage("Email debe ser válido");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Contraseña es requerida")
            .MinimumLength(6).WithMessage("Contraseña debe tener al menos 6 caracteres");
    }
}

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("Nombre es requerido")
            .MinimumLength(2).WithMessage("Nombre debe tener al menos 2 caracteres");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email es requerido")
            .EmailAddress().WithMessage("Email debe ser válido");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Contraseña es requerida")
            .MinimumLength(6).WithMessage("Contraseña debe tener al menos 6 caracteres")
            .Matches("[A-Z]").WithMessage("Contraseña debe contener mayúscula")
            .Matches("[0-9]").WithMessage("Contraseña debe contener número");
    }
}
