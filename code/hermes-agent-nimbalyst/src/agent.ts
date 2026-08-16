/**
 * Hermes Agent Backend Module
 *
 * Backend module entry point for the hermes-agent extension.
 * Compiled to dist/agent.js.
 */

import { spawn, ChildProcess } from 'child_process';

// ============================================
// Types
// ============================================

interface BackendActivateContext {
  extensionId: string;
  config: Record<string, unknown>;
  workspacePath: string;
  runtimeContext?: { extensionId?: string; logger?: any };
  logger?: any;
}

interface CreateSessionInput {
  sessionId: string;
  workspacePath?: string;
  model?: string;
  systemPrompt?: string;
  tools?: any[];
  documentContext?: unknown;
}

interface ResumeSessionInput {
  sessionId: string;
  workspacePath?: string;
  model?: string;
}

interface SendMessageInput {
  sessionId: string;
  content: string;
  attachments?: any[];
  abortSignal?: AbortSignal;
}

interface ProtocolEvent {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'complete' | 'usage' | 'reasoning';
  content?: string;
  toolCall?: { id?: string; name: string; arguments?: any; result?: any };
  toolResult?: { id?: string; name: string; result?: any };
  error?: string;
  usage?: { input_tokens: number; output_tokens: number; total_tokens: number };
}

interface BackendModuleApi {
  createSession(input: CreateSessionInput): Promise<void>;
  resumeSession(input: ResumeSessionInput): Promise<void>;
  sendMessage(input: SendMessageInput): AsyncIterable<ProtocolEvent>;
  abortSession(sessionId: string): void;
  cleanupSession(sessionId: string): void;
}

// ============================================
// Config
// ============================================

interface HermesConfig {
  connectionMode: 'local' | 'ssh';
  sshHost: string;
  sshUser: string;
  sshKeyPath: string;
  hermesBinary: string;
  hermesProfile: string;
}

function resolveConfig(ctx: BackendActivateContext): HermesConfig {
  const cfg = ctx.config || {};
  return {
    connectionMode: (cfg.connectionMode as 'local' | 'ssh') || 'local',
    sshHost: (cfg.sshHost as string) || '',
    sshUser: (cfg.sshUser as string) || 'root',
    sshKeyPath: (cfg.sshKeyPath as string) || '',
    hermesBinary: (cfg.hermesBinary as string) || 'hermes',
    hermesProfile: (cfg.hermesProfile as string) || 'coder',
  };
}

// ============================================
// Activate
// ============================================

async function activate(ctx: BackendActivateContext): Promise<{ methods: BackendModuleApi }> {
  const log = ctx.runtimeContext?.logger ?? ctx.logger ?? console;
  const extensionId = ctx.runtimeContext?.extensionId ?? ctx.extensionId;
  const config = resolveConfig(ctx);

  log.info?.(`[hermes-backend] activated mode=${config.connectionMode} host=${config.sshHost}`);

  const sessions = new Map<string, { sessionId: string; workspacePath?: string; process: ChildProcess | null }>();

  function getOrThrow(sessionId: string) {
    const s = sessions.get(sessionId);
    if (!s) throw new Error(`[hermes-backend] session ${sessionId} not found`);
    return s;
  }

  const api: BackendModuleApi = {
    async createSession(input: CreateSessionInput): Promise<void> {
      log.info?.(`[hermes-backend] createSession: ${input.sessionId}`);
      const existing = sessions.get(input.sessionId);
      if (existing?.process) existing.process.kill('SIGTERM');
      sessions.set(input.sessionId, {
        sessionId: input.sessionId,
        workspacePath: input.workspacePath,
        process: null,
      });
    },

    async resumeSession(input: ResumeSessionInput): Promise<void> {
      if (!sessions.has(input.sessionId)) {
        await api.createSession({ sessionId: input.sessionId, workspacePath: input.workspacePath, model: input.model });
      }
    },

    sendMessage(input: SendMessageInput): AsyncIterable<ProtocolEvent> {
      const session = getOrThrow(input.sessionId);
      log.info?.(`[hermes-backend] sendMessage: ${input.content.substring(0, 80)}`);

      // Kill previous process if running
      if (session.process) {
        session.process.kill('SIGINT');
        session.process = null;
      }

      // Spawn hermes
      let proc: ChildProcess;
      if (config.connectionMode === 'ssh') {
        const escaped = input.content.replace(/'/g, "'\\''");
        const cmd = `${config.hermesBinary} chat -q '${escaped}' -p ${config.hermesProfile}`;
        const args = ['-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=10'];
        if (config.sshKeyPath) args.push('-i', config.sshKeyPath);
        args.push(`${config.sshUser}@${config.sshHost}`, cmd);
        proc = spawn('ssh', args, { stdio: ['pipe', 'pipe', 'pipe'] });
      } else {
        const args = ['chat', '-q', input.content, '-p', config.hermesProfile];
        if (session.workspacePath) args.push('--in', session.workspacePath);
        proc = spawn(config.hermesBinary, args, { stdio: ['pipe', 'pipe', 'pipe'] });
      }
      session.process = proc;

      // Return async iterable
      return createEventStream(proc, input.abortSignal);
    },

    abortSession(sessionId: string): void {
      const session = sessions.get(sessionId);
      if (session?.process) {
        session.process.kill('SIGINT');
        session.process = null;
      }
    },

    cleanupSession(sessionId: string): void {
      const session = sessions.get(sessionId);
      if (session?.process) {
        session.process.kill('SIGTERM');
        session.process = null;
      }
      sessions.delete(sessionId);
    },
  };

  return { methods: api };
}

// ============================================
// Event Stream
// ============================================

function createEventStream(proc: ChildProcess, abortSignal?: AbortSignal): AsyncIterable<ProtocolEvent> {
  const buffer: ProtocolEvent[] = [];
  let resolve: (() => void) | null = null;
  let done = false;

  let stdout = '';
  let stderr = '';

  proc.stdout?.on('data', (data: Buffer) => {
    stdout += data.toString();
  });

  proc.stderr?.on('data', (data: Buffer) => {
    stderr += data.toString();
  });

  proc.on('exit', (code: number | null) => {
    // Send accumulated output as text
    if (stdout.trim()) {
      buffer.push({ type: 'text', content: stdout });
    }
    if (stderr.trim() && code !== 0) {
      buffer.push({ type: 'error', error: stderr });
    }
    buffer.push({
      type: 'complete',
      usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    });
    done = true;
    resolve?.();
  });

  proc.on('error', (error: Error) => {
    buffer.push({ type: 'error', error: error.message });
    done = true;
    resolve?.();
  });

  // Handle abort signal
  abortSignal?.addEventListener('abort', () => {
    proc.kill('SIGINT');
  });

  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          while (!done || buffer.length > 0) {
            if (buffer.length > 0) {
              return { value: buffer.shift()!, done: false };
            }
            await new Promise<void>(r => { resolve = r; });
          }
          return { value: undefined, done: true };
        },
      };
    },
  };
}

// ============================================
// Exports
// ============================================

export default { activate };
export { activate };
