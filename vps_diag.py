
import subprocess
import os

def run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, text=True)
    except subprocess.CalledProcessError as e:
        return f"ERROR: {e.output}"

print("=== WP OPTIONS ===")
print(run("mysql qapg033 -e \"SELECT option_name, option_value FROM wp_options WHERE option_name IN ('siteurl', 'home', 'permalink_structure');\""))

print("\n=== WOOCOMMERCE API KEYS ===")
print(run("mysql qapg033 -e \"SELECT user_id, description, permissions, consumer_key FROM wp_woocommerce_api_keys;\""))
