#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
until pg_isready -U bcgame; do
  sleep 1
done

# Update pg_hba.conf to use md5 for TCP connections
sed -i 's/host all all all scram-sha-256/host all all 0.0.0.0\/0 md5/' /var/lib/postgresql/data/pg_hba.conf

# Reload PostgreSQL configuration
psql -U bcgame -d bcgame -c "SELECT pg_reload_conf();"

echo "Authentication configuration updated"













