@echo off
REM ============================================
REM Hermes Agent Extension para Nimbalyst
REM ============================================
REM Ejecutar: .\instalar.bat
REM Requisito: Nimbalyst ya instalado

echo.
echo =============================================
echo   Hermes Agent Extension - Instalador
echo =============================================
echo.

set WORK_DIR=%USERPROFILE%\nimbalyst-hermes
mkdir "%WORK_DIR%" 2>nul

REM [1/3] Buscar Nimbalyst instalado
echo [1/3] Buscando Nimbalyst instalado...

set NIMBALYST_DIR=
set FOUND=0

REM Buscar en ubicaciones comunes
for %%d in (
    "%LOCALAPPDATA%\Programs\nimbalyst"
    "%LOCALAPPDATA%\nimbalyst"
    "%PROGRAMFILES%\nimbalyst"
    "%PROGRAMFILES(x86)%\nimbalyst"
) do (
    if exist "%%~d" (
        set NIMBALYST_DIR=%%~d
        set FOUND=1
    )
)

REM Buscar con wildcard
if %FOUND%==0 (
    for /d %%d in ("%LOCALAPPDATA%\Programs\nimbalyst*" "%LOCALAPPDATA%\nimbalyst*" "%PROGRAMFILES%\nimbalyst*") do (
        if exist "%%d" (
            set NIMBALYST_DIR=%%d
            set FOUND=1
        )
    )
)

if %FOUND%==0 (
    echo   [!] No se encontro Nimbalyst.
    echo   Instala Nimbalyst primero desde: https://nimbalyst.com/releases
    echo   Luego ejecuta este script de nuevo.
    pause
    exit /b 1
)

echo   [OK] Encontrado: %NIMBALYST_DIR%

REM Buscar carpeta de extensiones
set EXT_DIR=
if exist "%NIMBALYST_DIR%\resources\extensions" set EXT_DIR=%NIMBALYST_DIR%\resources\extensions

if "%EXT_DIR%"=="" (
    echo   [!] No se encontro la carpeta de extensiones.
    echo   Ruta esperada: %NIMBALYST_DIR%\resources\extensions
    pause
    exit /b 1
)

echo   [OK] Extensiones: %EXT_DIR%

REM [2/3] Descargar e instalar extension
echo.
echo [2/3] Instalando extension Hermes Agent...

cd /d "%WORK_DIR%"

REM Descargar extension
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/goldenigh1423/nimbalyst-hermes/archive/refs/heads/master.zip' -OutFile '%WORK_DIR%\hermes-ext.zip'"

if not exist "%WORK_DIR%\hermes-ext.zip" (
    echo   [!] Error al descargar extension.
    pause
    exit /b 1
)

REM Extraer
powershell -Command "Expand-Archive -Path '%WORK_DIR%\hermes-ext.zip' -DestinationPath '%WORK_DIR%' -Force"

REM Copiar extension
mkdir "%EXT_DIR%\hermes-agent" 2>nul
xcopy /e /i /y "%WORK_DIR%\nimbalyst-hermes-master\code\hermes-agent-nimbalyst\*" "%EXT_DIR%\hermes-agent" >nul

if exist "%EXT_DIR%\hermes-agent\manifest.json" (
    echo   [OK] Extension instalado
) else (
    echo   [!] Error al copiar extension
    pause
    exit /b 1
)

REM [3/3] Configurar SSH
echo.
echo [3/3] Configurando SSH al VPS...

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

REM Limpiar
del "%WORK_DIR%\hermes-ext.zip" 2>nul
rmdir /s /q "%WORK_DIR%\nimbalyst-hermes-master" 2>nul

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
pause
