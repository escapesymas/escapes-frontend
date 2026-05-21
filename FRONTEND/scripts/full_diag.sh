#!/bin/bash
# Script de diagnóstico del VPS - ESACES Y MÁS
# Ya no requiere WooCommerce

echo "🔍 Ejecutando diagnóstico del servidor..."

echo "📊 Verificando servicios..."
systemctl status plesk-task-manager --no-pager || true
systemctl status plesk-php83-fpm --no-pager || true

echo "✅ Diagnóstico completado."