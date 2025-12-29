#!/bin/sh

echo "🚀 Starting Laravel Railway..."

# Generate APP_KEY if missing
php artisan key:generate --force || true

echo "📦 Caching config..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache

echo "🛠 Running migrations..."
php artisan migrate --force || true

echo "✅ Laravel started!"

php artisan serve --host=0.0.0.0 --port=${PORT}
