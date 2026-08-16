/**
 * Hermes Agent Backend Module
 *
 * Backend module entry point for the hermes-agent extension.
 * Compiled to dist/agent.js. The host loads this and calls activate(ctx).
 *
 * Follows the same pattern as gemini-antigravity extension.
 */

import { spawn, ChildProcess } from 'child_process';

// ============================================
// Types (inline to avoid import issues)
// ============================================

interface BackendActivateContext {
  extensionId: string;
  config: Record<string, unknown>;
  workspacePath: string;
  runtimeContext?: {
    extensionId?: string;
    logger?: any;
  };
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
}

interface BackendModuleApi {
  createSession(input: CreateSessionInput): Promise<void>;
  resumeSession(input: ResumeSessionInput): Promise<void>;
  sendMessage(
    input: SendMessageInput,
    callbacks: {
      onText?: (text: string) => void;
      onToolCall?: (name: string, args: any) => void;
      onToolResult?: (name: string, result: any) => void;
      onComplete?: (usage?: any) => void;
      onError?: (error: string) => void;
    }
  ): Promise<void>;
  abortSession(sessionId: string): void;
  cleanupSession(sessionId: string): void;
}

// ============================================
// Session State
// ============================================

interface SessionState {
  sessionId: string;
  workspacePath?: string;
  modelKey: string;
  process: ChildProcess | null;
  abortController: AbortController | null;
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

  log.info?.(
    `[hermes-backend] activated extensionId=${extensionId} mode=${config.connectionMode} host=${config.sshHost}`
  );

  const sessions = new Map<string, SessionState>();

  function getOrThrow(sessionId: string): SessionState {
    const s = sessions.get(sessionId);
    if (!s) throw new Error(`[hermes-backend] session ${sessionId} not found`);
    return s;
  }

  function spawnHermes(
    session: SessionState,
    message: string,
    callbacks: {
      onText?: (text: string) => void;
      onToolCall?: (name: string, args: any) => void;
      onToolResult?: (name: string, result: any) => void;
      onComplete?: (usage?: any) => void;
      onError?: (error: string) => void;
    }
  ): ChildProcess {
    let proc: ChildProcess;

    if (config.connectionMode === 'ssh') {
      const escapedMessage = message.replace(/'/g, "'\\''");
      const hermesCmd = `${config.hermesBinary} chat -q '${escapedMessage}' -p ${config.hermesProfile}`;

      const sshArgs = [
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'ConnectTimeout=10',
      ];

      if (config.sshKeyPath) {
        sshArgs.push('-i', config.sshKeyPath);
      }

      sshArgs.push(`${config.sshUser}@${config.sshHost}`, hermesCmd);

      log.info?.(`[hermes-backend] SSH: ssh ${sshArgs.join(' ')}`);
      proc = spawn('ssh', sshArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
    } else {
      const args = ['chat', '-q', message, '-p', config.hermesProfile];
      if (session.workspacePath) {
        args.push('--in', session.workspacePath);
      }

      log.info?.(`[hermes-backend] Local: ${config.hermesBinary} ${args.join(' ')}`);
      proc = spawn(config.hermesBinary, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    }

    let stdoutBuffer = '';
    let stderrBuffer = '';

    proc.stdout?.on('data', (data: Buffer) => {
      stdoutBuffer += data.toString();
    });

    proc.stderr?.on('data', (data: Buffer) => {
      stderrBuffer += data.toString();
    });

    proc.on('exit', (code: number | null) => {
      log.info?.(`[hermes-backend] Process exited with code ${code}`);

      if (stdoutBuffer.trim()) {
        callbacks.onText?.(stdoutBuffer);
      }

      if (stderrBuffer.trim()) {
        // Only send stderr if it looks like an error
        if (code !== 0 || stderrBuffer.includes('Error') || stderrBuffer.includes('error')) {
          callbacks.onError?.(stderrBuffer);
        } else {
          callbacks.onText?.(stderrBuffer);
        }
      }

      callbacks.onComplete?.({
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
      });
    });

    proc.on('error', (error: Error) => {
      log.error?.(`[hermes-backend] Process error:`, error);
      callbacks.onError?.(error.message);
    });

    return proc;
  }

  const api: BackendModuleApi = {
    async createSession(input: CreateSessionInput): Promise<void> {
      log.info?.(`[hermes-backend] createSession: ${input.sessionId}`);

      // Kill existing session if any
      const existing = sessions.get(input.sessionId);
      if (existing?.process) {
        existing.process.kill('SIGTERM');
      }

      sessions.set(input.sessionId, {
        sessionId: input.sessionId,
        workspacePath: input.workspacePath,
        modelKey: input.model || 'default',
        process: null,
        abortController: null,
      });
    },

    async resumeSession(input: ResumeSessionInput): Promise<void> {
      log.info?.(`[hermes-backend] resumeSession: ${input.sessionId}`);

      if (!sessions.has(input.sessionId)) {
        // Create if not exists
        await api.createSession({
          sessionId: input.sessionId,
          workspacePath: input.workspacePath,
          model: input.model,
        });
      }
    },

    async sendMessage(
      input: SendMessageInput,
      callbacks: {
        onText?: (text: string) => void;
        onToolCall?: (name: string, args: any) => void;
        onToolResult?: (name: string, result: any) => void;
        onComplete?: (usage?: any) => void;
        onError?: (error: string) => void;
      }
    ): Promise<void> {
      const session = getOrThrow(input.sessionId);
      log.info?.(`[hermes-backend] sendMessage to ${input.sessionId}: ${input.content.substring(0, 50)}...`);

      // Abort previous if running
      if (session.process) {
        session.process.kill('SIGINT');
        session.process = null;
      }

      const abortController = new AbortController();
      session.abortController = abortController;

      // Spawn hermes with the message
      session.process = spawnHermes(session, input.content, callbacks);
    },

    abortSession(sessionId: string): void {
      const session = sessions.get(sessionId);
      if (session) {
        log.info?.(`[hermes-backend] abortSession: ${sessionId}`);
        session.abortController?.abort();
        if (session.process) {
          session.process.kill('SIGINT');
          session.process = null;
        }
      }
    },

    cleanupSession(sessionId: string): void {
      const session = sessions.get(sessionId);
      if (session) {
        log.info?.(`[hermes-backend] cleanupSession: ${sessionId}`);
        if (session.process) {
          session.process.kill('SIGTERM');
          session.process = null;
        }
        sessions.delete(sessionId);
      }
    },
  };

  return { methods: api };
}

// ============================================
// Exports
// ============================================

export default { activate };
export { activate };
