
# Script de Despliegue Paddock Social
# Ejecuta este script desde tu terminal local para subir las mejoras al servidor.

$user = "backendescapes.com_css4v"
$host_ip = "212.227.134.161"
$remotePath = "httpdocs/wp-content/plugins/" # Ajustado para Plesk estándar

Write-Host "--- Iniciando Despliegue Paddock Social ---" -ForegroundColor Cyan

# 1. Crear backup remoto (opcionalmente manual, pero intentamos comando SSH)
Write-Host "Creando backup remoto..."
ssh $user@$host_ip "cp -r ${remotePath}paddock-gamification ${remotePath}paddock-gamification.bak"

# 2. Subir archivos de paddock-gamification
Write-Host "Subiendo paddock-gamification..."
scp -r ./paddock-gamification/* ${user}@${host_ip}:${remotePath}paddock-gamification/

# 3. Subir archivos de paddock-admin-panel
Write-Host "Subiendo paddock-admin-panel..."
scp -r ./paddock-admin-panel/* ${user}@${host_ip}:${remotePath}paddock-admin-panel/

Write-Host "--- Despliegue completado con éxito ---" -ForegroundColor Green
Write-Host "Para finalizar, entra en la web y visita este enlace (logeado como admin):"
Write-Host "https://backendescapes.com/wp-json/paddock/v1/debug/sync-db" -ForegroundColor Yellow
