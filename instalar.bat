@echo off
echo ========================================
echo   Instalando Cantina Universitaria
echo ========================================
echo.

echo [1/4] Instalando dependencias do Backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do backend
    pause
    exit /b 1
)
echo Backend OK!
echo.

echo [2/4] Copiando arquivo de configuracao...
if not exist .env (
    copy .env.example .env
    echo Arquivo .env criado. O SQLite sera criado automaticamente em backend\data\cantina.sqlite.
) else (
    echo Arquivo .env ja existe.
)
echo.

echo [3/4] Instalando dependencias do Frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do frontend
    pause
    exit /b 1
)
echo Frontend OK!
echo.

echo [4/4] Criando pasta de uploads...
cd ..\backend
if not exist uploads mkdir uploads
echo.

echo ========================================
echo   Instalacao concluida!
echo ========================================
echo.
echo PROXIMOS PASSOS:
echo 1. Execute: cd backend ^& npm run migrate
echo 2. Execute: cd backend ^& npm run seed
echo 3. Em um terminal: cd backend ^& npm run dev
echo 4. Em outro terminal: cd frontend ^& npm run dev
echo.
echo Acesse: http://localhost:5173
echo.
pause
