# Nimbalyst + Hermes Agent

Instala Nimbalyst con el extension de Hermes Agent integrado.

## 🚀 Instalación (3 pasos)

### Windows
```bat
git clone https://github.com/goldenigh1423/nimbalyst-hermes.git
cd nimbalyst-hermes
instalar.bat
```

### Linux
```bash
git clone https://github.com/goldenigh1423/nimbalyst-hermes.git
cd nimbalyst-hermes
bash instalar.sh
```

## 📋 Lo que hace

1. Te pide que descargues Nimbalyst desde https://nimbalyst.com/releases
2. Descarga el extension Hermes Agent
3. Copia el extension dentro de Nimbalyst
4. Configura la conexión SSH al VPS (donde corre Hermes)

## 🔑 Requisito: SSH al VPS

```bash
ssh-keygen -t ed25519           # Enter, Enter, Enter
ssh-copy-id root@169.58.56.108  # Pide contraseña del VPS
```

## ▶️ Después de instalar

1. Abrir Nimbalyst
2. **Settings → Extensions** → Habilitar **"Hermes Agent"**
3. Crear nueva sesión → Seleccionar **"Hermes Agent"**
4. ¡Escribir y Hermes trabaja desde el VPS!

## ⚙️ Configuración

El instalador crea `~/.nimbalyst/extensions/hermes-agent/config.json`:

```json
{
  "connectionMode": "ssh",
  "sshHost": "169.58.56.108",
  "sshUser": "root",
  "hermesProfile": "coder"
}
```

## 📁 Contenido

```
nimbalyst-hermes/
├── instalar.bat                  # Instalador Windows
├── instalar.sh                   # Instalador Linux
├── code/hermes-agent-nimbalyst/  # Extension
│   ├── manifest.json
│   └── src/
│       ├── agent.ts              # Conexión SSH a Hermes
│       ├── index.tsx
│       └── components/
│           └── HermesAgentSettings.tsx
└── phases/                       # Planes de desarrollo (9 fases)
```
