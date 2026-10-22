@echo off
title Push to GitHub - katakamakshara2007-ui
echo ======================================================================
echo  Pushing Smart Pet Tracking System to GitHub
echo  Account: katakamakshara2007-ui
echo ======================================================================
echo.

cd /d "%~dp0"

echo [*] Initializing Git repository...
git init
git branch -M main

echo [*] Staging all clean project files...
git add .

echo [*] Committing code...
git commit -m "Complete Smart Pet Tracking and Escape Prediction System - Anurag University B.Tech Project"

echo [*] Setting remote origin to https://github.com/katakamakshara2007-ui/Smart-Pet-Tracking-System.git ...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/katakamakshara2007-ui/Smart-Pet-Tracking-System.git

echo.
echo [*] Uploading to GitHub (if prompted, sign in via browser or Personal Access Token)...
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ======================================================================
    echo  [SUCCESS] Code successfully pushed to your GitHub!
    echo  View it here: https://github.com/katakamakshara2007-ui/Smart-Pet-Tracking-System
    echo ======================================================================
) else (
    echo ======================================================================
    echo  [IMPORTANT] If the upload failed:
    echo  1. Make sure you created the empty repository on GitHub:
    echo     https://github.com/new -> Name: Smart-Pet-Tracking-System
    echo  2. Then double-click this push-to-github.bat file again!
    echo ======================================================================
)
echo.
pause
