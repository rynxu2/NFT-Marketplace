@echo off
echo ============================================
echo   NFT Marketplace - Dev Runner
echo   Next.js + Hardhat (Parallel)
echo ============================================
echo.

:: Start Hardhat node in a new window
echo [1/2] Starting Hardhat local node...
start "Hardhat Node" cmd /k "cd /d %~dp0 && npx hardhat --config hardhat.config.cjs node"

:: Wait a moment for Hardhat to initialize
timeout /t 3 /nobreak > nul

:: Start Next.js dev in current window
echo [2/2] Starting Next.js dev server...
echo.
echo  Hardhat: http://localhost:8545
echo  Next.js: http://localhost:3000
echo.
echo  Press Ctrl+C to stop Next.js. Close the Hardhat window separately.
echo ============================================
echo.

npx next dev
