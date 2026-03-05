<?php
// Load WordPress
$wp_load = '/var/www/vhosts/backendescapes.com/httpdocs/wp-load.php';
if (!file_exists($wp_load)) {
    die("wp-load.php not found at $wp_load\n");
}
require_once($wp_load);

global $wpdb;

$ck = 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9';
$cs = 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a';

echo "Injecting keys for user 1...\n";

// Delete existing Antigravity keys to avoid duplicates
$wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->prefix}woocommerce_api_keys WHERE description = %s", 'Antigravity API Key'));

$result = $wpdb->insert(
    $wpdb->prefix . 'woocommerce_api_keys',
    array(
        'user_id' => 1,
        'description' => 'Antigravity API Key',
        'permissions' => 'read_write',
        'consumer_key' => hash('sha256', $ck),
        'consumer_secret' => $cs,
        'truncated_key' => substr($ck, -7),
    )
);

if ($result) {
    echo "SUCCESS: Key injected successfully.\n";
} else {
    echo "ERROR: Failed to inject key: " . $wpdb->last_error . "\n";
}
?>