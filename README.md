# Finance App – Finanzas personales y control de deudas

Aplicación web full stack para gestionar finanzas personales: ingresos y gastos, presupuestos, deudas, metas de ahorro, gastos fijos y reportes. API REST en **C# .NET 8** y frontend en **Angular 22**.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | C# .NET 8, ASP.NET Core Web API, Entity Framework Core 8 |
| Base de datos | SQLite (migraciones con EF Core) |
| Frontend | Angular 22, TypeScript, Angular Material, RxJS |
| Autenticación | JWT + contraseñas cifradas con BCrypt |
| Pruebas | xUnit (backend), Vitest (frontend) |
| Otros | Swagger, Serilog, Docker y docker-compose |

## Funcionalidades

**Finanzas**
- Dashboard mensual con balance, ingresos, gastos y ahorro.
- Transacciones: crear, editar, eliminar y filtrar.
- Categorías por tipo: ingreso, gasto, deuda y ahorro.
- Salario y **planificador quincenal**: reparte los gastos fijos entre quincenas y propone una provisión.
- Gastos fijos, con registro del pago como transacción.
- Presupuestos mensuales por categoría.
- Metas de ahorro.
- Deudas con tasas de interés y **comparador de estrategias de pago** (bola de nieve frente a avalancha).

**Reportes**
- Reporte mensual, flujo de caja en cascada (*waterfall*), calendario de gastos y reporte por categorías.

**Cuentas y seguridad**
- Registro, inicio de sesión y recuperación de contraseña con token de un solo uso.
- Panel de administración de cuentas con registro de auditoría, sin acceso a los datos financieros de los usuarios.
- Aislamiento por usuario: cada consulta se filtra por el usuario autenticado.
- En producción la API no arranca sin una clave JWT de al menos 32 caracteres.
- Los endpoints de depuración solo responden en entorno de desarrollo.

## Arquitectura

```
Backend/
├── FinanceApp.API/             # Controladores, configuración, seeding y servicios
├── FinanceApp.Application/     # DTOs
├── FinanceApp.Domain/          # Entidades: User, Transaction, Category, Salary, Budget,
│                               #   Debt, SavingsGoal, FixedExpense, PasswordResetToken, AdminAuditLog
├── FinanceApp.Infrastructure/  # DbContext y migraciones de EF Core
└── FinanceApp.Tests/           # Pruebas de integración de la API (xUnit)

Frontend/src/app/
├── core/       # Servicios HTTP, guards, interceptor JWT, modelos y cálculos financieros
├── features/   # Un módulo por funcionalidad (transactions, debts, budgets, reports…)
├── layout/     # Encabezado y menú lateral
└── shared/     # Componentes reutilizables
```

Los cálculos financieros del frontend (estrategia de deudas, plan quincenal) están en funciones puras dentro de `core/finance/`, separadas de los componentes para poder probarlas de forma aislada.

## Pruebas

```bash
# Backend: 89 pruebas sobre deudas, presupuestos, gastos fijos, metas de ahorro,
# autenticación, recuperación de contraseña y panel de administración
cd Backend
dotnet test

# Frontend: 34 pruebas de los cálculos financieros
cd Frontend
npx ng test --watch=false
```

Las pruebas se ejecutan automáticamente en cada *push* mediante GitHub Actions (`.github/workflows/ci.yml`).

## Ejecución local

**Requisitos:** .NET 8 SDK y Node.js 20 o superior.

```bash
# API: aplica las migraciones al arrancar y crea datos de demostración
cd Backend
dotnet run --project FinanceApp.API

# Frontend (en otra terminal)
cd Frontend
npm install
npm start
# http://localhost:4200
```

La documentación de la API queda disponible en Swagger en entorno de desarrollo.

**Cuenta de administrador:** se toma de la configuración `Admin:Email` y `Admin:Password`. Si no hay contraseña configurada, se genera una y se muestra en el log al arrancar. Para restablecerla:

```bash
dotnet run --project FinanceApp.API -- --reset-admin-password
```

### Con Docker

```bash
docker-compose up --build
```

### Variables de entorno en producción

| Variable | Descripción |
|---|---|
| `Jwt__Key` | Clave de firma JWT (mínimo 32 caracteres, obligatoria) |
| `ConnectionStrings__DefaultConnection` | Cadena de conexión SQLite |
| `Admin__Email`, `Admin__Password` | Cuenta de administrador inicial |

## Documentación adicional

- [SECURITY.md](SECURITY.md): decisiones de seguridad.
- [DEPLOY.md](DEPLOY.md): opciones de despliegue.

## Autor

**Eduardo Machacón** · [GitHub](https://github.com/Ed4ard6)
