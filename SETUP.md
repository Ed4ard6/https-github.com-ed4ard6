# ⚡ Setup Rápido - Finance App

## 1️⃣ Crear Base de Datos
```bash
# Asegurar PostgreSQL corriendo en localhost:5432
# Usuario: postgres, Password: postgres

psql -U postgres
CREATE DATABASE "FinanceApp";
\q
```

## 2️⃣ Backend - Crear Migraciones
```bash
cd Backend

# Crear migración inicial
dotnet ef migrations add InitialCreate -p FinanceApp.Infrastructure -s FinanceApp.API

# Ejecutar migración
dotnet ef database update -p FinanceApp.Infrastructure -s FinanceApp.API

# Ejecutar API
dotnet run --project FinanceApp.API
# ✅ API en: https://localhost:5001
# ✅ Swagger en: https://localhost:5001/swagger
```

## 3️⃣ Frontend - Ejecutar
```bash
cd Frontend

# Primera vez
npm install

# Ejecutar desarrollo
ng serve
# ✅ Frontend en: http://localhost:4200
```

## 4️⃣ ¡Listo! 🚀
- Ir a http://localhost:4200
- Cualquier email/password funciona (mock)
- Todo está conectado con datos mock

---

## 🔗 Próximo Paso
Ver `GUIDE.md` para:
- Integración real (HTTP calls)
- Completar backend
- Testing
- Deployment

---

**Estado**: Listo para ejecutar ✅
