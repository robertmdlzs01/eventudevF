# Guía de Despliegue en Vercel

## 📋 Configuración para Vercel

### 1. Variables de Entorno Requeridas

Configura las siguientes variables de entorno en el dashboard de Vercel:

#### Frontend (Next.js)
```
NEXT_PUBLIC_API_URL=https://tu-backend-url.com/api
NEXT_PUBLIC_WS_URL=wss://tu-backend-url.com
NEXT_PUBLIC_FRONTEND_URL=https://tu-frontend-url.vercel.app
NODE_ENV=production
```

#### Backend (si se despliega en Vercel como Serverless Functions)
```
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=tu-jwt-secret
JWT_REFRESH_SECRET=tu-refresh-secret
COBRU_API_KEY=tu-api-key
COBRU_REFRESH_TOKEN=tu-refresh-token
COBRU_API_URL=https://prod.cobru.co
NODE_ENV=production
```

### 2. Configuración del Proyecto

El proyecto está configurado para:
- **Frontend**: Next.js 15 (detectado automáticamente por Vercel)
- **Backend**: Se recomienda desplegar en un servicio separado (Railway, Render, etc.)

### 3. Pasos para Desplegar

1. **Conectar repositorio a Vercel**:
   - Ve a https://vercel.com
   - Importa el repositorio desde GitHub
   - Vercel detectará automáticamente Next.js

2. **Configurar variables de entorno**:
   - En el dashboard de Vercel, ve a Settings > Environment Variables
   - Agrega todas las variables listadas arriba

3. **Configurar Build Settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next` (automático)

4. **Desplegar**:
   - Vercel desplegará automáticamente en cada push a `main`
   - O haz clic en "Deploy" manualmente

### 4. Notas Importantes

- ⚠️ **Backend**: El backend (Express) debe desplegarse en un servicio separado
- ⚠️ **Base de Datos**: Asegúrate de que tu base de datos PostgreSQL esté accesible desde Vercel
- ⚠️ **CORS**: Configura `ALLOWED_ORIGINS` en el backend para incluir tu dominio de Vercel
- ⚠️ **WebSockets**: Si usas WebSockets, necesitarás un servicio que los soporte (no disponible en Vercel Serverless)

### 5. Recomendaciones para Backend

Para el backend, considera:
- **Railway**: https://railway.app (recomendado)
- **Render**: https://render.com
- **Heroku**: https://heroku.com
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform

### 6. Verificación Post-Despliegue

1. Verifica que el frontend carga correctamente
2. Verifica que las llamadas API funcionan
3. Verifica la autenticación
4. Verifica que los archivos estáticos se sirven correctamente
