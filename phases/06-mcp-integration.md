# Fase 6: MCP Integration

**Objetivo:** Servidores MCP de Hermes accesibles desde Nimbalyst.
**Esfuerzo:** 1 semana
**Dependencias:** Fase 1

---

## 📋 Descripción

Conectar los servidores MCP (Model Context Protocol) de Hermes con Nimbalyst, permitiendo usar herramientas MCP de terceros.

---

## 🏗️ Arquitectura

```
Nimbalyst
    │
    ▼
MCPConfigService
    │
    ├── Hermes MCP Servers (config.yaml)
    │   ├── graphify
    │   ├── codebase-memory
    │   ├── code-rag
    │   └── custom servers
    │
    └── Nimbalyst MCP Servers
        ├── nimbalyst-mcp
        ├── extension-dev
        └── session-naming
```

---

## 🔧 Implementación

### 6.1 MCPBridge

```typescript
export class MCPBridge {
  private hermesProcess: HermesProcessManager;

  // Listar servidores MCP de Hermes
  async listServers(): Promise<MCPServer[]> {
    const result = await this.hermesProcess.execute({
      tool: 'tool_search',
      query: 'mcp'
    });
    return this.parseServers(result);
  }

  // Ejecutar herramienta MCP
  async executeTool(
    server: string,
    tool: string,
    args: Record<string, any>
  ): Promise<any> {
    const result = await this.hermesProcess.execute({
      tool: 'tool_call',
      name: `${server}__${tool}`,
      arguments: args
    });
    return result;
  }

  // Buscar herramientas MCP
  async searchTools(query: string): Promise<MCPTool[]> {
    const result = await this.hermesProcess.execute({
      tool: 'tool_search',
      query
    });
    return this.parseTools(result);
  }
}
```

### 6.2 MCP Panel UI

```typescript
export class MCPPanel extends React.Component {
  render() {
    return (
      <div className="mcp-panel">
        <MCPServerList
          servers={this.state.servers}
          onSelect={this.handleServerSelect}
        />
        <MCPToolList
          tools={this.state.tools}
          onExecute={this.handleToolExecute}
        />
        <MCPToolDetail
          tool={this.state.selectedTool}
          onRun={this.handleRun}
        />
      </div>
    );
  }
}
```

### 6.3 MCP Server Categories

| Categoría | Servidores | Estado |
|-----------|-----------|--------|
| **Knowledge** | graphify, codebase-memory, code-rag | ✅ |
| **Development** | github, gitlab | ✅ |
| **Productivity** | notion, airtable, linear | ✅ |
| **AI** | comfyui, image-gen | ✅ |
| **Data** | supabase, stripe, sentry | ✅ |
| **Custom** | User-configured | ✅ |

---

## ✅ Criterios de Aceptación

- [ ] MCPBridge conecta a Hermes MCP servers
- [ ] Se pueden listar servidores MCP
- [ ] Se pueden buscar herramientas MCP
- [ ] Se pueden ejecutar herramientas MCP
- [ ] Panel MCP funcional
- [ ] 5+ categorías de servidores soportadas
