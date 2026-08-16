# Fase 1: Hermes AI Provider

**Objetivo:** Conectar Hermes como un agente más dentro de Nimbalyst.
**Esfuerzo:** 1 semana
**Dependencias:** Ninguna

---

## 📋 Descripción

Crear un `HermesProvider` que implemente la interfaz `AIProvider` de Nimbalyst, permitiendo a Hermes actuar como un agente más (junto a Claude Code, Codex, Copilot, OpenCode).

---

## 🏗️ Arquitectura

```
Nimbalyst UI
    │
    ▼
AIProvider Interface
    │
    ▼
HermesProvider
    │
    ├── CLI Mode: hermes chat -q "prompt" --json
    ├── API Mode: hermes proxy (OpenAI-compatible)
    └── MCP Mode: Hermes como MCP server
```

---

## 📁 Estructura de Archivos

```
packages/extensions/hermes-agent/
├── manifest.json                    # Extensión manifest
├── package.json                     # Dependencies
├── vite.config.ts                   # Build config
├── src/
│   ├── index.ts                     # Entry point (activate/deactivate)
│   ├── HermesProvider.ts            # AIProvider implementation
│   ├── HermesProtocol.ts            # AgentProtocol (transport adapter)
│   ├── HermesProcessManager.ts      # Gestión del proceso Hermes
│   ├── HermesMessageParser.ts       # Parser de mensajes JSON
│   ├── HermesConfigPanel.ts         # UI de configuración
│   └── types.ts                     # TypeScript types
└── dist/                            # Built output
```

---

## 🔧 Implementación

### 1.1 Manifest

```json
{
  "id": "com.nimbalyst.hermes-agent",
  "name": "Hermes Agent",
  "version": "1.0.0",
  "description": "Connect Hermes Agent as AI provider with 70+ tools and 42 gateway platforms",
  "main": "dist/index.js",
  "apiVersion": "1.0.0",
  "permissions": {
    "filesystem": true,
    "ai": true,
    "network": true
  },
  "contributions": {
    "agentProviders": [{
      "id": "hermes",
      "backendModuleId": "hermes-backend"
    }],
    "panels": [{
      "id": "hermes-config",
      "title": "Hermes Config",
      "icon": "settings",
      "placement": "sidebar"
    }],
    "configuration": {
      "properties": {
        "hermes.path": {
          "type": "string",
          "default": "hermes",
          "description": "Path to hermes binary"
        },
        "hermes.profile": {
          "type": "string",
          "default": "default",
          "description": "Hermes profile to use"
        },
        "hermes.mode": {
          "type": "string",
          "enum": ["cli", "api", "mcp"],
          "default": "cli",
          "description": "Communication mode"
        }
      }
    }
  }
}
```

### 1.2 HermesProvider

```typescript
export class HermesProvider implements AIProvider {
  private processManager: HermesProcessManager;
  private protocol: HermesProtocol;
  private config: HermesConfig;

  async createSession(options: SessionOptions): Promise<string> {
    // 1. Iniciar proceso Hermes
    const proc = await this.processManager.start({
      profile: this.config.profile,
      model: options.model,
      workspace: options.workspacePath
    });

    // 2. Configurar protocolo
    this.protocol = new HermesProtocol(proc);

    // 3. Retornar session ID
    return proc.sessionId;
  }

  async sendMessage(
    sessionId: string,
    message: string
  ): Promise<AsyncIterable<ProtocolEvent>> {
    // Enviar mensaje y retornar stream de eventos
    return this.protocol.sendMessage(sessionId, message);
  }

  async abortSession(sessionId: string): Promise<void> {
    await this.processManager.abort(sessionId);
  }

  async resumeSession(sessionId: string): Promise<void> {
    await this.processManager.resume(sessionId);
  }
}
```

### 1.3 HermesProtocol

```typescript
export class HermesProtocol implements AgentProtocol {
  private process: ChildProcess;

  async *eventStream(): AsyncIterable<ProtocolEvent> {
    // Parse JSON output from Hermes
    for await (const line of this.process.stdout) {
      const event = this.parseEvent(line);
      if (event) yield event;
    }
  }

  private parseEvent(line: string): ProtocolEvent | null {
    const data = JSON.parse(line);
    switch (data.type) {
      case 'text': return { type: 'text', content: data.content };
      case 'tool_call': return { type: 'tool_call', ...data };
      case 'tool_result': return { type: 'tool_result', ...data };
      case 'error': return { type: 'error', ...data };
      case 'complete': return { type: 'complete', ...data };
      case 'usage': return { type: 'usage', ...data };
      default: return null;
    }
  }
}
```

### 1.4 HermesProcessManager

```typescript
export class HermesProcessManager {
  private processes: Map<string, ManagedProcess> = new Map();

  async start(options: StartOptions): Promise<ManagedProcess> {
    const args = [
      'chat',
      '--json',
      '-p', options.profile,
      '-m', options.model,
      '--in', options.workspace
    ];

    const proc = spawn('hermes', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, HERMES_HOME: options.hermesHome }
    });

    const managed = new ManagedProcess(proc, options);
    this.processes.set(managed.sessionId, managed);
    return managed;
  }

  async abort(sessionId: string): Promise<void> {
    const proc = this.processes.get(sessionId);
    if (proc) proc.process.kill('SIGINT');
  }

  async resume(sessionId: string): Promise<void> {
    const proc = this.processes.get(sessionId);
    if (proc) {
      // Send resume command
      proc.process.stdin.write('/resume\n');
    }
  }
}
```

---

## 🧪 Testing

### Unit Tests
- HermesProvider.createSession() → creates process
- HermesProvider.sendMessage() → returns event stream
- HermesProtocol.parseEvent() → parses all event types
- HermesProcessManager.start/stop/abort

### Integration Tests
- Full session lifecycle (create → message → abort)
- Error handling (process crash, timeout)
- Multiple concurrent sessions

---

## ✅ Criterios de Aceptación

- [ ] HermesProvider implementa AIProvider interface
- [ ] Se puede crear una sesión con Hermes
- [ ] Se pueden enviar mensajes y recibir respuestas
- [ ] Los eventos se parsean correctamente (text, tool_call, tool_result, error, complete)
- [ ] Se puede abortar una sesión
- [ ] Se puede reanudar una sesión
- [ ] Tests unitarios pasan
- [ ] Tests de integración pasan

---

## 📝 Notas

- Hermes CLI mode es el más simple para empezar
- API mode (hermes proxy) es más eficiente para sesiones largas
- MCP mode es el más integrado pero requiere más configuración
- El profile system de Hermes permite múltiples configuraciones
