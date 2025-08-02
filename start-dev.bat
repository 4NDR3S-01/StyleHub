@echo off
cd /d "c:\Users\Martha Mero\Desktop\avance-arquitectura\StyleHub"
echo Directorio actual: %cd%
echo.
echo Verificando package.json...
if exist package.json (
    echo ✓ package.json encontrado
) else (
    echo ✗ package.json NO encontrado
    pause
    exit /b 1
)
echo.
echo Verificando node_modules...
if exist node_modules (
    echo ✓ node_modules encontrado
) else (
    echo ✗ node_modules NO encontrado - ejecutando npm install...
    npm install
)
echo.
echo Ejecutando npm run dev...
npm run dev
pause
