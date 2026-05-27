#!/bin/bash
# =============================================
# DEPLOY SCRIPT — Escapes y Más Admin Dashboard
# Ejecutar desde la raíz del proyecto
# =============================================

VPS_USER="root"
VPS_HOST="212.227.134.161"
VPS_DIR="/var/www/vhosts/backendescapes.com/httpdocs"
SSH_KEY="${SSH_KEY:-$HOME/.gemini/antigravity/ssh/id_ed25519}"

echo "🛡️  Desplegando Admin Dashboard a backendescapes.com..."

# 1. Instalar y Compilar
echo "📦 Instalando dependencias del Admin..."
cd ADMIN
pnpm install
echo "⚙️ Compilando Admin..."
pnpm run build
cd ..

# 2. Subir archivos al VPS (sin --delete para proteger Dolibarr y otras herramientas)
echo "📡 Subiendo archivos por rsync..."
rsync -avz -e "ssh -i ${SSH_KEY}" \
  ADMIN/dist/ \
  ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/

# 3. Corregir permisos en el VPS y desactivar index.php de WordPress
echo "🔒 Ajustando permisos en el servidor..."
ssh -i ${SSH_KEY} ${VPS_USER}@${VPS_HOST} << 'EOF'
  if [ -f /var/www/vhosts/backendescapes.com/httpdocs/index.php ]; then
    echo "Desactivando legacy WordPress index.php..."
    mv /var/www/vhosts/backendescapes.com/httpdocs/index.php /var/www/vhosts/backendescapes.com/httpdocs/index.php.bak
  fi
  chown backendescapes.com:psaserv /var/www/vhosts/backendescapes.com/httpdocs/index.html
  chown -R backendescapes.com:psaserv /var/www/vhosts/backendescapes.com/httpdocs/assets/
  chmod 644 /var/www/vhosts/backendescapes.com/httpdocs/index.html
  find /var/www/vhosts/backendescapes.com/httpdocs/assets/ -type d -exec chmod 755 {} +
  find /var/www/vhosts/backendescapes.com/httpdocs/assets/ -type f -exec chmod 644 {} +
  echo "Permisos de Plesk para backendescapes.com configurados correctamente."
EOF

echo "✅ ¡Deploy del Admin completado con éxito!"
echo "🌐 Panel administrativo disponible en: https://backendescapes.com/"
