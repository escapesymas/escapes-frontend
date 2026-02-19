<?php

if (!defined('ABSPATH')) {
    exit;
}

class Paddock_API
{

    public static function register_routes()
    {
        // Namespace: wp-json/paddock/v1
        register_rest_route('paddock/v1', '/user/(?P<id>\d+)/stats', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'get_user_stats'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('paddock/v1', '/user/(?P<id>\d+)/rank', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'get_user_rank'],
            'permission_callback' => '__return_true',
        ]);

        // --- SOCIAL FEED ENDPOINTS ---

        register_rest_route('paddock/v1', '/feed/create', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'create_social_post'],
            'permission_callback' => [__CLASS__, 'check_auth'],
        ]);

        register_rest_route('paddock/v1', '/feed/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [__CLASS__, 'delete_post'],
            'permission_callback' => [__CLASS__, 'check_auth'],
        ]);

        register_rest_route('paddock/v1', '/feed', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'get_social_feed'],
            'permission_callback' => '__return_true',
        ]);

        // --- PADDOCK THREADS ENDPOINTS ---

        register_rest_route('paddock/v1', '/categories', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'get_paddock_categories'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('paddock/v1', '/threads', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'get_paddock_threads'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('paddock/v1', '/thread/create', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'create_paddock_thread'],
            'permission_callback' => [__CLASS__, 'check_auth'],
        ]);

        register_rest_route('paddock/v1', '/thread/(?P<id>\d+)', [
            [
                'methods' => 'GET',
                'callback' => [__CLASS__, 'get_paddock_thread'], // New method
                'permission_callback' => '__return_true',
            ],
            [
                'methods' => 'DELETE',
                'callback' => [__CLASS__, 'delete_paddock_thread'], // New method
                'permission_callback' => [__CLASS__, 'check_auth'],
            ]
        ]);

        // --- SHARED ACTIONS ---

        register_rest_route('paddock/v1', '/reply', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'create_reply'],
            'permission_callback' => [__CLASS__, 'check_auth'],
        ]);

        register_rest_route('paddock/v1', '/like', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'toggle_like'],
            'permission_callback' => [__CLASS__, 'check_auth'],
        ]);

        register_rest_route('paddock/v1', '/leaderboard', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'get_leaderboard'],
            'permission_callback' => '__return_true',
        ]);

        // --- NOTIFICATIONS ---

        register_rest_route('paddock/v1', '/notifications', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'get_notifications'],
            'permission_callback' => [__CLASS__, 'check_auth'],
        ]);

        register_rest_route('paddock/v1', '/notifications/read', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'mark_notifications_read'],
            'permission_callback' => [__CLASS__, 'check_auth'],
        ]);

        // --- FOLLOWERS ---

        register_rest_route('paddock/v1', '/follow', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'toggle_follow'],
            'permission_callback' => [__CLASS__, 'check_auth'],
        ]);

        register_rest_route('paddock/v1', '/followers', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'get_followers'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('paddock/v1', '/following', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'get_following'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('paddock/v1', '/user/(?P<id>\d+)/gallery', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'get_user_gallery'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('paddock/v1', '/user/(?P<id>\d+)/full-profile', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'get_user_full_profile'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('paddock/v1', '/users/search', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'search_users'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('paddock/v1', '/debug/sync-db', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'sync_db_manually'],
            'permission_callback' => [__CLASS__, 'check_auth'], // Admin check inside
        ]);
    }

    public static function check_auth($request)
    {
        // First check standard WP login (cookies)
        if (is_user_logged_in()) {
            return true;
        }

        // Fallback: Manually validate JWT Bearer token
        $auth_header = $request->get_header('Authorization');
        if (empty($auth_header)) {
            // Also check via server vars (some hosts strip it)
            if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
                $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
            } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
                $auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
            }
        }

        if (empty($auth_header) || strpos($auth_header, 'Bearer ') !== 0) {
            return new WP_Error('rest_forbidden', 'Debes iniciar sesión para realizar esta acción.', ['status' => 403]);
        }

        $token = trim(str_replace('Bearer', '', $auth_header));

        try {
            $secret_key = defined('JWT_AUTH_SECRET_KEY') ? JWT_AUTH_SECRET_KEY : false;
            if (!$secret_key) {
                return new WP_Error('jwt_auth_bad_config', 'JWT secret key not configured.', ['status' => 500]);
            }

            // Use the Firebase JWT library that ships with the JWT Auth plugin
            $jwt_path = WP_PLUGIN_DIR . '/jwt-authentication-for-wp-rest-api/includes/vendor/firebase/php-jwt/src/JWT.php';
            $key_path = WP_PLUGIN_DIR . '/jwt-authentication-for-wp-rest-api/includes/vendor/firebase/php-jwt/src/Key.php';

            if (file_exists($jwt_path)) {
                if (!class_exists('\\Firebase\\JWT\\JWT')) {
                    require_once $jwt_path;
                }
                if (file_exists($key_path) && !class_exists('\\Firebase\\JWT\\Key')) {
                    require_once $key_path;
                }

                // Decode token
                if (class_exists('\\Firebase\\JWT\\Key')) {
                    $decoded = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key($secret_key, 'HS256'));
                } else {
                    // Fallback for older versions (3 args, but some variants might only want 2 if keys are different)
                    // Passing as object or array explicitly
                    $decoded = \Firebase\JWT\JWT::decode($token, $secret_key, array('HS256'));
                }

                // Validate user exists safely
                if (!isset($decoded->data) || !isset($decoded->data->user) || !isset($decoded->data->user->id)) {
                    return new WP_Error('rest_forbidden', 'Token inválido o estructura inesperada.', ['status' => 403]);
                }

                $user_id = (int) $decoded->data->user->id;
                $user = get_user_by('id', $user_id);
                if (!$user) {
                    return new WP_Error('rest_forbidden', 'Usuario no encontrado.', ['status' => 403]);
                }

                // Set current user so get_current_user_id() works in callbacks
                wp_set_current_user($user->ID);
                return true;
            }

            return new WP_Error('jwt_auth_missing', 'JWT library not found.', ['status' => 500]);

        } catch (\Exception $e) {
            return new WP_Error('rest_forbidden', 'Token expirado o inválido: ' . $e->getMessage(), ['status' => 403]);
        }
    }

    // --- SOCIAL FEED METHODS ---

    public static function create_social_post($request)
    {
        $user_id = get_current_user_id();
        $content = sanitize_textarea_field($request['content']);
        $media_ids = isset($request['media_ids']) ? $request['media_ids'] : []; // Array of attachment IDs

        if (empty($content) && empty($media_ids)) {
            return new WP_REST_Response(['success' => false, 'message' => 'Contenido vacío'], 400);
        }

        $post_data = [
            'post_type' => 'paddock_social_post',
            'post_title' => 'Update by ' . wp_get_current_user()->display_name, // Placeholder title
            'post_content' => $content,
            'post_status' => 'publish',
            'post_author' => $user_id,
        ];

        $post_id = wp_insert_post($post_data);

        if (is_wp_error($post_id)) {
            return new WP_REST_Response(['success' => false, 'message' => $post_id->get_error_message()], 500);
        }

        // Handle Media Attachments (Save as post meta or attachment parent update)
        if (!empty($media_ids) && is_array($media_ids)) {
            update_post_meta($post_id, '_social_media_ids', $media_ids);
            // Optionally attach them strictly if they were uploaded unattached
            foreach ($media_ids as $att_id) {
                wp_update_post(['ID' => $att_id, 'post_parent' => $post_id]);
            }
        }

        // Award XP
        Paddock_XP::update_stat($user_id, 'total_posts', 1);
        Paddock_XP::award_xp($user_id, 15, 'social_post_create'); // 15 XP for status update

        return new WP_REST_Response(['success' => true, 'id' => $post_id], 201);
    }

    public static function get_social_feed($request)
    {
        $page = isset($request['page']) ? intval($request['page']) : 1;
        $per_page = 10;

        $args = [
            'post_type' => 'paddock_social_post',
            'post_status' => 'publish',
            'paged' => $page,
            'posts_per_page' => $per_page,
            'orderby' => 'date',
            'order' => 'DESC'
        ];

        $query = new WP_Query($args);
        $posts = [];

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post_id = get_the_ID();
                $author_id = get_the_author_meta('ID');

                // Get Media
                $media_ids = get_post_meta($post_id, '_social_media_ids', true);
                $media_urls = [];
                if (!empty($media_ids) && is_array($media_ids)) {
                    foreach ($media_ids as $mid) {
                        $url = wp_get_attachment_url($mid);
                        if ($url)
                            $media_urls[] = $url;
                    }
                }

                $posts[] = [
                    'id' => $post_id,
                    'content' => get_the_content(),
                    'author' => [
                        'id' => $author_id,
                        'name' => get_the_author_meta('display_name'),
                        'avatar' => get_avatar_url($author_id),
                        'rank' => Paddock_XP::get_user_rank_data($author_id)
                    ],
                    'date' => get_the_date('c'),
                    'media' => $media_urls,
                    'likes_count' => self::get_like_count($post_id, 'social_post'),
                    'shares_count' => self::get_share_count($post_id),
                    'is_liked' => self::is_liked_by_user($post_id, 'social_post'),
                    'comments_count' => get_comments_number(),
                    'latest_comments' => self::get_latest_comments($post_id, 3)
                ];
            }
            wp_reset_postdata();
        }

        return new WP_REST_Response([
            'data' => $posts,
            'has_more' => $query->max_num_pages > $page
        ], 200);
    }

    // --- PADDOCK THREADS METHODS ---

    public static function get_paddock_categories($request)
    {
        $terms = get_terms([
            'taxonomy' => 'paddock_category',
            'hide_empty' => false,
        ]);

        if (is_wp_error($terms)) {
            return new WP_REST_Response([], 200);
        }

        $categories = array_map(function ($term) {
            return [
                'id' => $term->term_id,
                'name' => $term->name,
                'slug' => $term->slug,
                'count' => $term->count,
                'description' => $term->description
            ];
        }, $terms);

        return new WP_REST_Response($categories, 200);
    }

    public static function create_paddock_thread($request)
    {
        $user_id = get_current_user_id();
        $title = sanitize_text_field($request['title']);
        $content = wp_kses_post($request['content']); // Allow some HTML
        $category_id = intval($request['category_id']);

        if (empty($title) || empty($content)) {
            return new WP_REST_Response(['success' => false, 'message' => 'Título y contenido requeridos'], 400);
        }

        $post_data = [
            'post_type' => 'paddock_thread',
            'post_title' => $title,
            'post_content' => $content,
            'post_status' => 'publish',
            'post_author' => $user_id,
        ];

        $post_id = wp_insert_post($post_data);

        if (is_wp_error($post_id)) {
            return new WP_REST_Response(['success' => false, 'message' => $post_id->get_error_message()], 500);
        }

        // Set Category
        if ($category_id) {
            wp_set_object_terms($post_id, $category_id, 'paddock_category');
        }

        // Award XP
        Paddock_XP::update_stat($user_id, 'total_posts', 1);
        Paddock_XP::award_xp($user_id, 30, 'thread_create'); // Higher XP for threads

        return new WP_REST_Response(['success' => true, 'id' => $post_id], 201);
    }

    public static function get_paddock_threads($request)
    {
        $category_id = $request->get_param('category_id');
        $page = isset($request['page']) ? intval($request['page']) : 1;

        $args = [
            'post_type' => 'paddock_thread',
            'post_status' => 'publish',
            'paged' => $page,
            'posts_per_page' => 15,
            'orderby' => 'date',
            'order' => 'DESC'
        ];

        if (!empty($category_id)) {
            $args['tax_query'] = [
                [
                    'taxonomy' => 'paddock_category',
                    'field' => 'term_id',
                    'terms' => $category_id
                ]
            ];
        }

        $query = new WP_Query($args);
        $threads = [];

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post_id = get_the_ID();
                $author_id = get_the_author_meta('ID');

                $threads[] = [
                    'id' => $post_id,
                    'title' => get_the_title(),
                    'content' => wp_trim_words(get_the_content(), 20),
                    'author' => [
                        'name' => get_the_author_meta('display_name'),
                        'avatar' => get_avatar_url($author_id)
                    ],
                    'date' => get_the_date('c'),
                    'likes_count' => self::get_like_count($post_id, 'paddock_thread'),
                    'shares_count' => self::get_share_count($post_id),
                    'comments_count' => get_comments_number(),
                    'categories' => wp_get_post_terms($post_id, 'paddock_category', ['fields' => 'names'])
                ];
            }
            wp_reset_postdata();
        }

        return new WP_REST_Response([
            'data' => $threads,
            'has_more' => $query->max_num_pages > $page
        ], 200);
    }

    // --- EXTENDED ACTIONS (FRIENDS & SHARES) ---

    public static function delete_post($request)
    {
        $user_id = get_current_user_id();
        $post_id = $request['id'];

        $post = get_post($post_id);

        if (!$post) {
            return new WP_REST_Response(['success' => false, 'message' => 'Post no encontrado'], 404);
        }

        if ($post->post_author != $user_id && !current_user_can('manage_options')) {
            return new WP_REST_Response(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $deleted = wp_trash_post($post_id);

        if (!$deleted) {
            return new WP_REST_Response(['success' => false, 'message' => 'Error al borrar'], 500);
        }

        Paddock_XP::update_stat($post->post_author, 'total_posts', -1);

        return new WP_REST_Response(['success' => true, 'id' => $post_id], 200);
    }

    public static function share_content($request)
    {
        global $wpdb;
        $user_id = get_current_user_id();
        $post_id = intval($request['post_id']);
        $platform = sanitize_text_field($request['platform']) ?: 'internal';

        $table = $wpdb->prefix . 'paddock_shares';

        $wpdb->insert($table, [
            'user_id' => $user_id,
            'post_id' => $post_id,
            'platform' => $platform
        ]);

        Paddock_XP::update_stat($user_id, 'total_shares', 1);
        Paddock_XP::award_xp($user_id, 5, 'share_content');

        return new WP_REST_Response(['success' => true], 200);
    }

    public static function friend_request_action($request)
    {
        global $wpdb;
        $user_id = get_current_user_id();
        $target_id = intval($request['target_id']);
        $action = $request['action'];

        $table = $wpdb->prefix . 'paddock_friends';

        $id1 = min($user_id, $target_id);
        $id2 = max($user_id, $target_id);

        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE user_id_1 = %d AND user_id_2 = %d",
            [$id1, $id2]
        ));

        if ($action === 'send') {
            if ($existing)
                return new WP_REST_Response(['success' => false, 'message' => 'Solicitud ya existe'], 400);
            $wpdb->insert($table, ['user_id_1' => $id1, 'user_id_2' => $id2, 'status' => 'pending']);

            // Notification for the recipient
            $recipient = ($id1 == $user_id) ? $id2 : $id1;
            self::add_notification($recipient, $user_id, 'friend_request', 'user', $user_id);

            return new WP_REST_Response(['success' => true, 'status' => 'pending'], 200);
        }

        if ($action === 'accept') {
            if (!$existing || $existing->status !== 'pending')
                return new WP_REST_Response(['success' => false, 'message' => 'Solicitud inválida'], 400);
            $wpdb->update($table, ['status' => 'accepted'], ['id' => $existing->id]);
            Paddock_XP::update_stat($id1, 'total_friends', 1);
            Paddock_XP::update_stat($id2, 'total_friends', 1);

            // Notification for the one who sent it (the other user accepted)
            $other_user = ($id1 == $user_id) ? $id2 : $id1;
            self::add_notification($other_user, $user_id, 'friend_accept', 'user', $user_id);

            return new WP_REST_Response(['success' => true, 'status' => 'accepted'], 200);
        }

        if ($action === 'remove' || $action === 'reject') {
            if ($existing) {
                $wpdb->delete($table, ['id' => $existing->id]);
                if ($existing->status === 'accepted') {
                    Paddock_XP::update_stat($id1, 'total_friends', -1);
                    Paddock_XP::update_stat($id2, 'total_friends', -1);
                }
            }
            return new WP_REST_Response(['success' => true, 'status' => 'removed'], 200);
        }

        return new WP_REST_Response(['success' => false, 'message' => 'Acción no válida'], 400);
    }

    public static function get_friends_list($request)
    {
        global $wpdb;
        $user_id = isset($request['user_id']) ? intval($request['user_id']) : get_current_user_id();
        $table = $wpdb->prefix . 'paddock_friends';

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE (user_id_1 = %d OR user_id_2 = %d) AND status = 'accepted'",
            [$user_id, $user_id]
        ));

        $friends = [];
        foreach ($results as $row) {
            $friend_id = ($row->user_id_1 == $user_id) ? $row->user_id_2 : $row->user_id_1;
            $user_info = get_userdata($friend_id);
            if ($user_info) {
                $friends[] = [
                    'id' => $friend_id,
                    'name' => $user_info->display_name,
                    'avatar' => get_avatar_url($friend_id),
                    'rank' => Paddock_XP::get_user_rank_data($friend_id)
                ];
            }
        }
        return new WP_REST_Response($friends, 200);
    }

    public static function get_full_profile($request)
    {
        $user_id = $request['id'];
        $base_stats = self::get_user_stats($request)->get_data(); // Reuse existing method
        $rank = Paddock_XP::get_user_rank_data($user_id);

        $user_info = get_userdata($user_id);
        if (!$user_info)
            return new WP_REST_Response(['error' => 'User not found'], 404);

        $current_user = get_current_user_id();
        $friendship = 'none';
        if ($current_user && $current_user != $user_id) {
            global $wpdb;
            $table = $wpdb->prefix . 'paddock_friends';
            $id1 = min($user_id, $current_user);
            $id2 = max($user_id, $current_user);
            $row = $wpdb->get_row($wpdb->prepare("SELECT status FROM $table WHERE user_id_1 = %d AND user_id_2 = %d", $id1, $id2));
            if ($row)
                $friendship = $row->status;
        }

        $profile = [
            'id' => $user_id,
            'name' => $user_info->display_name,
            'avatar' => get_avatar_url($user_id),
            'bio' => get_user_meta($user_id, 'description', true),
            'stats' => $base_stats,
            'rank' => $rank,
            'friendship_status' => $friendship
        ];

        return new WP_REST_Response($profile, 200);
    }

    public static function search_users($request)
    {
        $search_term = sanitize_text_field($request['q']);
        if (empty($search_term) || strlen($search_term) < 2) {
            return new WP_REST_Response([], 200);
        }

        $users = get_users([
            'search' => "*{$search_term}*",
            'search_columns' => ['user_login', 'user_nicename', 'display_name', 'user_email'],
            'number' => 20
        ]);

        $results = [];
        foreach ($users as $user) {
            $results[] = [
                'id' => $user->ID,
                'name' => $user->display_name,
                'avatar' => get_avatar_url($user->ID),
                'rank' => Paddock_XP::get_user_rank_data($user->ID)
            ];
        }

        return new WP_REST_Response($results, 200);
    }

    // --- SHARED METHODS ---

    public static function create_reply($request)
    {
        $user_id = get_current_user_id();
        $post_id = intval($request['post_id']);
        $content = sanitize_text_field($request['content']);

        if (empty($content) || !$post_id) {
            return new WP_REST_Response(['success' => false, 'message' => 'Datos inválidos'], 400);
        }

        $comment_data = [
            'comment_post_ID' => $post_id,
            'comment_content' => $content,
            'user_id' => $user_id,
            'comment_approved' => 1,
        ];

        $comment_id = wp_insert_comment($comment_data);

        if (!$comment_id) {
            return new WP_REST_Response(['success' => false, 'message' => 'Error al guardar comentario'], 500);
        }

        // Award XP
        Paddock_XP::update_stat($user_id, 'total_replies', 1);
        Paddock_XP::award_xp($user_id, 5, 'reply_create');

        // Notification for post author
        $post = get_post($post_id);
        if ($post && $post->post_author != $user_id) {
            $type = ($post->post_type === 'paddock_thread') ? 'thread' : 'post';
            self::add_notification($post->post_author, $user_id, 'reply', $type, $post_id);
        }

        return new WP_REST_Response(['success' => true, 'id' => $comment_id], 201);
    }

    // Updated Like Toggle to standard 'social_post' or 'paddock_thread' handling if needed,
    // but the existing DB approach uses 'target_id' and 'target_type'.
    // We will standardize 'target_type' to be 'social_post' or 'paddock_thread' or 'comment'.

    public static function toggle_like($request)
    {
        global $wpdb;
        $user_id = get_current_user_id();
        $target_type = $request['target_type']; // 'social_post', 'paddock_thread', 'comment'
        $target_id = $request['target_id'];

        if (!$user_id) {
            return new WP_REST_Response(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        // Determine Author ID based on type
        $author_id = 0;
        if (in_array($target_type, ['social_post', 'paddock_thread', 'post'])) {
            $post = get_post($target_id);
            if ($post)
                $author_id = $post->post_author;
        } elseif ($target_type === 'comment') {
            $comment = get_comment($target_id);
            if ($comment)
                $author_id = $comment->user_id;
        }

        if ($author_id == $user_id) {
            return new WP_REST_Response(['success' => false, 'message' => 'No puedes dar like a tu propio contenido'], 400);
        }

        $table_likes = $wpdb->prefix . 'paddock_likes';

        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM $table_likes WHERE user_id = %d AND target_type = %s AND target_id = %d",
            [$user_id, $target_type, $target_id]
        ));

        $is_liked = false;

        if ($existing) {
            $wpdb->delete($table_likes, ['id' => $existing->id]);
            $is_liked = false;
        } else {
            $wpdb->insert($table_likes, [
                'user_id' => $user_id,
                'target_type' => $target_type,
                'target_id' => $target_id
            ]);
            $is_liked = true;

            // Award XP to author
            if ($author_id && $author_id != $user_id) {
                Paddock_XP::award_xp($author_id, Paddock_XP::XP_RECEIVE_LIKE, 'receive_like');
                Paddock_XP::update_stat($author_id, 'total_likes_received', 1);

                // Notification
                self::add_notification($author_id, $user_id, 'like', $target_type, $target_id);
            }
        }

        $likes_count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_likes WHERE target_type = %s AND target_id = %d",
            $target_type,
            $target_id
        ));

        return new WP_REST_Response(['liked' => $is_liked, 'likeCount' => (int) $likes_count], 200);
    }

    private static function get_share_count($post_id)
    {
        global $wpdb;
        $table_shares = $wpdb->prefix . 'paddock_shares';
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_shares WHERE post_id = %d",
            [$post_id]
        ));
    }

    private static function get_like_count($target_id, $target_type)
    {
        global $wpdb;
        $table_likes = $wpdb->prefix . 'paddock_likes';
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_likes WHERE target_type = %s AND target_id = %d",
            [$target_type, $target_id]
        ));
    }

    private static function is_liked_by_user($target_id, $target_type)
    {
        global $wpdb;
        $user_id = get_current_user_id();
        if (!$user_id)
            return false;
        $table_likes = $wpdb->prefix . 'paddock_likes';
        return (bool) $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table_likes WHERE target_type = %s AND target_id = %d AND user_id = %d",
            [$target_type, $target_id, $user_id]
        ));
    }

    private static function get_latest_comments($post_id, $number = 3)
    {
        $comments = get_comments([
            'post_id' => $post_id,
            'number' => $number,
            'status' => 'approve',
            'orderby' => 'comment_date',
            'order' => 'DESC'
        ]);

        $data = [];
        foreach ($comments as $c) {
            $data[] = [
                'id' => $c->comment_ID,
                'author' => $c->comment_author,
                'content' => $c->comment_content,
                'date' => $c->comment_date
            ];
        }
        return array_reverse($data); // Return oldest to newest for display usually, but here we just send list
    }

    public static function get_user_stats($request)
    {
        global $wpdb;
        $user_id = $request['id'];
        $table = $wpdb->prefix . 'paddock_user_stats';

        $stats = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE user_id = %d", $user_id));

        if (!$stats) {
            Paddock_XP::ensure_user_stats($user_id);
            $stats = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE user_id = %d", $user_id));
        }

        return new WP_REST_Response($stats, 200);
    }

    public static function get_user_rank($request)
    {
        $user_id = $request['id'];
        $rank_data = Paddock_XP::get_user_rank_data($user_id);
        return new WP_REST_Response($rank_data, 200);
    }

    public static function get_leaderboard($request)
    {
        global $wpdb;
        $limit = isset($request['limit']) ? intval($request['limit']) : 10;
        $table = $wpdb->prefix . 'paddock_user_stats';

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT user_id, xp, level, total_posts, total_likes_received FROM $table ORDER BY xp DESC LIMIT %d",
            [$limit]
        ));

        $leaderboard = [];
        foreach ($results as $row) {
            $user_info = get_userdata($row->user_id);
            if ($user_info) {
                $rank_data = Paddock_XP::get_user_rank_data($row->user_id);
                $leaderboard[] = [
                    'user_id' => $row->user_id,
                    'name' => $user_info->display_name,
                    'avatar' => get_avatar_url($row->user_id),
                    'xp' => (int) $row->xp,
                    'level' => (int) $row->level,
                    'rank_title' => $rank_data['title'],
                    'stats' => [
                        'posts' => (int) $row->total_posts,
                        'likes' => (int) $row->total_likes_received
                    ]
                ];
            }
        }

        return new WP_REST_Response($leaderboard, 200);
    }
    public static function get_paddock_thread($request)
    {
        $thread_id = $request['id'];
        $post = get_post($thread_id);

        if (!$post || $post->post_type !== 'paddock_thread' || $post->post_status !== 'publish') {
            return new WP_REST_Response(['message' => 'Hilo no encontrado'], 404);
        }

        // Prepare thread data (reuse logic from get_paddock_threads if possible, but for one)
        $thread = [
            'id' => $post->ID,
            'title' => $post->post_title,
            'content' => apply_filters('the_content', $post->post_content),
            'author' => [
                'id' => $post->post_author,
                'name' => get_the_author_meta('display_name', $post->post_author),
                'avatar' => get_avatar_url($post->post_author),
                'rank' => Paddock_XP::get_user_rank_data($post->post_author)
            ],
            'metrics' => [
                'views' => (int) get_post_meta($post->ID, '_view_count', true),
                'replies' => (int) $post->comment_count,
                'likes' => self::get_like_count($post->ID, 'paddock_thread')
            ],
            'is_pinned' => (bool) get_post_meta($post->ID, '_is_pinned', true),
            'created_at' => get_the_date('c', $post->ID)
        ];

        // Increment view count
        $views = (int) get_post_meta($post->ID, '_view_count', true);
        update_post_meta($post->ID, '_view_count', $views + 1);

        // Fetch replies (comments)
        $comments = get_comments([
            'post_id' => $thread_id,
            'status' => 'approve',
            'order' => 'ASC'
        ]);

        $replies = [];
        foreach ($comments as $comment) {
            $replies[] = [
                'id' => $comment->comment_ID,
                'content' => $comment->comment_content,
                'author' => [
                    'id' => $comment->user_id,
                    'name' => $comment->comment_author,
                    'avatar' => get_avatar_url($comment->user_id),
                    'rank' => Paddock_XP::get_user_rank_data($comment->user_id)
                ],
                'created_at' => $comment->comment_date,
                'likes' => self::get_like_count($comment->comment_ID, 'reply'),
                'is_liked' => is_user_logged_in() ? self::is_liked_by_user($comment->comment_ID, 'reply') : false
            ];
        }

        return new WP_REST_Response(['thread' => $thread, 'replies' => $replies], 200);
    }

    public static function delete_paddock_thread($request)
    {
        $user_id = get_current_user_id();
        $thread_id = $request['id'];
        $post = get_post($thread_id);

        if (!$post || $post->post_type !== 'paddock_thread') {
            return new WP_REST_Response(['success' => false, 'message' => 'Hilo no encontrado'], 404);
        }

        if ($post->post_author != $user_id && !current_user_can('manage_options')) {
            return new WP_REST_Response(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $deleted = wp_trash_post($thread_id);

        if (!$deleted) {
            return new WP_REST_Response(['success' => false, 'message' => 'Error al borrar'], 500);
        }

        return new WP_REST_Response(['success' => true], 200);
    }

    // --- NOTIFICATION HELPERS ---

    public static function add_notification($user_id, $actor_id, $type, $target_type, $target_id)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'paddock_notifications';

        $wpdb->insert($table, [
            'user_id' => $user_id,
            'actor_id' => $actor_id,
            'type' => $type,
            'target_type' => $target_type,
            'target_id' => $target_id,
            'is_read' => 0
        ]);
    }

    public static function get_notifications($request)
    {
        global $wpdb;
        $user_id = get_current_user_id();
        $table = $wpdb->prefix . 'paddock_notifications';

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d ORDER BY created_at DESC LIMIT 50",
            $user_id
        ));

        $notifications = [];
        foreach ($results as $row) {
            $actor = get_userdata($row->actor_id);
            $notifications[] = [
                'id' => (int) $row->id,
                'type' => $row->type,
                'target_type' => $row->target_type,
                'target_id' => (int) $row->target_id,
                'actor' => [
                    'id' => $row->actor_id,
                    'name' => $actor ? $actor->display_name : 'Usuario',
                    'avatar' => get_avatar_url($row->actor_id)
                ],
                'is_read' => (bool) $row->is_read,
                'created_at' => $row->created_at
            ];
        }

        return new WP_REST_Response($notifications, 200);
    }

    public static function mark_notifications_read($request)
    {
        global $wpdb;
        $user_id = get_current_user_id();
        $table = $wpdb->prefix . 'paddock_notifications';

        $wpdb->update($table, ['is_read' => 1], ['user_id' => $user_id]);

        return new WP_REST_Response(['success' => true], 200);
    }

    // --- FOLLOWER METHODS ---

    public static function toggle_follow($request)
    {
        global $wpdb;
        $user_id = get_current_user_id();
        $target_id = intval($request['target_id']);

        if (!$user_id || !$target_id || $user_id == $target_id) {
            return new WP_REST_Response(['success' => false, 'message' => 'ID inválido'], 400);
        }

        $table = $wpdb->prefix . 'paddock_followers';

        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM $table WHERE user_id = %d AND follower_id = %d",
            $target_id,
            $user_id
        ));

        if ($existing) {
            $wpdb->delete($table, ['id' => $existing->id]);
            return new WP_REST_Response(['following' => false], 200);
        } else {
            $wpdb->insert($table, [
                'user_id' => $target_id,
                'follower_id' => $user_id
            ]);

            // Notification
            self::add_notification($target_id, $user_id, 'follow', 'user', $user_id);

            // Optional: XP to the one followed? (Typically not, to avoid follow-unfollow farming)
            // But XP to the follower for being active? 
            Paddock_XP::award_xp($user_id, 2, 'follow_user');

            return new WP_REST_Response(['following' => true], 200);
        }
    }

    public static function get_followers($request)
    {
        global $wpdb;
        $user_id = intval($request['user_id']) ?: get_current_user_id();
        $table = $wpdb->prefix . 'paddock_followers';

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT follower_id FROM $table WHERE user_id = %d ORDER BY created_at DESC",
            $user_id
        ));

        $followers = [];
        foreach ($results as $row) {
            $user = get_userdata($row->follower_id);
            if ($user) {
                $followers[] = [
                    'id' => $row->follower_id,
                    'name' => $user->display_name,
                    'avatar' => get_avatar_url($row->follower_id),
                    'rank' => Paddock_XP::get_user_rank_data($row->follower_id)
                ];
            }
        }

        return new WP_REST_Response($followers, 200);
    }

    public static function get_following($request)
    {
        global $wpdb;
        $user_id = intval($request['user_id']) ?: get_current_user_id();
        $table = $wpdb->prefix . 'paddock_followers';

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT user_id FROM $table WHERE follower_id = %d ORDER BY created_at DESC",
            $user_id
        ));

        $following = [];
        foreach ($results as $row) {
            $user = get_userdata($row->user_id);
            if ($user) {
                $following[] = [
                    'id' => $row->user_id,
                    'name' => $user->display_name,
                    'avatar' => get_avatar_url($row->user_id),
                    'rank' => Paddock_XP::get_user_rank_data($row->user_id)
                ];
            }
        }

        return new WP_REST_Response($following, 200);
    }

    public static function get_user_gallery($request)
    {
        $user_id = $request['id'];

        // Find all social posts by this user that have media
        $args = [
            'post_type' => 'paddock_social_post',
            'author' => $user_id,
            'posts_per_page' => 50,
            'meta_query' => [
                [
                    'key' => '_social_media_ids',
                    'compare' => 'EXISTS'
                ]
            ]
        ];

        $query = new WP_Query($args);
        $gallery = [];

        foreach ($query->posts as $post) {
            $media_ids = get_post_meta($post->ID, '_social_media_ids', true);
            if (!empty($media_ids) && is_array($media_ids)) {
                foreach ($media_ids as $media_id) {
                    $url = wp_get_attachment_url($media_id);
                    if ($url) {
                        $gallery[] = [
                            'id' => $media_id,
                            'url' => $url,
                            'post_id' => $post->ID,
                            'created_at' => $post->post_date
                        ];
                    }
                }
            }
        }

        return new WP_REST_Response($gallery, 200);
    }

    public static function sync_db_manually($request)
    {
        if (!current_user_can('manage_options')) {
            return new WP_REST_Response(['success' => false, 'message' => 'Solo administradores'], 403);
        }

        require_once PADDOCK_PLUGIN_DIR . 'includes/class-paddock-db.php';
        Paddock_DB::create_tables();

        return new WP_REST_Response(['success' => true, 'message' => 'Tablas sincronizadas'], 200);
    }

    public static function get_user_full_profile($request)
    {
        global $wpdb;
        $user_id = (int) $request['id'];
        $current_user_id = get_current_user_id();
        $user = get_userdata($user_id);

        if (!$user) {
            return new WP_REST_Response(['message' => 'Usuario no encontrado'], 404);
        }

        // Stats from custom table
        $table_stats = $wpdb->prefix . 'paddock_user_stats';
        $stats = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_stats WHERE user_id = %d", $user_id));

        // Friendship status
        $friendship_status = 'none';
        if ($current_user_id && $current_user_id != $user_id) {
            $table_friends = $wpdb->prefix . 'paddock_friends';
            $id1 = min($current_user_id, $user_id);
            $id2 = max($current_user_id, $user_id);
            $friendship = $wpdb->get_row($wpdb->prepare(
                "SELECT status FROM $table_friends WHERE user_id_1 = %d AND user_id_2 = %d",
                $id1,
                $id2
            ));
            if ($friendship) {
                $friendship_status = $friendship->status;
            }
        } elseif ($current_user_id == $user_id) {
            $friendship_status = 'self';
        }

        // Recent posts
        $posts_args = [
            'post_type' => 'paddock_social_post',
            'author' => $user_id,
            'posts_per_page' => 10,
            'post_status' => 'publish'
        ];
        $posts_query = new WP_Query($posts_args);
        $posts = [];
        foreach ($posts_query->posts as $post) {
            $posts[] = self::get_social_post_data($post);
        }

        return new WP_REST_Response([
            'id' => $user_id,
            'name' => $user->display_name,
            'avatar' => get_avatar_url($user_id),
            'bio' => get_user_meta($user_id, 'description', true),
            'rank' => Paddock_XP::get_user_rank_data($user_id),
            'stats' => [
                'posts' => $stats ? (int) $stats->total_posts : 0,
                'friends' => $stats ? (int) $stats->total_friends : 0,
                'likes_received' => $stats ? (int) $stats->total_likes_received : 0,
                'xp' => $stats ? (int) $stats->xp : 0,
                'level' => $stats ? (int) $stats->level : 1
            ],
            'friendship_status' => $friendship_status,
            'posts' => $posts
        ], 200);
    }

    private static function get_social_post_data($post)
    {
        $media_ids = get_post_meta($post->ID, '_social_media_ids', true);
        $media_urls = [];
        if (!empty($media_ids) && is_array($media_ids)) {
            foreach ($media_ids as $id) {
                $url = wp_get_attachment_url($id);
                if ($url)
                    $media_urls[] = $url;
            }
        }

        return [
            'id' => $post->ID,
            'author' => [
                'id' => $post->post_author,
                'name' => get_the_author_meta('display_name', $post->post_author),
                'avatar' => get_avatar_url($post->post_author),
                'rank' => Paddock_XP::get_user_rank_data($post->post_author)
            ],
            'content' => $post->post_content,
            'media' => $media_urls,
            'metrics' => [
                'likes' => self::get_like_count($post->ID, 'social_post'),
                'comments' => $post->comment_count,
                'shares' => (int) get_post_meta($post->ID, '_share_count', true)
            ],
            'is_liked' => is_user_logged_in() ? self::is_liked_by_user($post->ID, 'social_post') : false,
            'created_at' => get_the_date('c', $post->ID)
        ];
    }
}
