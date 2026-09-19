#!/bin/sh
set -e

echo "Waiting for MySQL at $DB_HOST:$DB_PORT..."
while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 0.5
done
echo "MySQL is up."

if [ "$RUN_MIGRATIONS" = "true" ]; then
  python manage.py migrate --noinput
fi

exec "$@"