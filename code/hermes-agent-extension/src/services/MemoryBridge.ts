// ============================================
// MemoryBridge - Memory System Bridge
// ============================================

import { HermesProcessManager } from './HermesProcessManager';
import {
  MemoryData,
  MemoryEntry,
  GraphNode,
  GraphEdge,
  GraphStats
} from '../types';

export class MemoryBridge {
  private processManager: HermesProcessManager;

  constructor(processManager: HermesProcessManager) {
    this.processManager = processManager;
  }

  // ============================================
  // Memory (MEMORY.md / USER.md)
  // ============================================

  async getMemory(): Promise<MemoryData> {
    const result = await this.executeHermesCommand({
      tool: 'memory',
      action: 'read'
    });

    return {
      memory: result.memory || '',
      user: result.user || '',
      entries: this.parseEntries(result.entries || [])
    };
  }

  async addMemory(content: string, target: 'memory' | 'user' = 'memory'): Promise<void> {
    await this.executeHermesCommand({
      tool: 'memory',
      action: 'add',
      content,
      target
    });
  }

  async replaceMemory(oldText: string, newText: string, target: 'memory' | 'user' = 'memory'): Promise<void> {
    await this.executeHermesCommand({
      tool: 'memory',
      action: 'replace',
      old_text: oldText,
      new_text: newText,
      target
    });
  }

  async removeMemory(text: string, target: 'memory' | 'user' = 'memory'): Promise<void> {
    await this.executeHermesCommand({
      tool: 'memory',
      action: 'remove',
      old_text: text,
      target
    });
  }

  // ============================================
  // Session Search
  // ============================================

  async searchSessions(query: string, limit: number = 3): Promise<any[]> {
    const result = await this.executeHermesCommand({
      tool: 'session_search',
      query,
      limit
    });

    return result.sessions || [];
  }

  // ============================================
  // Knowledge Graph (Graphify)
  // ============================================

  async queryGraph(question: string): Promise<any> {
    const result = await this.executeHermesCommand({
      tool: 'mcp__graphify__query_graph',
      question
    });

    return result;
  }

  async getGraphStats(): Promise<GraphStats> {
    const result = await this.executeHermesCommand({
      tool: 'mcp__graphify__graph_stats'
    });

    return {
      nodes: result.nodes || 0,
      edges: result.edges || 0,
      communities: result.communities || 0
    };
  }

  async getGraphNeighbors(nodeId: string): Promise<any> {
    const result = await this.executeHermesCommand({
      tool: 'mcp__graphify__get_neighbors',
      node_id: nodeId
    });

    return result;
  }

  async shortestPath(source: string, target: string): Promise<any> {
    const result = await this.executeHermesCommand({
      tool: 'mcp__graphify__shortest_path',
      source,
      target
    });

    return result;
  }

  // ============================================
  // Codebase Memory
  // ============================================

  async searchCode(pattern: string, project?: string): Promise<any[]> {
    const args: Record<string, any> = {
      tool: 'mcp__codebase_memory__search_code',
      pattern
    };

    if (project) {
      args.project = project;
    }

    const result = await this.executeHermesCommand(args);
    return result.results || [];
  }

  async getArchitecture(project: string): Promise<any> {
    const result = await this.executeHermesCommand({
      tool: 'mcp__codebase_memory__get_architecture',
      project
    });

    return result;
  }

  async listProjects(): Promise<any[]> {
    const result = await this.executeHermesCommand({
      tool: 'mcp__codebase_memory__list_projects'
    });

    return result.projects || [];
  }

  // ============================================
  // Code RAG
  // ============================================

  async searchSnippets(query: string, language?: string): Promise<any[]> {
    const args: Record<string, any> = {
      tool: 'mcp__code_rag__search_code',
      query
    };

    if (language) {
      args.language = language;
    }

    const result = await this.executeHermesCommand(args);
    return result.snippets || [];
  }

  async storeSnippet(
    name: string,
    description: string,
    code: string,
    language: string,
    tags: string[]
  ): Promise<void> {
    await this.executeHermesCommand({
      tool: 'mcp__code_rag__store_code',
      function_name: name,
      description,
      code,
      language,
      tags
    });
  }

  // ============================================
  // Helpers
  // ============================================

  private async executeHermesCommand(command: Record<string, any>): Promise<any> {
    const processes = this.processManager.getActiveProcesses();
    if (processes.length === 0) {
      throw new Error('No active Hermes process');
    }

    const process = processes[0];

    // Send command
    process.process.stdin?.write(JSON.stringify(command) + '\n');

    // Wait for response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Memory command timeout'));
      }, 30000);

      const onData = (data: Buffer) => {
        try {
          const result = JSON.parse(data.toString());
          if (result.type === 'tool_result') {
            clearTimeout(timeout);
            process.process.stdout?.off('data', onData);
            resolve(result.content);
          }
        } catch {
          // Not JSON, continue listening
        }
      };

      process.process.stdout?.on('data', onData);
    });
  }

  private parseEntries(entries: any[]): MemoryEntry[] {
    return entries.map(e => ({
      content: e.content || '',
      target: e.target || 'memory',
      timestamp: new Date(e.timestamp || Date.now())
    }));
  }
}
