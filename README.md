# Finance App - Control de Deudas y Finanzas 💰

Aplicación profesional de gestión financiera con control de deudas, transacciones, presupuestos y reportes avanzados.

## 🎯 Stack Tecnológico

| Layer | Tecnología |
|-------|-----------|
| **Backend API** | C# .NET 8 + Entity Framework Core |
| **Database** | PostgreSQL 15+ |
| **Frontend** | Angular 18 + TypeScript 5 |
| **UI Components** | Angular Material 18 |
| **State** | RxJS |
| **Auth** | JWT (JSON Web Tokens) |

## 📁 Estructura del Proyecto

```
finance-app/
├── Backend/                    # API REST en C# .NET
│   ├── FinanceApp.API/        # Controllers y configuración
│   ├── FinanceApp.Application/ # Servicios y DTOs
│   ├── FinanceApp.Domain/     # Entidades y lógica de negocio
│   ├── FinanceApp.Infrastructure/ # Data Access, Repositories
│   ├── FinanceApp.Tests/      # Pruebas unitarias
│   └── FinanceApp.sln         # Solución
│
├── Frontend/                   # Aplicación Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Servicios, guards, interceptores
│   │   │   ├── shared/        # Componentes reutilizables
│   │   │   ├── features/      # Módulos por funcionalidad
│   │   │   └── layout/        # Estructura general
│   │   └── styles/            # SCSS global
│   └── angular.json
│
├── docs/                       # Documentación del proyecto
├── .github/                    # GitHub Actions (CI/CD)
├── .gitignore
└── README.md
```

## 🚀 Comenzar

### Backend Setup
```bash
cd Backend

# Restaurar dependencias
dotnet restore

# Aplicar migraciones de base de datos
dotnet ef database update

# Ejecutar API
dotnet run --project FinanceApp.API
# API estará en: https://localhost:5001
```

### Frontend Setup
```bash
cd Frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
ng serve
# Abierto en: http://localhost:4200
```

## ✨ Características

### Core
- ✅ **Autenticación** - Login/Register con JWT
- ✅ **Dashboard** - Vista general de finanzas (balance, ingresos, gastos)
- ✅ **Transacciones** - CRUD completo (ingresos, gastos, deudas, ahorros)
- ✅ **Categorías** - Gestión de categorías con tipos y jerarquía
- ✅ **Salario** - Configuración y seguimiento de ingresos mensuales

### Funcionalidades Avanzadas
- ✅ **Gestión de Deudas** - Seguimiento de deudas, tasas de interés, pagos
- ✅ **Comparador de Deudas** - Estrategias snowball vs avalanche
- ✅ **Presupuestos** - Límites de gastos mensuales por categoría
- ✅ **Metas de Ahorro** - Seguimiento de objetivos de ahorro
- ✅ **Reportes**:
  - Waterfall (flujo de caja mensual)
  - Calendario de calor (actividad de gastos)
  - Reporte mensual (narrativo)
  - Planificador quincenal

## 📊 Modelo de Datos

### Entidades Principales
- **User** - Usuarios del sistema
- **Transaction** - Transacciones (ingresos, gastos, deudas, ahorros)
- **Category** - Categorías de transacciones (expense, income, debt, saving)
- **Salary** - Historial de salarios
- **Debt** - Deudas individuales con tasas
- **Budget** - Presupuestos mensuales
- **SavingsGoal** - Metas de ahorro

## 🔐 Seguridad

- JWT tokens con expiración configurable
- Contraseñas hasheadas con bcrypt
- CORS configurado para frontend
- Validación de entrada con FluentValidation
- User isolation (cada usuario solo ve sus datos)

## 🧪 Testing

```bash
# Backend - Tests unitarios
cd Backend
dotnet test

# Frontend - Tests
cd Frontend
ng test
```

## 📚 Documentación

Ver `/docs` para:
- Arquitectura detallada
- Especificación de API (Swagger)
- Guía de desarrollo
- Configuración de base de datos

## 🛠️ Desarrollo

### Requisitos Previos
- .NET 8 SDK
- Node.js 18+
- PostgreSQL 15+
- Visual Studio Code o Visual Studio 2022

### Variables de Entorno
Crear archivos:
- `Backend/FinanceApp.API/appsettings.Development.json`
- `Frontend/.env`

Ejemplos en la documentación.

## 📈 Roadmap

- [ ] Fase 1: Frontend con datos mock (2-3 días)
- [ ] Fase 2: Backend API (2-3 días)
- [ ] Fase 3: Integración Frontend-Backend (1-2 días)
- [ ] Fase 4: Testing y optimización (1-2 días)
- [ ] Fase 5: Despliegue en producción

## 👨‍💻 Autor

Desarrollado como proyecto de aprendizaje en desarrollo profesional.

---

**Última actualización**: 2026-09-17
