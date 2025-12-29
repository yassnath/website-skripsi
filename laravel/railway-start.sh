#!/bin/sh

echo "Running migrations..."
php artisan migrate --force

echo "Caching config..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Starting Laravel server..."
php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
