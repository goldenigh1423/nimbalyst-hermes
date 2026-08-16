#!/bin/bash
# ============================================
# Nimbalyst + Hermes Agent - Instalador Automático
# ============================================
# Ejecutar: bash install.sh
# Requisitos: git, node (v22+), npm

set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Nimbalyst + Hermes Agent - Instalador          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ok() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
step() { echo -e "\n${BLUE}[$1/7]${NC} $2"; }

# ============================================
# 1. Verificar requisitos
# ============================================
step 1 "Verificando requisitos..."

command -v git >/dev/null 2>&1 || fail "git no encontrado. Instalar: https://git-scm.com"
ok "git"

command -v node >/dev/null 2>&1 || fail "Node.js no encontrado. Instalar v22+: https://nodejs.org"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[ "$NODE_VERSION" -ge 22 ] || fail "Node.js v22+ requerido. Versión actual: $(node -v)"
ok "Node.js $(node -v)"

command -v npm >/dev/null 2>&1 || fail "npm no encontrado"
ok "npm"

# Detectar OS
OS="$(uname -s)"
case "$OS" in
    Linux*)   PLATFORM="linux"; BUILD_CMD="build:linux" ;;
    Darwin*)  PLATFORM="mac";   BUILD_CMD="build:mac:local" ;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="win"; BUILD_CMD="build:win" ;;
    *) fail "OS no soportado: $OS" ;;
esac
ok "Plataforma detectada: $PLATFORM"

# ============================================
# 2. Verificar SSH al VPS
# ============================================
step 2 "Verificando conexión SSH al VPS..."

if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@169.58.56.108 "hermes --version" >/dev/null 2>&1; then
    ok "SSH al VPS funciona"
    HERMES_VERSION=$(ssh -o ConnectTimeout=5 root@169.58.56.108 "hermes --version" 2>/dev/null | head -1)
    ok "Hermes: $HERMES_VERSION"
    SSH_OK=true
else
    warn "No se pudo conectar al VPS por SSH"
    warn "Para configurar SSH:"
    echo "    ssh-keygen -t ed25519"
    echo "    ssh-copy-id root@169.58.56.108"
    echo ""
    read -p "¿Continuar sin SSH? (se puede configurar después) [s/N]: " CONTINUE
    [[ "$CONTINUE" =~ ^[Ss]$ ]] || exit 1
    SSH_OK=false
fi

# ============================================
# 3. Clonar repos
# ============================================
step 3 "Clonando repositorios..."

INSTALL_DIR="$HOME/nimbalyst-workspace"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

if [ -d "nimbalyst" ]; then
    warn "nimbalyst ya existe, actualizando..."
    cd nimbalyst && git pull && cd ..
else
    git clone https://github.com/nimbalyst/nimbalyst.git
    ok "Nimbalyst clonado"
fi

if [ -d "nimbalyst-hermes" ]; then
    warn "nimbalyst-hermes ya existe, actualizando..."
    cd nimbalyst-hermes && git pull && cd ..
else
    git clone https://github.com/goldenigh1423/nimbalyst-hermes.git
    ok "Extension Hermes clonado"
fi

# ============================================
# 4. Integrar extension
# ============================================
step 4 "Integrando extension Hermes Agent..."

DEST="$INSTALL_DIR/nimbalyst/packages/extensions/hermes-agent"
rm -rf "$DEST"
cp -r "$INSTALL_DIR/nimbalyst-hermes/code/hermes-agent-nimbalyst/" "$DEST"
ok "Extension integrado en packages/extensions/hermes-agent/"

# ============================================
# 5. Instalar dependencias
# ============================================
step 5 "Instalando dependencias (esto tarda 5-15 minutos)..."

cd "$INSTALL_DIR/nimbalyst"
npm install 2>&1 | tail -3
ok "Dependencias instaladas"

# ============================================
# 6. Compilar Nimbalyst
# ============================================
step 6 "Compilando Nimbalyst (esto tarda 10-20 minutos)..."

cd "$INSTALL_DIR/nimbalyst/packages/electron"

echo "  → Generando licencias..."
npm run licenses:generate 2>&1 | tail -1

echo "  → Compilando aplicación..."
cross-env NODE_OPTIONS='--max-old-space-size=8192' npx electron-vite build 2>&1 | tail -3

echo "  → Compilando extensiones..."
npm run build:extensions 2>&1 | tail -3

echo "  → Generando instalador..."
npx electron-builder --$PLATFORM 2>&1 | tail -5

# Buscar el instalador generado
OUTPUT_DIR="$INSTALL_DIR/nimbalyst/packages/electron/dist"
echo ""
ok "Compilación completada!"

# ============================================
# 7. Configurar SSH
# ============================================
step 7 "Configurando conexión SSH..."

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
ok "Configuración SSH creada"

# ============================================
# Resultado
# ============================================
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✓ ¡Instalación completada!                     ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "El instalador de Nimbalyst está en:"
echo ""
echo "    $OUTPUT_DIR/"
echo ""

# Mostrar archivos generados
if [ "$PLATFORM" = "linux" ]; then
    echo "Busca el archivo .AppImage y ejecúltalo:"
    ls -la "$OUTPUT_DIR"/*.AppImage 2>/dev/null || echo "    (revisar $OUTPUT_DIR/)"
elif [ "$PLATFORM" = "mac" ]; then
    echo "Busca el archivo .dmg y ábrelo:"
    ls -la "$OUTPUT_DIR"/*.dmg 2>/dev/null || echo "    (revisar $OUTPUT_DIR/)"
elif [ "$PLATFORM" = "win" ]; then
    echo "Busca el archivo .exe y ejecútalo:"
    ls -la "$OUTPUT_DIR"/*.exe 2>/dev/null || echo "    (revisar $OUTPUT_DIR/)"
fi

echo ""
echo "Después de instalar Nimbalyst:"
echo "  1. Abrir Nimbalyst"
echo "  2. Settings → Extensions → Habilitar 'Hermes Agent'"
echo "  3. Nueva sesión → Seleccionar 'Hermes Agent'"
echo ""
echo "Configuración: $CONFIG_DIR/config.json"
echo ""
