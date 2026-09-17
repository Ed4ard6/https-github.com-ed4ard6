# 📘 Finance App - Guía Completa de Ejecución y Continuación

## 🚀 Inicio Rápido (5 minutos)

### Requisitos Previos
- ✅ .NET 8 SDK instalado
- ✅ Node.js 18+ instalado
- ✅ PostgreSQL 15+ corriendo en `localhost:5432`
- ✅ Usuario postgres con contraseña `postgres`

### Paso 1: Crear Base de Datos
```bash
# Desde PostgreSQL CLI o pgAdmin
CREATE DATABASE "FinanceApp";
```

### Paso 2: Ejecutar Migraciones Backend
```bash
cd Backend
dotnet ef database update -p FinanceApp.Infrastructure -s FinanceApp.API
```

### Paso 3: Iniciar Backend
```bash
cd Backend
dotnet run --project FinanceApp.API
# API disponible en: https://localhost:5001
# Swagger docs: https://localhost:5001/swagger
```

### Paso 4: Iniciar Frontend (en otra terminal)
```bash
cd Frontend
npm install  # Primera vez
ng serve
# Angular disponible en: http://localhost:4200
```

---

## 🔧 Arquitectura y Flujo

### Frontend → Backend
```
Angular (4200)
    ↓ HTTP + JWT Token
.NET API (5001)
    ↓ Entity Framework
PostgreSQL (5432)
```

### Autenticación
1. Usuario ingresa email/contraseña en Login
2. Backend valida y genera JWT token (24 horas)
3. Token se guarda en `localStorage`
4. Cada request incluye `Authorization: Bearer <token>`
5. AuthGuard protege rutas privadas

---

## 📝 Próximas Tareas (Fases 5-6)

### Fase 5: Integración Frontend-Backend

**Tarea 5.1: Reemplazar Mock Data**
- ✅ Frontend ya está estructurado para usar observables
- ⏳ Cambiar `MockDataService` por `HttpClient`
- Archivo a modificar: `Frontend/src/app/core/services/`

Ejemplo:
```typescript
// ANTES (mock)
getTransactions(): Observable<Transaction[]> {
  return of(this.mockDataService.getTransactions()).pipe(delay(500));
}

// DESPUÉS (real)
getTransactions(): Observable<Transaction[]> {
  return this.http.get<Transaction[]>('/api/transactions');
}
```

**Tarea 5.2: Agregar Interceptor HTTP**
- Crear interceptor para agregar JWT token a requests
- Ubicación: `Frontend/src/app/core/interceptors/auth.interceptor.ts`

```typescript
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
    return next.handle(req);
  }
}
```

**Tarea 5.3: Crear Servicios HTTP**
Crear servicios para cada entidad:
- `TransactionService`: GET, POST, PUT, DELETE
- `CategoryService`: GET, POST, PUT, DELETE
- `DebtService`: GET, comparador
- Inyectar `HttpClient` y usar endpoints `/api/`

### Fase 6: Backend Completar

**Tarea 6.1: Controllers Faltantes**
Crear controllers para:
- DebtController: GET list, GET byId
- BudgetController: CRUD
- SalaryController: CRUD
- DashboardController: GET summary

**Tarea 6.2: Validación con FluentValidation**
```csharp
public class CreateTransactionValidator : AbstractValidator<CreateTransactionRequest>
{
    public CreateTransactionValidator()
    {
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.CategoryId).NotEmpty();
    }
}
```

**Tarea 6.3: Error Handling Middleware**
```csharp
app.UseExceptionHandler(options => { /* ... */ });
```

---

## 🧪 Testing

### Backend - Crear DbContext de Test
```bash
cd Backend
dotnet new xunit -n FinanceApp.Tests
dotnet add FinanceApp.Tests/FinanceApp.Tests.csproj reference FinanceApp.API/FinanceApp.API.csproj
dotnet add FinanceApp.Tests/FinanceApp.Tests.csproj package Microsoft.EntityFrameworkCore.InMemory
```

### Frontend - Unit Tests
```bash
cd Frontend
ng test  # Ejecuta tests Jasmine
```

### E2E Tests
```bash
cd Frontend
ng e2e  # Cypress o Protractor
```

---

## 📊 Modelos de Datos

### User
```csharp
Id (string)
Nombre (string)
Email (string - unique)
PasswordHash (string)
CreatedAt (DateTime)
UpdatedAt (DateTime)
```

### Category
```csharp
Id (string)
UserId (string - FK)
Nombre (string)
Kind (enum: Income, Expense, Debt, Saving)
Color (string - hex)
ParentId (string? - para jerarquía)
Activo (bool)
CreatedAt, UpdatedAt
```

### Transaction
```csharp
Id (string)
UserId (string - FK)
CategoryId (string - FK)
Amount (decimal)
Description (string)
Date (DateTime)
Kind (enum: Income, Expense, Debt, Saving)
CreatedAt, UpdatedAt
```

### Salary
```csharp
Id (string)
UserId (string - FK)
Amount (decimal)
Date (DateTime)
CreatedAt
```

---

## 🔑 Variables de Entorno

Crear `.env` en raíz o usar `appsettings.Production.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=YOUR_HOST;Port=5432;Database=FinanceApp;Username=USER;Password=PASS"
  },
  "Jwt": {
    "Key": "cambiar-a-key-largo-y-seguro-en-produccion",
    "Issuer": "finance-app",
    "Audience": "finance-app"
  }
}
```

---

## 🐳 Docker (Opcional)

### PostgreSQL en Docker
```bash
docker run --name postgres-finance \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=FinanceApp \
  -p 5432:5432 \
  -d postgres:15
```

### Dockerfile Backend
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 5001
CMD ["dotnet", "FinanceApp.API.dll"]
```

---

## 📋 Checklist Completo

### Backend
- [ ] Base de datos creada
- [ ] Migraciones ejecutadas
- [ ] API ejecutándose en puerto 5001
- [ ] Swagger funcionando
- [ ] Controllers Auth, Transactions, Categories
- [ ] JWT tokens generándose
- [ ] CORS habilitado para localhost:4200
- [ ] Error handling middleware
- [ ] Validación con FluentValidation
- [ ] Logging con Serilog

### Frontend
- [ ] Dependencias instaladas (npm install)
- [ ] Angular serve funcionando en puerto 4200
- [ ] Login/Register funcionando
- [ ] MockDataService mostrando datos
- [ ] Dashboard con KPIs
- [ ] Navegación entre componentes
- [ ] Rutas protegidas con AuthGuard
- [ ] MockDataService reemplazado por HttpClient
- [ ] Interceptor JWT agregado
- [ ] Todas las páginas conectadas a API

### Integración
- [ ] Frontend llama API endpoints
- [ ] Tokens JWT enviándose correctamente
- [ ] CRUD funcionando end-to-end
- [ ] Error handling en Frontend
- [ ] Loading states mostrándose

### Testing
- [ ] Tests unitarios Backend (xUnit)
- [ ] Tests unitarios Frontend (Jasmine)
- [ ] Tests E2E (Cypress)

### Deployment
- [ ] CI/CD pipeline con GitHub Actions
- [ ] Docker images creadas
- [ ] Secrets configurados
- [ ] Base de datos en producción
- [ ] SSL/TLS certificados
- [ ] Logs centralizados

---

## 🐛 Troubleshooting

### Puerto 5001 ocupado
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5001
kill -9 <PID>
```

### Migración falla
```bash
# Ver migraciones
dotnet ef migrations list -p FinanceApp.Infrastructure -s FinanceApp.API

# Remover última migración
dotnet ef migrations remove -p FinanceApp.Infrastructure -s FinanceApp.API

# Crear nueva
dotnet ef migrations add InitialCreate -p FinanceApp.Infrastructure -s FinanceApp.API
```

### PostgreSQL no conecta
```bash
# Verificar que PostgreSQL está corriendo
psql -U postgres

# Ver conexión en appsettings.Development.json
# Asegurar: Host=localhost, Port=5432, User=postgres, Password=postgres
```

### Angular no conecta a API
- Verificar CORS en `Program.cs`
- Verificar URL en servicios
- Ver console del navegador (F12)
- Ver logs de API

---

## 📚 Recursos Útiles

- [Entity Framework Core Docs](https://learn.microsoft.com/en-us/ef/core/)
- [Angular Docs](https://angular.io/docs)
- [JWT.io - Verificar tokens](https://jwt.io)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [ASP.NET Core Best Practices](https://learn.microsoft.com/en-us/dotnet/core/project-sdk/overview)

---

## 📞 Notas Importantes

1. **Seguridad**: Cambiar JWT Key en producción
2. **CORS**: Configurar dominios correctos en producción
3. **Validación**: Implementar FluentValidation en todos los endpoints
4. **Logging**: Usar Serilog para logs estructurados
5. **Testing**: Mantener >80% cobertura
6. **Versionado**: Usar API versioning (/api/v1/...)
7. **Rate Limiting**: Agregar para prevenir abuso
8. **Paginación**: Implementar para listas grandes

---

**Última actualización**: 2026-09-17
**Estado**: Fase 4 completa, Fases 5-6 documentadas
