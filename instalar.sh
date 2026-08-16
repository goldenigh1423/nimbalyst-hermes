#!/bin/bash
# ============================================
# Nimbalyst + Hermes Agent - Instalador Automatico
# ============================================
# Ejecutar: bash instalar.sh

set -e

echo ""
echo "============================================="
echo "  Nimbalyst + Hermes Agent - Instalador"
echo "============================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'
ok() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

WORK_DIR="$HOME/nimbalyst-hermes"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# [1/4] Descargar Nimbalyst
echo "[1/4] Descargando Nimbalyst v0.73.2..."

ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    APPIMAGE_URL="https://github.com/nimbalyst/nimbalyst/releases/download/v0.73.2/Nimbalyst-Linux.AppImage"
    APPIMAGE_NAME="Nimbalyst-Linux.AppImage"
elif [ "$ARCH" = "aarch64" ]; then
    APPIMAGE_URL="https://github.com/nimbalyst/nimbalyst/releases/download/v0.73.2/Nimbalyst-Linux-arm64.AppImage"
    APPIMAGE_NAME="Nimbalyst-Linux-arm64.AppImage"
else
    fail "Arquitectura no soportada: $ARCH"
fi

echo "  Descargando $APPIMAGE_NAME..."
curl -L -o "$WORK_DIR/$APPIMAGE_NAME" "$APPIMAGE_URL" 2>&1 | tail -1
chmod +x "$WORK_DIR/$APPIMAGE_NAME"
ok "Descargado: $APPIMAGE_NAME"

# [2/4] Descargar extension
echo ""
echo "[2/4] Descargando extension Hermes Agent..."

curl -L -o "$WORK_DIR/hermes-ext.zip" "https://github.com/goldenigh1423/nimbalyst-hermes/archive/refs/heads/master.zip" 2>&1 | tail -1
unzip -q -o "$WORK_DIR/hermes-ext.zip" -d "$WORK_DIR/"
ok "Extension descargado"

# [3/4] Extraer AppImage y copiar extension
echo ""
echo "[3/4] Instalando extension en Nimbalyst..."

cd "$WORK_DIR"
"./$APPIMAGE_NAME" --appimage-extract >/dev/null 2>&1

if [ -d "squashfs-root" ]; then
    EXT_DIR="squashfs-root/resources/extensions/hermes-agent"
    mkdir -p "$EXT_DIR"
    cp -r nimbalyst-hermes-master/code/hermes-agent-nimbalyst/* "$EXT_DIR/"
    ok "Extension instalado"

    # Crear shortcut
    DESKTOP_FILE="$HOME/.local/share/applications/nimbalyst-hermes.desktop"
    mkdir -p "$(dirname "$DESKTOP_FILE")"
    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=Nimbalyst + Hermes
Exec=$WORK_DIR/squashfs-root/AppRun
Icon=$WORK_DIR/squashfs-root/nimbalyst
Type=Application
Categories=Development;
EOF
    ok "Shortcut creado en el menu de aplicaciones"
else
    fail "No se pudo extraer el AppImage"
fi

# [4/4] Configurar SSH
echo ""
echo "[4/4] Configurando SSH..."

CONFIG_DIR="$HOME/.nimbalyst/extensions/hermes-agent"
mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_DIR/config.json" << EOF
{
  "connectionMode": "ssh",
  "sshHost": "169.58.56.108",
  "sshUser": "root",
  "sshKeyPath": "$HOME/.ssh/id_rsa",
  "hermesBinary": "hermes",
  "hermesProfile": "coder"
}
EOF
ok "Configuracion SSH creada"

# Verificar SSH
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@169.58.56.108 "hermes --version" >/dev/null 2>&1; then
    ok "SSH al VPS funciona"
else
    echo "  SSH no configurado. Ejecuta:"
    echo "    ssh-keygen -t ed25519"
    echo "    ssh-copy-id root@169.58.56.108"
fi

# Limpiar
rm -f "$WORK_DIR/hermes-ext.zip"
rm -rf "$WORK_DIR/nimbalyst-hermes-master"

# Resultado
echo ""
echo "============================================="
echo "  Instalacion completada!"
echo "============================================="
echo ""
echo "  Ejecutar Nimbalyst:"
echo "    $WORK_DIR/squashfs-root/AppRun"
echo ""
echo "  O busca 'Nimbalyst + Hermes' en tu menu."
echo ""
echo "  Despues de abrir:"
echo "    1. Settings -> Extensions"
echo "    2. Habilitar 'Hermes Agent'"
echo "    3. Nueva sesion -> Seleccionar 'Hermes Agent'"
echo ""
