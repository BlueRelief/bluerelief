# Docker development helper script for BlueRelief

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$Service
)

function Show-Usage {
    Write-Host "BlueRelief Docker Development Helper" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: ./docker-dev.ps1 command [service]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Green
    Write-Host "  start         - Start all services"
    Write-Host "  stop          - Stop all services"
    Write-Host "  restart       - Restart all services"
    Write-Host "  rebuild       - Rebuild and start all services"
    Write-Host "  logs          - Show logs (optionally specify service)"
    Write-Host "  reset         - Reset database (deletes all data)"
    Write-Host "  reset-rebuild - Reset database and rebuild all services"
    Write-Host "  shell         - Access service shell"
    Write-Host ""
    Write-Host "Services:" -ForegroundColor Green
    Write-Host "  backend, frontend, postgres, redis"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Magenta
    Write-Host "  ./docker-dev.ps1 start"
    Write-Host "  ./docker-dev.ps1 logs backend"
    Write-Host "  ./docker-dev.ps1 shell postgres"
}

if (-not $Command) {
    Show-Usage
    exit
}

switch ($Command) {
    "start" {
        Write-Host "🚀 Starting BlueRelief development environment..." -ForegroundColor Green
        docker compose up -d
        Write-Host "✅ Services started!" -ForegroundColor Green
        Write-Host "   Frontend: http://localhost:3000"
        Write-Host "   Backend: http://localhost:8000"
        Write-Host "   API Docs: http://localhost:8000/docs"
    }
    
    "stop" {
        Write-Host "🛑 Stopping BlueRelief development environment..." -ForegroundColor Yellow
        docker compose down
        Write-Host "✅ Services stopped!" -ForegroundColor Green
    }
    
    "restart" {
        Write-Host "🔄 Restarting BlueRelief development environment..." -ForegroundColor Yellow
        docker compose restart
        Write-Host "✅ Services restarted!" -ForegroundColor Green
    }
    
    "rebuild" {
        Write-Host "🔨 Rebuilding BlueRelief development environment..." -ForegroundColor Yellow
        docker compose down
        docker compose up --build -d
        Write-Host "✅ Services rebuilt and started!" -ForegroundColor Green
    }
    
    "logs" {
        if ([string]::IsNullOrEmpty($Service)) {
            docker compose logs -f
        }
        else {
            docker compose logs -f $Service
        }
    }
    
    "reset" {
        Write-Host "🗑️ Resetting database (this will delete all data)..." -ForegroundColor Red
        $confirmation = Read-Host "Are you sure? (y/N)"
        if ($confirmation -match "^[Yy]$") {
            docker compose down -v
            docker compose up -d
            Write-Host "✅ Database reset complete!" -ForegroundColor Green
            docker exec bluerelief-backend python run_migrations.py
            Write-Host "✅ Migrations applied!" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Reset cancelled" -ForegroundColor Yellow
        }
    }
    
    "reset-rebuild" {
        Write-Host "🗑️ Resetting database and rebuilding (this will delete all data)..." -ForegroundColor Red
        $confirmation = Read-Host "Are you sure? (y/N)"
        if ($confirmation -match "^[Yy]$") {
            docker compose down -v
            docker compose up --build -d
            Write-Host "✅ Database reset and rebuild complete!" -ForegroundColor Green
            docker exec bluerelief-backend python run_migrations.py
            Write-Host "✅ Migrations applied!" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Reset-rebuild cancelled" -ForegroundColor Yellow
        }
    }
    
    "shell" {
        switch ($Service) {
            "backend" {
                docker compose exec backend bash
            }
            "frontend" {
                docker compose exec frontend sh
            }
            "postgres" {
                docker compose exec postgres psql -U dev -d bluerelief
            }
            "redis" {
                docker compose exec redis redis-cli
            }
            default {
                Write-Host "Available services: backend, frontend, postgres, redis" -ForegroundColor Yellow
                Write-Host "Usage: ./docker-dev.ps1 shell [service]" -ForegroundColor Yellow
            }
        }
    }
    
    default {
        Write-Host ("Unknown command: " + $Command) -ForegroundColor Red
        Write-Host ""
        Show-Usage
    }
}