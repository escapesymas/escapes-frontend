<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Paddock_DB {

	public static function create_tables() {
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
			updated_at datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
			PRIMARY KEY  (user_id)
		) $charset_collate;";

		// Table: Likes Log
		$table_likes = $wpdb->prefix . 'paddock_likes';
		$sql_likes = "CREATE TABLE $table_likes (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			user_id bigint(20) unsigned NOT NULL,
			target_type varchar(20) NOT NULL, -- 'topic' or 'reply'
			target_id bigint(20) unsigned NOT NULL,
			created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
			PRIMARY KEY  (id),
			KEY user_id (user_id),
			KEY target (target_type, target_id),
			UNIQUE KEY unique_like (user_id, target_type, target_id)
		) $charset_collate;";

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		dbDelta( $sql_stats );
		dbDelta( $sql_likes );
	}
}
