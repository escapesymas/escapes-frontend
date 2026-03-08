<?php
require_once('/var/www/vhosts/backendescapes.com/httpdocs/wp-load.php');
if (update_option('woocommerce_api_enabled', 'yes')) {
    echo "SUCCESS: WooCommerce API enabled.\n";
} else {
    echo "INDICATOR: WooCommerce API was already enabled or failed to update.\n";
}
?>