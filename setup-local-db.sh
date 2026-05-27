#!/bin/bash
# =================================================================
# SCRIPT DE INSTALACIÓN Y CONFIGURACIÓN DE POSTGRESQL LOCAL (ARCH LINUX)
# =================================================================

set -e

DUMP_FILE="local_db/escapes_db_dump.sql"
DB_NAME="escapes_db"
DB_PASS="EscapesPostgres2026Vercel"

echo "🐘 Iniciando configuración de base de datos local..."

# 1. Comprobar si el dump existe
if [ ! -f "$DUMP_FILE" ]; then
  echo "❌ Error: No se encuentra el archivo de dump en $DUMP_FILE"
  exit 1
fi

# 2. Instalar PostgreSQL si no está instalado
if ! command -v psql &> /dev/null; then
  echo "📦 Instalando PostgreSQL con pacman..."
  sudo pacman -S --needed --noconfirm postgresql
else
  echo "✅ PostgreSQL ya está instalado."
fi

# 3. Inicializar el clúster de base de datos (requerido en Arch Linux)
if [ ! -d "/var/lib/postgres/data" ] || [ -z "$(ls -A /var/lib/postgres/data 2>/dev/null)" ]; then
  echo "⚙️  Inicializando clúster de base de datos..."
  sudo mkdir -p /var/lib/postgres/data
  sudo chown -R postgres:postgres /var/lib/postgres/data
  sudo -u postgres initdb -D /var/lib/postgres/data
else
  echo "✅ Clúster de base de datos ya inicializado."
fi

# 4. Iniciar y habilitar el servicio PostgreSQL
echo "🔄 Iniciando servicio de PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 5. Configurar contraseña de usuario 'postgres'
echo "🔐 Configurando credenciales del usuario 'postgres'..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$DB_PASS';"

# 6. Crear la base de datos escapes_db si no existe
echo "🛠️ Creando la base de datos '$DB_NAME'..."
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || sudo -u postgres createdb "$DB_NAME"

# 7. Restaurar el dump
echo "📥 Restaurando copia de seguridad de la base de datos..."
sudo -u postgres psql "$DB_NAME" < "$DUMP_FILE"

echo "🎉 ¡Base de datos local configurada y restaurada con éxito!"
echo "🔌 Cadena de conexión: postgresql://postgres:$DB_PASS@localhost:5432/$DB_NAME"
