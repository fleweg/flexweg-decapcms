# Dockerfile for Flexweg Static Site Generator
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS base

# Install basic utilities
RUN apk add --no-cache \
    bash \
    git \
    supervisor

WORKDIR /var/www/project

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p /var/log/supervisor \
    && mkdir -p public

# Copy supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/supervisord.conf

# Expose ports
# 3333 - Admin Panel (Decap CMS)
# 8080 - Site Preview (live-server)
EXPOSE 3333 8080

# Default command (will be overridden in docker-compose)
CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
