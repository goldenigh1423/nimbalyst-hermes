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
where git >nul 2>&1 || (echo ERROR: git no encontrado. Instalar: https://git-scm.com && exit /b 1)
echo [OK] git encontrado

REM Verificar Node.js
where node >nul 2>&1 || (echo ERROR: Node.js no encontrado. Instalar v22+: https://nodejs.org && exit /b 1)
echo [OK] Node.js encontrado

REM Crear directorio de trabajo
set INSTALL_DIR=%USERPROFILE%\nimbalyst-workspace
mkdir "%INSTALL_DIR%" 2>nul
cd /d "%INSTALL_DIR%"

REM Clonar Nimbalyst
if exist "nimbalyst" (
    echo [WARN] nimbalyst ya existe, actualizando...
    cd nimbalyst && git pull && cd ..
) else (
    git clone https://github.com/nimbalyst/nimbalyst.git
    echo [OK] Nimbalyst clonado
)

REM Clonar Extension
if exist "nimbalyst-hermes" (
    echo [WARN] nimbalyst-hermes ya existe, actualizando...
    cd nimbalyst-hermes && git pull && cd ..
) else (
    git clone https://github.com/goldenigh1423/nimbalyst-hermes.git
    echo [OK] Extension clonado
)

REM Copiar extension
echo Integrando extension...
rmdir /s /q "%INSTALL_DIR%\nimbalyst\packages\extensions\hermes-agent" 2>nul
xcopy /e /i /y "%INSTALL_DIR%\nimbalyst-hermes\code\hermes-agent-nimbalyst" "%INSTALL_DIR%\nimbalyst\packages\extensions\hermes-agent"
echo [OK] Extension integrado

REM Instalar dependencias
echo.
echo Instalando dependencias (esto tarda varios minutos)...
cd /d "%INSTALL_DIR%\nimbalyst"
call npm install
echo [OK] Dependencias instaladas

REM Crear configuración
set CONFIG_DIR=%USERPROFILE%\.nimbalyst\extensions\hermes-agent
mkdir "%CONFIG_DIR%" 2>nul
echo { > "%CONFIG_DIR%\config.json"
echo   "connectionMode": "ssh", >> "%CONFIG_DIR%\config.json"
echo   "sshHost": "169.58.56.108", >> "%CONFIG_DIR%\config.json"
echo   "sshUser": "root", >> "%CONFIG_DIR%\config.json"
echo   "sshKeyPath": "%USERPROFILE%\.ssh\id_rsa", >> "%CONFIG_DIR%\config.json"
echo   "hermesBinary": "hermes", >> "%CONFIG_DIR%\config.json"
echo   "hermesProfile": "coder" >> "%CONFIG_DIR%\config.json"
echo } >> "%CONFIG_DIR%\config.json"
echo [OK] Configuracion creada

echo.
echo ====================================================
echo   Instalacion completada!
echo ====================================================
echo.
echo Para iniciar Nimbalyst:
echo.
echo     cd %INSTALL_DIR%\nimbalyst\packages\electron
echo     npm run dev
echo.
echo Para usar Hermes Agent:
echo   1. Abrir Nimbalyst
echo   2. Ir a Settings - Extensions
echo   3. Habilitar 'Hermes Agent'
echo   4. Crear nueva sesion - Seleccionar 'Hermes Agent'
echo.
pause
