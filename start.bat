@echo off
echo.
echo 🚀 Iniciando Aligned Proposals...
echo.

REM Verifica se está na raiz do projeto
if not exist "backend" (
    echo ❌ Erro: Execute este script na raiz do projeto!
    exit /b 1
)
if not exist "frontend" (
    echo ❌ Erro: Execute este script na raiz do projeto!
    exit /b 1
)

echo 📦 Iniciando Backend (porta 5000)...
start "Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo ⚛️  Iniciando Frontend (porta 3000)...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo ✅ Servidores iniciados em janelas separadas!
echo.
echo 📍 Backend:  http://localhost:5000
echo 📍 Frontend: http://localhost:3000
echo.
echo ⚠️  Feche as janelas do terminal para parar os servidores
echo.
pause
