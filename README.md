# Nimbalyst + Hermes Agent

Instala Nimbalyst con el extension de Hermes Agent ya integrado. Un solo comando.

## 🚀 Instalación

### Linux / Mac

```bash
git clone https://github.com/goldenigh1423/nimbalyst-hermes.git
cd nimbalyst-hermes
bash install.sh
```

### Windows

```bat
git clone https://github.com/goldenigh1423/nimbalyst-hermes.git
cd nimbalyst-hermes
install.bat
```

## 📋 Lo que hace el instalador

1. Clona Nimbalyst (repo oficial)
2. Copia el extension Hermes Agent dentro de Nimbalyst
3. Instala dependencias (`npm install`)
4. **Compila Nimbalyst** → genera `.AppImage` (Linux), `.dmg` (Mac), `.exe` (Windows)
5. Configura la conexión SSH al VPS (donde corre Hermes)

## ▶️ Después de instalar

1. Buscar el instalador en `~/nimbalyst-workspace/nimbalyst/packages/electron/dist/`
2. Ejecutar el `.AppImage` / `.dmg` / `.exe`
3. Ir a **Settings → Extensions** → Habilitar **"Hermes Agent"**
4. Crear nueva sesión → Seleccionar **"Hermes Agent"**

## ⚙️ Configuración SSH

El instalador crea la configuración en `~/.nimbalyst/extensions/hermes-agent/config.json`:

```json
{
  "connectionMode": "ssh",
  "sshHost": "169.58.56.108",
  "sshUser": "root",
  "sshKeyPath": "~/.ssh/id_rsa",
  "hermesBinary": "hermes",
  "hermesProfile": "coder"
}
```

## 🔑 Requisito previo: SSH al VPS

```bash
ssh-keygen -t ed25519           # Crear clave (Enter, Enter, Enter)
ssh-copy-id root@169.58.56.108  # Copiar al VPS (pedirá contraseña)
```

## 📁 Qué contiene

```
nimbalyst-hermes/
├── install.sh                    # Instalador Linux/Mac
├── install.bat                   # Instalador Windows
├── code/hermes-agent-nimbalyst/  # Extension para Nimbalyst
│   ├── manifest.json
│   └── src/
│       ├── agent.ts              # Conexión SSH a Hermes
│       ├── index.tsx             # Entry point
│       └── components/
│           └── HermesAgentSettings.tsx
└── phases/                       # Planes de desarrollo
```
