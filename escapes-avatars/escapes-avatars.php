<?php
/**
 * Plugin Name: Escapes Custom Avatars
 * Description: Gestión de avatares personalizados para clientes. Almacena avatares en la librería de medios y los sirve vía REST API.
 * Version: 1.0.0
 * Author: Escapes y Más
 * Text Domain: escapes-avatars
 */

if (!defined('ABSPATH')) {
    exit;
}

// =====================
// PLUGIN INITIALIZATION
// =====================

class Escapes_Avatars
{

    const META_KEY = 'escapes_custom_avatar';

    public static function init()
    {
        // REST API Endpoints
        add_action('rest_api_init', [__CLASS__, 'register_rest_routes']);

        // Admin Profile Fields
        add_action('show_user_profile', [__CLASS__, 'add_avatar_field']);
        add_action('edit_user_profile', [__CLASS__, 'add_avatar_field']);
        add_action('personal_options_update', [__CLASS__, 'save_avatar_field']);
        add_action('edit_user_profile_update', [__CLASS__, 'save_avatar_field']);

        // Override WordPress Avatar System
        add_filter('get_avatar_url', [__CLASS__, 'filter_avatar_url'], 10, 3);
        add_filter('get_avatar', [__CLASS__, 'filter_avatar_html'], 10, 6);
    }

    // =====================
    // REST API ENDPOINTS
    // =====================

    public static function register_rest_routes()
    {
        // Upload Avatar
        register_rest_route('escapes/v1', '/avatar/upload', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'rest_upload_avatar'],
            'permission_callback' => function () {
                return is_user_logged_in();
            }
        ]);

        // Get Avatar URL
        register_rest_route('escapes/v1', '/avatar/(?P<user_id>\d+)', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'rest_get_avatar'],
            'permission_callback' => '__return_true'
        ]);

        // Delete Avatar
        register_rest_route('escapes/v1', '/avatar/delete', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'rest_delete_avatar'],
            'permission_callback' => function () {
                return is_user_logged_in();
            }
        ]);
    }

    /**
     * REST: Upload Avatar
     */
    public static function rest_upload_avatar($request)
    {
        $user_id = get_current_user_id();

        if (!$user_id) {
            return new WP_REST_Response(['success' => false, 'message' => 'No autorizado'], 401);
        }

        // Check for file in request
        $files = $request->get_file_params();

        if (empty($files['avatar'])) {
            return new WP_REST_Response(['success' => false, 'message' => 'No se recibió archivo'], 400);
        }

        $file = $files['avatar'];

        // Validate file type
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowed_types)) {
            return new WP_REST_Response(['success' => false, 'message' => 'Tipo de archivo no permitido. Usa JPG, PNG, GIF o WebP.'], 400);
        }

        // Validate file size (max 2MB)
        if ($file['size'] > 2 * 1024 * 1024) {
            return new WP_REST_Response(['success' => false, 'message' => 'El archivo es demasiado grande. Máximo 2MB.'], 400);
        }

        // Include WordPress media functions
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');

        // Upload to Media Library
        $attachment_id = media_handle_upload('avatar', 0);

        if (is_wp_error($attachment_id)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Error al subir: ' . $attachment_id->get_error_message()
            ], 500);
        }

        // Delete old avatar attachment if exists
        $old_attachment_id = get_user_meta($user_id, self::META_KEY . '_id', true);
        if ($old_attachment_id) {
            wp_delete_attachment($old_attachment_id, true);
        }

        // Get attachment URL
        $avatar_url = wp_get_attachment_url($attachment_id);

        // Store both URL and Attachment ID
        update_user_meta($user_id, self::META_KEY, $avatar_url);
        update_user_meta($user_id, self::META_KEY . '_id', $attachment_id);

        return new WP_REST_Response([
            'success' => true,
            'avatar_url' => $avatar_url,
            'attachment_id' => $attachment_id
        ], 200);
    }

    /**
     * REST: Get Avatar URL
     */
    public static function rest_get_avatar($request)
    {
        $user_id = (int) $request['user_id'];

        if (!$user_id) {
            return new WP_REST_Response(['avatar_url' => null], 200);
        }

        $avatar_url = get_user_meta($user_id, self::META_KEY, true);

        return new WP_REST_Response([
            'avatar_url' => $avatar_url ?: null
        ], 200);
    }

    /**
     * REST: Delete Avatar
     */
    public static function rest_delete_avatar($request)
    {
        $user_id = get_current_user_id();

        if (!$user_id) {
            return new WP_REST_Response(['success' => false, 'message' => 'No autorizado'], 401);
        }

        // Delete attachment
        $attachment_id = get_user_meta($user_id, self::META_KEY . '_id', true);
        if ($attachment_id) {
            wp_delete_attachment($attachment_id, true);
        }

        // Delete meta
        delete_user_meta($user_id, self::META_KEY);
        delete_user_meta($user_id, self::META_KEY . '_id');

        return new WP_REST_Response(['success' => true], 200);
    }

    // =====================
    // ADMIN PROFILE FIELDS
    // =====================

    public static function add_avatar_field($user)
    {
        $avatar_url = get_user_meta($user->ID, self::META_KEY, true);
        ?>
        <h3>Avatar Personalizado</h3>
        <table class="form-table">
            <tr>
                <th><label for="escapes_avatar">Imagen de Perfil</label></th>
                <td>
                    <?php if ($avatar_url): ?>
                        <div style="margin-bottom: 10px;">
                            <img src="<?php echo esc_url($avatar_url); ?>"
                                style="max-width: 150px; height: auto; border-radius: 50%;" />
                        </div>
                    <?php endif; ?>

                    <input type="file" name="escapes_avatar" id="escapes_avatar" accept="image/*" />
                    <p class="description">Sube una imagen de perfil (JPG, PNG, GIF, WebP). Máximo 2MB.</p>

                    <?php if ($avatar_url): ?>
                        <label>
                            <input type="checkbox" name="escapes_avatar_delete" value="1" />
                            Eliminar avatar actual
                        </label>
                    <?php endif; ?>
                </td>
            </tr>
        </table>
        <?php
    }

    public static function save_avatar_field($user_id)
    {
        if (!current_user_can('edit_user', $user_id)) {
            return;
        }

        // Handle delete
        if (!empty($_POST['escapes_avatar_delete'])) {
            $attachment_id = get_user_meta($user_id, self::META_KEY . '_id', true);
            if ($attachment_id) {
                wp_delete_attachment($attachment_id, true);
            }
            delete_user_meta($user_id, self::META_KEY);
            delete_user_meta($user_id, self::META_KEY . '_id');
            return;
        }

        // Handle upload
        if (!empty($_FILES['escapes_avatar']['name'])) {
            require_once(ABSPATH . 'wp-admin/includes/image.php');
            require_once(ABSPATH . 'wp-admin/includes/file.php');
            require_once(ABSPATH . 'wp-admin/includes/media.php');

            // Delete old avatar
            $old_attachment_id = get_user_meta($user_id, self::META_KEY . '_id', true);
            if ($old_attachment_id) {
                wp_delete_attachment($old_attachment_id, true);
            }

            // Upload new
            $attachment_id = media_handle_upload('escapes_avatar', 0);

            if (!is_wp_error($attachment_id)) {
                $avatar_url = wp_get_attachment_url($attachment_id);
                update_user_meta($user_id, self::META_KEY, $avatar_url);
                update_user_meta($user_id, self::META_KEY . '_id', $attachment_id);
            }
        }
    }

    // =====================
    // AVATAR SYSTEM OVERRIDE
    // =====================

    /**
     * Filter avatar URL to use custom avatar
     */
    public static function filter_avatar_url($url, $id_or_email, $args)
    {
        $user_id = self::get_user_id_from_mixed($id_or_email);

        if ($user_id) {
            $custom_avatar = get_user_meta($user_id, self::META_KEY, true);
            if ($custom_avatar) {
                return $custom_avatar;
            }
        }

        // Return default placeholder instead of Gravatar
        return plugins_url('assets/default-avatar.png', __FILE__);
    }

    /**
     * Filter full avatar HTML
     */
    public static function filter_avatar_html($avatar, $id_or_email, $size, $default, $alt, $args)
    {
        $user_id = self::get_user_id_from_mixed($id_or_email);

        if ($user_id) {
            $custom_avatar = get_user_meta($user_id, self::META_KEY, true);
            if ($custom_avatar) {
                $class = isset($args['class']) ? $args['class'] : 'avatar';
                if (is_array($class)) {
                    $class = implode(' ', $class);
                }

                return sprintf(
                    '<img src="%s" alt="%s" class="%s" width="%d" height="%d" />',
                    esc_url($custom_avatar),
                    esc_attr($alt),
                    esc_attr($class . ' avatar-' . $size),
                    (int) $size,
                    (int) $size
                );
            }
        }

        // Return default avatar instead of Gravatar
        $default_url = plugins_url('assets/default-avatar.png', __FILE__);
        $class = isset($args['class']) ? $args['class'] : 'avatar';
        if (is_array($class)) {
            $class = implode(' ', $class);
        }

        return sprintf(
            '<img src="%s" alt="%s" class="%s" width="%d" height="%d" />',
            esc_url($default_url),
            esc_attr($alt),
            esc_attr($class . ' avatar-' . $size),
            (int) $size,
            (int) $size
        );
    }

    /**
     * Helper: Extract user ID from mixed input
     */
    private static function get_user_id_from_mixed($id_or_email)
    {
        if (is_numeric($id_or_email)) {
            return (int) $id_or_email;
        }

        if (is_object($id_or_email)) {
            if (!empty($id_or_email->user_id)) {
                return (int) $id_or_email->user_id;
            }
            if (!empty($id_or_email->ID)) {
                return (int) $id_or_email->ID;
            }
        }

        if (is_string($id_or_email) && is_email($id_or_email)) {
            $user = get_user_by('email', $id_or_email);
            if ($user) {
                return $user->ID;
            }
        }

        return 0;
    }
}

// Initialize Plugin
add_action('init', ['Escapes_Avatars', 'init']);
