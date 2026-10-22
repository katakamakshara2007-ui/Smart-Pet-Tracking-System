@echo off
title Smart Pet Tracking - Process Terminator
echo ======================================================================
echo  Stopping Smart Pet Tracking Application Processes
echo ======================================================================
echo.

echo [*] Stopping processes listening on Port 5000 (Flask Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [*] Stopping processes listening on Port 5173 (React/Vite Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [DONE] Both Backend and Frontend services have been stopped.
timeout /t 2 >nul
