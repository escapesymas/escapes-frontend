#!/bin/bash
# =============================================
# DEPLOY SCRIPT — Escapes y Más Backend
# Ejecutar desde la raíz del proyecto
# REQUISITO: Copiar .env al VPS antes del primer deploy
# =============================================
set -e

VPS_USER="root"
VPS_HOST="212.227.134.161"
VPS_DIR="/var/www/vhosts/backendescapes.com/server"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
TAG="backend-$(date +%Y%m%d-%H%M%S)"

# ──────────────────────────────────────────────
# 0. Aviso sobre variables de entorno
# ──────────────────────────────────────────────
echo "⚠️  El servidor requiere variables de entorno (no hay credenciales hardcodeadas)."
echo "   Asegúrate de que ${VPS_DIR}/.env existe en el VPS."
echo "   Si no: ssh ${VPS_USER}@${VPS_HOST} 'cp ${VPS_DIR}/.env.example ${VPS_DIR}/.env && vi ${VPS_DIR}/.env'"
echo ""

echo "🏍️ Desplegando backend al VPS..."

# 0.5. Git: crear tag y subir versiones
echo "🏷️  Creando tag $TAG..."
git tag -a "$TAG" -m "Deploy backend $(date '+%Y-%m-%d %H:%M:%S')"
echo "📤 Subiendo tag a GitHub..."
git push origin "$TAG" 2>/dev/null || echo "   (sin conexión a GitHub, tag solo local)"
echo "📤 Subiendo tag a VPS..."
git push vps "$TAG" 2>/dev/null || echo "   (VPS remote no disponible)"

# 1. Compilar TypeScript
echo "📦 Compilando TypeScript..."
cd server
pnpm run build
cd ..

# 2. Parar el servicio antes de subir (evita ERR_MODULE_NOT_FOUND)
echo "🛑 Parando servicio..."
ssh ${VPS_USER}@${VPS_HOST} "pm2 stop escapes-backend 2>/dev/null; exit 0"

# 3. Subir archivos al VPS + push source a VPS git
echo "📡 Subiendo archivos..."
rsync -avz --delete --exclude 'uploads/' --exclude 'invoices/' \
  server/dist/ \
  server/package.json \
  server/ecosystem.config.cjs \
  server/moto_catalog.json \
  server/.env.example \
  ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/

# 4. Instalar dependencias y reiniciar en el VPS
echo "🔄 Restaurando base de datos y reiniciando servicio..."
ssh ${VPS_USER}@${VPS_HOST} << 'EOF'
  cd /var/www/vhosts/backendescapes.com/server
  npm install --production
  pm2 start ecosystem.config.cjs || pm2 restart ecosystem.config.cjs
  pm2 save
EOF

echo "✅ ¡Deploy completado! Tag: $TAG"
echo "🌐 Backend disponible en: https://backendescapes.com/api/health"

