<?php

if (!defined('ABSPATH')) {
    exit;
}

class Paddock_CPT
{

    public static function init()
    {
        add_action('init', [__CLASS__, 'register_social_feed_cpt']);
        add_action('init', [__CLASS__, 'register_paddock_thread_cpt']);
        add_action('init', [__CLASS__, 'register_paddock_taxonomies']);
    }

    public static function register_social_feed_cpt()
    {
        $labels = [
            'name' => 'Social Posts',
            'singular_name' => 'Social Post',
            'menu_name' => 'Paddock Social',
            'add_new' => 'Add New Post',
            'add_new_item' => 'Add New Social Post',
            'edit_item' => 'Edit Social Post',
            'new_item' => 'New Social Post',
            'view_item' => 'View Social Post',
            'search_items' => 'Search Social Posts',
            'not_found' => 'No social posts found',
            'not_found_in_trash' => 'No social posts found in Trash',
        ];

        $args = [
            'labels' => $labels,
            'public' => true,
            'publicly_queryable' => false, // API only mostly, but public for visibility checks
            'show_ui' => true,
            'show_in_menu' => true,
            'query_var' => true,
            'rewrite' => ['slug' => 'social-post'],
            'capability_type' => 'post',
            'has_archive' => false,
            'hierarchical' => false,
            'menu_position' => 30,
            'menu_icon' => 'dashicons-groups',
            'supports' => ['title', 'editor', 'author', 'comments', 'custom-fields'],
            'show_in_rest' => true, // Enable Gutenberg editor and REST API
        ];

        register_post_type('paddock_social_post', $args);
    }

    public static function register_paddock_thread_cpt()
    {
        $labels = [
            'name' => 'Paddock Threads',
            'singular_name' => 'Thread',
            'menu_name' => 'Paddock Forum',
            'add_new' => 'Add New Thread',
            'add_new_item' => 'Add New Thread',
            'edit_item' => 'Edit Thread',
            'new_item' => 'New Thread',
            'view_item' => 'View Thread',
            'search_items' => 'Search Threads',
            'not_found' => 'No threads found',
            'not_found_in_trash' => 'No threads found in Trash',
        ];

        $args = [
            'labels' => $labels,
            'public' => true,
            'publicly_queryable' => true,
            'show_ui' => true,
            'show_in_menu' => true,
            'query_var' => true,
            'rewrite' => ['slug' => 'paddock-thread'],
            'capability_type' => 'post',
            'has_archive' => true,
            'hierarchical' => false,
            'menu_position' => 31,
            'menu_icon' => 'dashicons-format-chat',
            'supports' => ['title', 'editor', 'author', 'comments', 'custom-fields', 'thumbnail'],
            'show_in_rest' => true,
        ];

        register_post_type('paddock_thread', $args);
    }

    public static function register_paddock_taxonomies()
    {
        $labels = [
            'name' => 'Paddock Categories',
            'singular_name' => 'Paddock Category',
            'search_items' => 'Search Categories',
            'all_items' => 'All Categories',
            'parent_item' => 'Parent Category',
            'parent_item_colon' => 'Parent Category:',
            'edit_item' => 'Edit Category',
            'update_item' => 'Update Category',
            'add_new_item' => 'Add New Category',
            'new_item_name' => 'New Category Name',
            'menu_name' => 'Categories',
        ];

        $args = [
            'hierarchical' => true,
            'labels' => $labels,
            'show_ui' => true,
            'show_admin_column' => true,
            'query_var' => true,
            'rewrite' => ['slug' => 'paddock-category'],
            'show_in_rest' => true,
        ];

        register_taxonomy('paddock_category', ['paddock_thread'], $args);
    }
}
