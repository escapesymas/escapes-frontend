<?php
require_once('/var/www/vhosts/backendescapes.com/httpdocs/wp-load.php');

if (!class_exists('WC_REST_Authentication')) {
    die("WooCommerce is not active or WC_REST_Authentication missing.\n");
}

$user_id = 1;
$description = 'Antigravity Fixed Key';
$permissions = 'read_write';

// Generate keys
$consumer_key = 'ck_' . wc_generate_api_key();
$consumer_secret = 'cs_' . wc_generate_api_key();

global $wpdb;

// Delete previous attempts
$wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->prefix}woocommerce_api_keys WHERE description = %s", $description));

// WooCommerce way to save
$data = array(
    'user_id' => $user_id,
    'description' => $description,
    'permissions' => $permissions,
    'consumer_key' => hash('sha256', $consumer_key),
    'consumer_secret' => $consumer_secret,
    'truncated_key' => substr($consumer_key, -7),
);

$wpdb->insert($wpdb->prefix . 'woocommerce_api_keys', $data);

echo "NEW_CK: $consumer_key\n";
echo "NEW_CS: $consumer_secret\n";
echo "SUCCESS: Key generated and saved.\n";
?>