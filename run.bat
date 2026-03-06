@echo off
REM Incident Report Analyzer - Run Script (Windows)
REM Starts both backend and frontend servers locally (NO DOCKER)

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     INCIDENT REPORT ANALYZER - START APPLICATION           ║
echo ║            (Local Development - No Docker)                 ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if backend\.env exists
if not exist "backend\.env" (
    echo ❌ ERROR: backend\.env not found!
    echo.
    echo Please run the PowerShell setup script first:
    echo   powershell -ExecutionPolicy Bypass -File setup.ps1
    echo.
    pause
    exit /b 1
)

REM Check for Gemini API key
findstr "GEMINI_API_KEY=your-gemini-api-key-here" backend\.env >nul
if errorlevel 0 (
    echo ⚠️  WARNING: Gemini API key not configured!
    echo.
    echo Please edit: backend\.env
    echo And set your GEMINI_API_KEY
    echo Get from: https://aistudio.google.com/app/apikey
    echo.
    pause
)

echo ✓ All prerequisites met. Starting application...
echo.

echo ▶ Starting Backend Server...
start "Incident Report Analyzer - Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate.bat && python main.py"

timeout /t 3 /nobreak

echo ▶ Starting Frontend Development Server...
start "Incident Report Analyzer - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 2 /nobreak

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           ✓ APPLICATION STARTED SUCCESSFULLY               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📱 Frontend Application:
echo    http://localhost:5173
echo.
echo 📚 API Documentation (Swagger UI):
echo    http://localhost:8000/docs
echo.
echo 🔧 API Server:
echo    http://localhost:8000
echo.
echo ℹ️  Two terminal windows opened:
echo    - Backend running on port 8000
echo    - Frontend running on port 5173
echo.
echo Type Ctrl+C in either window to stop that server
echo.

    exit /b 1
)

echo ✅ Environment setup verified
echo.

REM Start services
echo Starting services...
echo.

docker-compose up -d

REM Wait for services
echo.
echo Waiting for services to be healthy...
timeout /t 10 /nobreak

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if errorlevel 0 (
    echo.
    echo ✅ Services started successfully!
    echo.
    echo =========================================
    echo   🎉 Ready to Use!
    echo =========================================
    echo.
    echo Frontend:  http://localhost
    echo Backend:   http://localhost:8000
    echo API Docs:  http://localhost:8000/docs
    echo.
    echo Database:  PostgreSQL on localhost:5432
    echo.
    echo =========================================
    echo.
    echo 📝 First Steps:
    echo   1. Open http://localhost in your browser
    echo   2. Enter an incident report
    echo   3. Click 'Analyze Report'
    echo.
    echo 📊 View Logs:
    echo   docker-compose logs -f backend
    echo   docker-compose logs -f frontend
    echo.
    echo 🛑 Stop Services:
    echo   docker-compose down
    echo.
    pause
) else (
    echo.
    echo ❌ Failed to start services
    echo.
    echo Troubleshooting:
    echo   - Check Docker is running
    echo   - Check ports 80, 8000, 5432 are available
    echo   - View logs: docker-compose logs
    echo.
    pause
    exit /b 1
)
