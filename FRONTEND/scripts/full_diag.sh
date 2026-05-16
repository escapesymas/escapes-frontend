#!/bin/bash
WP_PATH="/var/www/vhosts/backendescapes.com/httpdocs"
DB_NAME="qapg033"

echo "=== ACTIVE PLUGINS ==="
mysql $DB_NAME -e "SELECT option_value FROM wp_options WHERE option_name='active_plugins';"

echo "\n=== MU-PLUGINS ==="
ls -la $WP_PATH/wp-content/mu-plugins/

echo "\n=== USER 1 ROLES ==="
mysql $DB_NAME -e "SELECT meta_value FROM wp_usermeta WHERE user_id=1 AND meta_key='wp_capabilities';"

echo "\n=== WP-CONFIG API CONSTANTS ==="
grep -E "REST|API" $WP_PATH/wp-config.php

echo "\n=== .HTACCESS REWRITE RULES ==="
cat $WP_PATH/.htaccess | grep -i "Authorization"

echo "\n=== WOOCOMMERCE API SETTINGS ==="
mysql $DB_NAME -e "SELECT option_value FROM wp_options WHERE option_name='woocommerce_api_enabled';"
