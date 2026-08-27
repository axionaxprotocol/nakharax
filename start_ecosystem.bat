@echo off
TITLE NakharaX Protocol - Sovereign Ecosystem Launcher
COLOR 0A
cls
echo ==============================================================================
echo       NAKHARAX PROTOCOL: LAYER-1 SOVEREIGN DEAI BLOCKCHAIN ECOSYSTEM
echo ==============================================================================
echo [1/3] Loading Blockchain State (.state_cache.json)...
echo [2/3] Starting L1 RPC Server (8545) & WebSocket Stream (8546)...
echo [3/3] Starting Web OS Terminal (http://localhost:3030)...
echo ==============================================================================
echo.
pnpm dev
