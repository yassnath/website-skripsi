#!/bin/bash
set -e

echo "🚀 Railway Laravel Start Script Running..."

# jika APP_KEY kosong, generate otomatis (opsional)
if [ -z "$APP_KEY" ]; then
  echo "⚠️ APP_KEY not set, generating..."
  php artisan key:generate --force
fi

echo "🧹 Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

echo "📌 Running migrations..."
php artisan migrate --force

# Kalau kamu punya seeder untuk admin/user default
# php artisan db:seed --force

echo "✅ Starting Laravel server on PORT=${PORT} ..."
php artisan serve --host=0.0.0.0 --port=${PORT}
