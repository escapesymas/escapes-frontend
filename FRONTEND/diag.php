<?php
echo "DISK SPACE:\n";
system("df -h");
echo "\nMEMORY:\n";
system("free -m");
echo "\nMARIADB USERS/DATABASES:\n";
system("mysql -e 'SELECT User, Host FROM mysql.user; SHOW DATABASES;' 2>&1");
echo "\nPLESK TASK MANAGER SQLITE:\n";
system("ls -la /usr/local/psa/var/modules/plesk-task-manager/ 2>&1");
echo "\nSTART PLESK TASK MANAGER:\n";
system("plesk srvman start plesk-task-manager 2>&1");
echo "\nPHP PROCESSES:\n";
system("ps aux | grep -E 'php|fpm' | grep -v grep 2>&1");
echo "\nPLESK TASK MANAGER SERVICE NAME:\n";
system("systemctl status plesk-task-manager --no-pager 2>&1");
?>