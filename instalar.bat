@echo off
echo ========================================
echo   Instalando Cantina Universitaria
echo ========================================
echo.

echo [1/1] Instalando dependencias do Frontend...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do frontend
    pause
    exit /b 1
)
echo Frontend OK!
echo.

echo ========================================
echo   Instalacao concluida!
echo ========================================
echo.
echo PROXIMOS PASSOS:
echo 1. Execute: cd frontend ^& npm run dev
echo 2. Acesse: http://localhost:5173
echo.
echo O app roda em modo demo com dados mockados no navegador.
echo.
pause
