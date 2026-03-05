#!/bin/bash
# 1. Ensure DB exists and user has permissions
echo "Setting up database permissions..."
mysql -e "CREATE DATABASE IF NOT EXISTS qapg033;"
mysql -e "GRANT ALL PRIVILEGES ON qapg033.* TO 'qapg033'@'localhost' IDENTIFIED BY 'ElocoM25081989!';"
mysql -e "GRANT ALL PRIVILEGES ON qapg033.* TO 'qapg033'@'%' IDENTIFIED BY 'ElocoM25081989!';"
mysql -e "FLUSH PRIVILEGES;"

# 2. Import SQL if tables are missing or requested
echo "Checking table count in qapg033..."
TABLE_COUNT=$(mysql -N -s -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='qapg033';")
echo "Tables found: $TABLE_COUNT"

if [ "$TABLE_COUNT" -lt 10 ]; then
    if [ -f /root/qapg033.sql ]; then
        echo "Importing database (this may take a few minutes)..."
        mysql qapg033 < /root/qapg033.sql
        echo "Import completed."
    else
        echo "CRITICAL: SQL file not found at /root/qapg033.sql"
    fi
else
    echo "Database already contains $TABLE_COUNT tables. Skipping import."
fi

# 3. Fix Plesk services
echo "Stopping crash-looping services..."
systemctl stop plesk-task-manager
sleep 2
echo "Restarting services..."
systemctl start plesk-task-manager
systemctl restart plesk-php83-fpm

echo "Deployment finished successfully."
