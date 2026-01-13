#!/bin/bash
# Script para aplicar la migración de integración del sistema de boletos

echo "🔧 Aplicando migración de integración del sistema de boletos..."
echo ""

# Cargar variables de entorno si existe config.env
if [ -f backend/config.env ]; then
  echo "📋 Cargando variables de entorno desde backend/config.env..."
  export $(grep -v '^#' backend/config.env | xargs)
fi

# Verificar si DATABASE_URL está definida
if [ -n "$DATABASE_URL" ]; then
  echo "✅ Usando DATABASE_URL para conectar a la base de datos"
  psql "$DATABASE_URL" -f backend/migrations/integrate_ticket_system.sql
elif [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
  echo "✅ Usando variables individuales para conectar a la base de datos"
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f backend/migrations/integrate_ticket_system.sql
else
  echo "❌ No se encontraron variables de conexión a la base de datos"
  echo ""
  echo "Por favor, proporciona las credenciales manualmente:"
  echo ""
  echo "Opción 1 - Usando DATABASE_URL:"
  echo "  psql \"tu_database_url\" -f backend/migrations/integrate_ticket_system.sql"
  echo ""
  echo "Opción 2 - Usando variables individuales:"
  echo "  PGPASSWORD=tu_password psql -h tu_host -U tu_user -d tu_database -f backend/migrations/integrate_ticket_system.sql"
  echo ""
  exit 1
fi

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ ¡Migración aplicada exitosamente!"
else
  echo ""
  echo "❌ Error al aplicar la migración"
  exit 1
fi
