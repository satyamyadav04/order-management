@echo off
title Sphere Launcher

echo =======================================================
echo               Sphere System Launcher
echo =======================================================
echo.

:: Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in your PATH.
    echo Please make sure Python 3.12 is installed and added to environment variables.
    pause
    exit /b 1
)

echo [1/3] Setting up Python virtual environment...
if not exist "backend\venv" (
    echo Creating virtual environment inside backend\venv...
    python -m venv backend\venv
) else (
    echo Virtual environment already exists.
)

echo [2/3] Installing/verifying API dependencies...
call backend\venv\Scripts\pip install -r backend\requirements.txt

echo [3/3] Launching local FastAPI backend server...
:: Run uvicorn in a separate window so it runs concurrently
start "Sphere Backend API" cmd /k "cd backend && venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo =======================================================
echo  API backend launched at http://localhost:8000
echo  Launching preview website in your browser...
echo =======================================================
echo.

:: Open the preview website in the browser
start preview_website.html

echo Done! Keep the backend terminal window open to query the database.
echo To run using Docker Compose instead, use: docker compose up --build
echo.
pause
