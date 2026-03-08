<?php
require_once('/var/www/vhosts/backendescapes.com/httpdocs/wp-load.php');
$role = get_role('administrator');
if ($role) {
    echo "--- ADMINISTRATOR CAPABILITIES ---\n";
    foreach ($role->capabilities as $cap => $granted) {
        if (strpos($cap, 'woocommerce') !== false || strpos($cap, 'view') !== false) {
            echo "$cap: " . ($granted ? 'YES' : 'NO') . "\n";
        }
    }
} else {
    echo "ERROR: Administrator role not found.\n";
}
?>