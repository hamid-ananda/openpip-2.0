FROM php:7.2.0-apache

# Clean existing package lists
RUN rm -rf /var/lib/apt/lists/* /etc/apt/sources.list.d/*

# Add Debian Stretch repository (archived) and configure for unsigned packages
RUN echo "deb [trusted=yes] http://archive.debian.org/debian stretch main" > /etc/apt/sources.list && \
    echo "Acquire::Check-Valid-Until false;" > /etc/apt/apt.conf.d/99no-check-valid-until

# Install basic packages and PHP extensions
RUN apt-get update && apt-get install -y --allow-unauthenticated git
RUN docker-php-ext-install pdo pdo_mysql mysqli
RUN a2enmod rewrite

# Set Apache document root to web directory
ENV APACHE_DOCUMENT_ROOT=/var/www/html/web
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Install additional packages and configure PHP
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
# Tools
    apt-utils \
    wget \
    git \
    nano \
    iputils-ping \
    mysql-client \
    locales \
    imagemagick \
    graphicsmagick \
    ghostscript \
# Configure PHP
    libxml2-dev libfreetype6-dev \
    libjpeg62-turbo-dev \
    libmcrypt-dev \
    libpng-dev && \
    docker-php-ext-configure gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/ && \
    docker-php-ext-install -j$(nproc) mysqli soap gd zip opcache && \
    echo 'always_populate_raw_post_data = -1\nmax_execution_time = 240\nmemory_limit = -1\nmax_input_vars = 1500\nupload_max_filesize = 200M\npost_max_size = 300M' > /usr/local/etc/php/conf.d/typo3.ini && \
# Configure bash
    echo 'export LS_OPTIONS="--color=auto"\nalias ls="ls $LS_OPTIONS"\nalias ll="ls $LS_OPTIONS -aGFlh"\nalias l="ls $LS_OPTIONS -FG"' > ~/.bashrc && \
# Configure Apache & clean
    a2enmod rewrite && \
    apt-get clean && \
    apt-get -y purge \
        libxml2-dev libfreetype6-dev \
        libjpeg62-turbo-dev \
        libmcrypt-dev \
        libpng12-dev && \
    rm -rf /var/lib/apt/lists/* /usr/src/*

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Set locales
RUN locale-gen en_US.UTF-8 en_GB.UTF-8 de_DE.UTF-8 es_ES.UTF-8 fr_FR.UTF-8 it_IT.UTF-8 km_KH sv_SE.UTF-8 fi_FI.UTF-8

# Create necessary directories and set permissions
RUN mkdir -p /var/www/html/app/cache /var/www/html/app/logs /var/www/html/web/uploads && \
    chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

# Copy application files from parent directory (where the actual OpenPIP app is located)
COPY ./ /var/www/html/

# Fix permissions after copying files
RUN chown -R www-data:www-data /var/www/html/app/cache /var/www/html/app/logs && \
    chmod -R 777 /var/www/html/web/uploads

# Set working directory
WORKDIR /var/www/html

# Expose ports
EXPOSE 80/tcp
EXPOSE 443/tcp
EXPOSE 8000/tcp
EXPOSE 8443/tcp