# Incident Report Analyzer - Setup Script for Windows
# This script will setup the entire project without Docker

param(
    [switch]$Help,
    [switch]$SkipDB,
    [switch]$OnlyBackend,
    [switch]$OnlyFrontend
)

if ($Help) {
    @"
INCIDENT REPORT ANALYZER - SETUP SCRIPT

Usage:
  .\setup.ps1                 # Full setup
  .\setup.ps1 -SkipDB        # Skip database setup
  .\setup.ps1 -OnlyBackend   # Only setup backend
  .\setup.ps1 -OnlyFrontend  # Only setup frontend
  .\setup.ps1 -Help          # Show this help

Requirements:
  - Python 3.9+ (https://www.python.org/downloads/)
  - PostgreSQL (https://www.postgresql.org/download/)
  - Node.js & npm (https://nodejs.org/)

"@
    exit 0
}

$ErrorActionPreference = "Stop"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     INCIDENT REPORT ANALYZER - SETUP (NO DOCKER)           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ==================== CHECKS ====================
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.9+" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
try {
    $psqlVersion = psql --version 2>&1
    Write-Host "✓ PostgreSQL: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ PostgreSQL not found. Please install PostgreSQL" -ForegroundColor Red
    exit 1
}

# Check Node.js
if (-not $OnlyBackend) {
    try {
        $nodeVersion = node --version 2>&1
        Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "✗ Node.js not found. Please install Node.js" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# ==================== DATABASE SETUP ====================
if (-not $OnlyFrontend -and -not $SkipDB) {
    Write-Host "🗄️  Setting up PostgreSQL database..." -ForegroundColor Cyan
    
    try {
        $dbCheckQuery = @"
psql -U postgres -h localhost -tc "SELECT 1 FROM pg_database WHERE datname = 'incident_db'" 2>$null
"@
        Write-Host "Note: Enter PostgreSQL password when prompted" -ForegroundColor Gray
        
        # Try to create database
        $createDbQuery = @"
CREATE DATABASE incident_db;
"@
        $createDbQuery | psql -U postgres -h localhost 2>$null
        Write-Host "✓ Database 'incident_db' created (or already exists)" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Database setup had issues - it may already exist" -ForegroundColor Yellow
    }
}

Write-Host ""

# ==================== BACKEND SETUP ====================
if (-not $OnlyFrontend) {
    Write-Host "⚙️  Setting up Backend (FastAPI)..." -ForegroundColor Cyan
    
    cd "$scriptPath\backend"
    
    # Create virtual environment
    Write-Host "Creating Python virtual environment..." -ForegroundColor Gray
    if (-not (Test-Path "venv")) {
        python -m venv venv
        Write-Host "✓ Virtual environment created" -ForegroundColor Green
    } else {
        Write-Host "✓ Virtual environment already exists" -ForegroundColor Green
    }
    
    # Activate virtual environment
    Write-Host "Activating virtual environment..." -ForegroundColor Gray
    & ".\venv\Scripts\Activate.ps1"
    
    # Install dependencies
    Write-Host "Installing Python dependencies..." -ForegroundColor Gray
    pip install --upgrade pip | Out-Null
    pip install -r requirements.txt | Out-Null
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
    
    # Check for .env
    if (-not (Test-Path ".env")) {
        Write-Host "Creating .env file..." -ForegroundColor Gray
        Copy-Item ".env.example" ".env"
        Write-Host "✓ .env file created" -ForegroundColor Green
        Write-Host "⚠ IMPORTANT: Edit backend\.env and add your OpenAI API key!" -ForegroundColor Yellow
    } else {
        Write-Host "✓ .env file already exists" -ForegroundColor Green
    }
    
    Write-Host ""
}

# ==================== FRONTEND SETUP ====================
if (-not $OnlyBackend) {
    Write-Host "⚛️  Setting up Frontend (React + Vite)..." -ForegroundColor Cyan
    
    cd "$scriptPath\frontend"
    
    # Install dependencies
    Write-Host "Installing npm dependencies..." -ForegroundColor Gray
    npm install | Out-Null
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
    
    # Create .env
    if (-not (Test-Path ".env")) {
        Write-Host "Creating .env file..." -ForegroundColor Gray
        @"
VITE_API_URL=http://localhost:8000
"@ | Out-File -Encoding UTF8 ".env"
        Write-Host "✓ Frontend .env file created" -ForegroundColor Green
    } else {
        Write-Host "✓ Frontend .env file already exists" -ForegroundColor Green
    }
    
    Write-Host ""
}

# ==================== COMPLETION ====================
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✓ SETUP COMPLETED SUCCESSFULLY                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure Backend Environment Variables:"
Write-Host "   Open: backend\.env" -ForegroundColor Gray
Write-Host "   Add your OpenAI API Key:" -ForegroundColor Gray
Write-Host "   OPENAI_API_KEY=your_key_here" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Start Backend Server (Terminal 1):"
Write-Host "   cd backend && .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "   python main.py" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Start Frontend Server (Terminal 2):"
Write-Host "   cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Access Application:"
Write-Host "   Frontend:     http://localhost:5173" -ForegroundColor Cyan
Write-Host "   API Docs:     http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

Write-Host "For detailed instructions, see: SETUP_WITHOUT_DOCKER.md" -ForegroundColor Gray
Write-Host ""
