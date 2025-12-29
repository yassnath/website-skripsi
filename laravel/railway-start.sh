#!/bin/sh
set -e

echo "🚀 Starting Laravel Railway..."

# Ensure storage folders exist
mkdir -p storage/framework/cache
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views

# Fix permissions
chmod -R 775 storage bootstrap/cache || true

echo "📦 Clearing cache..."
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true
php artisan cache:clear || true

echo "📦 Caching config..."
php artisan config:cache || true
php artisan route:cache || true

echo "🛠 Running migrations..."
php artisan migrate --force

echo "🌱 Running seeders..."
php artisan db:seed --force

echo "✅ Laravel started!"
php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
