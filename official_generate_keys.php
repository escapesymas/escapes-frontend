<?php
require_once('/var/www/vhosts/backendescapes.com/httpdocs/wp-load.php');

if (!class_exists('WooCommerce')) {
    die("WooCommerce not found.\n");
}

// Ensure the REST API classes are loaded
if (!class_exists('WC_REST_Authentication')) {
    include_once WC_ABSPATH . 'includes/class-wc-api.php';
}

$user_id = 1;
$description = 'Official API Key';

// We'll use the WC_API_Keys class if available, or just the standard hashing if we can confirm it.
// Actually, let's use the WP-CLI logic if we can mock it.
// Or just generate them and save them via the proper DB method.

$consumer_key = 'ck_' . bin2hex(random_bytes(20));
$consumer_secret = 'cs_' . bin2hex(random_bytes(20));

global $wpdb;

$data = array(
    'user_id' => $user_id,
    'description' => $description,
    'permissions' => 'read_write',
    'consumer_key' => hash('sha256', $consumer_key),
    'consumer_secret' => $consumer_secret,
    'truncated_key' => substr($consumer_key, -7),
);

$wpdb->insert($wpdb->prefix . 'woocommerce_api_keys', $data);

echo "CK: $consumer_key\n";
echo "CS: $consumer_secret\n";
echo "SUCCESS\n";
?>
health_check_and_cleanup();