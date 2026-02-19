
# Script de Despliegue Paddock Social (ROOT)
# Ejecuta este script desde tu terminal local para subir las mejoras al servidor como ROOT.

$user = "root"
$pass = "Wzs8sX4y9c1TBJp"
$host_ip = "212.227.134.161"
$remotePath = "/var/www/vhosts/backendescapes.com/httpdocs/wp-content/plugins/"

Write-Host "--- Iniciando Despliegue Paddock Social (Acceso Root) ---" -ForegroundColor Cyan

# 1. Crear backup remoto
Write-Host "Creando backup remoto..."
ssh -o StrictHostKeyChecking=no $user@$host_ip "mkdir -p ${remotePath}backups && cp -r ${remotePath}paddock-gamification ${remotePath}backups/paddock-gamification-$(Get-Date -Format 'yyyyMMddHHmm')"

# 2. Subir archivos de paddock-gamification
Write-Host "Subiendo paddock-gamification..."
scp -r ./paddock-gamification/* ${user}@${host_ip}:${remotePath}paddock-gamification/

# 3. Subir archivos de paddock-admin-panel
Write-Host "Subiendo paddock-admin-panel..."
scp -r ./paddock-admin-panel/* ${user}@${host_ip}:${remotePath}paddock-admin-panel/

# 4. Asegurar permisos correctos (Plesk suele usar www-data o el usuario del dominio, pero root puede fix)
Write-Host "Ajustando permisos..."
ssh $user@$host_ip "chown -R backendescapes.com_css4v:psacln ${remotePath}paddock-gamification ${remotePath}paddock-admin-panel"
ssh $user@$host_ip "chmod -R 755 ${remotePath}paddock-gamification ${remotePath}paddock-admin-panel"

Write-Host "--- Despliegue completado con éxito ---" -ForegroundColor Green
Write-Host "Para finalizar, entra en la web y visita este enlace (logeado como admin):"
Write-Host "https://backendescapes.com/wp-json/paddock/v1/debug/sync-db" -ForegroundColor Yellow
