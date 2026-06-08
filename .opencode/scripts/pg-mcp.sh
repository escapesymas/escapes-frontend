#!/bin/bash
# Wrapper that launches the PostgreSQL MCP server using the project's DATABASE_URL
CONFIG_FILE="/home/adrian/Documentos/GitHub/escapes-react/server/.env"
if [ -f "$CONFIG_FILE" ]; then
  DB_URL=$(grep '^DATABASE_URL=' "$CONFIG_FILE" | cut -d= -f2-)
fi
if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL not found in $CONFIG_FILE" >&2
  exit 1
fi
exec npx -y @modelcontextprotocol/server-postgres "$DB_URL"
