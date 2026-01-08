# Eventu - Sistema de Gestión de Eventos

Sistema completo para gestión de eventos, venta de boletos, impresión física y administración de tickets.

## 📚 Documentación

- **[Sistema de Plantillas de Boletos Físicos](./docs/TICKET_TEMPLATES_SYSTEM.md)** - Guía completa del sistema de impresión con plantillas personalizables
- **[Drivers de Impresión](./docs/DRIVERS_IMPRESION.md)** - ⚠️ **IMPORTANTE**: Guía sobre drivers e instalación de QZ Tray

## ⚠️ Nota Importante sobre Impresión

**Los drivers de impresora NO están incluidos en este proyecto**. Los drivers deben instalarse en el equipo donde se ejecutará la impresión. 

Ver la guía completa: [docs/DRIVERS_IMPRESION.md](./docs/DRIVERS_IMPRESION.md)

## 🚀 Instalación Rápida

### Backend

```bash
cd backend
npm install
cp config.env.example config.env
# Configurar variables de entorno en config.env
npm start
```

### Frontend

```bash
npm install
npm run dev
```

## 📋 Requisitos para Impresión

1. **QZ Tray** - Descargar e instalar desde https://qz.io/download/
2. **Drivers de Impresora** - Instalar según el modelo de impresora en el equipo
3. **Impresora configurada** - Al menos una impresora debe estar instalada en el sistema

Ver detalles completos en [docs/DRIVERS_IMPRESION.md](./docs/DRIVERS_IMPRESION.md)

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Node.js, Express, PostgreSQL
- **Impresión**: QZ Tray (aplicación externa)
- **UI**: Tailwind CSS, shadcn/ui

## 📝 Licencia

Propietario - Todos los derechos reservados
