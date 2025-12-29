FROM php:8.3-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    curl \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install pdo pdo_mysql zip gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Workdir
WORKDIR /var/www/html

# Copy project source
COPY . .

# Install dependencies (production only)
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Fix permissions for Laravel
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Make startup script executable
RUN chmod +x /var/www/html/railway-start.sh

# Railway uses dynamic PORT environment variable
EXPOSE 8080

# Run the startup script
CMD ["bash", "/var/www/html/railway-start.sh"]
