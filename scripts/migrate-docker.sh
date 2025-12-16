#!/bin/sh
# Run migrations inside Docker container (avoids authentication issues)

docker cp sql/migrations bc-game-postgres:/tmp/migrations

docker exec bc-game-postgres sh << 'EOF'
for f in /tmp/migrations/*.sql; do
  if [ -f "$f" ]; then
    echo "Applying $f"
    psql -U bcgame -d bcgame -f "$f"
  fi
done
EOF
