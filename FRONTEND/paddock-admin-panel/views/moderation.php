<div class="wrap paddock-admin">
    <h1 class="wp-heading-inline">Moderación de Contenido</h1>
    
    <?php
    // Handle Actions
    if (isset($_GET['action']) && isset($_GET['post_id']) && check_admin_referer('paddock_mod')) {
        $post_id = intval($_GET['post_id']);
        if ($_GET['action'] === 'trash') {
            wp_trash_post($post_id);
            echo '<div class="notice notice-success"><p>Elemento enviado a la papelera.</p></div>';
        }
    }

    $tab = isset($_GET['tab']) ? $_GET['tab'] : 'social';
    $post_type = ($tab === 'social') ? 'paddock_social_post' : 'paddock_thread';
    ?>

    <nav class="nav-tab-wrapper">
        <a href="?page=paddock-moderation&tab=social" class="nav-tab <?php echo $tab === 'social' ? 'nav-tab-active' : ''; ?>">Muro Social</a>
        <a href="?page=paddock-moderation&tab=threads" class="nav-tab <?php echo $tab === 'threads' ? 'nav-tab-active' : ''; ?>">Hilos del Foro</a>
    </nav>
    
    <br>

    <table class="wp-list-table widefat fixed striped">
        <thead>
            <tr>
                <th width="15%">Autor</th>
                <th width="50%">Contenido / Título</th>
                <th width="15%">Fecha</th>
                <th width="20%">Acciones</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $items = get_posts([
                'post_type' => $post_type,
                'posts_per_page' => 20,
                'post_status' => 'publish'
            ]);

            if ($items) :
                foreach ($items as $item) : 
                    $delete_url = wp_nonce_url(admin_url("admin.php?page=paddock-moderation&tab=$tab&action=trash&post_id={$item->ID}"), 'paddock_mod');
                    ?>
                    <tr>
                        <td>
                            <strong><?php echo get_the_author_meta('display_name', $item->post_author); ?></strong><br>
                            <small><?php echo get_the_author_meta('user_email', $item->post_author); ?></small>
                        </td>
                        <td>
                            <?php if ($tab === 'threads') : ?>
                                <strong><?php echo $item->post_title; ?></strong><br>
                            <?php endif; ?>
                            <?php echo wp_trim_words($item->post_content, 20); ?>
                        </td>
                        <td><?php echo get_the_date('d/m/Y H:i', $item->ID); ?></td>
                        <td>
                            <a href="<?php echo get_edit_post_link($item->ID); ?>" class="button button-small">Editar</a>
                            <a href="<?php echo $delete_url; ?>" class="button button-small button-link-delete" onclick="return confirm('¿Seguro?');">Papelera</a>
                        </td>
                    </tr>
                <?php endforeach;
            else : ?>
                <tr><td colspan="4">No hay contenido para mostrar.</td></tr>
            <?php endif; ?>
        </tbody>
    </table>
</div>
