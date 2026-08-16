// ============================================
// HermesToolBridge - Tool Execution Bridge
// ============================================

import { HermesProcessManager } from './HermesProcessManager';
import {
  ToolDefinition,
  ToolCategory,
  ToolResult,
  ManagedProcess
} from '../types';

export class HermesToolBridge {
  private processManager: HermesProcessManager;
  private tools: Map<string, ToolDefinition> = new Map();

  constructor(processManager: HermesProcessManager) {
    this.processManager = processManager;
    this.registerBuiltinTools();
  }

  // ============================================
  // Tool Execution
  // ============================================

  async executeTool(
    toolName: string,
    args: Record<string, any>
  ): Promise<ToolResult> {
    console.log(`[Hermes Tools] Executing: ${toolName}`);

    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        type: 'error',
        content: `Tool not found: ${toolName}`
      };
    }

    try {
      const result = await tool.handler(args);
      return {
        type: 'text',
        content: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        metadata: { toolName, args }
      };
    } catch (error: any) {
      return {
        type: 'error',
        content: `Tool error: ${error.message}`,
        metadata: { toolName, args, error: error.message }
      };
    }
  }

  // ============================================
  // Tool Definitions
  // ============================================

  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolsByCategory(category: ToolCategory): ToolDefinition[] {
    return Array.from(this.tools.values())
      .filter(t => t.category === category);
  }

  // ============================================
  // Builtin Tools Registration
  // ============================================

  private registerBuiltinTools(): void {
    // Web Tools
    this.registerTool({
      name: 'web_search',
      description: 'Search the web for information',
      category: 'web',
      parameters: {
        query: { type: 'string', description: 'Search query', required: true },
        limit: { type: 'number', description: 'Max results', default: 5 }
      },
      handler: async (args) => this.executeHermesTool('web_search', args)
    });

    this.registerTool({
      name: 'web_extract',
      description: 'Extract content from web pages',
      category: 'web',
      parameters: {
        urls: { type: 'array', description: 'URLs to extract', required: true }
      },
      handler: async (args) => this.executeHermesTool('web_extract', args)
    });

    // Terminal Tools
    this.registerTool({
      name: 'terminal',
      description: 'Execute shell commands',
      category: 'terminal',
      parameters: {
        command: { type: 'string', description: 'Command to execute', required: true },
        timeout: { type: 'number', description: 'Timeout in seconds' }
      },
      handler: async (args) => this.executeHermesTool('terminal', args)
    });

    this.registerTool({
      name: 'process',
      description: 'Manage background processes',
      category: 'terminal',
      parameters: {
        action: { type: 'string', description: 'Action (list, poll, log, wait, kill)', required: true },
        session_id: { type: 'string', description: 'Process session ID' }
      },
      handler: async (args) => this.executeHermesTool('process', args)
    });

    // File Tools
    this.registerTool({
      name: 'read_file',
      description: 'Read a text file',
      category: 'files',
      parameters: {
        path: { type: 'string', description: 'File path', required: true },
        offset: { type: 'number', description: 'Start line' },
        limit: { type: 'number', description: 'Max lines' }
      },
      handler: async (args) => this.executeHermesTool('read_file', args)
    });

    this.registerTool({
      name: 'write_file',
      description: 'Write content to a file',
      category: 'files',
      parameters: {
        path: { type: 'string', description: 'File path', required: true },
        content: { type: 'string', description: 'File content', required: true }
      },
      handler: async (args) => this.executeHermesTool('write_file', args)
    });

    this.registerTool({
      name: 'patch',
      description: 'Find and replace in a file',
      category: 'files',
      parameters: {
        path: { type: 'string', description: 'File path', required: true },
        old_string: { type: 'string', description: 'Text to find', required: true },
        new_string: { type: 'string', description: 'Replacement text', required: true }
      },
      handler: async (args) => this.executeHermesTool('patch', args)
    });

    this.registerTool({
      name: 'search_files',
      description: 'Search for files or content',
      category: 'files',
      parameters: {
        pattern: { type: 'string', description: 'Search pattern', required: true },
        target: { type: 'string', description: 'Search target (content or files)', default: 'content' }
      },
      handler: async (args) => this.executeHermesTool('search_files', args)
    });

    // Code Tools
    this.registerTool({
      name: 'execute_code',
      description: 'Execute Python code',
      category: 'code',
      parameters: {
        code: { type: 'string', description: 'Python code to execute', required: true }
      },
      handler: async (args) => this.executeHermesTool('execute_code', args)
    });

    this.registerTool({
      name: 'delegate_task',
      description: 'Delegate a task to a subagent',
      category: 'code',
      parameters: {
        goal: { type: 'string', description: 'Task goal', required: true },
        context: { type: 'string', description: 'Task context' }
      },
      handler: async (args) => this.executeHermesTool('delegate_task', args)
    });

    // Memory Tools
    this.registerTool({
      name: 'memory',
      description: 'Read or write persistent memory',
      category: 'memory',
      parameters: {
        action: { type: 'string', description: 'Action (add, replace, remove)', required: true },
        content: { type: 'string', description: 'Memory content' },
        target: { type: 'string', description: 'Target (memory or user)', default: 'memory' }
      },
      handler: async (args) => this.executeHermesTool('memory', args)
    });

    this.registerTool({
      name: 'session_search',
      description: 'Search past sessions',
      category: 'memory',
      parameters: {
        query: { type: 'string', description: 'Search query', required: true },
        limit: { type: 'number', description: 'Max results', default: 3 }
      },
      handler: async (args) => this.executeHermesTool('session_search', args)
    });

    // Skills Tools
    this.registerTool({
      name: 'skills_list',
      description: 'List available skills',
      category: 'skills',
      parameters: {},
      handler: async (args) => this.executeHermesTool('skills_list', args)
    });

    this.registerTool({
      name: 'skill_view',
      description: 'View a skill',
      category: 'skills',
      parameters: {
        name: { type: 'string', description: 'Skill name', required: true }
      },
      handler: async (args) => this.executeHermesTool('skill_view', args)
    });

    this.registerTool({
      name: 'skill_manage',
      description: 'Manage skills (create, edit, patch, delete)',
      category: 'skills',
      parameters: {
        action: { type: 'string', description: 'Action', required: true },
        name: { type: 'string', description: 'Skill name', required: true },
        content: { type: 'string', description: 'Skill content' }
      },
      handler: async (args) => this.executeHermesTool('skill_manage', args)
    });

    // Cron Tools
    this.registerTool({
      name: 'cronjob',
      description: 'Manage scheduled jobs',
      category: 'cron',
      parameters: {
        action: { type: 'string', description: 'Action (list, create, update, pause, resume, run, remove)', required: true },
        job_id: { type: 'string', description: 'Job ID' },
        schedule: { type: 'string', description: 'Cron schedule' },
        prompt: { type: 'string', description: 'Job prompt' }
      },
      handler: async (args) => this.executeHermesTool('cronjob', args)
    });

    // Vision Tools
    this.registerTool({
      name: 'vision_analyze',
      description: 'Analyze an image',
      category: 'vision',
      parameters: {
        image_url: { type: 'string', description: 'Image URL or path', required: true },
        question: { type: 'string', description: 'Question about the image' }
      },
      handler: async (args) => this.executeHermesTool('vision_analyze', args)
    });

    // Browser Tools
    this.registerTool({
      name: 'browser_navigate',
      description: 'Navigate to a URL',
      category: 'browser',
      parameters: {
        url: { type: 'string', description: 'URL to navigate', required: true }
      },
      handler: async (args) => this.executeHermesTool('browser_navigate', args)
    });

    this.registerTool({
      name: 'browser_click',
      description: 'Click an element in the browser',
      category: 'browser',
      parameters: {
        ref: { type: 'string', description: 'Element reference', required: true }
      },
      handler: async (args) => this.executeHermesTool('browser_click', args)
    });

    this.registerTool({
      name: 'browser_type',
      description: 'Type text in the browser',
      category: 'browser',
      parameters: {
        ref: { type: 'string', description: 'Element reference', required: true },
        text: { type: 'string', description: 'Text to type', required: true }
      },
      handler: async (args) => this.executeHermesTool('browser_type', args)
    });
  }

  // ============================================
  // Tool Registration
  // ============================================

  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  // ============================================
  // Hermes Tool Execution
  // ============================================

  private async executeHermesTool(
    toolName: string,
    args: Record<string, any>
  ): Promise<any> {
    // Get active process
    const processes = this.processManager.getActiveProcesses();
    if (processes.length === 0) {
      throw new Error('No active Hermes process');
    }

    const process = processes[0];

    // Send tool execution command to Hermes
    const command = JSON.stringify({
      type: 'tool_call',
      name: toolName,
      arguments: args
    });

    process.process.stdin?.write(command + '\n');

    // Wait for tool result
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Tool execution timeout'));
      }, 60000);

      const onData = (data: Buffer) => {
        const text = data.toString();
        try {
          const result = JSON.parse(text);
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
}
