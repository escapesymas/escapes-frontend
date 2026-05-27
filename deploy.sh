#!/bin/bash
# =============================================
# DEPLOY SCRIPT — Escapes y Más Backend
# Ejecutar desde la raíz del proyecto
# =============================================

VPS_USER="root"
VPS_HOST="212.227.134.161"
VPS_DIR="/var/www/vhosts/backendescapes.com/server"
SSH_KEY="${SSH_KEY:-$HOME/.gemini/antigravity/ssh/id_ed25519}"

echo "🏍️ Desplegando backend al VPS..."

# 1. Compilar TypeScript
echo "📦 Compilando TypeScript..."
cd server
pnpm run build
cd ..

# 1.5. Exportar Base de Datos Local
echo "🐘 Exportando copia de seguridad de la base de datos local..."
mkdir -p local_db
PGPASSWORD=EscapesPostgres2026Vercel pg_dump -U postgres -h localhost -d escapes_db --clean --if-exists -f local_db/escapes_db_deploy.sql

# 2. Parar el servicio antes de subir (evita ERR_MODULE_NOT_FOUND)
echo "🛑 Parando servicio..."
ssh -i ${SSH_KEY} ${VPS_USER}@${VPS_HOST} "pm2 stop escapes-backend 2>/dev/null; exit 0"

# 3. Subir archivos al VPS
echo "📡 Subiendo archivos..."
rsync -avz --delete --exclude 'uploads/' --exclude 'invoices/' -e "ssh -i ${SSH_KEY}" \
  server/dist/ \
  server/package.json \
  server/ecosystem.config.cjs \
  local_db/escapes_db_deploy.sql \
  ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/

# 4. Instalar dependencias, restaurar base de datos y reiniciar en el VPS
echo "🔄 Restaurando base de datos y reiniciando servicio..."
ssh -i ${SSH_KEY} ${VPS_USER}@${VPS_HOST} << 'EOF'
  cd /var/www/vhosts/backendescapes.com/server
  
  if [ -f "escapes_db_deploy.sql" ]; then
    echo "🐘 Restaurando base de datos en el VPS..."
    PGPASSWORD=EscapesPostgres2026Vercel psql -U postgres -h localhost -d escapes_db -f escapes_db_deploy.sql >/dev/null || true
    rm -f escapes_db_deploy.sql
  fi

  npm install --production
  pm2 start ecosystem.config.cjs || pm2 restart ecosystem.config.cjs
  pm2 save
EOF

echo "✅ ¡Deploy completado!"
echo "🌐 Backend disponible en: https://backendescapes.com/api/health"

