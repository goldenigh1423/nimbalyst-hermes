/**
 * Hermes Agent Backend Module
 *
 * Implements AgentProtocol to connect Nimbalyst to Hermes Agent.
 * Supports two connection modes:
 *   - local: runs `hermes` binary directly
 *   - ssh: connects to a remote VPS via SSH and runs hermes there
 */

import { spawn, ChildProcess } from 'child_process';
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
  currentMode: 'idle' | 'interactive';
}

// ============================================
// HermesProtocol
// ============================================

class HermesProtocol implements AgentProtocol {
  readonly platform = 'hermes';
  private sessions: Map<string, HermesSession> = new Map();
  private config: HermesBackendConfig;

  constructor(config: HermesBackendConfig) {
    this.config = config;
    console.log(`[Hermes Agent] Protocol initialized (mode: ${config.connectionMode})`);
  }

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
      currentMode: 'idle',
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async resumeSession(sessionId: string, options: SessionOptions): Promise<ProtocolSession> {
    const session = this.sessions.get(sessionId);
    if (session) return session;
    return this.createSession(options);
  }

  async forkSession(sessionId: string, options: SessionOptions): Promise<ProtocolSession> {
    return this.createSession(options);
  }

  async *sendMessage(
    session: ProtocolSession,
    message: ProtocolMessage
  ): AsyncIterable<ProtocolEvent> {
    const hermesSession = session as HermesSession;
    console.log(`[Hermes Agent] Sending message to session ${session.id}`);

    // Use -q for single query mode (one shot)
    const proc = this.spawnHermes(hermesSession, message.content);
    hermesSession.process = proc;
    hermesSession.done = false;
    hermesSession.eventBuffer = [];
    hermesSession.resolveNext = null;

    this.setupProcessEvents(hermesSession);

    yield* this.consumeEvents(hermesSession);
  }

  abortSession(session: ProtocolSession): void {
    const hermesSession = session as HermesSession;
    if (hermesSession.process) {
      hermesSession.process.kill('SIGINT');
    }
  }

  cleanupSession(session: ProtocolSession): void {
    const hermesSession = session as HermesSession;
    if (hermesSession.process) {
      hermesSession.process.kill('SIGTERM');
      hermesSession.process = null;
    }
    this.sessions.delete(session.id);
  }

  // ============================================
  // Process Spawning
  // ============================================

  private spawnHermes(session: HermesSession, message: string): ChildProcess {
    const { config } = session;

    if (config.connectionMode === 'ssh') {
      return this.spawnSSH(config, message);
    } else {
      return this.spawnLocal(config, message);
    }
  }

  private spawnLocal(config: HermesBackendConfig, message: string): ChildProcess {
    const args = [
      'chat',
      '-q', message,
      '-p', config.hermesProfile,
    ];

    if (config.workspacePath) {
      args.push('--in', config.workspacePath);
    }

    console.log(`[Hermes Agent] Local: ${config.hermesBinary} ${args.join(' ')}`);

    return spawn(config.hermesBinary, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }

  private spawnSSH(config: HermesBackendConfig, message: string): ChildProcess {
    // Escape the message for shell
    const escapedMessage = message.replace(/'/g, "'\\''");
    const hermesCmd = `${config.hermesBinary} chat -q '${escapedMessage}' -p ${config.hermesProfile}`;

    const sshArgs = [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ConnectTimeout=10',
      `${config.sshUser}@${config.sshHost}`,
      hermesCmd,
    ];

    // Add SSH key if specified
    if (config.sshKeyPath) {
      sshArgs.splice(0, 0, '-i', config.sshKeyPath);
    }

    console.log(`[Hermes Agent] SSH: ssh ${sshArgs.join(' ')}`);

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

    let stdoutBuffer = '';
    let stderrBuffer = '';

    proc.stdout?.on('data', (data: Buffer) => {
      stdoutBuffer += data.toString();
    });

    proc.stderr?.on('data', (data: Buffer) => {
      stderrBuffer += data.toString();
    });

    proc.on('exit', (code: number | null) => {
      console.log(`[Hermes Agent] Process exited with code ${code}`);

      // Send accumulated stdout as text
      if (stdoutBuffer.trim()) {
        session.eventBuffer.push({
          type: 'text',
          content: stdoutBuffer,
        });
      }

      // Send stderr as text if present
      if (stderrBuffer.trim()) {
        session.eventBuffer.push({
          type: 'text',
          content: stderrBuffer,
        });
      }

      // Mark complete
      session.eventBuffer.push({
        type: 'complete',
        usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
      });

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

  private async *consumeEvents(session: HermesSession): AsyncIterable<ProtocolEvent> {
    while (!session.done || session.eventBuffer.length > 0) {
      if (session.eventBuffer.length > 0) {
        const event = session.eventBuffer.shift()!;
        yield event;
        if (event.type === 'complete' || event.type === 'error') {
          return;
        }
      } else {
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

export function createProtocol(context: {
  extensionId: string;
  config: Record<string, unknown>;
  workspacePath: string;
}): AgentProtocol {
  const config: HermesBackendConfig = {
    connectionMode: (context.config.connectionMode as 'local' | 'ssh') || 'local',
    sshHost: (context.config.sshHost as string) || '',
    sshUser: (context.config.sshUser as string) || 'root',
    sshKeyPath: (context.config.sshKeyPath as string) || '',
    hermesBinary: (context.config.hermesBinary as string) || 'hermes',
    hermesProfile: (context.config.hermesProfile as string) || 'coder',
    workspacePath: context.workspacePath || '',
  };

  console.log(`[Hermes Agent] Backend loaded (mode: ${config.connectionMode})`);
  return new HermesProtocol(config);
}
