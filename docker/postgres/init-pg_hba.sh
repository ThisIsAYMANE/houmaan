#!/bin/sh
set -e

# Configure pg_hba.conf to allow password authentication from host
# This allows connections from the host machine (127.0.0.1) using password

echo "Configuring PostgreSQL authentication..."

# Backup original pg_hba.conf
cp /var/lib/postgresql/data/pg_hba.conf /var/lib/postgresql/data/pg_hba.conf.backup

# Add trust authentication for local connections (from host)
cat >> /var/lib/postgresql/data/pg_hba.conf <<EOF

# Allow password authentication from host
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
EOF

echo "PostgreSQL authentication configured successfully"
