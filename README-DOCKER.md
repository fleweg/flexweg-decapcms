# Docker Setup for Flexweg Static Site Generator

## Overview

This project is dockerized to provide a consistent development environment. The Docker setup runs:

- **Admin Panel** (Decap CMS) on port 3333
- **Site Preview** (live-server) on port 8080
- **Build Watcher** that automatically rebuilds on file changes

## Prerequisites

- Docker
- Docker Compose
- Traefik (optional, for domain routing)

## Quick Start

### 1. Setup Environment

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` to match your local setup:

```env
PROJECT_NAME=flexweg-decapcms
APP_FQDN=flexweg.local
ADMIN_PORT=3333
SITE_PORT=8080
```

### 2. Start the Application

```bash
docker-compose up -d
```

This will:
- Build the Docker image
- Install npm dependencies
- Start the dev server (admin panel + live-server)
- Start the build watcher

### 3. Access the Application

**Without Traefik (using ports):**
- Admin Panel: http://localhost:3333/admin
- Site Preview: http://localhost:8080

**With Traefik (using domains):**
- Admin Panel: http://admin.flexweg.local
- Site Preview: http://flexweg.local

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app_flexweg
```

### Restart Services

```bash
docker-compose restart
```

### Stop Services

```bash
docker-compose down
```

### Rebuild Image

```bash
docker-compose build
docker-compose up -d
```

### Execute Commands Inside Container

```bash
# Open bash shell
docker-compose exec app_flexweg bash

# Run npm commands
docker-compose exec app_flexweg npm run build
docker-compose exec app_flexweg npm install <package>
```

## Development Workflow

### Editing Content

1. Access admin panel at http://localhost:3333/admin
2. Create/edit articles or pages
3. Save changes
4. Build watcher automatically rebuilds the site
5. Preview updates at http://localhost:8080

### Editing Code/Templates

1. Edit files in your IDE (VSCode, etc.)
2. Save changes
3. Build watcher detects changes and rebuilds
4. Preview refreshes automatically

### Adding npm Packages

```bash
# From host machine
docker-compose exec app_flexweg npm install <package> --save

# Or stop containers, add to package.json, then restart
docker-compose down
# Edit package.json
docker-compose up -d
```

## Configuration

### Docker Compose Files

- **docker-compose.yml** - Base production configuration
- **docker-compose.override.yml** - Development overrides (volumes, ports, networks)

### Supervisor Configuration

The `docker/supervisord.conf` file manages multiple processes:
- `dev-server` - Runs the Express server and live-server
- `build-watcher` - Watches files and rebuilds on changes

### Volumes

Development volumes are mounted in `docker-compose.override.yml`:

```yaml
volumes:
  - ./:/var/www/project/:cached
```

This allows live editing without rebuilding the container.

### External Content Directories

You can mount external directories for content:

```yaml
volumes:
  - ../external-content:/var/www/project/content
```

Uncomment in `docker-compose.override.yml` if needed.

## Traefik Integration

If using Traefik for local domain routing:

1. Ensure Traefik network exists:
```bash
docker network create traefik
```

2. Configure your `/etc/hosts`:
```
127.0.0.1 flexweg.local
127.0.0.1 admin.flexweg.local
```

3. The labels in `docker-compose.override.yml` handle routing automatically.

## Troubleshooting

### Container Won't Start

Check logs:
```bash
docker-compose logs app_flexweg
```

### Ports Already in Use

Change ports in `.env`:
```env
ADMIN_PORT=3334
SITE_PORT=8081
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

### Build Not Triggering

Check build watcher logs:
```bash
docker-compose logs -f app_flexweg | grep build-watcher
```

### npm Dependencies Not Installing

Rebuild the container:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Permission Issues

Ensure proper permissions on mounted volumes:
```bash
chmod -R 755 content/ config/ src/
```

## Production Deployment

For production, you would typically:

1. Build the static site:
```bash
docker-compose exec app_flexweg npm run build
```

2. Copy the `public/` directory to your hosting:
```bash
docker-compose exec app_flexweg npm run sync
```

Or use CI/CD pipelines to automate this process.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_ENV` | Application environment | `development` |
| `NODE_ENV` | Node environment | `development` |
| `PROJECT_NAME` | Docker project name | `flexweg-decapcms` |
| `APP_FQDN` | Application domain | `flexweg.local` |
| `DOCKER_IMAGE` | Docker image name | `flexweg` |
| `DOCKER_IMAGE_TAG` | Docker image tag | `latest` |
| `NODE_VERSION` | Node.js version | `20` |
| `ADMIN_PORT` | Admin panel port | `3333` |
| `SITE_PORT` | Site preview port | `8080` |
| `FLEXWEG_API_KEY` | API key for deployment | - |
| `FLEXWEG_BASE_URL` | API base URL | - |

## File Structure

```
.
├── docker/
│   └── supervisord.conf       # Process manager config
├── docker-compose.yml          # Base Docker config
├── docker-compose.override.yml # Development overrides
├── Dockerfile                  # Container definition
├── .dockerignore              # Files to exclude from image
├── .env.example               # Environment template
└── README-DOCKER.md           # This file
```

## Tips

1. **Use volumes for development** - Changes reflect immediately
2. **Check logs frequently** - `docker-compose logs -f`
3. **Keep .env out of Git** - Never commit sensitive data
4. **Use Traefik for multiple projects** - Easier domain management
5. **Backup your content/** - It contains all your articles/pages

## Support

For issues related to:
- Docker setup: Check this README
- Application: See main README.md
- Flexweg API: Contact Flexweg support
