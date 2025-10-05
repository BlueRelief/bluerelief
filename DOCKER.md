# Docker Development Setup

This setup includes PostgreSQL, Redis, FastAPI backend, and Next.js frontend for development.

## Quick Start

1. **Clone and navigate to the project:**
   ```bash
   cd /Users/geeth/Development/bluerelief
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

## Services

- **Frontend (Next.js)**: http://localhost:3000
- **Backend (FastAPI)**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Database Connection

- **Host**: localhost
- **Port**: 5432
- **Database**: bluerelief
- **Username**: dev
- **Password**: devpassword

## Redis Connection

- **Host**: localhost
- **Port**: 6379

## Useful Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild services
docker-compose up --build

# View logs
docker-compose logs -f [service-name]

# Execute commands in containers
docker-compose exec backend bash
docker-compose exec frontend sh

# Reset database (removes all data)
docker-compose down -v
docker-compose up -d
```

## Development

The services are configured with volume mounts for hot reloading:
- Backend code changes are reflected immediately
- Frontend code changes trigger hot reload
- Database and Redis data persist in Docker volumes
