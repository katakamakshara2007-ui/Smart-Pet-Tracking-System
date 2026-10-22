@echo off
title Smart Pet Tracking and Escape Prediction System - Launcher
echo ======================================================================
echo  Smart Pet Tracking and Escape Prediction System
echo  Department of Data Science - Anurag University
echo ======================================================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

:: Check Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not found in PATH. Please install Python 3.10 or 3.11.
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js.
    pause
    exit /b 1
)

:: Setup Virtualenv if not present
if not exist "backend\venv" (
    echo [*] Creating Python virtual environment in backend\venv...
    cd backend
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
)

:: Setup Node modules if not present
if not exist "frontend\node_modules" (
    echo [*] Installing frontend npm dependencies...
    cd frontend
    call npm install
    cd ..
)

echo [*] Starting Flask Backend Server on http://localhost:5000 ...
start "Smart Pet Tracking - Flask Backend" cmd /c "cd /d "%SCRIPT_DIR%backend" && call venv\Scripts\activate.bat && python run.py"

echo [*] Starting React / Vite Frontend on http://localhost:5173 ...
start "Smart Pet Tracking - Vite Frontend" cmd /c "cd /d "%SCRIPT_DIR%frontend" && npm run dev"

echo.
echo ======================================================================
echo  Applications started successfully!
echo   - Backend:  http://localhost:5000/api/health
echo   - Frontend: http://localhost:5173
echo.
echo  Demo Credentials:
echo   - Email:    student@anurag.edu.in
echo   - Password: Password123!
echo ======================================================================
echo.
timeout /t 3 >nul
start http://localhost:5173
pause
