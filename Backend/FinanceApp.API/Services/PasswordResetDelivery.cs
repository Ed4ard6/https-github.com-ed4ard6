namespace FinanceApp.API.Services;

/// <summary>
/// Cómo llega al usuario el enlace de recuperación. Se deja detrás de una
/// interfaz porque hoy no hay servidor de correo: la implementación actual lo
/// escribe en el log, y el día que haya SMTP basta con registrar otra sin
/// tocar el controlador.
/// </summary>
public interface IPasswordResetDelivery
{
    void Enviar(string email, string resetUrl, TimeSpan validez);
}

public class LogPasswordResetDelivery : IPasswordResetDelivery
{
    private readonly ILogger<LogPasswordResetDelivery> _logger;

    public LogPasswordResetDelivery(ILogger<LogPasswordResetDelivery> logger)
    {
        _logger = logger;
    }

    public void Enviar(string email, string resetUrl, TimeSpan validez)
    {
        // Nivel warning a propósito: tiene que verse en la terminal sin
        // tener que subir el nivel de log.
        _logger.LogWarning(
            "Recuperación de contraseña para {Email}. Enlace válido {Minutos} minutos:\n{Url}",
            email, (int)validez.TotalMinutes, resetUrl);
    }
}
