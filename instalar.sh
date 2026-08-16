#!/bin/bash
# ============================================
# Nimbalyst + Hermes Agent - Instalador Simple
# ============================================
# Ejecutar: bash instalar.sh
#
# Esto hace:
#   1. Descarga Nimbalyst oficial
#   2. Copia el extension Hermes Agent
#   3. Abre Nimbalyst

set -e

echo ""
echo "============================================="
echo "  Nimbalyst + Hermes Agent - Instalador"
echo "============================================="
echo ""

GREEN='\033[0;32m'
NC='\033[0m'
ok() { echo -e "${GREEN}✓${NC} $1"; }

INSTALL_DIR="$HOME/nimbalyst-hermes"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# [1/5] Descargar Nimbalyst
echo "[1/5] Descargando Nimbalyst..."
echo ""
echo "  Ve a: https://nimbalyst.com/releases"
echo "  Descarga el .AppImage para Linux"
echo ""
echo "  Cuando lo tengas, copialo a: $INSTALL_DIR/"
echo ""
read -p "  Presiona ENTER cuando este listo..."

# Buscar AppImage
APPIMAGE=$(ls "$INSTALL_DIR"/*.AppImage 2>/dev/null | head -1)
if [ -n "$APPIMAGE" ]; then
    ok "Nimbalyst encontrado: $APPIMAGE"
    chmod +x "$APPIMAGE"
else
    echo "  No se encontro .AppImage en $INSTALL_DIR/"
    echo "  Asegurate de que el archivo este ahi."
    exit 1
fi

# [2/5] Descargar extension
echo ""
echo "[2/5] Descargando extension Hermes Agent..."

if command -v git >/dev/null 2>&1; then
    git clone https://github.com/goldenigh1423/nimbalyst-hermes.git 2>/dev/null || cd nimbalyst-hermes && git pull && cd ..
else
    echo "  git no encontrado. Instalando..."
    sudo apt-get install -y git
    git clone https://github.com/goldenigh1423/nimbalyst-hermes.git
fi
ok "Extension descargado"

# [3/5] Extraer AppImage e instalar extension
echo ""
echo "[3/5] Instalando extension..."

# Extraer AppImage
cd "$INSTALL_DIR"
"$APPIMAGE" --appimage-extract 2>/dev/null || true

if [ -d "squashfs-root" ]; then
    # Copiar extension
    EXT_DIR="squashfs-root/resources/extensions/hermes-agent"
    mkdir -p "$EXT_DIR"
    cp -r nimbalyst-hermes/code/hermes-agent-nimbalyst/* "$EXT_DIR/"
    ok "Extension instalado en AppImage"

    # Repack AppImage (opcional, o se puede ejecutar desde squashfs-root)
    echo "  Para ejecutar: $INSTALL_DIR/squashfs-root/AppRun"
else
    echo "  No se pudo extraer el AppImage"
    echo "  Intenta ejecutar manualmente:"
    echo "    $APPIMAGE --appimage-extract"
fi

# [4/5] Configurar SSH
echo ""
echo "[4/5] Configurando SSH..."

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

# [5/5] SSH setup
echo ""
echo "[5/5] Verificando SSH..."

if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@169.58.56.108 "hermes --version" >/dev/null 2>&1; then
    ok "SSH al VPS funciona"
else
    echo "  SSH no configurado. Para configurar:"
    echo "    ssh-keygen -t ed25519"
    echo "    ssh-copy-id root@169.58.56.108"
fi

# Resultado
echo ""
echo "============================================="
echo "  Listo!"
echo "============================================="
echo ""
echo "  Ejecutar Nimbalyst:"
echo "    $INSTALL_DIR/squashfs-root/AppRun"
echo ""
echo "  O directamente:"
echo "    $APPIMAGE"
echo ""
echo "  Despues de abrir:"
echo "    1. Settings -> Extensions"
echo "    2. Habilitar 'Hermes Agent'"
echo "    3. Nueva sesion -> Seleccionar 'Hermes Agent'"
echo ""
