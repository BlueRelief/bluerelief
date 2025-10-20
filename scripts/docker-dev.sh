#!/bin/bash

# Docker development helper script for BlueRelief

case "$1" in
    "start")
        echo "🚀 Starting BlueRelief development environment..."
        docker-compose up -d
        echo "✅ Services started!"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend: http://localhost:8000"
        echo "   API Docs: http://localhost:8000/docs"
        ;;
    "stop")
        echo "🛑 Stopping BlueRelief development environment..."
        docker-compose down
        echo "✅ Services stopped!"
        ;;
    "restart")
        echo "🔄 Restarting BlueRelief development environment..."
        docker-compose restart
        echo "✅ Services restarted!"
        ;;
    "rebuild")
        echo "🔨 Rebuilding BlueRelief development environment..."
        docker-compose down
        docker-compose up --build -d
        echo "✅ Services rebuilt and started!"
        ;;
    "logs")
        if [ -z "$2" ]; then
            docker-compose logs -f
        else
            docker-compose logs -f $2
        fi
        ;;
    "reset")
        echo "🗑️ Resetting database (this will delete all data)..."
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v
            docker-compose up -d
            echo "✅ Database reset complete!"
        else
            echo "❌ Reset cancelled"
        fi
        docker exec bluerelief-backend alembic upgrade head
        echo "✅ Migrations applied!"
        ;;
    "reset-rebuild")
        echo "🗑️ Resetting database and rebuilding (this will delete all data)..."
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v
            docker-compose up --build -d
            echo "✅ Database reset and rebuild complete!"
        else
            echo "❌ Reset-rebuild cancelled"
        fi
        ;;
    "migrate")
        echo "🔄 Running database migrations..."
        docker exec bluerelief-backend alembic upgrade head
        echo "✅ Migrations applied!"
        ;;
    "migrate-validate")
        echo "🔍 Validating schema..."
        docker exec bluerelief-backend python3 manage_migrations.py validate
        ;;
    "migrate-generate")
        if [ -z "$2" ]; then
            echo "❌ Error: Migration name required"
            echo "Usage: $0 migrate-generate \"description\""
            exit 1
        fi
        echo "📝 Generating migration: $2"
        docker exec bluerelief-backend alembic revision --autogenerate -m "$2"
        echo "✅ Migration generated!"
        ;;
    "migrate-status")
        echo "📊 Migration status:"
        docker exec bluerelief-backend alembic current
        echo ""
        docker exec bluerelief-backend alembic history
        ;;
    "migrate-downgrade")
        if [ -z "$2" ]; then
            echo "❌ Error: Revision required"
            echo "Usage: $0 migrate-downgrade <revision>"
            exit 1
        fi
        echo "⬇️ Downgrading to: $2"
        docker exec bluerelief-backend alembic downgrade "$2"
        echo "✅ Downgrade complete!"
        ;;
    "shell")
        if [ "$2" = "backend" ]; then
            docker-compose exec backend bash
        elif [ "$2" = "frontend" ]; then
            docker-compose exec frontend sh
        elif [ "$2" = "postgres" ]; then
            docker-compose exec postgres psql -U dev -d bluerelief
        elif [ "$2" = "redis" ]; then
            docker-compose exec redis redis-cli
        else
            echo "Usage: $0 shell [backend|frontend|postgres|redis]"
        fi
        ;;
    *)
        echo "BlueRelief Docker Development Helper"
        echo "Usage: $0 {start|stop|restart|rebuild|logs|reset|reset-rebuild|shell}"
        echo ""
        echo "Commands:"
        echo "  start              - Start all services"
        echo "  stop               - Stop all services"
        echo "  restart            - Restart all services"
        echo "  rebuild            - Rebuild and start all services"
        echo "  logs               - Show logs (optionally specify service)"
        echo "  reset              - Reset database (deletes all data)"
        echo "  reset-rebuild      - Reset database and rebuild all services"
        echo "  migrate            - Run pending migrations"
        echo "  migrate-validate   - Validate schema vs ORM"
        echo "  migrate-generate   - Generate new migration (e.g. migrate-generate \"add users table\")"
        echo "  migrate-status     - Show migration history and current revision"
        echo "  migrate-downgrade  - Downgrade to specific revision"
        echo "  shell              - Access service shell [backend|frontend|postgres|redis]"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs backend"
        echo "  $0 shell postgres"
        echo "  $0 migrate-generate \"add users table\""
        echo "  $0 migrate-validate"
        echo "  $0 migrate-downgrade abc1234"
        ;;
esac
