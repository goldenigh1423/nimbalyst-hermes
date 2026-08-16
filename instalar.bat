@echo off
REM ============================================
REM Nimbalyst + Hermes Agent - Instalador Simple
REM ============================================
REM Ejecutar: instalar.bat
REM
REM Esto hace:
REM   1. Descarga Nimbalyst oficial
REM   2. Copia el extension Hermes Agent
REM   3. Abre Nimbalyst
REM
REM Requisitos: Ninguno (descarga todo)

echo.
echo =============================================
echo   Nimbalyst + Hermes Agent - Instalador
echo =============================================
echo.

REM Crear directorio de trabajo
set INSTALL_DIR=%USERPROFILE%\nimbalyst-hermes
mkdir "%INSTALL_DIR%" 2>nul
cd /d "%INSTALL_DIR%"

REM [1/5] Descargar Nimbalyst
echo [1/5] Descargando Nimbalyst...
echo.
echo   Ve a: https://nimbalyst.com/releases
echo   Descarga el instalador para Windows (.exe)
echo   e instalalo normalmente.
echo.
echo   Cuando termine la instalacion, presiona ENTER aqui.
echo.
pause

REM [2/5] Buscar instalacion de Nimbalyst
echo.
echo [2/5] Buscando Nimbalyst instalado...

set NIMBALYST_DIR=
if exist "%LOCALAPPDATA%\nimbalyst" set NIMBALYST_DIR=%LOCALAPPDATA%\nimbalyst
if exist "%PROGRAMFILES%\nimbalyst" set NIMBALYST_DIR=%PROGRAMFILES%\nimbalyst
if exist "%PROGRAMFILES(x86)%\nimbalyst" set NIMBALYST_DIR=%PROGRAMFILES(x86)%\nimbalyst

if "%NIMBALYST_DIR%"=="" (
    echo   No se encontro Nimbalyst automaticamente.
    echo   Copia la ruta donde instalaste Nimbalyst:
    set /p NIMBALYST_DIR="   Ruta: "
)

echo   [OK] Nimbalyst en: %NIMBALYST_DIR%

REM [3/5] Descargar extension Hermes
echo.
echo [3/5] Descargando extension Hermes Agent...

cd /d "%INSTALL_DIR%"

REM Descargar desde GitHub
where git >nul 2>&1
if %errorlevel%==0 (
    git clone https://github.com/goldenigh1423/nimbalyst-hermes.git
) else (
    echo   git no encontrado. Descargando ZIP...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/goldenigh1423/nimbalyst-hermes/archive/refs/heads/master.zip' -OutFile 'nimbalyst-hermes.zip'"
    powershell -Command "Expand-Archive -Path 'nimbalyst-hermes.zip' -DestinationPath '.'"
    ren nimbalyst-hermes-master nimbalyst-hermes
)

echo   [OK] Extension descargado

REM [4/5] Copiar extension
echo.
echo [4/5] Instalando extension en Nimbalyst...

set EXT_DIR=%NIMBALYST_DIR%\resources\extensions\hermes-agent
mkdir "%EXT_DIR%" 2>nul
xcopy /e /i /y "%INSTALL_DIR%\nimbalyst-hermes\code\hermes-agent-nimbalyst\*" "%EXT_DIR%" >nul
echo   [OK] Extension instalado

REM [5/5] Configurar SSH
echo.
echo [5/5] Configurando SSH al VPS...

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

echo   [OK] Configuracion creada

REM Resultado
echo.
echo =============================================
echo   Listo!
echo =============================================
echo.
echo   1. Abre Nimbalyst
echo   2. Settings - Extensions
echo   3. Habilita "Hermes Agent"
echo   4. Nueva sesion - Selecciona "Hermes Agent"
echo.
echo   Si no tienes SSH al VPS configurado:
echo     ssh-keygen -t ed25519
echo     ssh-copy-id root@169.58.56.108
echo.
pause
