@echo off
title Gestión de Servidores - Gestor
echo ========================================
echo    INICIANDO SERVIDORES DEL GESTOR
echo ========================================
echo.

echo 🚀 Iniciando servidor backend (Puerto 3001)...
start "Backend Server" cmd /k "cd /d server && npm start"

echo ⏳ Esperando 3 segundos para que el backend inicie...
timeout /t 3 /nobreak >nul

echo 🌐 Iniciando cliente React (Puerto 3000)...
start "React Client" cmd /k "cd /d client && npm start"

echo.
echo ✅ Ambos servidores están iniciándose...
echo.
echo 📋 URLs disponibles:
echo    - Frontend: http://localhost:3000
echo    - Backend:  http://localhost:3001
echo.
echo 🔴 Para detener los servidores, cierre ambas ventanas
echo.
pause
