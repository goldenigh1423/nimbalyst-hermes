@echo off
REM ============================================
REM Nimbalyst + Hermes Agent - Instalador Automatico
REM ============================================
REM Ejecutar: .\instalar.bat

echo.
echo =============================================
echo   Nimbalyst + Hermes Agent - Instalador
echo =============================================
echo.

REM Crear directorio de trabajo
set WORK_DIR=%USERPROFILE%\nimbalyst-hermes
mkdir "%WORK_DIR%" 2>nul
cd /d "%WORK_DIR%"

REM [1/4] Descargar Nimbalyst
echo [1/4] Descargando Nimbalyst v0.73.2...
echo.

REM Detectar arquitectura
if "%PROCESSOR_ARCHITECTURE%"=="ARM64" (
    set EXE_URL=https://github.com/nimbalyst/nimbalyst/releases/download/v0.73.2/Nimbalyst-Windows-arm64.exe
    set EXE_NAME=Nimbalyst-Windows-arm64.exe
) else (
    set EXE_URL=https://github.com/nimbalyst/nimbalyst/releases/download/v0.73.2/Nimbalyst-Windows-x64.exe
    set EXE_NAME=Nimbalyst-Windows-x64.exe
)

echo   Descargando %EXE_NAME%...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%EXE_URL%' -OutFile '%WORK_DIR%\%EXE_NAME%'"

if exist "%WORK_DIR%\%EXE_NAME%" (
    echo   [OK] Descargado: %EXE_NAME%
) else (
    echo   [ERROR] No se pudo descargar.
    echo   Descarga manualmente desde: https://github.com/nimbalyst/nimbalyst/releases/latest
    pause
    exit /b 1
)

REM [2/4] Instalar Nimbalyst
echo.
echo [2/4] Instalando Nimbalyst...
echo   Ejecutando instalador (sigue las instrucciones en pantalla)...
start /wait "%WORK_DIR%\%EXE_NAME%"

echo   [OK] Nimbalyst instalado

REM [3/4] Descargar e instalar extension Hermes
echo.
echo [3/4] Instalando extension Hermes Agent...

REM Descargar extension desde GitHub
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/goldenigh1423/nimbalyst-hermes/archive/refs/heads/master.zip' -OutFile '%WORK_DIR%\hermes-ext.zip'"
powershell -Command "Expand-Archive -Path '%WORK_DIR%\hermes-ext.zip' -DestinationPath '%WORK_DIR%' -Force"

REM Buscar donde se instalo Nimbalyst
set NIMBALYST_DIR=
if exist "%LOCALAPPDATA%\Programs\nimbalyst" set NIMBALYST_DIR=%LOCALAPPDATA%\Programs\nimbalyst
if exist "%LOCALAPPDATA%\nimbalyst" set NIMBALYST_DIR=%LOCALAPPDATA%\nimbalyst
if exist "%PROGRAMFILES%\nimbalyst" set NIMBALYST_DIR=%PROGRAMFILES%\nimbalyst

REM Buscar resources\extensions
set EXT_DEST=
if exist "%NIMBALYST_DIR%\resources\extensions" set EXT_DEST=%NIMBALYST_DIR%\resources\extensions

if "%EXT_DEST%"=="" (
    echo   Buscando instalacion de Nimbalyst...
    for /d %%d in ("%LOCALAPPDATA%\Programs\nimbalyst*" "%LOCALAPPDATA%\nimbalyst*" "%PROGRAMFILES%\nimbalyst*") do (
        if exist "%%d\resources\extensions" set EXT_DEST=%%d\resources\extensions
    )
)

if "%EXT_DEST%"=="" (
    echo   No se encontro la carpeta de extensiones automaticamente.
    echo   Copia manualmente la carpeta:
    echo     %WORK_DIR%\nimbalyst-hermes-master\code\hermes-agent-nimbalyst
    echo   A la carpeta 'resources\extensions\hermes-agent' dentro de Nimbalyst.
) else (
    mkdir "%EXT_DEST%\hermes-agent" 2>nul
    xcopy /e /i /y "%WORK_DIR%\nimbalyst-hermes-master\code\hermes-agent-nimbalyst\*" "%EXT_DEST%\hermes-agent" >nul
    echo   [OK] Extension instalado en: %EXT_DEST%\hermes-agent
)

REM [4/4] Configurar SSH
echo.
echo [4/4] Configurando SSH al VPS...

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

echo   [OK] Configuracion creada en: %CONFIG_DIR%\config.json

REM Limpiar
del "%WORK_DIR%\hermes-ext.zip" 2>nul
del "%WORK_DIR%\%EXE_NAME%" 2>nul
rmdir /s /q "%WORK_DIR%\nimbalyst-hermes-master" 2>nul

REM Resultado
echo.
echo =============================================
echo   Instalacion completada!
echo =============================================
echo.
echo   1. Abre Nimbalyst (buscalo en el menu inicio)
echo   2. Settings - Extensions
echo   3. Habilita "Hermes Agent"
echo   4. Nueva sesion - Selecciona "Hermes Agent"
echo.
echo   Si no tienes SSH al VPS configurado:
echo     ssh-keygen -t ed25519
echo     ssh-copy-id root@169.58.56.108
echo.
pause
