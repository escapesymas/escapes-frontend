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

        register_rest_route('paddock/v1', '/activity', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'register_activity'],
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
    }

    public static function check_auth($request)
    {
        // Check for logged in user via standard WP cookies or JWT
        return is_user_logged_in();
    }

    public static function get_user_stats($request)
    {
        global $wpdb;
        $user_id = $request['id'];
        $table = $wpdb->prefix . 'paddock_user_stats';

        $stats = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE user_id = %d", $user_id));

        if (!$stats) {
            // Initialize if not exists
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

    public static function register_activity($request)
    {
        $user_id = get_current_user_id();
        $type = $request['type']; // 'post' or 'reply'
        $target_id = $request['target_id'];

        if ($type === 'post') {
            Paddock_XP::update_stat($user_id, 'total_posts', 1);
            Paddock_XP::award_xp($user_id, Paddock_XP::XP_CREATE_TOPIC, 'create_topic');
        } elseif ($type === 'reply') {
            Paddock_XP::update_stat($user_id, 'total_replies', 1);
            Paddock_XP::award_xp($user_id, Paddock_XP::XP_CREATE_REPLY, 'create_reply');
        }

        $new_rank = Paddock_XP::get_user_rank_data($user_id);
        return new WP_REST_Response(['success' => true, 'new_stats' => $new_rank], 200);
    }

    public static function get_topics($request)
    {
        global $wpdb;
        $user_id = get_current_user_id();
        $table_likes = $wpdb->prefix . 'paddock_likes';

        // Use native WP_Query to fetch posts
        $category_id = $request->get_param('category_id');

        $args = [
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => 20,
            'orderby' => 'date',
            'order' => 'DESC'
        ];

        if (!empty($category_id)) {
            $args['cat'] = intval($category_id);
        }

        $query = new WP_Query($args);
        $topics = [];

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post_id = get_the_ID();

                // Get like count
                $likes_count = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM $table_likes WHERE target_type = 'topic' AND target_id = %d",
                    $post_id
                ));

                // Check if user liked
                $liked_by_user = false;
                if ($user_id) {
                    $liked_by_user = $wpdb->get_var($wpdb->prepare(
                        "SELECT id FROM $table_likes WHERE target_type = 'topic' AND target_id = %d AND user_id = %d",
                        $post_id,
                        $user_id
                    ));
                }

                $topics[] = [
                    'id' => $post_id,
                    'title' => get_the_title(),
                    'content' => get_the_content(),
                    'author' => get_the_author(),
                    'author_id' => get_the_author_meta('ID'),
                    'date' => get_the_date('c'),
                    'comment_count' => get_comments_number(),
                    'link' => get_permalink(),
                    'likes' => (int) $likes_count,
                    'is_liked' => (bool) $liked_by_user
                ];
            }
            wp_reset_postdata();
        }

        return new WP_REST_Response($topics, 200);
    }

    public static function toggle_like($request)
    {
        global $wpdb;
        $user_id = get_current_user_id();
        $target_type = $request['target_type'];
        $target_id = $request['target_id'];

        if (!$user_id) {
            return new WP_REST_Response(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        // Get Author ID
        $author_id = 0;
        if ($target_type === 'topic') {
            $post = get_post($target_id);
            if ($post)
                $author_id = $post->post_author;
        } else {
            $comment = get_comment($target_id);
            if ($comment)
                $author_id = $comment->user_id;
        }

        // PREVENT SELF LIKES
        if ($author_id == $user_id) {
            return new WP_REST_Response(['success' => false, 'message' => 'No puedes dar like a tu propio contenido', 'liked' => false], 400);
        }

        $table_likes = $wpdb->prefix . 'paddock_likes';

        // Check if already liked
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM $table_likes WHERE user_id = %d AND target_type = %s AND target_id = %d",
            $user_id,
            $target_type,
            $target_id
        ));

        $is_liked = false;

        if ($existing) {
            // Unlike
            $wpdb->delete($table_likes, ['id' => $existing->id]);
            $is_liked = false;
            // NOTE: We do not remove XP from author to avoid negative feelings, or we could? 
            // User request regarding undoing XP was not specified, but typically we don't revoke.
        } else {
            // Like
            $wpdb->insert($table_likes, [
                'user_id' => $user_id,
                'target_type' => $target_type,
                'target_id' => $target_id
            ]);
            $is_liked = true;

            // Award XP ONLY to the Author (Receiver), NOT the Liker
            if ($author_id && $author_id != $user_id) {
                Paddock_XP::award_xp($author_id, Paddock_XP::XP_RECEIVE_LIKE, 'receive_like');
                Paddock_XP::update_stat($author_id, 'total_likes_received', 1);
            }
        }

        // Get updated count
        $likes_count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_likes WHERE target_type = %s AND target_id = %d",
            $target_type,
            $target_id
        ));

        return new WP_REST_Response(['liked' => $is_liked, 'likeCount' => (int) $likes_count], 200);
    }

    public static function get_leaderboard($request)
    {
        global $wpdb;
        $limit = isset($request['limit']) ? intval($request['limit']) : 10;
        $table = $wpdb->prefix . 'paddock_user_stats';

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT user_id, xp, level, total_posts, total_likes_received FROM $table ORDER BY xp DESC LIMIT %d",
            $limit
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
}
