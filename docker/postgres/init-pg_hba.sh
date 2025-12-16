#!/bin/bash
# This script runs after PostgreSQL initializes to fix pg_hba.conf

# Wait for PostgreSQL to be ready
until pg_isready -U bcgame; do
  sleep 1
done

# Backup original pg_hba.conf
cp /var/lib/postgresql/data/pg_hba.conf /var/lib/postgresql/data/pg_hba.conf.backup

# Create new pg_hba.conf with correct rule order
cat > /var/lib/postgresql/data/pg_hba.conf <<EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
# IPv4 local connections - trust (for development)
host    all             all             127.0.0.1/32            trust
# IPv6 local connections - trust (for development)
host    all             all             ::1/128                 trust
# All other connections - require password
host    all             all             0.0.0.0/0               scram-sha-256
EOF

# Reload configuration
psql -U bcgame -d bcgame -c "SELECT pg_reload_conf();"

echo "pg_hba.conf configured successfully"




