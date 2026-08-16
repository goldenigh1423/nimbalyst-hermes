// ============================================
// HermesProvider - AIProvider Implementation
// ============================================

import { EventEmitter } from 'events';
import { HermesProcessManager } from './services/HermesProcessManager';
import { HermesToolBridge } from './services/HermesToolBridge';
import { GatewayBridge } from './services/GatewayBridge';
import { MemoryBridge } from './services/MemoryBridge';
import {
  HermesConfig,
  HermesSession,
  ProtocolEvent,
  ManagedProcess
} from './types';

export interface HermesProviderOptions {
  processManager: HermesProcessManager;
  toolBridge: HermesToolBridge;
  gatewayBridge: GatewayBridge;
  memoryBridge: MemoryBridge;
  config: HermesConfig;
}

export class HermesProvider extends EventEmitter {
  private processManager: HermesProcessManager;
  private toolBridge: HermesToolBridge;
  private gatewayBridge: GatewayBridge;
  private memoryBridge: MemoryBridge;
  private config: HermesConfig;
  private sessions: Map<string, HermesSession> = new Map();

  constructor(options: HermesProviderOptions) {
    super();
    this.processManager = options.processManager;
    this.toolBridge = options.toolBridge;
    this.gatewayBridge = options.gatewayBridge;
    this.memoryBridge = options.memoryBridge;
    this.config = options.config;
  }

  // ============================================
  // AIProvider Interface
  // ============================================

  async createSession(options: SessionOptions): Promise<string> {
    console.log(`[Hermes] Creating session (profile: ${this.config.profile})`);

    // Start Hermes process
    const process = await this.processManager.start({
      profile: this.config.profile,
      model: options.model,
      workspace: options.workspacePath,
      mode: this.config.mode,
      apiUrl: this.config.apiUrl
    });

    // Create session
    const session: HermesSession = {
      id: process.sessionId,
      profile: this.config.profile,
      model: options.model,
      workspace: options.workspacePath,
      status: 'active',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(session.id, session);

    // Setup event forwarding
    this.setupProcessEventForwarding(process, session);

    console.log(`[Hermes] Session created: ${session.id}`);
    return session.id;
  }

  async sendMessage(
    sessionId: string,
    message: string
  ): Promise<AsyncIterable<ProtocolEvent>> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const process = this.processManager.getProcess(sessionId);
    if (!process) {
      throw new Error(`Process not found for session: ${sessionId}`);
    }

    // Send message to Hermes
    process.process.stdin?.write(message + '\n');

    // Return event stream
    return this.createEventStream(process, session);
  }

  async abortSession(sessionId: string): Promise<void> {
    console.log(`[Hermes] Aborting session: ${sessionId}`);

    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'paused';
      session.updatedAt = new Date();
    }

    await this.processManager.abort(sessionId);
  }

  async resumeSession(sessionId: string): Promise<void> {
    console.log(`[Hermes] Resuming session: ${sessionId}`);

    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'active';
      session.updatedAt = new Date();
    }

    await this.processManager.resume(sessionId);
  }

  async destroySession(sessionId: string): Promise<void> {
    console.log(`[Hermes] Destroying session: ${sessionId}`);

    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.updatedAt = new Date();
    }

    await this.processManager.stop(sessionId);
    this.sessions.delete(sessionId);
  }

  // ============================================
  // Status
  // ============================================

  async getStatus(): Promise<any> {
    const processes = this.processManager.getAllProcesses();
    const sessions = Array.from(this.sessions.values());

    return {
      mode: this.config.mode,
      profile: this.config.profile,
      processes: processes.length,
      sessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      gateway: await this.gatewayBridge.getStatus(),
      memory: this.config.memoryEnabled ? 'enabled' : 'disabled'
    };
  }

  // ============================================
  // Event Stream
  // ============================================

  private async *createEventStream(
    process: ManagedProcess,
    session: HermesSession
  ): AsyncIterable<ProtocolEvent> {
    const buffer: ProtocolEvent[] = [];
    let resolve: (() => void) | null = null;
    let done = false;

    // Listen for data from stdout
    process.process.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const event = this.parseEvent(line);
          if (event) {
            buffer.push(event);
            session.messages.push(event);
            session.updatedAt = new Date();

            // Notify waiting consumer
            if (resolve) {
              resolve();
              resolve = null;
            }
          }
        } catch (e) {
          console.error('[Hermes] Parse error:', e);
        }
      }
    });

    // Listen for process exit
    process.process.on('exit', () => {
      done = true;
      if (resolve) {
        resolve();
        resolve = null;
      }
    });

    // Yield events as they arrive
    while (!done) {
      if (buffer.length > 0) {
        yield buffer.shift()!;
      } else {
        // Wait for more data
        await new Promise<void>(r => { resolve = r; });
      }
    }

    // Yield remaining buffer
    while (buffer.length > 0) {
      yield buffer.shift()!;
    }
  }

  private parseEvent(line: string): ProtocolEvent | null {
    try {
      const data = JSON.parse(line);
      const timestamp = new Date();

      switch (data.type) {
        case 'text':
        case 'content_block_delta':
          return {
            type: 'text',
            content: data.text || data.delta?.text || '',
            timestamp
          };

        case 'tool_call':
        case 'tool_use':
          return {
            type: 'tool_call',
            toolName: data.name || data.tool_name,
            toolArgs: data.input || data.arguments || {},
            timestamp
          };

        case 'tool_result':
        case 'tool_result_content':
          return {
            type: 'tool_result',
            toolName: data.name || data.tool_name,
            toolResult: data.content || data.result,
            timestamp
          };

        case 'error':
          return {
            type: 'error',
            error: data.error || data.message || 'Unknown error',
            timestamp
          };

        case 'complete':
        case 'message_stop':
          return {
            type: 'complete',
            content: data.content || '',
            timestamp
          };

        case 'usage':
          return {
            type: 'usage',
            usage: {
              promptTokens: data.input_tokens || 0,
              completionTokens: data.output_tokens || 0,
              totalTokens: (data.input_tokens || 0) + (data.output_tokens || 0),
              cost: data.cost
            },
            timestamp
          };

        default:
          // Try to extract text from unknown event types
          if (data.text || data.content) {
            return {
              type: 'text',
              content: data.text || data.content,
              timestamp
            };
          }
          return null;
      }
    } catch {
      // Not JSON, treat as plain text
      if (line.trim()) {
        return {
          type: 'text',
          content: line,
          timestamp: new Date()
        };
      }
      return null;
    }
  }

  // ============================================
  // Process Event Forwarding
  // ============================================

  private setupProcessEventForwarding(
    process: ManagedProcess,
    session: HermesSession
  ): void {
    // Forward stdout as text events
    process.process.stdout?.on('data', (data: Buffer) => {
      this.emit('text', {
        sessionId: session.id,
        content: data.toString()
      });
    });

    // Forward stderr as error events
    process.process.stderr?.on('data', (data: Buffer) => {
      this.emit('error', {
        sessionId: session.id,
        error: data.toString()
      });
    });

    // Forward process exit
    process.process.on('exit', (code: number) => {
      session.status = code === 0 ? 'completed' : 'error';
      session.updatedAt = new Date();

      this.emit('complete', {
        sessionId: session.id,
        exitCode: code
      });
    });
  }
}
