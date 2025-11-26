#!/bin/bash

# ===========================================
# Script de Despliegue para VPS
# ===========================================

echo "🚀 Iniciando despliegue..."

# 1. Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci --production=false

# 2. Generar cliente de Prisma
echo "🗄️ Generando cliente Prisma..."
npx prisma generate

# 3. Ejecutar migraciones de base de datos
echo "🔄 Aplicando migraciones..."
npx prisma migrate deploy

# 4. Construir la aplicación
echo "🔨 Construyendo aplicación..."
npm run build

echo "✅ Despliegue completado!"
echo ""
echo "Para iniciar la aplicación:"
echo "  npm start"
echo ""
echo "O usa PM2 para mantenerla en segundo plano:"
echo "  pm2 start npm --name 'dashboard' -- start"
