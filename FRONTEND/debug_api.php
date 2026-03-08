<?php
require_once('/var/www/vhosts/backendescapes.com/httpdocs/wp-load.php');

echo "--- WORDPRESS CONFIG ---\n";
echo "Site URL: " . get_option('siteurl') . "\n";
echo "Home URL: " . get_option('home') . "\n";
echo "Permalink Structure: " . get_option('permalink_structure') . "\n";

echo "\n--- USER 1 STATUS ---\n";
$user = get_userdata(1);
if ($user) {
    echo "Login: " . $user->user_login . "\n";
    echo "Roles: " . implode(', ', $user->roles) . "\n";
} else {
    echo "User 1 not found.\n";
}

echo "\n--- WOOCOMMERCE API KEYS ---\n";
global $wpdb;
$keys = $wpdb->get_results("SELECT key_id, user_id, description, permissions, truncated_key FROM {$wpdb->prefix}woocommerce_api_keys");
foreach ($keys as $key) {
    echo "ID: {$key->key_id} | User: {$key->user_id} | Desc: {$key->description} | Perms: {$key->permissions} | Trunc: {$key->truncated_key}\n";
}

// Test internal request
echo "\n--- INTERNAL API TEST (Products) ---\n";
$request = new WP_REST_Request('GET', '/wc/v3/products');
$request->set_param('per_page', 1);
$response = rest_do_request($request);
echo "Status: " . $response->get_status() . "\n";
?>