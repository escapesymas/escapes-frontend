#!/bin/bash
# =============================================
# DEPLOY SCRIPT — Escapes y Más Next.js Frontend
# Ejecutar desde la raíz del proyecto
# =============================================

VPS_USER="root"
VPS_HOST="212.227.134.161"
VPS_DIR="/var/www/vhosts/test.escapesymas.com/app"
SSH_KEY="${SSH_KEY:-$HOME/.gemini/antigravity/ssh/id_ed25519}"

echo "🏍️  Desplegando nuevo frontend (Next.js) al VPS..."

# 1. Compilar Next.js localmente
echo "🛠️  Compilando Next.js localmente..."
cd frontend-next
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
  frontend-next/ \
  ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/

# 3. Sincronizar moto_catalog.json con el backend del VPS
echo "🗃️  Sincronizando catálogo de motos..."
rsync -avz \
  -e "ssh -i ${SSH_KEY}" \
  server/moto_catalog.json \
  ${VPS_USER}@${VPS_HOST}:/var/www/vhosts/backendescapes.com/server/moto_catalog.json

# 4. Instalar dependencias y arrancar con PM2 en el VPS
echo "🔄 Instalando dependencias y reiniciando app en el VPS..."
ssh -i ${SSH_KEY} ${VPS_USER}@${VPS_HOST} << 'EOF'
  cd /var/www/vhosts/test.escapesymas.com/app
  
  # Instalar dependencias usando pnpm
  echo "📦 Instalando dependencias..."
  pnpm install --config.minimum-release-age=0
  
  # Registrar o reiniciar servicio en PM2 (puerto 3002)
  echo "🚀 Levantando la app con PM2 en el puerto 3002..."
  pm2 delete escapes-frontend-next 2>/dev/null || true
  pm2 start node_modules/next/dist/bin/next --name "escapes-frontend-next" -- start -p 3002
  pm2 save
  
  # Corregir permisos del frontend
  chown -R escapesymas:psaserv /var/www/vhosts/test.escapesymas.com/
  find /var/www/vhosts/test.escapesymas.com/ -type d -exec chmod 755 {} \;
  find /var/www/vhosts/test.escapesymas.com/ -type f -exec chmod 644 {} \;
EOF

echo "✅ ¡Deploy del frontend-next completado!"
echo "🌐 Disponible en: https://test.escapesymas.com"
