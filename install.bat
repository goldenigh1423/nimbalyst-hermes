@echo off
REM ============================================
REM Nimbalyst + Hermes Agent - Instalador Windows
REM ============================================
REM Ejecutar: install.bat
REM Requisitos: git, node (v22+), npm

echo.
echo ====================================================
echo   Nimbalyst + Hermes Agent - Instalador
echo ====================================================
echo.

REM Verificar git
where git >nul 2>&1 || (echo [ERROR] git no encontrado && exit /b 1)
echo [OK] git

REM Verificar Node.js
where node >nul 2>&1 || (echo [ERROR] Node.js no encontrado && exit /b 1)
echo [OK] Node.js

REM Verificar npm
where npm >nul 2>&1 || (echo [ERROR] npm no encontrado && exit /b 1)
echo [OK] npm

REM Crear directorio
set INSTALL_DIR=%USERPROFILE%\nimbalyst-workspace
mkdir "%INSTALL_DIR%" 2>nul
cd /d "%INSTALL_DIR%"

REM [1/7] Clonar repos
echo.
echo [1/7] Clonando repositorios...

if exist "nimbalyst" (
    echo   nimbalyst ya existe, actualizando...
    cd nimbalyst && git pull && cd ..
) else (
    git clone https://github.com/nimbalyst/nimbalyst.git
    echo   [OK] Nimbalyst clonado
)

if exist "nimbalyst-hermes" (
    echo   nimbalyst-hermes ya existe, actualizando...
    cd nimbalyst-hermes && git pull && cd ..
) else (
    git clone https://github.com/goldenigh1423/nimbalyst-hermes.git
    echo   [OK] Extension clonado
)

REM [2/7] Integrar extension
echo.
echo [2/7] Integrando extension Hermes Agent...

rmdir /s /q "%INSTALL_DIR%\nimbalyst\packages\extensions\hermes-agent" 2>nul
xcopy /e /i /y "%INSTALL_DIR%\nimbalyst-hermes\code\hermes-agent-nimbalyst" "%INSTALL_DIR%\nimbalyst\packages\extensions\hermes-agent" >nul
echo   [OK] Extension integrado

REM [3/7] Instalar dependencias
echo.
echo [3/7] Instalando dependencias (tarda 5-15 minutos)...
cd /d "%INSTALL_DIR%\nimbalyst"
call npm install >nul 2>&1
echo   [OK] Dependencias instaladas

REM [4/7] Compilar
echo.
echo [4/7] Compilando Nimbalyst (tarda 10-20 minutos)...
cd /d "%INSTALL_DIR%\nimbalyst\packages\electron"

echo   Generando licencias...
call npm run licenses:generate >nul 2>&1

echo   Compilando aplicacion...
set NODE_OPTIONS=--max-old-space-size=8192
call npx electron-vite build >nul 2>&1

echo   Compilando extensiones...
call npm run build:extensions >nul 2>&1

echo   Generando instalador...
call npx electron-builder --win --x64 >nul 2>&1

echo   [OK] Compilacion completada

REM [5/7] Configurar SSH
echo.
echo [5/7] Configurando SSH...

set CONFIG_DIR=%USERPROFILE%\.nimbalyst\extensions\hermes-agent
mkdir "%CONFIG_DIR%" 2>nul

(
echo {
echo   "connectionMode": "ssh",
echo   "sshHost": "169.58.56.108",
echo   "sshUser": "root",
echo   "sshKeyPath": "%USERPROFILE%\.ssh\id_rsa",
echo   "hermesBinary": "hermes",
echo   "hermesProfile": "coder"
echo }
) > "%CONFIG_DIR%\config.json"

echo   [OK] Configuracion SSH creada

REM Resultado
echo.
echo ====================================================
echo   Instalacion completada!
echo ====================================================
echo.
echo El instalador esta en:
echo   %INSTALL_DIR%\nimbalyst\packages\electron\dist\
echo.
echo Busca el archivo .exe y ejecutalo.
echo.
echo Desues de instalar:
echo   1. Abrir Nimbalyst
echo   2. Settings - Extensions - Habilitar 'Hermes Agent'
echo   3. Nueva sesion - Seleccionar 'Hermes Agent'
echo.
pause
