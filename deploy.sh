#!/bin/bash
# =============================================
# DEPLOY SCRIPT — Escapes y Más Backend
# Ejecutar desde la raíz del proyecto
# =============================================

VPS_USER="root"
VPS_HOST="212.227.134.161"
VPS_DIR="/var/www/vhosts/backendescapes.com/server"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"

echo "🏍️ Desplegando backend al VPS..."

# 1. Compilar TypeScript
echo "📦 Compilando TypeScript..."
cd server
pnpm run build
cd ..

# 2. Subir archivos al VPS
echo "📡 Subiendo archivos..."
rsync -avz --delete --exclude 'uploads/' --exclude 'invoices/' -e "ssh -i ${SSH_KEY}" \
  server/dist/ \
  server/package.json \
  server/ecosystem.config.cjs \
  ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/

# 3. Instalar dependencias y reiniciar en el VPS
echo "🔄 Reiniciando servicio..."
ssh -i ${SSH_KEY} ${VPS_USER}@${VPS_HOST} << 'EOF'
  cd /var/www/vhosts/backendescapes.com/server
  npm install --production
  pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs
  pm2 save
EOF

echo "✅ ¡Deploy completado!"
echo "🌐 Backend disponible en: https://backendescapes.com/api/health"

