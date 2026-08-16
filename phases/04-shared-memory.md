# Fase 4: Shared Memory

**Objetivo:** Sistema de memoria de Hermes accesible desde Nimbalyst.
**Esfuerzo:** 1 semana
**Dependencias:** Fase 1

---

## 📋 Descripción

Conectar los sistemas de memoria de Hermes (MEMORY.md, USER.md, Graphify, Codebase Memory, Code RAG) con la UI de Nimbalyst.

---

## 🏗️ Arquitectura

```
Nimbalyst UI
    │
    ├── Memory Panel → MEMORY.md / USER.md
    ├── Knowledge Graph → Graphify (166 nodos)
    ├── Code Intelligence → Codebase Memory (159K nodos)
    └── Code Snippets → Code RAG (16 snippets)
```

---

## 🔧 Implementación

### 4.1 MemoryBridge

```typescript
export class MemoryBridge {
  private hermesProcess: HermesProcessManager;

  // Leer memoria
  async getMemory(): Promise<MemoryData> {
    const result = await this.hermesProcess.execute({
      tool: 'memory',
      action: 'read'
    });
    return this.parseMemory(result);
  }

  // Escribir memoria
  async addMemory(content: string): Promise<void> {
    await this.hermesProcess.execute({
      tool: 'memory',
      action: 'add',
      content
    });
  }

  // Buscar en memoria
  async searchMemory(query: string): Promise<MemorySearchResult[]> {
    const result = await this.hermesProcess.execute({
      tool: 'session_search',
      query
    });
    return this.parseSearchResults(result);
  }
}
```

### 4.2 GraphifyBridge

```typescript
export class GraphifyBridge {
  // Consultar knowledge graph
  async queryGraph(question: string): Promise<GraphResult> {
    const result = await this.hermesProcess.execute({
      tool: 'mcp__graphify__query_graph',
      question
    });
    return this.parseGraphResult(result);
  }

  // Obtener estadísticas
  async getStats(): Promise<GraphStats> {
    const result = await this.hermesProcess.execute({
      tool: 'mcp__graphify__graph_stats'
    });
    return this.parseStats(result);
  }

  // Visualizar grafo
  async getVisualization(): Promise<GraphVisualization> {
    // Obtener datos del grafo
    const nodes = await this.getNodes();
    const edges = await this.getEdges();

    // Crear visualización
    return {
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.label,
        group: n.community
      })),
      edges: edges.map(e => ({
        source: e.source,
        target: e.target,
        label: e.type
      }))
    };
  }
}
```

### 4.3 CodebaseMemoryBridge

```typescript
export class CodebaseMemoryBridge {
  // Buscar código
  async searchCode(
    pattern: string,
    project?: string
  ): Promise<CodeSearchResult[]> {
    const result = await this.hermesProcess.execute({
      tool: 'mcp__codebase_memory__search_code',
      pattern,
      project
    });
    return this.parseCodeResults(result);
  }

  // Obtener arquitectura
  async getArchitecture(
    project: string
  ): Promise<ArchitectureOverview> {
    const result = await this.hermesProcess.execute({
      tool: 'mcp__codebase_memory__get_architecture',
      project
    });
    return this.parseArchitecture(result);
  }

  // Analizar impacto
  async analyzeImpact(
    file: string,
    change: string
  ): Promise<ImpactAnalysis> {
    const result = await this.hermesProcess.execute({
      tool: 'mcp__codebase_memory__detect_changes',
      file,
      change
    });
    return this.parseImpact(result);
  }
}
```

### 4.4 CodeRAGBridge

```typescript
export class CodeRAGBridge {
  // Buscar snippets
  async searchSnippets(
    query: string,
    language?: string
  ): Promise<CodeSnippet[]> {
    const result = await this.hermesProcess.execute({
      tool: 'mcp__code_rag__search_code',
      query,
      language
    });
    return this.parseSnippets(result);
  }

  // Almacenar snippet
  async storeSnippet(snippet: CodeSnippet): Promise<void> {
    await this.hermesProcess.execute({
      tool: 'mcp__code_rag__store_code',
      function_name: snippet.name,
      description: snippet.description,
      code: snippet.code,
      language: snippet.language,
      tags: snippet.tags
    });
  }
}
```

---

## 🎨 UI Components

### Memory Panel
- MEMORY.md viewer/editor
- USER.md viewer/editor
- Search bar
- Recent entries

### Knowledge Graph Panel
- Graph visualization (D3.js/vis.js)
- Node search
- Community view
- Statistics

### Code Intelligence Panel
- Code search
- Architecture overview
- Impact analysis
- File tree

### Code Snippets Panel
- Snippet search
- Language filter
- Copy button
- Store new snippet

---

## ✅ Criterios de Aceptación

- [ ] Memory panel muestra MEMORY.md y USER.md
- [ ] Se puede buscar en memoria
- [ ] Knowledge graph se visualiza
- [ ] Code search funciona
- [ ] Code snippets se buscan y almacenan
- [ ] Architecture overview se muestra
