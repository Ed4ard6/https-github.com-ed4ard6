# 🚀 Guía de Despliegue - Finance App

## Opción 1: Railway (Recomendado) ⭐

### Paso 1: Preparar GitHub
```bash
git push origin master
```

### Paso 2: Crear cuenta en Railway
1. Ir a [railway.app](https://railway.app)
2. Sign up con GitHub
3. Autorizar acceso a repositorios

### Paso 3: Deploy en Railway
1. Click "New Project"
2. Seleccionar "Deploy from GitHub repo"
3. Seleccionar `Proyectos-finance-app`
4. Railway detectará automáticamente `Dockerfile`
5. Configurar variables de entorno:
   - `ASPNETCORE_ENVIRONMENT=Production`
   - `ConnectionStrings__DefaultConnection=Data Source=finance_app.db`

### Paso 4: Frontend en Railway
1. Crear nuevo servicio para Frontend
2. Railway deploará usando el Dockerfile
3. Exponer puerto 4200

### URLs generadas
- Backend: `https://[random].up.railway.app`
- Frontend: `https://[random].up.railway.app`

---

## Opción 2: Render.com

### Paso 1: Conectar GitHub
1. Ir a [render.com](https://render.com)
2. Conectar GitHub
3. Autorizar repo

### Paso 2: Crear Web Service Backend
1. "New Web Service"
2. Conectar a repo
3. Configurar:
   - Build Command: `cd Backend && dotnet build`
   - Start Command: `dotnet FinanceApp.API.dll`
   - Environment: Production

### Paso 3: Crear Web Service Frontend
1. "New Web Service"
2. Conectar a repo
3. Configurar:
   - Build Command: `cd Frontend && npm install && npm run build`
   - Start Command: `npm start`
   - Publish Directory: `dist/finance-frontend/browser`

---

## Opción 3: Docker Local

```bash
# Build images
docker-compose build

# Start services
docker-compose up

# URLs
# Frontend: http://localhost:4200
# Backend: http://localhost:5001
```

---

## Variables de Entorno Necesarias

**Backend:**
```
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=Data Source=finance_app.db
Jwt__Key=your-secret-key-here
Jwt__Issuer=finance-app
Jwt__Audience=finance-app
```

**Frontend:**
```
API_URL=https://your-backend-url.com
```

---

## Monitoreo Post-Deploy

- Backend logs: `docker logs finance-backend`
- Frontend logs: `docker logs finance-frontend`
- Health check: `curl https://your-backend-url/swagger`

---

## Próximos Pasos

1. ✅ Custom domain (Railway: Domain tab)
2. ✅ SSL certificado (automático en Railway/Render)
3. ✅ Database migration (Render ofrece PostgreSQL addon)
4. ✅ CI/CD automático (GitHub Actions)

---

**Estado:** 🟢 Lista para producción
