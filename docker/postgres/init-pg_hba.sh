#!/bin/bash
# This script ensures password is set correctly
# We use Docker's default pg_hba.conf which works with POSTGRES_PASSWORD

# Wait for PostgreSQL to be ready
until pg_isready -U bcgame; do
  sleep 1
done

# Wait a bit more to ensure user is fully created
sleep 2

# Verify password is set (Docker sets it via POSTGRES_PASSWORD, but we ensure it's correct)
psql -U bcgame -d bcgame <<EOF
ALTER USER bcgame WITH ENCRYPTED PASSWORD 'bcgame123';
EOF

echo "Password configured successfully"




