<?php
require_once('/var/www/vhosts/backendescapes.com/httpdocs/wp-load.php');
$active_plugins = get_option('active_plugins');
echo "--- ACTIVE PLUGINS ---\n";
foreach ($active_plugins as $plugin) {
    echo $plugin . "\n";
}
?>