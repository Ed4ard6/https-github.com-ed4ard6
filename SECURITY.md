# Seguridad – Finance App

## Autenticación

- **JWT** firmado con clave simétrica, con validez de 24 horas.
- Contraseñas cifradas con **BCrypt**. Nunca se guardan en texto plano.
- En producción la API **no arranca** si `Jwt__Key` falta o tiene menos de 32 caracteres. La clave de `appsettings.Development.json` solo sirve para desarrollo local.

## Recuperación de contraseña

- Token de un solo uso con una validez de 30 minutos (`PasswordResetToken.UsedAt` y `ExpiresAt`).
- El token queda invalidado en cuanto se usa.

## Autorización y aislamiento de datos

- Todas las rutas financieras requieren un usuario autenticado.
- Cada consulta se filtra por el usuario del token: un usuario no puede leer ni modificar datos de otro.
- El panel de administración solo es accesible con rol `Admin` y gestiona cuentas (listar, activar o desactivar, restablecer contraseña y ver estadísticas) sin acceso a los datos financieros de los usuarios, y registra cada acción en `AdminAuditLog`.
- La cuenta de administrador se crea desde la configuración (`Admin__Email`, `Admin__Password`). Si no hay contraseña configurada, se genera una aleatoria. Para restablecerla existe el comando `--reset-admin-password`.

## Validación y acceso a datos

- La validación de entrada se hace en los controladores y en los formularios de Angular.
- Entity Framework Core usa consultas parametrizadas. No hay SQL construido a mano.

## Configuración

- **CORS:** en desarrollo se permite `localhost:4200`. En producción se leen los orígenes de `CORS_Origins`, separados por `;`.
- **Depuración:** los endpoints de `DebugController` solo responden en entorno de desarrollo.
- **Secretos:** los archivos de base de datos (`*.db`) y los `appsettings.*.json`, excepto el de desarrollo, están excluidos del repositorio.

## Variables de entorno en producción

```bash
ASPNETCORE_ENVIRONMENT=Production
Jwt__Key=<mínimo 32 caracteres aleatorios>
ConnectionStrings__DefaultConnection=Data Source=finance_app.db
CORS_Origins=https://tu-dominio.com
Admin__Email=<correo del administrador>
Admin__Password=<contraseña segura>
```

## Pendiente

- Limitar los intentos de inicio de sesión (*rate limiting*).
- Cabeceras HSTS y Content Security Policy.
