#!/bin/bash
# =============================================
# DEPLOY SCRIPT — Escapes y Más Frontend Production (Next.js)
# Ejecutar desde la raíz del proyecto
# =============================================
set -e

VPS_USER="root"
VPS_HOST="212.227.134.161"
VPS_DIR="/var/www/vhosts/escapesymas.com/app"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
TAG="frontend-$(date +%Y%m%d-%H%M%S)"

echo "🏍️  Desplegando frontend de producción (Next.js) al VPS..."

# 0. Git: crear tag y subir versiones
echo "🏷️  Creando tag $TAG..."
git tag -a "$TAG" -m "Deploy frontend $(date '+%Y-%m-%d %H:%M:%S')"
echo "📤 Subiendo tag a GitHub..."
git push origin "$TAG" 2>/dev/null || echo "   (sin conexión a GitHub)"
echo "📤 Subiendo tag a VPS..."
git push vps "$TAG" 2>/dev/null || echo "   (VPS remote no disponible)"

# 1. Compilar Next.js localmente en la carpeta FRONTEND
echo "🛠️  Compilando Next.js localmente..."
cd FRONTEND
pnpm build
cd ..

# 1.5. Crear directorio en el VPS si no existe
echo "📁 Preparando directorios en el VPS..."
ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${VPS_DIR}"

# 2. Subir código fuente por rsync (excluyendo carpetas pesadas/locales)
echo "📡 Subiendo archivos del proyecto..."
rsync -avz --delete \
  --exclude 'node_modules/' \
  --exclude '.next/cache/' \
  --exclude '.git/' \
  --exclude 'dist/' \
  FRONTEND/ \
  ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/

# 2.5. Sincronizar moto_catalog.json con el backend del VPS
echo "🗃️  Sincronizando catálogo de motos..."
rsync -avz \
  server/moto_catalog.json \
  ${VPS_USER}@${VPS_HOST}:/var/www/vhosts/backendescapes.com/server/moto_catalog.json

# 3. Instalar dependencias y arrancar con PM2 en el VPS en el puerto 3000
echo "🔄 Instalando dependencias y reiniciando app de producción en el VPS..."
ssh ${VPS_USER}@${VPS_HOST} << 'EOF'
  cd /var/www/vhosts/escapesymas.com/app
  
  echo "📦 Instalando dependencias..."
  pnpm install --config.minimum-release-age=0
  
  echo "🚀 Levantando la app con PM2 en el puerto 3000..."
  pm2 delete escapes-frontend-prod 2>/dev/null || true
  pm2 start node_modules/next/dist/bin/next --name "escapes-frontend-prod" -- start -p 3000
  pm2 save
  
  chown -R escapesymas:psaserv /var/www/vhosts/escapesymas.com/
  find /var/www/vhosts/escapesymas.com/ -type d -exec chmod 755 {} \;
  find /var/www/vhosts/escapesymas.com/ -type f -exec chmod 644 {} \;
EOF

echo "✅ ¡Deploy del frontend de producción completado! Tag: $TAG"
echo "🌐 Disponible en: https://escapesymas.com"
