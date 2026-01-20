<?php

if (!defined('ABSPATH')) {
    exit;
}

class Paddock_CPT
{

    public static function register_cpts()
    {
        $labels = [
            'name' => 'Temas del Paddock',
            'singular_name' => 'Tema',
            'menu_name' => 'Paddock Foro',
            'name_admin_bar' => 'Tema de Paddock',
            'add_new' => 'Nuevo Tema',
            'add_new_item' => 'Añadir Nuevo Tema',
            'new_item' => 'Nuevo Tema',
            'edit_item' => 'Editar Tema',
            'view_item' => 'Ver Tema',
            'all_items' => 'Todos los Temas',
            'search_items' => 'Buscar Temas',
            'not_found' => 'No se encontraron temas.',
        ];

        $args = [
            'labels' => $labels,
            'public' => true,
            'publicly_queryable' => true,
            'show_ui' => true,
            'show_in_menu' => true,
            'query_var' => true,
            'rewrite' => ['slug' => 'paddock-topic'],
            'capability_type' => 'post',
            'has_archive' => true,
            'hierarchical' => false,
            'menu_position' => 5,
            'menu_icon' => 'dashicons-groups',
            'supports' => ['title', 'editor', 'author', 'comments', 'custom-fields'],
            'show_in_rest' => true, // Important for REST API
        ];

        register_post_type('paddock_topic', $args);

        // Registrar taxonomía de Categorías del Paddock
        $cat_labels = [
            'name' => 'Categorías',
            'singular_name' => 'Categoría',
            'search_items' => 'Buscar Categorías',
            'all_items' => 'Todas las Categorías',
            'edit_item' => 'Editar Categoría',
            'update_item' => 'Actualizar Categoría',
            'add_new_item' => 'Añadir Nueva Categoría',
            'new_item_name' => 'Nombre de Categoría',
            'menu_name' => 'Categorías',
        ];

        register_taxonomy('paddock_category', ['paddock_topic'], [
            'hierarchical' => true,
            'labels' => $cat_labels,
            'show_ui' => true,
            'show_admin_column' => true,
            'query_var' => true,
            'rewrite' => ['slug' => 'paddock-category'],
            'show_in_rest' => true,
        ]);
    }
}
