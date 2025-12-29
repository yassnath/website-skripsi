#!/bin/sh

echo "🚀 Starting Laravel Railway..."

# NOTE: Railway does not use .env file by default
# so DO NOT run php artisan key:generate here.
# APP_KEY must be set in Railway Variables.

echo "📦 Clearing cache..."
php artisan config:clear || true
php artisan cache:clear || true
php artisan route:clear || true

echo "📦 Caching config..."
php artisan config:cache || true

echo "🛠 Running migrations..."
php artisan migrate --force || true

echo "✅ Laravel started!"
php artisan serve --host=0.0.0.0 --port=${PORT}
