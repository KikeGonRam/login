#!/bin/bash

# LOGIN GLOBAL SSO - QUICK START
# Ejecutar este script para configurar rápidamente el proyecto

echo "🚀 LOGIN GLOBAL SSO - QUICK START"
echo "=================================="
echo ""

# 1. Generar claves RSA256
echo "📝 Paso 1: Generando claves RSA256..."
if [ ! -d "keys" ]; then
    mkdir keys
    openssl genrsa -out keys/private.pem 2048
    openssl rsa -in keys/private.pem -pubout -out keys/public.pem
    echo "✅ Claves generadas en ./keys/"
else
    echo "ℹ️  Directorio ./keys/ ya existe"
fi
echo ""

# 2. Crear .env si no existe
echo "🔧 Paso 2: Verificando .env..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Archivo .env creado (actualiza DATABASE_URL)"
else
    echo "ℹ️  .env ya existe"
fi
echo ""

# 3. Instalar dependencias
echo "📦 Paso 3: Instalando dependencias..."
npm install
echo "✅ Dependencias instaladas"
echo ""

# 4. Ejecutar migraciones
echo "🗄️  Paso 4: Ejecutando migraciones Prisma..."
npx prisma migrate deploy
echo "✅ Migraciones completadas"
echo ""

# 5. Ejecutar seed
echo "🌱 Paso 5: Cargando datos iniciales..."
npm run seed
echo "✅ Datos iniciales cargados"
echo ""

echo "=================================="
echo "✨ ¡Configuración completada!"
echo ""
echo "🎯 Próximos pasos:"
echo "1. Actualizar .env con tu DATABASE_URL"
echo "2. Ejecutar: npm run start:dev"
echo ""
echo "🔐 Usuarios de prueba:"
echo "   - admin@loginglobal.com / Admin@123456"
echo "   - support@loginglobal.com / Support@123456"
echo ""
echo "📚 Ver IMPLEMENTATION_GUIDE.md para más detalles"
echo "=================================="
