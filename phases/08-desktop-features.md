# Fase 8: Desktop Feature Parity

**Objetivo:** Funciones del desktop de Hermes que faltan en Nimbalyst.
**Esfuerzo:** 2 semanas
**Dependencias:** Fase 1

---

## 📋 Descripción

Identificar y agregar las funciones del desktop de Hermes que NO tiene Nimbalyst, priorizando las que aportan más valor.

---

## 📊 Comparación de Desktop Features

### ✅ Ambos Tienen

| Feature | Hermes | Nimbalyst | Diferencia |
|---------|--------|-----------|------------|
| **Chat** | Streaming, rich markdown | Streaming, rich markdown | Similar |
| **Terminal** | node-pty | node-pty + ghostty-web | Nimbalyst mejor |
| **File browser** | Basic | Full tree + preview | Nimbalyst mejor |
| **Sessions** | List + search | Kanban + search + phases | Nimbalyst mejor |
| **Settings** | Config UI | Config UI | Similar |
| **Notifications** | Toast + native | Toast + native | Similar |
| **Dark/Light mode** | ✅ | ✅ | Similar |
| **Keyboard shortcuts** | 50+ rebindable | 50+ rebindable | Similar |
| **Multi-window** | ✅ | ✅ | Similar |
| **Auto-update** | ✅ | ✅ | Similar |
| **Crash forensics** | ✅ | ✅ | Similar |

---

### 🟢 Solo Hermes tiene (Agregar a Nimbalyst)

| Feature | Descripción | Prioridad | Esfuerzo |
|---------|-------------|-----------|----------|
| **HUD Mode** | Chat flotante sin chrome sobre escritorio | ALTA | 1 semana |
| **Quick Entry** | Mini-composer con hotkey global | ALTA | 3 días |
| **Command Palette (⌘K)** | Paleta de comandos universal | ALTA | 3 días |
| **Voice Conversation** | Modo de conversación por voz | MEDIA | 1 semana |
| **Profiles System** | Múltiples perfiles aislados | MEDIA | 3 días |
| **Star Map** | Visualización de conocimiento aprendido | MEDIA | 3 días |
| **Pet System** | Mascota flotante animada | BAJA | 2 días |
| **Computer Use** | Control del escritorio desde AI | MEDIA | 1 semana |
| **Browser Automation** | Control de navegador desde AI | MEDIA | 3 días |
| **Send Message** | Enviar mensajes a plataformas | ALTA | 3 días |
| **Proxy OpenAI** | Proxy OpenAI-compatible local | MEDIA | 3 días |
| **Theme/Skin System** | VS Code marketplace themes | BAJA | 3 días |
| **Skills Hub** | Marketplace de skills | ALTA | 1 semana |
| **Session Export** | Exportar sesiones (jsonl, md, html) | MEDIA | 2 días |
| **Find-in-page** | Buscar en página (⌘F) | MEDIA | 1 día |
| **Session Compression** | Compresión automática de contexto | ALTA | 3 días |
| **Background Agents** | Agentes en background | ALTA | 1 semana |
| **Kanban (Hermes)** | Kanban multi-agent coordination | MEDIA | 1 semana |

---

### 🔵 Solo Nimbalyst tiene (No necesario en Hermes)

| Feature | Descripción | Notas |
|---------|-------------|-------|
| **10 Visual Editors** | Excalidraw, Monaco, CSV, etc. | Core feature |
| **Real-time Collab** | Y.js + E2E encryption | Core feature |
| **Mobile Apps** | iOS + Android nativos | Core feature |
| **Extension Marketplace** | Marketplace de extensiones | Core feature |
| **Git Worktrees** | Full worktree management | Ya en Hermes (básico) |
| **Tracker System** | Full issue tracker | Ya en Hermes (DB AIOS) |
| **Plans System** | Markdown plans con YAML | Ya en Hermes (skills) |
| **Data Model Editor** | ER diagrams | Específico |
| **Mockup Editor** | HTML mockups | Específico |
| **PDF Viewer** | PDF reading | Específico |
| **Browser Extension** | Web clipper | Específico |

---

## 🔧 Implementación

### 8.1 HUD Mode (Prioridad ALTA)

```typescript
// HUD Mode: Chat flotante sin chrome
export class HUDMode {
  private window: BrowserWindow;

  async create(): Promise<void> {
    this.window = new BrowserWindow({
      width: 600,
      height: 400,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: true
    });

    // Load HUD component
    this.window.loadURL('nimbalyst://hud');

    // Click-through when idle
    this.window.setIgnoreMouseEvents(true, { forward: true });
  }

  async toggle(): Promise<void> {
    if (this.window.isVisible()) {
      this.window.hide();
    } else {
      this.window.show();
    }
  }
}
```

### 8.2 Quick Entry (Prioridad ALTA)

```typescript
// Quick Entry: Mini-composer con hotkey global
export class QuickEntry {
  private window: BrowserWindow;

  async register(): Promise<void> {
    // Register global hotkey
    globalShortcut.register('CommandOrControl+Shift+Space', () => {
      this.toggle();
    });
  }

  async create(): Promise<void> {
    this.window = new BrowserWindow({
      width: 500,
      height: 100,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true
    });

    this.window.loadURL('nimbalyst://quick-entry');
  }
}
```

### 8.3 Command Palette (Prioridad ALTA)

```typescript
// Command Palette: Paleta de comandos universal
export class CommandPalette {
  // Using cmdk library (same as Hermes)
  private commands: Map<string, Command> = new Map();

  register(command: Command): void {
    this.commands.set(command.id, command);
  }

  async show(): Promise<void> {
    // Show palette with all commands
    const commands = Array.from(this.commands.values());
    // Render cmdk component
  }
}
```

### 8.4 Voice Conversation (Prioridad MEDIA)

```typescript
// Voice Conversation: Modo de conversación por voz
export class VoiceConversation {
  private audioContext: AudioContext;
  private mediaRecorder: MediaRecorder;

  async start(): Promise<void> {
    // 1. Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    // 2. Start recording
    this.mediaRecorder = new MediaRecorder(stream);
    this.mediaRecorder.start();

    // 3. Send to Hermes TTS/STT
    this.mediaRecorder.ondataavailable = async (event) => {
      const audio = event.data;
      // Send to Hermes for processing
    };
  }

  async stop(): Promise<void> {
    this.mediaRecorder.stop();
  }
}
```

### 8.5 Profiles System (Prioridad MEDIA)

```typescript
// Profiles System: Múltiples perfiles aislados
export class ProfileSystem {
  private profiles: Map<string, Profile> = new Map();

  async create(name: string, options?: CreateOptions): Promise<Profile> {
    // Create profile directory
    const profileDir = path.join(
      this.hermesHome,
      'profiles',
      name
    );

    // Clone from current if requested
    if (options?.clone) {
      await this.cloneProfile(this.currentProfile, profileDir);
    }

    const profile = { name, dir: profileDir, ...options };
    this.profiles.set(name, profile);
    return profile;
  }

  async switch(name: string): Promise<void> {
    const profile = this.profiles.get(name);
    if (profile) {
      // Switch Hermes to this profile
      await this.hermesProcess.switchProfile(name);
      this.currentProfile = profile;
    }
  }
}
```

### 8.6 Session Compression (Prioridad ALTA)

```typescript
// Session Compression: Compresión automática de contexto
export class SessionCompression {
  async compress(sessionId: string): Promise<void> {
    // Call Hermes compression
    await this.hermesProcess.execute({
      slash: '/compress',
      sessionId
    });
  }

  async autoCompress(sessionId: string): Promise<void> {
    // Check if compression needed
    const tokens = await this.getTokenCount(sessionId);
    if (tokens > this.threshold) {
      await this.compress(sessionId);
    }
  }
}
```

---

## 📅 Cronograma de Implementación

| Semana | Features | Esfuerzo |
|--------|----------|----------|
| **Semana 7** | HUD Mode, Quick Entry, Command Palette | 1 semana |
| **Semana 8** | Voice, Profiles, Session Compression, Background Agents | 1 semana |

---

## ✅ Criterios de Aceptación

- [ ] HUD Mode funcional
- [ ] Quick Entry con hotkey global
- [ ] Command Palette con búsqueda
- [ ] Voice conversation mode
- [ ] Profiles system con 3+ perfiles
- [ ] Session compression automática
- [ ] Background agents funcionando

---

## 📊 Comparación Detallada (Del análisis de código fuente)

### Features que AMBOS tienen (~20)

| Feature | Hermes | Nimbalyst |
|---------|--------|-----------|
| AI Chat | Rich text, @-refs, slash commands, queue | UnifiedAI, action prompts, slash commands |
| Session Management | Color coding, unread dots, pinning, density | Kanban board, session list filter |
| Voice Mode | Barge-in, wake word, stop words | OpenAI Realtime API, barge-in policy |
| Terminal | xterm.js, agent terminal stream | Ghostty WASM (GPU rendering) |
| Theme System | VSCode import, skins, marketplace | Dark/light, extension themes |
| Command Palette | Cmd+K palette with marketplace themes | Cmd+K Agent mode, Cmd+L session quick open |
| Notifications | Native OS, settings | Native, team inbox |
| File Tree | DnD, remote picker | Workspace manager, gitignore |
| Model Selection | Presets, visibility, provider collapse | Selector, effort level, thinking mode |
| Settings | Appearance, connections, models, voice, billing | Global + per-project + extension + org |
| Git Worktrees | git-worktree-ops.ts | Full worktree service + onboarding |
| File Attachments | DnD in composer | Preview, mention, staging |
| Dark/Light Mode | Theme presets | ThemeToggleButton |
| Zoom | Zoom store, IPC, percentage | In/out/actual-size |
| Find in Page | Ctrl+F native | Cmd+F in editor |
| MCP Integration | Health monitoring, deeplink install | MCPConfigService, lockdown banner |
| Onboarding | First-run gate, onboarding store | 16+ walkthroughs, tip system |
| Auto-Update | Update gate, marker, remote, updater | electron-updater |
| AI Agent Mode | Sub-agents, background delegation | Workstreams, session panel, review |
| Pull Requests | PR tag in chat | Full PR review mode |

### Solo Hermes tiene (~25)

| Feature | Descripción | Prioridad Integración |
|---------|-------------|----------------------|
| **HUD Mode** | Floating translucent overlay, click-through, glass effects | ALTA |
| **Quick Entry** | Spotlight-like floating input | ALTA |
| **Pet System** | AI-generated desktop companion, hatching animation | BAJA |
| **Star Map** | Constellation visualization of sessions | MEDIA |
| **Cron/Scheduled Jobs** | Create/manage scheduled AI tasks | ALTA |
| **Webhooks** | Webhook configuration for external integrations | ALTA |
| **OpenAI-Compatible Proxy** | Gateway as OpenAI API endpoint | ALTA |
| **Multi-Profile System** | Multiple named profiles, isolated sessions/skills | ALTA |
| **Skin/Theme Marketplace** | VSCode Marketplace theme import | BAJA |
| **Skills Hub** | Browse/install/manage skills | ALTA |
| **Background Delegation** | Delegate to background agent processes | ALTA |
| **Inline Media Embeds** | YouTube, Spotify, Mermaid, SVG, social embeds | MEDIA |
| **Wake Word Detection** | "Hey Hermes" wake word | MEDIA |
| **Translucency Effects** | Window glass effects, power-save aware | BAJA |
| **Haptics** | Haptic feedback | BAJA |
| **Message Reactions** | Emoji reactions | MEDIA |
| **Todo List** | Built-in task management | MEDIA |
| **SSH Support** | SSH config, connection management | MEDIA |
| **WSL Support** | WSL path bridging, clipboard | MEDIA |
| **Hyprland Support** | Wayland compositor integration | BAJA |
| **Artifacts Viewer** | AI-generated artifacts display | MEDIA |
| **Panes System** | Multi-pane layout management | MEDIA |
| **Session Color Coding** | Per-session color customization | MEDIA |
| **Composer Queue** | Queue multiple prompts | ALTA |
| **Completion Sound** | Sound on AI task completion | BAJA |

### Solo Nimbalyst tiene (~40+)

| Feature | Descripción |
|---------|-------------|
| **10+ Visual Editors** | Excalidraw, spreadsheet, wireframe, database, mermaid, data models |
| **Native Issue Tracker** | Kanban, grid, list, document views, custom fields, milestones |
| **Real-Time Collaboration** | CRDT-based co-editing, presence, shared docs |
| **Team Messaging/Inbox** | Rooms, inbox, DMs, read receipts |
| **Extension Marketplace** | Full marketplace + SDK + permissions |
| **Mobile Apps** | iOS + Android native |
| **PR Review Mode** | Full PR list, detail, diff, inline comments |
| **Meta-Agent Mode** | Multi-agent orchestration |
| **AI Usage Analytics** | Dashboard, heatmap, model comparison |
| **Tracker Import** | Import from Linear/Jira |
| **Embedded Inline Editors** | Notion-like embeds |
| **Browser Session Viewer** | Manage browser sessions |
| **Interactive Walkthroughs** | 16+ guided walkthroughs |
| **Contextual Tips** | 20+ tip definitions |
| **Organization Management** | Roles, billing, projects |
| **Team Analytics** | Collaboration health metrics |
| **Database Browser** | Browse SQLite/PGlite in-app |
| **Developer Dashboard** | Render profiler, atom profiler |
| **Blitz (Batch Ops)** | Batch operations on sessions |
| **Super Loops** | Multi-step agent orchestration |
| **Extension Permissions** | Granular permission system |
| **System Tray** | Tray panel with session management |
| **Tab-Based Editor** | VSCode-style tabs |
| **Session Kanban** | Drag sessions between status columns |
| **Plans Panel** | List/filter/manage AI plans |
| **QR Mobile Pairing** | Pair mobile via QR code |
| **Stytch Auth** | B2B authentication |
| **Content Search** | Full-text search across sessions |
| **Session Shares** | Share sessions with team |
| **Diff Preview** | Monaco diff with approval bar |
| **Personal Sync** | Sync across personal devices |
| **Tutorial System** | Seed tutorial projects |
| **Comments System** | Threaded comments, reactions, @-mentions |
| **Navigation History** | Back/forward across views |
| **Claude CLI Integration** | Native Claude Code CLI |
| **Action Prompts** | Predefined action prompts |
