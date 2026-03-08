
import os
import subprocess

def run_sql(query):
    try:
        cmd = ["mysql", "qapg033", "-N", "-e", query]
        return subprocess.check_output(cmd).decode().strip()
    except:
        return "ERROR"

print("=== WP-CONFIG (Lines 85-110) ===")
with open("/var/www/vhosts/backendescapes.com/httpdocs/wp-config.php", "r") as f:
    lines = f.readlines()
    for i in range(84, min(110, len(lines))):
        print(f"{i+1}: {lines[i].strip()}")

print("\n=== SYSTEM INFO ===")
print(f"WooCommerce Version: {run_sql('SELECT option_value FROM wp_options WHERE option_name=\"woocommerce_version\"')}")
print(f"Permalink Structure: {run_sql('SELECT option_value FROM wp_options WHERE option_name=\"permalink_structure\"')}")
print(f"API Enabled: {run_sql('SELECT option_value FROM wp_options WHERE option_name=\"woocommerce_api_enabled\"')}")

print("\n=== SERVER VARS TEST (via PHP) ===")
php_code = '<?php echo "AUTH_HEADER: " . (isset($_SERVER["HTTP_AUTHORIZATION"]) ? "YES" : "NO") . "\\n"; ?>'
with open("/root/test_auth.php", "w") as f:
    f.write(php_code)
os.system("php /root/test_auth.php")
