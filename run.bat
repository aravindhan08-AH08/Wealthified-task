@echo off
title Mutual Fund Dashboard Launcher
echo ============================================================
echo      MUTUAL FUND DASHBOARD - ENVIRONMENT INITIALIZATION      
echo ============================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in your system PATH.
    echo Please install Python 3.9+ and check "Add Python to PATH" during setup.
    echo.
    pause
    exit /b 1
)

:: Create Python Virtual Environment in backend directory if it doesn't exist
if not exist "backend\.venv" (
    echo [INFO] Creating Python virtual environment in backend\.venv...
    python -m venv backend\.venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment created.
    echo.
)

:: Activate Virtual Environment & Install requirements
echo [INFO] Activating virtual environment and updating dependencies...
call backend\.venv\Scripts\activate.bat
python -m pip install --upgrade pip >nul 2>&1
pip install -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)
echo [SUCCESS] Backend dependencies successfully installed/verified.
echo.

:: Start FastAPI Backend Server in a new window
echo [INFO] Starting FastAPI backend on http://localhost:8000...
start "Mutual Fund Dashboard Backend" cmd /k "call backend\.venv\Scripts\activate.bat && cd backend && uvicorn app.main:app --host 127.0.0.1 --port 8000"

:: Wait a brief moment for backend to warm up
timeout /t 2 /nobreak >nul

:: Open Dashboard in Web Browser
echo [INFO] Launching dashboard in browser...
start "" "http://localhost:5500"

:: Start Frontend Server locally
echo [INFO] Starting local frontend server on port 5500...
echo Keep this window open to run the frontend server. Press Ctrl+C to stop.
echo.
python -m http.server 5500
