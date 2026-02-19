<?php

if (!defined('ABSPATH')) {
	exit;
}

class Paddock_DB
{

	public static function create_tables()
	{
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();

		// Table: User Stats
		$table_stats = $wpdb->prefix . 'paddock_user_stats';
		$sql_stats = "CREATE TABLE $table_stats (
			user_id bigint(20) unsigned NOT NULL,
			xp int(11) DEFAULT 0 NOT NULL,
			level int(11) DEFAULT 1 NOT NULL,
			total_posts int(11) DEFAULT 0 NOT NULL,
			total_replies int(11) DEFAULT 0 NOT NULL,
			total_likes_received int(11) DEFAULT 0 NOT NULL,
			total_likes_given int(11) DEFAULT 0 NOT NULL,
            total_friends int(11) DEFAULT 0 NOT NULL,
            total_shares int(11) DEFAULT 0 NOT NULL,
			updated_at datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
			PRIMARY KEY  (user_id)
		) $charset_collate;";

		// Table: Likes Log
		$table_likes = $wpdb->prefix . 'paddock_likes';
		$sql_likes = "CREATE TABLE $table_likes (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			user_id bigint(20) unsigned NOT NULL,
			target_type varchar(20) NOT NULL,
			target_id bigint(20) unsigned NOT NULL,
			created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
			PRIMARY KEY  (id),
			KEY user_id (user_id),
			KEY target (target_type, target_id),
			UNIQUE KEY unique_like (user_id, target_type, target_id)
		) $charset_collate;";

		// Table: Friends
		$table_friends = $wpdb->prefix . 'paddock_friends';
		$sql_friends = "CREATE TABLE $table_friends (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id_1 bigint(20) unsigned NOT NULL,
            user_id_2 bigint(20) unsigned NOT NULL,
            status varchar(20) DEFAULT 'pending' NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY unique_friendship (user_id_1, user_id_2)
        ) $charset_collate;";

		// Table: Shares
		$table_shares = $wpdb->prefix . 'paddock_shares';
		$sql_shares = "CREATE TABLE $table_shares (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            post_id bigint(20) unsigned NOT NULL,
            platform varchar(50) DEFAULT 'internal' NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY post_id (post_id)
        ) $charset_collate;";

		// Table: Notifications
		$table_notifications = $wpdb->prefix . 'paddock_notifications';
		$sql_notifications = "CREATE TABLE $table_notifications (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL, -- The recipient
            actor_id bigint(20) unsigned NOT NULL, -- The one who triggered it
            type varchar(50) NOT NULL, -- 'like', 'reply', 'friend_request', 'friend_accept'
            target_type varchar(50) NOT NULL, -- 'post', 'thread', 'comment', 'user'
            target_id bigint(20) unsigned NOT NULL,
            is_read tinyint(1) DEFAULT 0 NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY is_read (is_read)
        ) $charset_collate;";

		// Table: Followers (Unidirectional)
		$table_followers = $wpdb->prefix . 'paddock_followers';
		$sql_followers = "CREATE TABLE $table_followers (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL, -- The one being followed
            follower_id bigint(20) unsigned NOT NULL, -- The one following
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY unique_follow (user_id, follower_id)
        ) $charset_collate;";

		require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
		dbDelta($sql_stats);
		dbDelta($sql_likes);
		dbDelta($sql_friends);
		dbDelta($sql_shares);
		dbDelta($sql_notifications);
		dbDelta($sql_followers);
	}
}
