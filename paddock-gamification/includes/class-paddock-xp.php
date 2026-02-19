<?php

if (!defined('ABSPATH')) {
    exit;
}

class Paddock_XP
{

    // XP Values
    const XP_CREATE_TOPIC = 25;
    const XP_CREATE_REPLY = 10;
    const XP_RECEIVE_LIKE = 5;
    const XP_GIVE_LIKE = 1;

    // Ranks configuration
    public static function get_ranks()
    {
        return [
            1 => ['title' => 'Novato', 'min_xp' => 0, 'discount' => 0],
            2 => ['title' => 'Aficionado', 'min_xp' => 100, 'discount' => 2],
            3 => ['title' => 'Entusiasta', 'min_xp' => 300, 'discount' => 4],
            4 => ['title' => 'Experto', 'min_xp' => 700, 'discount' => 6],
            5 => ['title' => 'Pro Racer', 'min_xp' => 1500, 'discount' => 8],
            6 => ['title' => 'Leyenda', 'min_xp' => 3000, 'discount' => 10],
        ];
    }

    /**
     * Calculate level based on total XP
     */
    public static function get_level_from_xp($xp)
    {
        $ranks = self::get_ranks();
        $current_level = 1;

        foreach ($ranks as $level => $data) {
            if ($xp >= $data['min_xp']) {
                $current_level = $level;
            } else {
                break;
            }
        }

        return $current_level;
    }

    /**
     * Award XP to a user
     */
    public static function award_xp($user_id, $amount, $action_type)
    {
        global $wpdb;

        // Ensure user exists in stats table
        self::ensure_user_stats($user_id);

        $table = $wpdb->prefix . 'paddock_user_stats';

        // Update XP
        $wpdb->query($wpdb->prepare(
            "UPDATE $table SET xp = xp + %d, updated_at = NOW() WHERE user_id = %d",
            $amount,
            $user_id
        ));

        // Recalculate level
        self::update_user_level($user_id);
    }

    /**
     * Update stats counters (posts/replies/likes)
     */
    public static function update_stat($user_id, $column, $increment = 1)
    {
        global $wpdb;
        self::ensure_user_stats($user_id);

        $table = $wpdb->prefix . 'paddock_user_stats';
        $valid_columns = ['total_posts', 'total_replies', 'total_likes_received', 'total_likes_given'];

        if (!in_array($column, $valid_columns))
            return;

        $wpdb->query($wpdb->prepare(
            "UPDATE $table SET $column = $column + %d, updated_at = NOW() WHERE user_id = %d",
            $increment,
            $user_id
        ));
    }

    public static function ensure_user_stats($user_id)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'paddock_user_stats';

        $exists = $wpdb->get_var($wpdb->prepare("SELECT user_id FROM $table WHERE user_id = %d", $user_id));

        if (!$exists) {
            $wpdb->insert($table, [
                'user_id' => $user_id,
                'xp' => 0,
                'level' => 1,
                'updated_at' => current_time('mysql')
            ]);
        }
    }

    private static function update_user_level($user_id)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'paddock_user_stats';

        $xp = $wpdb->get_var($wpdb->prepare("SELECT xp FROM $table WHERE user_id = %d", $user_id));
        $new_level = self::get_level_from_xp($xp);

        $wpdb->update(
            $table,
            ['level' => $new_level],
            ['user_id' => $user_id]
        );
    }

    /**
     * Hook: When a post is published
     */
    public static function on_post_publish($new_status, $old_status, $post)
    {
        if ($new_status === 'publish' && $old_status !== 'publish' && $post->post_type === 'post') {
            $user_id = $post->post_author;
            self::award_xp($user_id, self::XP_CREATE_TOPIC, 'create_topic');
            self::update_stat($user_id, 'total_posts', 1);
        }
    }

    /**
     * Hook: When a comment is posted
     */
    public static function on_comment_posted($comment_id, $comment_object)
    {
        if ($comment_object->comment_approved == 1) {
            $user_id = $comment_object->user_id;
            if ($user_id > 0) {
                self::award_xp($user_id, self::XP_CREATE_REPLY, 'create_reply');
                self::update_stat($user_id, 'total_replies', 1);
            }
        }
    }

    public static function get_user_rank_data($user_id)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'paddock_user_stats';

        // Check for Administrator override
        $user_info = get_userdata($user_id);
        if ($user_info && (in_array('administrator', $user_info->roles) || $user_info->user_email === 'info@escapesymas.com')) {
            return [
                'level' => 99,
                'title' => 'Administrador',
                'xp' => 999999,
                'next_xp' => 999999,
                'discount' => 10, // Max discount
                'icon' => '🛡️' // Special icon
            ];
        }

        $stats = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE user_id = %d", $user_id));

        if (!$stats) {
            return [
                'level' => 1,
                'title' => 'Novato',
                'xp' => 0,
                'next_xp' => 100,
                'discount' => 0
            ];
        }

        $ranks = self::get_ranks();
        $current_rank = $ranks[$stats->level];
        $next_level = $stats->level + 1;
        $next_xp = isset($ranks[$next_level]) ? $ranks[$next_level]['min_xp'] : $stats->xp; // Max level reached

        return [
            'level' => (int) $stats->level,
            'title' => $current_rank['title'],
            'xp' => (int) $stats->xp,
            'next_xp' => $next_xp,
            'discount' => $current_rank['discount']
        ];
    }
}
