# Hermes Agent Desktop vs Nimbalyst Desktop — Feature Comparison

> Based on source code analysis of:
> - Hermes: /tmp/hermes-agent/apps/desktop/ (src/ + electron/)
> - Nimbalyst: /tmp/nimbalyst/packages/electron/ (src/main + src/renderer)

---

## 1. Features BOTH Have (with differences)

| Feature | Hermes | Nimbalyst |
|---------|--------|-----------|
| **AI Chat** | Full chat with composer, rich text, @-refs, slash commands, queue | AI chat panel via UnifiedAI component, action prompts, slash commands |
| **Session Management** | Multi-session sidebar, color coding, unread dots, pinning, density controls | Multi-session sidebar, session list filter, kanban board for sessions |
| **Voice Mode** | Real-time voice with barge-in, wake word detection, stop words | Voice mode via OpenAI Realtime API, barge-in policy, voice tools, mobile voice |
| **Terminal** | xterm.js-based terminal in right sidebar, agent terminal stream, persistent tabs | Ghostty WASM-based terminal (native GPU rendering), terminal tabs, CLI terminal drawer |
| **Theme System** | Full theme engine: VSCode theme import, user themes, presets, skin system, profile-themes | Theme system with dark/light toggle, extension-contributed themes, fallback themes |
| **Command Palette** | Cmd+K command palette with marketplace themes, pet pages | Cmd+K opens Agent mode; Cmd+L for session quick open; Cmd+Shift+L for prompt quick open |
| **Keyboard Shortcuts** | Customizable keybinds, keybind settings UI | Full shortcut system documented in KeyboardShortcuts.ts |
| **Notifications** | Native OS notifications, notification settings | Native notifications, team inbox notifications, session notifications |
| **File Tree** | Project file tree in right sidebar with DnD, remote picker | File tree with workspace manager, drag support, gitignore awareness |
| **Model Selection** | Model presets, model visibility, provider collapse | Model selector, effort level selector, thinking mode selector |
| **Settings** | Full settings: appearance, connections, models, voice, notifications, billing, plugins | Global settings + per-project settings, extension settings, organization settings |
| **Git Worktrees** | git-worktree-ops.ts in electron main process | Full worktree service, worktree onboarding modal, worktree inference |
| **File Attachments** | Attachments in composer, drag-and-drop | Attachment preview, file mention, attachment staging |
| **Dark/Light Mode** | Theme presets include dark/light variants | ThemeToggleButton component, theme fallback atoms |
| **Zoom Controls** | Zoom store, zoom IPC, zoom percentage controls | Zoom in/out/actual-size keyboard shortcuts |
| **Find in Page** | Native find-in-page with Ctrl+F | Find/search in editor (Cmd+F, find & replace) |
| **MCP Integration** | MCP health monitoring, MCP setup, MCP deeplink install | MCPConfigService, MCP lockdown banner, MCPServersPanel in settings |
| **Onboarding** | First-run setup gate, onboarding store | UnifiedOnboarding, WelcomeModal, 16+ walkthrough definitions, tip system |
| **Auto-Update** | Update gate, update marker, update remote, updater process | Auto-updater service with electron-updater |
| **AI Agent Mode** | Sub-agents, background delegation, agent delivery | AgentMode with workstreams, session panel, review panel, file scope, git operations |
| **Pull Requests** | PR tag in chat, pull-requests store | Full PullRequestMode: list view, detail, file diff, inline comments, PR tracker |
| **Composers/Input** | Rich editor, suggestion pills, trigger popover, undo history, IME handling | AIInput, slash command suggestions, text selection chips, prompt queue |

---

## 2. Features ONLY Hermes Has

| Feature | Description |
|---------|-------------|
| **🖥️ HUD Mode** | Floating translucent overlay window that stays above other apps. Supports click-through, glass/vibrancy effects, cursor customization, snap shortcuts, drag-to-move, resize handles. Can run Hermes in a minimal always-on-top bubble. |
| **⚡ Quick Entry** | Floating quick-input window (like Spotlight) for fast prompts without opening the main window. Has its own app root, settings page, and bridge hook. |
| **🐾 Pet System** | Virtual pet companion: pet overlay (desktop mascot), pet generation with AI (draft grid, hatching animation, provider picker, reference images), pet gallery, pet settings, pet palette page in command palette. Full lifecycle: create → hatch → display on desktop. |
| **⭐ Star Map** | Constellation visualization of sessions/connections. Canvas-based with physics simulation, node context menus, timeline axis, share codes, share controls. Visualizes relationships between sessions as an interactive star field. |
| **⏰ Cron / Scheduled Jobs** | Create and manage scheduled AI tasks. Cron job model, blueprints, delivery checkboxes, job state tracking, cron model impact scoping. |
| **🪝 Webhooks** | Webhook configuration and management for external integrations. |
| **🔌 OpenAI-Compatible Proxy** | Gateway system exposes Hermes as an OpenAI-compatible API endpoint. Custom endpoints settings, gateway connection lifecycle, gateway WebSocket probe, gateway file download. |
| **👤 Multi-Profile System** | Multiple named profiles (work, personal, etc.) with create/delete/rename dialogs. Profile session routing, profile-agent activation, profile sharing. Each profile has isolated sessions, settings, skills. |
| **🎨 Skin / Theme Marketplace** | VSCode Marketplace theme import (vscode-marketplace.ts), user-customizable theme presets, install/import flows, backend sync for themes, profile-specific themes. |
| **🧠 Skills Hub** | Browse, install, and manage skills. Embedded hub picker, MCP tab, skill store. Skills are reusable procedural knowledge modules. |
| **📺 Background Delegation** | Delegate tasks to background agent processes. Background sync hooks, session tile delegate, sub-agent tracking. |
| **🔗 Inline Media Embeds** | Rich inline embeds in chat: YouTube, Spotify, Mermaid diagrams, SVG, social embeds, URL previews, iframes. Each has consent gating and size controls. |
| **🎙️ Wake Word Detection** | Voice wake word detection (like "Hey Hermes") with wake indicator overlay window. |
| **✨ Translucency Effects** | Window translucency/glass effects with power-save awareness (reduces effects on battery). |
| **📱 Haptics** | Haptic feedback support for compatible devices. |
| **🌊 Backdrop Effects** | Backdrop blur/filter effects for visual depth. |
| **😊 Message Reactions** | React to messages with emoji reactions. Reactions enabled/disabled toggle, local reactions. |
| **📋 Todo List** | Built-in todo/task list management within sessions. |
| **🔑 SSH Support** | SSH config parsing, SSH connection management, SSH bootstrap coordinator, git-bash detection on Windows. |
| **🐧 WSL Support** | Windows Subsystem for Linux path bridging, WSL clipboard image support. |
| **🏔️ Hyprland Support** | Native Hyprland (Wayland compositor) integration for Linux. |
| **🖼️ Artifacts Viewer** | Display and manage AI-generated artifacts (code, documents, etc.) with artifact cards. |
| **🔭 Panes System** | Multi-pane layout with pane focus management, pane shell components. |
| **🔗 Session Color Coding** | Per-session color customization for visual organization. |
| **📊 Session Unread Tracking** | Cross-session unread state with remote sync, unread tiles, dot state indicators. |
| **🎯 Directive System** | AI directive text rendering, directive actions, directive scope control. |
| **🔌 Plugin System** | Extensible plugin architecture with example plugin, plugin settings UI. |
| **📡 Remote Connection** | Remote/SSH backend connections with liveness monitoring, connection registry, rehome logic. |
| **🖥️ External Terminal** | Open sessions in external terminal emulators. |
| **🔧 Tool Diffs** | Side-by-side diff view for tool execution results. |
| **📝 Composer Queue** | Queue multiple prompts to send sequentially. |
| **🏷️ Session Pin Sync** | Pin important sessions with cross-device sync. |
| **🎵 Completion Sound** | Play sound on AI task completion. |

---

## 3. Features ONLY Nimbalyst Has

| Feature | Description |
|---------|-------------|
| **📝 10+ Visual/Built-in Editors** | Native editors for: Markdown (Lexical), Excalidraw diagrams, spreadsheets, wireframes, database schemas, rich documents, mermaid diagrams, data models, images, code. Extensions can contribute additional editors via ExtensionEditorBridge. |
| **📋 Native Issue Tracker** | Full tracker system: Kanban board, grid view, list view, document view. Custom fields, relationship fields, saved views, advanced filter builder, milestones, staleness detection, import from Linear/Jira/other sources. Deep integration with sessions and git commits. |
| **🤝 Real-Time Collaboration** | Collaborative documents with real-time co-editing (CRDT-based via collab-protocol). Shared docs, presence indicators, shared document search, pinned tabs, offline support. Entire collab-* package stack (6 packages). |
| **💬 Team Messaging / Inbox** | Organization-level team messaging: rooms, inbox with filters, compose destinations, mark-all-read, conversation threading, DMs, read receipts, team presence. |
| **🏪 Extension Marketplace** | Full extension marketplace (marketplace package) with: extension SDK, permission system, extension dev tools, custom editor extensions, theme extensions, tracker importers, plugin extensions, extension error console, rebuild on dev. |
| **📱 Mobile Apps (iOS + Android)** | Native mobile companion apps (packages/ios, packages/android). Mobile session control, mobile queued prompts, mobile voice tool handler, mobile keep-awake tip. |
| **🔀 PR Review Mode** | Dedicated PullRequestMode: PR list, PR detail, file diff, inline review comments, PR tracker badge, GitHub onboarding, PR sidebar, approve/reject actions. |
| **🤖 Meta-Agent Mode** | Meta-agent orchestration: coordinate multiple AI agents across workstreams. MetaAgentService manages parent-child session promotion, workstream sync, notification signatures. |
| **📊 AI Usage Analytics Dashboard** | AIUsageReport: overview dashboard, activity heatmap, historical graphs, model comparison, project insights, tool usage breakdown. Plus per-provider indicators: ClaudeUsage, CodexUsage, GeminiUsage. |
| **📥 Tracker Import System** | Import issues from external sources (Linear, Jira, etc.) via ImportFromSourceDialog and TrackerImporterRegistry. |
| **📎 Embedded Inline Editors** | EmbedFrame: inline editable editors embedded within documents (like Notion embeds). Drag-to-resize, extension-resolved rendering. |
| **🌐 Browser Session Viewer** | BrowserSessionService: manage and view browser sessions within the app. |
| **🎓 Interactive Walkthroughs** | 16+ guided walkthrough definitions: agent intro, file tree tools, layout controls, model picker, plan mode, PR review, git commit mode, session kanban, context window, and more. |
| **💡 Contextual Tips System** | TipService with 20+ tip definitions: action prompts, auto-commit, content search, document sharing, mockup discovery, spreadsheet discovery, theme explore, tracker mode, worktree sessions, etc. |
| **🏢 Organization Management** | Multi-level org structure: org members & roles, org billing, org projects, merge org wizard, move project wizard, org danger zone, org onboarding choices. |
| **📈 Team Analytics** | Collaboration health metrics, team analytics service, per-team feature tracking. |
| **🗄️ Database Browser** | DatabaseBrowser: browse and query SQLite/PGlite databases directly within the app. Database dashboard view. |
| **🔧 Developer Dashboard** | DeveloperDashboard: render profiler panel, atom write profiler, dashboard stats, render budget monitoring. |
| **📤 Session Import/Export** | SessionImportDialog: import/export AI sessions. SessionHtmlExporter for sharing. |
| **⚡ Blitz (Batch Operations)** | BlitzDialog for batch operations on sessions/items. BlitzGroup in session list. |
| **🔄 Super Loops** | Multi-step agent orchestration: SuperLoopService, SuperLoopStore, progress tracking via MCP. NewSuperLoopDialog. |
| **🔐 Extension Permissions** | Granular extension permission system: permission prompts, capability policies, permission registry, usage tracking. |
| **🖥️ System Tray Integration** | TrayPanel: system tray with session management, quick actions. Tray sessions support. |
| **📑 Tab-Based Editor** | TabManager/TabBar: VSCode-style tab system with multiple document tabs, reopen closed tab, tab context menus. |
| **📊 Session Kanban Board** | KanbanBoard specifically for AI sessions (Cmd+Shift+K): drag sessions between status columns. |
| **🔀 Multi-Provider AI** | Claude, OpenAI, Copilot CLI, OpenCode, Gemini, LM Studio — all with individual settings panels and usage indicators. |
| **📋 Plans Panel** | Dedicated PlansPanel: list, filter, and manage AI-generated plans. |
| **🏷️ Mockup System** | MockupPickerMenu: create and manage UI mockups directly in documents. MockupAnnotationIndicator. |
| **🔑 QR Mobile Pairing** | QRPairingModal: pair mobile devices via QR code scanning. |
| **📋 Stytch Auth** | Stytch-based authentication with account binding, personal JWT handling. |
| **🔍 Content Search** | Full-text content search across sessions (Cmd+Shift+F), global search (Cmd+Shift+O). |
| **🧹 Session Cleanup** | Session cleanup tools, archive blitz for bulk session management. |
| **🔗 Session Shares** | Share sessions with team members via link. ShareDialog, ShareToTeamDialog. |
| **📊 Diff Preview** | Monaco-based diff preview with approval bar (approve/reject changes). |
| **📡 Personal Sync** | PersonalSyncDevicesService: sync data across personal devices. SyncPanel, SyncStatusButton. |
| **🎓 Tutorial System** | TutorialProjectService: seed tutorial projects, sessions, and trackers for new users. |
| **📋 Workspace Manager** | Dedicated WorkspaceManager window for managing multiple project workspaces. |
| **💬 Comments System** | Full commenting system: comment threads, reactions, @-mentions, emoji picker, resource pills. |
| **🔍 Navigation History** | Back/forward navigation history (Cmd+[ / Cmd+]) across all views. |
| **🖥️ Claude CLI Integration** | Native Claude Code CLI integration: detect, launch, observe, manage Claude CLI sessions. ClaudeCliTerminalStrip. |
| **📋 Action Prompts** | Predefined action prompts that can be triggered from the AI input. ActionPromptService. |
| **📊 Collab Discovery** | Discover shared documents and collaborative sessions across the organization. |
| **🗂️ Session Files Tracking** | Track files modified by AI sessions with pending review identity. |

---

## Summary Counts

| Category | Count |
|----------|-------|
| Features both have | ~20 |
| Features ONLY Hermes has | ~25 |
| Features ONLY Nimbalyst has | ~40+ |

**Key Architectural Difference:** Hermes is an **AI-first assistant** with personality (pets, star map), HUD overlay, and deep system integration (SSH, WSL, Hyprland). Nimbalyst is a **collaborative IDE** with visual editors, issue tracking, real-time collaboration, and team features — it's closer to a Notion/Linear hybrid with AI coding built in.

**Hermes strengths:** Personal AI companion, unique visual features (star map, pets), system-level integration, profiles, OpenAI-compatible gateway, cron/scheduling, skills system.

**Nimbalyst strengths:** Built-in editors, issue tracker, real-time collab, team features, extension marketplace, mobile apps, organization management, multi-provider AI, analytics dashboard.
