# Nimbalyst + Hermes Agent Integration

## 📋 Qué es esto

Un **extension para Nimbalyst** que conecta Hermes Agent como proveedor de coding agent. Permite usar las 70+ herramientas de Hermes, los 42 gateway platforms, y el sistema de memoria desde la interfaz visual de Nimbalyst.

## 🏗️ Arquitectura

```
Tu PC (Nimbalyst)  ←→  VPS (Hermes Agent)
   │                        │
   │  SSH / CLI              │
   │                        │
   ├─ Editores visuales     ├─ 70+ herramientas
   ├─ Kanban board          ├─ 42 plataformas gateway
   ├─ Task tracking         ├─ Graphify (knowledge graph)
   ├─ Real-time collab      ├─ Codebase Memory
   └─ Mobile apps           └─ Code RAG
```

## 📦 Instalación

### 1. Instalar Nimbalyst

```bash
# Descargar Nimbalyst desde https://nimbalyst.com
# O compilar desde source:
git clone https://github.com/nimbalyst/nimbalyst.git
cd nimbalyst
npm install
cd packages/electron && npm run dev
```

### 2. Instalar el Extension Hermes Agent

```bash
# Clonar este repo
git clone https://github.com/goldenigh1423/nimbalyst-hermes.git
cd nimbalyst-hermes

# Copiar el extension al directorio de extensiones de Nimbalyst
cp -r code/hermes-agent-nimbalyst/ ~/.nimbalyst/extensions/hermes-agent/

# O si compilas Nimbalyst desde source:
cp -r code/hermes-agent-nimbalyst/ /ruta/a/nimbalyst/packages/extensions/hermes-agent/
```

### 3. Configurar la Conexión SSH al VPS

En Nimbalyst, ir a **Settings → Extensions → Hermes Agent**:

| Campo | Valor |
|-------|-------|
| Connection Mode | `ssh` |
| SSH Host | `169.58.56.108` |
| SSH User | `root` |
| SSH Key Path | `~/.ssh/id_rsa` (tu clave SSH) |
| Hermes Binary | `hermes` |
| Hermes Profile | `coder` |

### 4. Verificar SSH

```bash
# Test de conexión SSH desde tu PC
ssh root@169.58.56.108 "hermes --version"

# Debería mostrar:
# Hermes Agent v0.20.1 (2026.8.13)
```

### 5. Usar

1. Abrir Nimbalyst
2. Crear nueva sesión de coding agent
3. Seleccionar **"Hermes Agent"** como provider
4. Seleccionar modelo (MiMo v2.5 Pro, Claude, GPT-4o)
5. ¡Escribir y que Hermes trabaje!

## 📁 Estructura del Extension

```
hermes-agent-nimbalyst/
├── manifest.json          # Declaración del extension
├── package.json           # Dependencias
├── tsconfig.json          # Config TypeScript
└── src/
    ├── index.tsx           # Entry point (frontend)
    ├── agent.ts            # Backend (AgentProtocol + SSH)
    └── components/
        └── HermesAgentSettings.tsx  # Panel de configuración
```

## 🔧 Modos de Conexión

### Modo Local
Hermes instalado localmente en tu PC:
```
connectionMode: "local"
hermesBinary: "hermes"
```

### Modo SSH (Recomendado)
Hermes corriendo en el VPS:
```
connectionMode: "ssh"
sshHost: "169.58.56.108"
sshUser: "root"
sshKeyPath: "~/.ssh/id_rsa"
```

## 📊 Plan de Desarrollo

| Fase | Estado | Descripción |
|------|--------|-------------|
| 1. HermesProvider | ✅ | Extension con AgentProtocol + SSH |
| 2. Tool Bridge | ⏳ | 70+ herramientas de Hermes |
| 3. Gateway Bridge | ⏳ | 42 plataformas de gateway |
| 4. Shared Memory | ⏳ | Graphify + Codebase Memory |
| 5. Skills | ⏳ | Skills como extensiones |
| 6. MCP Integration | ⏳ | Servidores MCP |
| 7. Cron Bridge | ⏳ | Scheduled jobs |
| 8. Desktop Features | ⏳ | HUD, Quick Entry, etc. |
| 9. Database Integration | ⏳ | PostgreSQL AIOS |

## 🔗 Links

- [Hermes Agent](https://github.com/NousResearch/hermes-agent)
- [Nimbalyst](https://github.com/nimbalyst/nimbalyst)
- [Documentación Hermes](https://hermes-agent.nousresearch.com/docs/)
