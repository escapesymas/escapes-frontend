#!/bin/bash
# =============================================
# DEPLOY SCRIPT — Escapes y Más Frontend React
# Ejecutar desde la raíz del proyecto
# =============================================

VPS_USER="root"
VPS_HOST="212.227.134.161"
VPS_DIR="/var/www/vhosts/escapesymas.com/httpdocs"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"

echo "🏍️  Desplegando frontend al VPS..."

# 1. Compilar Frontend
echo "📦 Compilando Frontend React..."
cd FRONTEND
pnpm run build
cd ..

# 2. Subir archivos al VPS
echo "📡 Subiendo archivos por rsync..."
rsync -avz --delete -e "ssh -i ${SSH_KEY}" \
  FRONTEND/dist/ \
  ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/

# 3. Corregir permisos en el VPS
echo "🔒 Ajustando permisos en el servidor..."
ssh -i /home/adrian/.gemini/antigravity/ssh/id_ed25519 ${VPS_USER}@${VPS_HOST} << 'EOF'
  chown -R escapesymas:psaserv /var/www/vhosts/escapesymas.com/httpdocs/
  find /var/www/vhosts/escapesymas.com/httpdocs/ -type d -exec chmod 755 {} \;
  find /var/www/vhosts/escapesymas.com/httpdocs/ -type f -exec chmod 644 {} \;
  echo "Permisos de Plesk configurados correctamente."
EOF

echo "✅ ¡Deploy completado con éxito!"
echo "🌐 Frontend listo en Plesk (escapesymas.com)"
