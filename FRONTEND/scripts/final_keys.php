<?php
require_once('/var/www/vhosts/backendescapes.com/httpdocs/wp-load.php');
$ck = 'ck_' . bin2hex(random_bytes(20));
$cs = 'cs_' . bin2hex(random_bytes(20));
global $wpdb;
$wpdb->insert($wpdb->prefix . 'woocommerce_api_keys', [
    'user_id' => 1,
    'description' => 'API Key Final',
    'permissions' => 'read_write',
    'consumer_key' => hash('sha256', $ck),
    'consumer_secret' => $cs,
    'truncated_key' => substr($ck, -7),
]);
echo "FINAL_CK: $ck\n";
echo "FINAL_CS: $cs\n";
?>