/**
 * Hermes Agent Backend Module
 *
 * Implements AgentProtocol to connect Nimbalyst to Hermes Agent.
 * Supports two connection modes:
 *   - local: runs `hermes` binary directly
 *   - ssh: connects to a remote VPS via SSH and runs hermes there
 *
 * This module runs in a privileged utility-process (electron main).
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import type {
  AgentProtocol,
  ProtocolEvent,
  ProtocolSession,
  ProtocolMessage,
  SessionOptions,
} from '@nimbalyst/extension-sdk/agents';

// ============================================
// Types
// ============================================

interface HermesBackendConfig {
  connectionMode: 'local' | 'ssh';
  sshHost: string;
  sshUser: string;
  sshKeyPath: string;
  hermesBinary: string;
  hermesProfile: string;
  workspacePath: string;
}

interface HermesSession extends ProtocolSession {
  process: ChildProcess | null;
  config: HermesBackendConfig;
  eventBuffer: ProtocolEvent[];
  resolveNext: (() => void) | null;
  done: boolean;
}

// ============================================
// HermesProtocol - AgentProtocol Implementation
// ============================================

class HermesProtocol implements AgentProtocol {
  readonly platform = 'hermes';
  private sessions: Map<string, HermesSession> = new Map();
  private config: HermesBackendConfig;

  constructor(config: HermesBackendConfig) {
    this.config = config;
    console.log(`[Hermes Agent] Protocol initialized (mode: ${config.connectionMode})`);
  }

  // ============================================
  // Session Management
  // ============================================

  async createSession(options: SessionOptions): Promise<ProtocolSession> {
    const sessionId = `hermes-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[Hermes Agent] Creating session: ${sessionId}`);

    const session: HermesSession = {
      id: sessionId,
      platform: this.platform,
      process: null,
      config: { ...this.config },
      eventBuffer: [],
      resolveNext: null,
      done: false,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async resumeSession(sessionId: string, options: SessionOptions): Promise<ProtocolSession> {
    console.log(`[Hermes Agent] Resuming session: ${sessionId}`);
    const session = this.sessions.get(sessionId);
    if (session) {
      return session;
    }
    // If not found, create new
    return this.createSession(options);
  }

  async forkSession(sessionId: string, options: SessionOptions): Promise<ProtocolSession> {
    // Hermes doesn't support native forking, create new session
    console.log(`[Hermes Agent] Fork not supported, creating new session`);
    return this.createSession(options);
  }

  // ============================================
  // Message Sending
  // ============================================

  async *sendMessage(
    session: ProtocolSession,
    message: ProtocolMessage
  ): AsyncIterable<ProtocolEvent> {
    const hermesSession = session as HermesSession;
    console.log(`[Hermes Agent] Sending message to session ${session.id}`);

    // Start hermes process if not running
    if (!hermesSession.process) {
      hermesSession.process = await this.startHermesProcess(hermesSession, message);
      this.setupProcessEvents(hermesSession);
    }

    // Send the message to hermes stdin
    const msg = message.content.replace(/\n/g, '\\n');
    hermesSession.process.stdin?.write(message.content + '\n');

    // Reset state for this turn
    hermesSession.done = false;
    hermesSession.eventBuffer = [];
    hermesSession.resolveNext = null;

    // Yield events as they arrive
    yield* this.consumeEvents(hermesSession);
  }

  // ============================================
  // Abort / Cleanup
  // ============================================

  abortSession(session: ProtocolSession): void {
    const hermesSession = session as HermesSession;
    console.log(`[Hermes Agent] Aborting session: ${session.id}`);

    if (hermesSession.process) {
      hermesSession.process.kill('SIGINT');
    }
  }

  cleanupSession(session: ProtocolSession): void {
    const hermesSession = session as HermesSession;
    console.log(`[Hermes Agent] Cleaning up session: ${session.id}`);

    if (hermesSession.process) {
      hermesSession.process.kill('SIGTERM');
      hermesSession.process = null;
    }

    this.sessions.delete(session.id);
  }

  // ============================================
  // Process Management
  // ============================================

  private async startHermesProcess(
    session: HermesSession,
    message: ProtocolMessage
  ): Promise<ChildProcess> {
    const { config } = session;
    const workspace = message.sessionId || config.workspacePath || process.cwd();

    if (config.connectionMode === 'ssh') {
      return this.startSSHProcess(config, workspace);
    } else {
      return this.startLocalProcess(config, workspace);
    }
  }

  private startLocalProcess(
    config: HermesBackendConfig,
    workspace: string
  ): ChildProcess {
    const args = [
      'chat',
      '--json',
      '-p', config.hermesProfile,
      '--in', workspace,
    ];

    console.log(`[Hermes Agent] Starting local: ${config.hermesBinary} ${args.join(' ')}`);

    return spawn(config.hermesBinary, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: workspace,
    });
  }

  private startSSHProcess(
    config: HermesBackendConfig,
    workspace: string
  ): ChildProcess {
    // SSH into the VPS and run hermes there
    const hermesCmd = `${config.hermesBinary} chat --json -p ${config.hermesProfile} --in ${workspace}`;

    const sshArgs = [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ConnectTimeout=10',
      '-i', config.sshKeyPath,
      `${config.sshUser}@${config.sshHost}`,
      hermesCmd,
    ];

    console.log(`[Hermes Agent] Starting SSH: ssh ${sshArgs.join(' ')}`);

    return spawn('ssh', sshArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }

  // ============================================
  // Event Processing
  // ============================================

  private setupProcessEvents(session: HermesSession): void {
    const proc = session.process;
    if (!proc) return;

    let buffer = '';

    proc.stdout?.on('data', (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        const event = this.parseEvent(line);
        if (event) {
          session.eventBuffer.push(event);
          session.resolveNext?.();
        }
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      const text = data.toString().trim();
      if (text) {
        // Hermes sends some info via stderr, forward as text
        session.eventBuffer.push({
          type: 'text',
          content: text + '\n',
        });
        session.resolveNext?.();
      }
    });

    proc.on('exit', (code: number | null) => {
      console.log(`[Hermes Agent] Process exited with code ${code}`);
      session.done = true;
      session.resolveNext?.();
    });

    proc.on('error', (error: Error) => {
      console.error(`[Hermes Agent] Process error:`, error);
      session.eventBuffer.push({
        type: 'error',
        error: error.message,
      });
      session.done = true;
      session.resolveNext?.();
    });
  }

  private parseEvent(line: string): ProtocolEvent | null {
    try {
      const data = JSON.parse(line);

      switch (data.type) {
        case 'text':
        case 'content_block_delta':
          return {
            type: 'text',
            content: data.text || data.delta?.text || '',
          };

        case 'tool_call':
        case 'tool_use':
          return {
            type: 'tool_call',
            toolCall: {
              id: data.id || `tool-${Date.now()}`,
              name: data.name || data.tool_name || '',
              arguments: data.input || data.arguments || {},
            },
          };

        case 'tool_result':
        case 'tool_result_content':
          return {
            type: 'tool_result',
            toolResult: {
              id: data.id,
              name: data.name || data.tool_name || '',
              result: {
                success: true,
                output: data.content || data.result,
              },
            },
          };

        case 'error':
          return {
            type: 'error',
            error: data.error || data.message || 'Unknown error',
          };

        case 'complete':
        case 'message_stop':
          return {
            type: 'complete',
            content: data.content || '',
            usage: data.usage ? {
              input_tokens: data.usage.input_tokens || 0,
              output_tokens: data.usage.output_tokens || 0,
              total_tokens: data.usage.total_tokens || 0,
            } : undefined,
          };

        case 'usage':
          return {
            type: 'usage',
            usage: {
              input_tokens: data.input_tokens || 0,
              output_tokens: data.output_tokens || 0,
              total_tokens: (data.input_tokens || 0) + (data.output_tokens || 0),
            },
          };

        default:
          // Try to extract text
          if (data.text || data.content) {
            return {
              type: 'text',
              content: data.text || data.content,
            };
          }
          return null;
      }
    } catch {
      // Not JSON — treat as plain text output
      if (line.trim()) {
        return {
          type: 'text',
          content: line + '\n',
        };
      }
      return null;
    }
  }

  private async *consumeEvents(session: HermesSession): AsyncIterable<ProtocolEvent> {
    while (!session.done || session.eventBuffer.length > 0) {
      if (session.eventBuffer.length > 0) {
        const event = session.eventBuffer.shift()!;
        yield event;

        if (event.type === 'complete' || event.type === 'error') {
          return;
        }
      } else {
        // Wait for more events
        await new Promise<void>((resolve) => {
          session.resolveNext = resolve;
        });
      }
    }
  }
}

// ============================================
// Backend Module Entry Point
// ============================================

/**
 * Called by Nimbalyst's PrivilegedExtensionHost when the backend module is loaded.
 * Reads config from the extension settings and returns a protocol instance.
 */
export function createProtocol(context: {
  extensionId: string;
  config: Record<string, unknown>;
  workspacePath: string;
}): AgentProtocol {
  const config: HermesBackendConfig = {
    connectionMode: (context.config.connectionMode as string as 'local' | 'ssh') || 'local',
    sshHost: (context.config.sshHost as string) || '',
    sshUser: (context.config.sshUser as string) || 'root',
    sshKeyPath: (context.config.sshKeyPath as string) || '~/.ssh/id_rsa',
    hermesBinary: (context.config.hermesBinary as string) || 'hermes',
    hermesProfile: (context.config.hermesProfile as string) || 'coder',
    workspacePath: context.workspacePath || '',
  };

  console.log(`[Hermes Agent] Backend module loaded (mode: ${config.connectionMode})`);

  if (config.connectionMode === 'ssh' && !config.sshHost) {
    console.warn('[Hermes Agent] SSH mode selected but no sshHost configured!');
  }

  return new HermesProtocol(config);
}
