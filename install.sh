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

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

# ============================================
# 1. Verificar requisitos
# ============================================
echo "Verificando requisitos..."

command -v git >/dev/null 2>&1 || fail "git no encontrado. Instalar: https://git-scm.com"
ok "git encontrado"

command -v node >/dev/null 2>&1 || fail "Node.js no encontrado. Instalar v22+: https://nodejs.org"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[ "$NODE_VERSION" -ge 22 ] || fail "Node.js v22+ requerido. Versión actual: $(node -v)"
ok "Node.js $(node -v)"

command -v npm >/dev/null 2>&1 || fail "npm no encontrado"
ok "npm encontrado"

# ============================================
# 2. Verificar SSH al VPS
# ============================================
echo ""
echo "Verificando conexión SSH al VPS..."

if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@169.58.56.108 "hermes --version" >/dev/null 2>&1; then
    ok "SSH al VPS funciona"
    HERMES_VERSION=$(ssh -o ConnectTimeout=5 root@169.58.56.108 "hermes --version" 2>/dev/null | head -1)
    ok "Hermes: $HERMES_VERSION"
else
    warn "No se pudo conectar al VPS por SSH"
    warn "Configurar SSH primero:"
    echo "    ssh-keygen -t ed25519"
    echo "    ssh-copy-id root@169.58.56.108"
    echo ""
    read -p "¿Continuar sin SSH? (se puede configurar después) [s/N]: " CONTINUE
    [[ "$CONTINUE" =~ ^[Ss]$ ]] || exit 1
fi

# ============================================
# 3. Clonar Nimbalyst
# ============================================
echo ""
echo "Clonando Nimbalyst..."

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

# ============================================
# 4. Clonar Extension Hermes
# ============================================
echo ""
echo "Instalando extension Hermes Agent..."

if [ -d "nimbalyst-hermes" ]; then
    warn "nimbalyst-hermes ya existe, actualizando..."
    cd nimbalyst-hermes && git pull && cd ..
else
    git clone https://github.com/goldenigh1423/nimbalyst-hermes.git
    ok "Extension clonado"
fi

# ============================================
# 5. Copiar extension a Nimbalyst
# ============================================
echo ""
echo "Integrando extension en Nimbalyst..."

DEST="$INSTALL_DIR/nimbalyst/packages/extensions/hermes-agent"
rm -rf "$DEST"
cp -r "$INSTALL_DIR/nimbalyst-hermes/code/hermes-agent-nimbalyst/" "$DEST"
ok "Extension copiado a packages/extensions/hermes-agent/"

# ============================================
# 6. Instalar dependencias de Nimbalyst
# ============================================
echo ""
echo "Instalando dependencias de Nimbalyst (esto tarda varios minutos)..."

cd "$INSTALL_DIR/nimbalyst"
npm install 2>&1 | tail -5
ok "Dependencias instaladas"

# ============================================
# 7. Configurar SSH en la configuración del extension
# ============================================
echo ""
echo "Configurando conexión SSH..."

# Crear directorio de configuración del extension
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
ok "Configuración SSH creada en $CONFIG_DIR/config.json"

# ============================================
# 8. Instrucciones finales
# ============================================
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✓ Instalación completada                       ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Para iniciar Nimbalyst:"
echo ""
echo "    cd $INSTALL_DIR/nimbalyst/packages/electron"
echo "    npm run dev"
echo ""
echo "Para usar Hermes Agent:"
echo "  1. Abrir Nimbalyst"
echo "  2. Ir a Settings → Extensions"
echo "  3. Habilitar 'Hermes Agent'"
echo "  4. Crear nueva sesión → Seleccionar 'Hermes Agent'"
echo ""
echo "Configuración SSH: $CONFIG_DIR/config.json"
echo ""
