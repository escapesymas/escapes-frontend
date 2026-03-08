<?php
require_once('/var/www/vhosts/backendescapes.com/httpdocs/wp-load.php');
$user = get_userdata(1);
if ($user) {
    echo "USER_ID: " . $user->ID . "\n";
    echo "USER_LOGIN: " . $user->user_login . "\n";
    echo "USER_ROLES: " . json_encode($user->roles) . "\n";
    echo "IS_ADMIN: " . (in_array('administrator', $user->roles) ? 'YES' : 'NO') . "\n";
} else {
    echo "ERROR: User 1 not found.\n";
}
?>