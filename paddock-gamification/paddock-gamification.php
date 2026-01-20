<?php
/**
 * Plugin Name: Paddock Gamification
 * Description: Sistema de rangos, XP, foro y descuentos para Escapes y Más.
 * Version: 1.0.0
 * Author: Escapes y Más
 * Text Domain: paddock-gamification
 */

// If this file is called directly, abort.
if (!defined('ABSPATH')) {
	exit;
}

// Define plugin constants
define('PADDOCK_VERSION', '1.0.0');
define('PADDOCK_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('PADDOCK_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include core classes
require_once PADDOCK_PLUGIN_DIR . 'includes/class-paddock-db.php';
// require_once PADDOCK_PLUGIN_DIR . 'includes/class-paddock-cpt.php'; // Removed: Using native posts
require_once PADDOCK_PLUGIN_DIR . 'includes/class-paddock-xp.php';
require_once PADDOCK_PLUGIN_DIR . 'includes/class-paddock-discounts.php';
require_once PADDOCK_PLUGIN_DIR . 'includes/class-paddock-api.php';

/**
 * Main Paddock Plugin Class
 */
class Paddock_Gamification
{

	public function __construct()
	{
		$this->init_hooks();
	}

	private function init_hooks()
	{
		// Activation hook for DB creation
		register_activation_hook(__FILE__, ['Paddock_DB', 'create_tables']);

		// Init Custom Post Types - REMOVED
		// add_action( 'init', [ 'Paddock_CPT', 'register_cpts' ] );

		// Init REST API
		add_action('rest_api_init', ['Paddock_API', 'register_routes']);

		// Init Discounts
		add_action('woocommerce_cart_calculate_fees', ['Paddock_Discounts', 'apply_rank_discount']);

		// Hook into native post/comment creation for XP
		add_action('transition_post_status', ['Paddock_XP', 'on_post_publish'], 10, 3);
		add_action('wp_insert_comment', ['Paddock_XP', 'on_comment_posted'], 10, 2);
	}
}

// Initialize the plugin
new Paddock_Gamification();
