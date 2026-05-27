#!/bin/bash
# =============================================
# DEPLOY SCRIPT — Escapes y Más Frontend Production (Next.js)
# Ejecutar desde la raíz del proyecto
# =============================================

VPS_USER="root"
VPS_HOST="212.227.134.161"
VPS_DIR="/var/www/vhosts/escapesymas.com/app"
SSH_KEY="${SSH_KEY:-$HOME/.gemini/antigravity/ssh/id_ed25519}"

echo "🏍️  Desplegando frontend de producción (Next.js) al VPS..."

# 1. Compilar Next.js localmente en la carpeta FRONTEND
echo "🛠️  Compilando Next.js localmente..."
cd FRONTEND
pnpm build
cd ..

# 1.5. Crear directorio en el VPS si no existe
echo "📁 Preparando directorios en el VPS..."
ssh -i ${SSH_KEY} ${VPS_USER}@${VPS_HOST} "mkdir -p ${VPS_DIR}"

# 2. Subir código fuente por rsync (excluyendo carpetas pesadas/locales)
echo "📡 Subiendo archivos del proyecto..."
rsync -avz --delete \
  --exclude 'node_modules/' \
  --exclude '.next/cache/' \
  --exclude '.git/' \
  --exclude 'dist/' \
  -e "ssh -i ${SSH_KEY}" \
  FRONTEND/ \
  ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/

# 2.5. Sincronizar moto_catalog.json con el backend del VPS
echo "🗃️  Sincronizando catálogo de motos..."
rsync -avz \
  -e "ssh -i ${SSH_KEY}" \
  server/moto_catalog.json \
  ${VPS_USER}@${VPS_HOST}:/var/www/vhosts/backendescapes.com/server/moto_catalog.json

# 3. Instalar dependencias y arrancar con PM2 en el VPS en el puerto 3000
echo "🔄 Instalando dependencias y reiniciando app de producción en el VPS..."
ssh -i ${SSH_KEY} ${VPS_USER}@${VPS_HOST} << 'EOF'
  cd /var/www/vhosts/escapesymas.com/app
  
  # Instalar dependencias usando pnpm
  echo "📦 Instalando dependencias..."
  pnpm install --config.minimum-release-age=0
  
  # Registrar o reiniciar servicio en PM2 (puerto 3000)
  echo "🚀 Levantando la app con PM2 en el puerto 3000..."
  pm2 delete escapes-frontend-prod 2>/dev/null || true
  pm2 start node_modules/next/dist/bin/next --name "escapes-frontend-prod" -- start -p 3000
  pm2 save
  
  # Corregir permisos del frontend
  chown -R escapesymas:psaserv /var/www/vhosts/escapesymas.com/
  find /var/www/vhosts/escapesymas.com/ -type d -exec chmod 755 {} \;
  find /var/www/vhosts/escapesymas.com/ -type f -exec chmod 644 {} \;
EOF

echo "✅ ¡Deploy del frontend de producción completado!"
echo "🌐 Disponible en: https://escapesymas.com"
