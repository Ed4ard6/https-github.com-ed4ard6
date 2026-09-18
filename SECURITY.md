# 🔒 Guía de Seguridad & Validación - Finance App

## Cambios Implementados

### ✅ Backend Security

#### 1. **JWT Key en Producción**
- En `appsettings.Development.json`: usa default para desarrollo
- En `appsettings.Production.json`: lee de variable `JWT_KEY`
- **Importante**: NUNCA usar default key en producción

#### 2. **CORS Restriction**
- En desarrollo: `http://localhost:4200`, `https://localhost:4200`
- En producción: lee de variable `CORS_Origins` (semicolon-separated)
- Ejemplo: `https://myapp.com;https://www.myapp.com`

#### 3. **Input Validation con FluentValidation**
- `LoginRequestValidator`: Email format + password minLength(6)
- `RegisterRequestValidator`: Email + strong password (mayús + número)
- `CreateTransactionRequestValidator`: Monto > 0, Kind validation, Date not future
- ValidationFilter aplica automáticamente en todos los Controllers

#### 4. **SQL Injection Prevention**
- Entity Framework Core usa parametrized queries (automático)
- No hay SQL strings manualmente construidas

---

## Variables de Entorno - Producción

### Backend (Railway/Render/Docker)

```bash
# REQUIRED
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:5001
JWT__KEY=tu-key-super-secreto-minimo-32-caracteres-aqui
JWT__ISSUER=finance-app
JWT__AUDIENCE=finance-app
ConnectionStrings__DefaultConnection=Data Source=finance_app.db

# CORS (semicolon-separated)
CORS_Origins=https://yourdomain.com;https://www.yourdomain.com

# Logging
Logging__LogLevel__Default=Information
Logging__LogLevel__Microsoft.AspNetCore=Warning
```

### Frontend (Railway/Render)

```bash
# No special env vars needed - API URL detectado automáticamente
# El frontend hace request a: {protocol}://{host}/api
```

---

## Ejemplos Railway Deployment

### Agregar Secrets en Railway Dashboard

1. **Deploy → Variables**
2. **Add Variable**:
   - `JWT__KEY` = `your-super-secret-key-min-32-chars-here!@#`
   - `CORS_Origins` = `https://your-app.railway.app`
   - `ASPNETCORE_ENVIRONMENT` = `Production`

3. **Deploy**

---

## Testing Validación

### Test Login Validation
```bash
# ❌ Email inválido
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"test123"}'

# ❌ Password muy corta
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123"}'

# ✅ Válido
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}'
```

### Test Transaction Validation
```bash
# ❌ Monto negativo
curl -X POST http://localhost:5001/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryId":"123","amount":-100,"kind":"expense"}'

# ❌ Kind inválido
curl -X POST http://localhost:5001/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryId":"123","amount":100,"kind":"invalid"}'

# ✅ Válido
curl -X POST http://localhost:5001/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryId":"123","amount":100,"kind":"expense","date":"2026-09-18"}'
```

---

## Checklist Pre-Producción

- [ ] `JWT__KEY` es mínimo 32 caracteres aleatorios
- [ ] `CORS_Origins` restringe a tu dominio real
- [ ] `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Database migrations ejecutadas en BD de producción
- [ ] HTTPS habilitado (automático en Railway/Render)
- [ ] Logs monitoreados (check Railway/Render dashboard)
- [ ] Rate limiting configurado (future enhancement)
- [ ] HSTS headers habilitados (future enhancement)
- [ ] Content Security Policy (future enhancement)

---

## Error Handling

Validaciones retornan **400 Bad Request** con estructura:

```json
{
  "message": "Validation failed",
  "errors": {
    "Email": ["Email debe ser válido"],
    "Password": ["Contraseña debe tener al menos 6 caracteres"]
  }
}
```

Frontend muestra errores en mat-error y snack-bar notifications.

---

## Próximos Pasos de Seguridad

1. **Password Reset Flow** - token en email
2. **Rate Limiting** - máx 5 login attempts / 15 min
3. **2FA (Two-Factor Auth)** - opcional para usuarios
4. **Audit Logging** - registrar cambios importantes
5. **Data Encryption** - PII en reposo
6. **API Key Management** - para terceros

---

**Estado**: 🟢 MVP listo para producción (seguridad básica)
