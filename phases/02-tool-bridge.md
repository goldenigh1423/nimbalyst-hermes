# Fase 2: Exponer Herramientas

**Objetivo:** Las 70+ herramientas de Hermes disponibles en Nimbalyst.
**Esfuerzo:** 1 semana
**Dependencias:** Fase 1

---

## 📋 Descripción

Crear un puente que exponga las herramientas de Hermes como herramientas nativas dentro de Nimbalyst, con integración directa en los editores visuales.

---

## 🏗️ Arquitectura

```
Nimbalyst Editor
    │
    ▼
HermesToolBridge
    │
    ├── Hermes Process → tool_call → tool_result
    │
    ▼
Editor Response
    ├── Monaco: diff view
    ├── Excalidraw: add elements
    ├── CSV: apply formula
    ├── Terminal: execute command
    └── Mermaid: render diagram
```

---

## 📊 Categorías de Herramientas

### Prioridad ALTA (Semana 2, días 1-3)

| Categoría | Herramientas | Integración Nimbalyst |
|-----------|-------------|----------------------|
| **Web** | `web_search`, `web_extract` | Panel de resultados, links clickeables |
| **Terminal** | `terminal`, `process` | Terminal panel (Ghostty) |
| **Archivos** | `read_file`, `write_file`, `patch`, `search_files` | Monaco editor (diff view) |
| **Código** | `execute_code` | Terminal panel |

### Prioridad MEDIA (Semana 2, días 4-5)

| Categoría | Herramientas | Integración Nimbalyst |
|-----------|-------------|----------------------|
| **Memoria** | `memory`, `session_search` | Memory panel |
| **Browser** | `browser_*` | Preview panel |
| **Skills** | `skills_list`, `skill_view`, `skill_manage` | Skills panel |
| **Visión** | `vision_analyze` | Image preview |
| **Diagrams** | `excalidraw_*`, `mermaid_*` | Excalidraw/Mermaid editors |

### Prioridad BAJA (Futuro)

| Categoría | Herramientas | Integración Nimbalyst |
|-----------|-------------|----------------------|
| **Smart Home** | `ha_*` | Settings panel |
| **Desktop** | `computer_use` | Preview panel |
| **TTS** | `text_to_speech` | Audio player |
| **Image Gen** | `image_generate` | Image preview |

---

## 🔧 Implementación

### 2.1 HermesToolBridge

```typescript
export class HermesToolBridge {
  private provider: HermesProvider;
  private editorBridge: EditorBridge;

  async executeTool(
    toolName: string,
    args: Record<string, any>
  ): Promise<ToolResult> {
    // 1. Ejecutar herramienta en Hermes
    const result = await this.provider.executeTool(toolName, args);

    // 2. Mapear resultado a formato Nimbalyst
    return this.mapResult(toolName, result);
  }

  private mapResult(toolName: string, result: any): ToolResult {
    switch (toolName) {
      case 'read_file':
        return this.mapFileResult(result);
      case 'write_file':
        return this.mapWriteResult(result);
      case 'patch':
        return this.mapPatchResult(result);
      case 'terminal':
        return this.mapTerminalResult(result);
      case 'web_search':
        return this.mapSearchResult(result);
      default:
        return { type: 'text', content: result.output };
    }
  }
}
```

### 2.2 Editor Bridge

```typescript
export class EditorBridge {
  // Mapear resultados de herramientas a acciones en editores
  async applyToolResult(
    editor: EditorHost,
    toolName: string,
    result: ToolResult
  ): Promise<void> {
    switch (toolName) {
      case 'write_file':
      case 'patch':
        // Mostrar diff en Monaco
        await editor.showDiff(result.oldContent, result.newContent);
        break;

      case 'excalidraw_add_rectangle':
        // Añadir elemento al editor Excalidraw
        await editor.registerEditorAPI('excalidraw').addRectangle(result);
        break;

      case 'csv_apply_formula':
        // Aplicar fórmula en CSV
        await editor.registerEditorAPI('csv').applyFormula(result);
        break;

      case 'terminal':
        // Ejecutar en terminal
        await this.terminalService.execute(result.command);
        break;
    }
  }
}
```

### 2.3 Tool Registry

```typescript
export class HermesToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  // Registrar todas las herramientas de Hermes
  registerAll(): void {
    // Web
    this.register({ name: 'web_search', category: 'web', ... });
    this.register({ name: 'web_extract', category: 'web', ... });

    // Terminal
    this.register({ name: 'terminal', category: 'terminal', ... });
    this.register({ name: 'process', category: 'terminal', ... });

    // Files
    this.register({ name: 'read_file', category: 'files', ... });
    this.register({ name: 'write_file', category: 'files', ... });
    this.register({ name: 'patch', category: 'files', ... });
    this.register({ name: 'search_files', category: 'files', ... });

    // Code
    this.register({ name: 'execute_code', category: 'code', ... });
    this.register({ name: 'delegate_task', category: 'code', ... });

    // Memory
    this.register({ name: 'memory', category: 'memory', ... });
    this.register({ name: 'session_search', category: 'memory', ... });

    // Browser
    this.register({ name: 'browser_navigate', category: 'browser', ... });
    this.register({ name: 'browser_click', category: 'browser', ... });
    this.register({ name: 'browser_type', category: 'browser', ... });

    // Skills
    this.register({ name: 'skills_list', category: 'skills', ... });
    this.register({ name: 'skill_view', category: 'skills', ... });
    this.register({ name: 'skill_manage', category: 'skills', ... });

    // Vision
    this.register({ name: 'vision_analyze', category: 'vision', ... });

    // Diagrams
    this.register({ name: 'excalidraw_create', category: 'diagrams', ... });
    this.register({ name: 'mermaid_generate', category: 'diagrams', ... });
  }
}
```

---

## 🧪 Testing

- [ ] Tool bridge ejecuta herramientas correctamente
- [ ] Resultados se mapean a formato Nimbalyst
- [ ] Monaco muestra diff para write_file/patch
- [ ] Terminal ejecuta comandos
- [ ] Web search muestra resultados
- [ ] Excalidraw recibe elementos
- [ ] CSV aplica fórmulas

---

## ✅ Criterios de Aceptación

- [ ] 20+ herramientas prioritarias funcionando
- [ ] Integración con Monaco (diff view)
- [ ] Integración con Terminal
- [ ] Integración con Excalidraw
- [ ] Integración con CSV
- [ ] Tool registry completo
- [ ] Tests pasan
