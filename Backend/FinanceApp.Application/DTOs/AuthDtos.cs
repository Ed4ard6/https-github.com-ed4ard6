namespace FinanceApp.Application.DTOs;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    /// <summary>"user" o "admin"; el permiso real lo da el token, no esto</summary>
    public string Role { get; set; } = "user";

    public bool MustChangePassword { get; set; }
}

public class UpdateProfileRequest
{
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// La respuesta es siempre la misma, exista el email o no: así la pantalla de
/// "he olvidado mi contraseña" no sirve para averiguar quién tiene cuenta.
/// </summary>
public class ForgotPasswordResponse
{
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Sólo en desarrollo, y sólo si la configuración lo permite: el enlace
    /// de recuperación viene aquí para poder probar el flujo sin servidor de
    /// correo. En producción llega vacío.
    /// </summary>
    public string? ResetUrl { get; set; }

    public string? Token { get; set; }
}

public class ResetPasswordWithTokenRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
