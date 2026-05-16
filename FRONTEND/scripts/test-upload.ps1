
$user = "backendescapes.com_css4v"
$pass = "t78!wBDuK7"
$host_ip = "212.227.134.161"
$localFile = "paddock-gamification/paddock-gamification.php"
$remotePath = "ftp://$host_ip/html/wp-content/plugins/paddock-gamification/paddock-gamification.php"

Write-Host "Attempting to upload $localFile to $remotePath..."
try {
    $webclient = New-Object System.Net.WebClient
    $webclient.Credentials = New-Object System.Net.NetworkCredential($user, $pass)
    $webclient.UploadFile($remotePath, "STOR", $localFile)
    Write-Host "✅ Upload successful!"
} catch {
    Write-Host "❌ Upload failed: $_"
}
