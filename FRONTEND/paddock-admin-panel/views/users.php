<div class="wrap paddock-admin">
    <h1 class="wp-heading-inline">Gestión de Usuarios (Paddock)</h1>

    <?php
    // Handle XP Update
    if (isset($_POST['update_xp']) && check_admin_referer('paddock_xp_update')) {
        $user_id = intval($_POST['user_id']);
        $new_xp = intval($_POST['xp_amount']);
        $action = $_POST['xp_action']; // 'add' or 'set' or 'remove'
    
        // Ensure class exists (dependency check)
        if (class_exists('Paddock_XP')) {
            if ($action === 'add') {
                Paddock_XP::award_xp($user_id, $new_xp, 'manual_adjustment');
                echo '<div class="notice notice-success"><p>XP Añadida correctamente.</p></div>';
            }
        } else {
            echo '<div class="notice notice-error"><p>Error: Plugin Paddock Gamification no activo.</p></div>';
        }
    }

    // Simple Search
    $search = isset($_GET['s']) ? sanitize_text_field($_GET['s']) : '';
    ?>

    <form method="get">
        <input type="hidden" name="page" value="paddock-users">
        <p class="search-box">
            <label class="screen-reader-text" for="post-search-input">Buscar usuarios:</label>
            <input type="search" id="post-search-input" name="s" value="<?php echo esc_attr($search); ?>">
            <input type="submit" id="search-submit" class="button" value="Buscar usuario">
        </p>
    </form>

    <br class="clear">

    <table class="wp-list-table widefat fixed striped">
        <thead>
            <tr>
                <th>Usuario</th>
                <th>XP Actual</th>
                <th>Nivel</th>
                <th>Rango</th>
                <th>Amigos</th>
                <th>Compartidos</th>
                <th>Acciones Rápidas</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $user_args = ['number' => 20];
            if ($search) {
                $user_args['search'] = '*' . $search . '*';
            }
            $users = get_users($user_args);

            if ($users):
                foreach ($users as $user):
                    $stats = null;
                    $rank = [];
                    global $wpdb;
                    $table = $wpdb->prefix . 'paddock_user_stats';
                    $row = $wpdb->get_row($wpdb->prepare("SELECT xp, level, total_friends, total_shares FROM $table WHERE user_id = %d", $user->ID));

                    $xp = $row ? $row->xp : 0;
                    $level = $row ? $row->level : 1;
                    $friends = $row ? $row->total_friends : 0;
                    $shares = $row ? $row->total_shares : 0;

                    if (class_exists('Paddock_XP')) {
                        $rank = Paddock_XP::get_user_rank_data($user->ID);
                    }
                    ?>
                    <tr>
                        <td>
                            <?php echo get_avatar($user->ID, 32); ?>
                            <strong>
                                <?php echo $user->display_name; ?>
                            </strong><br>
                            <small>
                                <?php echo $user->user_email; ?>
                            </small>
                        </td>
                        <td>
                            <?php echo $xp; ?>
                        </td>
                        <td>
                            <?php echo $level; ?>
                        </td>
                        <td>
                            <?php echo isset($rank['title']) ? $rank['title'] : '-'; ?>
                        </td>
                        <td>
                            <?php echo $friends; ?>
                        </td>
                        <td>
                            <?php echo $shares; ?>
                        </td>
                        <td>
                            <form method="post" class="inline-form" style="display:flex; gap:5px; align-items:center;">
                                <?php wp_nonce_field('paddock_xp_update'); ?>
                                <input type="hidden" name="user_id" value="<?php echo $user->ID; ?>">
                                <input type="number" name="xp_amount" placeholder="XP" style="width:60px" required min="1">
                                <select name="xp_action">
                                    <option value="add">Añadir XP</option>
                                </select>
                                <button type="submit" name="update_xp" class="button button-small">Aplicar</button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach;
            else: ?>
                <tr>
                    <td colspan="5">No se encontraron usuarios.</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>
</div>