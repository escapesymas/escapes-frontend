<?php
/**
 * Plugin Name: Paddock Admin Panel
 * Description: Panel de control para gestionar la Red Social y el Foro Paddock.
 * Version: 1.0.0
 * Author: Escapes y Más
 * Text Domain: paddock-admin-panel
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PADDOCK_ADMIN_PATH', plugin_dir_path(__FILE__));
define('PADDOCK_ADMIN_URL', plugin_dir_url(__FILE__));

require_once PADDOCK_ADMIN_PATH . 'includes/class-paddock-admin-menu.php';

// Initialize
add_action('plugins_loaded', ['Paddock_Admin_Menu', 'init']);
