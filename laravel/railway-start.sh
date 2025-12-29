#!/bin/sh
set -e

echo "🚀 Starting Laravel Railway..."

# Pastikan storage benar
mkdir -p storage/framework/cache
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs

chmod -R 775 storage bootstrap/cache

echo "📦 Clearing cache..."
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true
php artisan cache:clear || true
php artisan config:cache || true

echo "🛠 Running migrations..."
php artisan migrate --force

echo "🌱 Running seeders (optional)..."
php artisan db:seed --force || true

echo "✅ Laravel started!"
php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
