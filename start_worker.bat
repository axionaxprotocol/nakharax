@echo off
TITLE NakharaX Protocol - Plug ^& Play DeAI Worker Launcher
COLOR 0B
cls

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_worker_zero_config.ps1"

if %errorlevel% neq 0 (
    echo.
    echo Press any key to exit...
    pause >nul
)
