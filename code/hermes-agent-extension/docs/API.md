# Hermes Agent Extension - API Documentation

## Overview

The Hermes Agent Extension connects Hermes Agent as an AI provider within Nimbalyst, providing:
- 70+ AI tools
- 42 gateway platforms
- Persistent memory system
- Knowledge graph (Graphify)
- Code intelligence (Codebase Memory)
- Scheduled jobs (Cron)
- PostgreSQL AIOS integration

---

## Extension Lifecycle

### activate(ctx: ExtensionContext)

Called when the extension is loaded. Initializes:
- HermesProvider (AI provider)
- HermesProcessManager (process management)
- HermesToolBridge (tool execution)
- GatewayBridge (gateway connection)
- MemoryBridge (memory system)
- DBAIOSBridge (database connection)

### deactivate(ctx: ExtensionContext)

Called when the extension is unloaded. Cleans up:
- Stops all Hermes processes
- Disconnects gateway
- Closes database connections

---

## AI Provider

### HermesProvider

Implements the `AIProvider` interface for Nimbalyst.

#### Methods

```typescript
createSession(options: SessionOptions): Promise<string>
```
Creates a new Hermes session. Returns session ID.

```typescript
sendMessage(sessionId: string, message: string): Promise<AsyncIterable<ProtocolEvent>>
```
Sends a message and returns an async event stream.

```typescript
abortSession(sessionId: string): Promise<void>
```
Aborts the current operation in a session.

```typescript
resumeSession(sessionId: string): Promise<void>
```
Resumes a paused session.

```typescript
destroySession(sessionId: string): Promise<void>
```
Destroys a session and cleans up resources.

```typescript
getStatus(): Promise<any>
```
Returns current status (mode, profile, processes, sessions, gateway, memory).

---

## Tools

### Web Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `hermes.web_search` | Search the web | `query: string, limit?: number` |
| `hermes.web_extract` | Extract content from URLs | `urls: string[]` |

### Terminal Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `hermes.terminal` | Execute shell commands | `command: string, timeout?: number` |
| `hermes.process` | Manage background processes | `action: string, session_id?: string` |

### File Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `hermes.read_file` | Read a text file | `path: string, offset?: number, limit?: number` |
| `hermes.write_file` | Write content to a file | `path: string, content: string` |
| `hermes.patch` | Find and replace in a file | `path: string, old_string: string, new_string: string` |
| `hermes.search_files` | Search for files or content | `pattern: string, target?: string` |

### Code Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `hermes.execute_code` | Execute Python code | `code: string` |
| `hermes.delegate_task` | Delegate to subagent | `goal: string, context?: string` |

### Memory Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `hermes.memory` | Read/write persistent memory | `action: string, content?: string, target?: string` |
| `hermes.session_search` | Search past sessions | `query: string, limit?: number` |

### Skills Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `hermes.skills_list` | List available skills | `{}` |
| `hermes.skill_view` | View a skill | `name: string` |
| `hermes.skill_manage` | Manage skills | `action: string, name: string, content?: string` |

### Cron Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `hermes.cronjob` | Manage scheduled jobs | `action: string, job_id?: string, schedule?: string, prompt?: string` |

### Vision Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `hermes.vision_analyze` | Analyze an image | `image_url: string, question?: string` |

### Browser Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `hermes.browser_navigate` | Navigate to URL | `url: string` |
| `hermes.browser_click` | Click element | `ref: string` |
| `hermes.browser_type` | Type text | `ref: string, text: string` |

---

## Slash Commands

| Command | Description |
|---------|-------------|
| `/hermes.status` | Show Hermes status |
| `/hermes.skills` | List skills |
| `/hermes.memory` | Show memory |
| `/hermes.gateway` | Show gateway status |
| `/hermes.cron` | List cron jobs |

---

## Panels

### HermesConfigPanel

Configuration panel for:
- Binary path
- Profile selection
- Communication mode (CLI/API/MCP)
- API URL
- Gateway toggle
- Memory toggle
- Connection test

### HermesGatewayPanel

Gateway monitoring panel:
- Platform list with status
- Message history
- Send messages to platforms

### HermesMemoryPanel

Memory management panel:
- MEMORY.md viewer/editor
- USER.md viewer/editor
- Knowledge graph stats and queries
- Session search

---

## Services

### HermesProcessManager

Manages Hermes child processes.

```typescript
start(options: HermesProcessOptions): Promise<ManagedProcess>
stop(sessionId: string): Promise<void>
stopAll(): Promise<void>
abort(sessionId: string): Promise<void>
resume(sessionId: string): Promise<void>
getProcess(sessionId: string): ManagedProcess | undefined
getAllProcesses(): ManagedProcess[]
getActiveProcesses(): ManagedProcess[]
```

### HermesToolBridge

Bridges tool execution between Nimbalyst and Hermes.

```typescript
executeTool(toolName: string, args: Record<string, any>): Promise<ToolResult>
getToolDefinitions(): ToolDefinition[]
getToolsByCategory(category: ToolCategory): ToolDefinition[]
registerTool(tool: ToolDefinition): void
```

### GatewayBridge

Connects to Hermes gateway for multi-platform messaging.

```typescript
connect(): Promise<void>
disconnect(): Promise<void>
sendMessage(platform: string, sessionId: string, content: string): Promise<void>
getStatus(): Promise<any>
getPlatforms(): GatewayPlatform[]
getMessages(platform?: string): GatewayMessage[]
```

### MemoryBridge

Bridges memory systems between Nimbalyst and Hermes.

```typescript
getMemory(): Promise<MemoryData>
addMemory(content: string, target?: 'memory' | 'user'): Promise<void>
replaceMemory(oldText: string, newText: string, target?: 'memory' | 'user'): Promise<void>
removeMemory(text: string, target?: 'memory' | 'user'): Promise<void>
searchSessions(query: string, limit?: number): Promise<any[]>
queryGraph(question: string): Promise<any>
getGraphStats(): Promise<GraphStats>
searchCode(pattern: string, project?: string): Promise<any[]>
searchSnippets(query: string, language?: string): Promise<any[]>
```

### DBAIOSBridge

PostgreSQL AIOS database integration.

```typescript
connect(): Promise<boolean>
disconnect(): Promise<void>
getProjects(): Promise<Project[]>
getProject(id: string): Promise<Project | null>
createProject(data: CreateProjectInput): Promise<Project>
updateProject(id: string, data: UpdateProjectInput): Promise<Project>
getMilestones(projectId: string): Promise<Milestone[]>
createMilestone(data: CreateMilestoneInput): Promise<Milestone>
getPhases(milestoneId: string): Promise<Phase[]>
createPhase(data: CreatePhaseInput): Promise<Phase>
getTasks(phaseId: string): Promise<Task[]>
createTask(data: CreateTaskInput): Promise<Task>
updateTask(id: string, data: UpdateTaskInput): Promise<Task>
getBugs(filters?: BugFilters): Promise<Bug[]>
getHistory(entityType: string, entityId: string): Promise<HistoryEntry[]>
addHistory(data: AddHistoryInput): Promise<HistoryEntry>
getProjectSummary(): Promise<any[]>
getPendingBugs(): Promise<Bug[]>
getPipelineStatuses(): Promise<any[]>
getUsers(): Promise<any[]>
```

### HermesConfigService

Persistent configuration management.

```typescript
initialize(): Promise<void>
getHermesConfig(): HermesConfig
updateHermesConfig(updates: Partial<HermesConfig>): Promise<void>
getDBConfig(): DBConfig
updateDBConfig(updates: Partial<DBConfig>): Promise<void>
validateHermesConfig(config: Partial<HermesConfig>): ValidationResult
validateDBConfig(config: Partial<DBConfig>): ValidationResult
```

---

## Configuration

### manifest.json

```json
{
  "id": "com.nimbalyst.hermes-agent",
  "name": "Hermes Agent",
  "version": "1.0.0",
  "permissions": {
    "filesystem": true,
    "ai": true,
    "network": true
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HERMES_HOME` | Hermes home directory | `~/.hermes` |
| `HERMES_PROFILE` | Default profile | `default` |
| `AIOS_DB_HOST` | Database host | `169.58.56.108` |
| `AIOS_DB_PORT` | Database port | `5432` |
| `AIOS_DB_NAME` | Database name | `aios` |
| `AIOS_DB_USER` | Database user | `postgres` |
| `AIOS_DB_PASSWORD` | Database password | (required) |
