<div class="wrap paddock-admin">
    <div class="paddock-header">
        <h1 class="wp-heading-inline">Paddock Dashboard <span class="badge">V2.0</span></h1>
        <p class="description">Gestión de comunidad y estadísticas en tiempo real.</p>
    </div>

    <!-- KPI Grid -->
    <div class="paddock-stats-grid">
        <div class="stat-card">
            <div class="stat-icon posts">📝</div>
            <div class="stat-content">
                <span class="stat-label">Social Posts</span>
                <span class="stat-value"><?php echo wp_count_posts('paddock_social_post')->publish; ?></span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon threads">💬</div>
            <div class="stat-content">
                <span class="stat-label">Hilos Activos</span>
                <span class="stat-value"><?php echo wp_count_posts('paddock_thread')->publish; ?></span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon comments">✍️</div>
            <div class="stat-content">
                <span class="stat-label">Comentarios</span>
                <span class="stat-value"><?php echo wp_count_comments()->approved; ?></span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon shares">🔗</div>
            <div class="stat-content">
                <span class="stat-label">Compartidos</span>
                <span class="stat-value">
                    <?php
                    global $wpdb;
                    $table_shares = $wpdb->prefix . 'paddock_shares';
                    echo $wpdb->get_var("SELECT COUNT(*) FROM $table_shares");
                    ?>
                </span>
            </div>
        </div>
    </div>

    <div class="paddock-main-grid">
        <!-- Recent Activity Section -->
        <div class="activity-column">
            <div class="paddock-card-box">
                <div class="card-header">
                    <h2>Últimos Social Posts</h2>
                    <a href="edit.php?post_type=paddock_social_post" class="button button-small">Ver todos</a>
                </div>
                <div class="card-body">
                    <ul class="activity-list">
                        <?php
                        $recent_posts = get_posts([
                            'post_type' => 'paddock_social_post',
                            'numberposts' => 5
                        ]);
                        if ($recent_posts):
                            foreach ($recent_posts as $post): ?>
                                <li class="activity-item">
                                    <div class="item-avatar"><?php echo get_avatar($post->post_author, 32); ?></div>
                                    <div class="item-info">
                                        <strong><?php echo get_the_author_meta('display_name', $post->post_author); ?></strong>
                                        <p><?php echo wp_trim_words($post->post_content, 12); ?></p>
                                        <small><?php echo human_time_diff(get_the_time('U', $post->ID), current_time('timestamp')); ?>
                                            ago</small>
                                    </div>
                                </li>
                            <?php endforeach;
                        else: ?>
                            <li class="empty-state">No hay actividad reciente.</li>
                        <?php endif; ?>
                    </ul>
                </div>
            </div>
        </div>

        <div class="activity-column">
            <div class="paddock-card-box">
                <div class="card-header">
                    <h2>Últimos Hilos del Forum</h2>
                    <a href="edit.php?post_type=paddock_thread" class="button button-small">Gestionar Forum</a>
                </div>
                <div class="card-body">
                    <table class="wp-list-table widefat fixed striped recent-threads">
                        <thead>
                            <tr>
                                <th>Título del Tema</th>
                                <th>Respuestas</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            $recent_threads = get_posts([
                                'post_type' => 'paddock_thread',
                                'numberposts' => 5
                            ]);
                            if ($recent_threads):
                                foreach ($recent_threads as $thread): ?>
                                    <tr>
                                        <td class="thread-title">
                                            <a
                                                href="<?php echo get_edit_post_link($thread->ID); ?>"><?php echo $thread->post_title; ?></a>
                                        </td>
                                        <td><span class="count-pill"><?php echo get_comments_number($thread->ID); ?></span></td>
                                    </tr>
                                <?php endforeach;
                            else: ?>
                                <tr>
                                    <td colspan="2">No hay hilos recientes.</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .paddock-admin {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        margin-right: 20px;
    }

    .paddock-header {
        margin: 25px 0 30px;
    }

    .paddock-header h1 {
        font-size: 28px;
        font-weight: 800;
        color: #1d2327;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .paddock-header .badge {
        background: #ff5722;
        color: #fff;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 600;
        text-transform: uppercase;
    }

    .paddock-header .description {
        color: #646970;
        margin: 5px 0 0;
        font-size: 14px;
    }

    .paddock-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }

    .stat-card {
        background: #fff;
        border-radius: 12px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 15px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        border: 1px solid #e2e4e7;
        transition: transform 0.2s;
    }

    .stat-card:hover {
        transform: translateY(-3px);
    }

    .stat-icon {
        font-size: 24px;
        width: 48px;
        height: 48px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f0f0f1;
    }

    .stat-icon.posts {
        background: #e7f5ff;
    }

    .stat-icon.threads {
        background: #fff4e6;
    }

    .stat-icon.comments {
        background: #ebfbee;
    }

    .stat-icon.shares {
        background: #f3f0ff;
    }

    .stat-label {
        display: block;
        color: #646970;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .stat-value {
        font-size: 24px;
        fontWeight: 800;
        color: #1d2327;
    }

    .paddock-main-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 25px;
    }

    .paddock-card-box {
        background: #fff;
        border-radius: 12px;
        border: 1px solid #e2e4e7;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        overflow: hidden;
    }

    .card-header {
        padding: 15px 20px;
        background: #fafafa;
        border-bottom: 1px solid #e2e4e7;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .card-header h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #1d2327;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .card-body {
        padding: 0;
    }

    .activity-list {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .activity-item {
        padding: 15px 20px;
        border-bottom: 1px solid #f0f0f1;
        display: flex;
        gap: 12px;
        transition: background 0.2s;
    }

    .activity-item:last-child {
        border-bottom: none;
    }

    .activity-item:hover {
        background: #fcfcfc;
    }

    .item-avatar img {
        border-radius: 50%;
        border: 1px solid #e2e4e7;
    }

    .item-info {
        flex: 1;
    }

    .item-info strong {
        font-size: 14px;
        color: #1d2327;
    }

    .item-info p {
        margin: 5px 0;
        color: #50575e;
        font-size: 13px;
        line-height: 1.4;
    }

    .item-info small {
        color: #8c8f94;
        font-size: 11px;
    }

    .recent-threads {
        border: none !important;
        box-shadow: none !important;
        margin: 0 !important;
    }

    .recent-threads th {
        border-bottom: 1px solid #e2e4e7 !important;
        padding: 12px 20px !important;
        color: #646970;
        font-size: 11px;
        text-transform: uppercase;
    }

    .recent-threads td {
        padding: 12px 20px !important;
        vertical-align: middle;
    }

    .thread-title a {
        text-decoration: none;
        font-weight: 600;
        color: #2271b1;
        font-size: 14px;
    }

    .thread-title a:hover {
        color: #135e96;
    }

    .count-pill {
        background: #f0f0f1;
        color: #50575e;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 700;
    }
</style>