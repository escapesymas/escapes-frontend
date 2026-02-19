<?php

if (!defined('ABSPATH')) {
    exit;
}

class Paddock_Admin_Menu
{

    public static function init()
    {
        add_action('admin_menu', [__CLASS__, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [__CLASS__, 'enqueue_assets']);
    }

    public static function add_admin_menu()
    {
        add_menu_page(
            'Paddock Control',
            'Paddock Panel',
            'manage_options', // Capability
            'paddock-admin',
            [__CLASS__, 'render_dashboard'],
            'dashicons-chart-pie',
            30
        );

        add_submenu_page(
            'paddock-admin',
            'Dashboard',
            'Dashboard',
            'manage_options',
            'paddock-admin',
            [__CLASS__, 'render_dashboard']
        );

        add_submenu_page(
            'paddock-admin',
            'Moderación',
            'Moderación',
            'manage_options',
            'paddock-moderation',
            [__CLASS__, 'render_moderation']
        );

        add_submenu_page(
            'paddock-admin',
            'Usuarios',
            'Usuarios (XP)',
            'manage_options',
            'paddock-users',
            [__CLASS__, 'render_users']
        );

        add_submenu_page(
            'paddock-admin',
            'Categorías',
            'Categorías Forum',
            'manage_options',
            'edit-tags.php?taxonomy=paddock_category&post_type=paddock_thread'
        );

        add_submenu_page(
            'paddock-admin',
            'Ver Hilos',
            'Hilos Forum',
            'manage_options',
            'edit.php?post_type=paddock_thread'
        );
    }

    public static function enqueue_assets($hook)
    {
        if (strpos($hook, 'paddock-') === false) {
            return;
        }
        wp_enqueue_style('paddock-admin-css', PADDOCK_ADMIN_URL . 'assets/admin.css', [], '1.0.0');
    }

    public static function render_dashboard()
    {
        include PADDOCK_ADMIN_PATH . 'views/dashboard.php';
    }

    public static function render_moderation()
    {
        include PADDOCK_ADMIN_PATH . 'views/moderation.php';
    }

    public static function render_users()
    {
        include PADDOCK_ADMIN_PATH . 'views/users.php';
    }
}
