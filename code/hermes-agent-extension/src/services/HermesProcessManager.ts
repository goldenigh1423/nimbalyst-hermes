// ============================================
// HermesProcessManager - Process Management
// ============================================

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  HermesProcessOptions,
  ManagedProcess,
  HermesConfig
} from '../types';

export class HermesProcessManager extends EventEmitter {
  private processes: Map<string, ManagedProcess> = new Map();
  private config: HermesConfig;

  constructor(config: HermesConfig) {
    super();
    this.config = config;
  }

  // ============================================
  // Process Lifecycle
  // ============================================

  async start(options: HermesProcessOptions): Promise<ManagedProcess> {
    const sessionId = uuidv4();

    console.log(`[Hermes Process] Starting session ${sessionId} (mode: ${options.mode})`);

    let process: ChildProcess;

    switch (options.mode) {
      case 'cli':
        process = await this.startCLI(sessionId, options);
        break;
      case 'api':
        process = await this.startAPI(sessionId, options);
        break;
      case 'mcp':
        process = await this.startMCP(sessionId, options);
        break;
      default:
        throw new Error(`Unknown mode: ${options.mode}`);
    }

    const managed: ManagedProcess = {
      sessionId,
      process,
      options,
      status: 'starting',
      createdAt: new Date()
    };

    this.processes.set(sessionId, managed);

    // Setup event handlers
    this.setupProcessEvents(managed);

    // Wait for process to be ready
    await this.waitForReady(managed);

    console.log(`[Hermes Process] Session ${sessionId} ready`);
    return managed;
  }

  async stop(sessionId: string): Promise<void> {
    const managed = this.processes.get(sessionId);
    if (!managed) {
      console.warn(`[Hermes Process] Session ${sessionId} not found`);
      return;
    }

    console.log(`[Hermes Process] Stopping session ${sessionId}`);

    managed.status = 'stopped';
    managed.process.kill('SIGTERM');

    // Wait for process to exit
    await new Promise<void>((resolve) => {
      managed.process.on('exit', () => resolve());
      setTimeout(() => {
        managed.process.kill('SIGKILL');
        resolve();
      }, 5000);
    });

    this.processes.delete(sessionId);
    console.log(`[Hermes Process] Session ${sessionId} stopped`);
  }

  async stopAll(): Promise<void> {
    console.log(`[Hermes Process] Stopping all processes (${this.processes.size})`);

    const promises = Array.from(this.processes.keys()).map(id => this.stop(id));
    await Promise.all(promises);
  }

  async abort(sessionId: string): Promise<void> {
    const managed = this.processes.get(sessionId);
    if (!managed) return;

    console.log(`[Hermes Process] Aborting session ${sessionId}`);

    // Send SIGINT to interrupt current operation
    managed.process.kill('SIGINT');
  }

  async resume(sessionId: string): Promise<void> {
    const managed = this.processes.get(sessionId);
    if (!managed) return;

    console.log(`[Hermes Process] Resuming session ${sessionId}`);

    // Send resume command
    managed.process.stdin?.write('/resume\n');
  }

  // ============================================
  // Process Access
  // ============================================

  getProcess(sessionId: string): ManagedProcess | undefined {
    return this.processes.get(sessionId);
  }

  getAllProcesses(): ManagedProcess[] {
    return Array.from(this.processes.values());
  }

  getActiveProcesses(): ManagedProcess[] {
    return Array.from(this.processes.values())
      .filter(p => p.status === 'ready' || p.status === 'busy');
  }

  // ============================================
  // CLI Mode
  // ============================================

  private async startCLI(
    sessionId: string,
    options: HermesProcessOptions
  ): Promise<ChildProcess> {
    const args = [
      'chat',
      '--json',
      '-p', options.profile
    ];

    if (options.model) {
      args.push('-m', options.model);
    }

    if (options.workspace) {
      args.push('--in', options.workspace);
    }

    const env = {
      ...process.env,
      HERMES_HOME: options.hermesHome || this.getHermesHome(options.profile)
    };

    const proc = spawn(this.config.path, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
      cwd: options.workspace || process.cwd()
    });

    return proc;
  }

  // ============================================
  // API Mode
  // ============================================

  private async startAPI(
    sessionId: string,
    options: HermesProcessOptions
  ): Promise<ChildProcess> {
    // API mode uses hermes proxy
    const args = [
      'proxy',
      '--port', '0'  // Random port
    ];

    const env = {
      ...process.env,
      HERMES_HOME: options.hermesHome || this.getHermesHome(options.profile)
    };

    const proc = spawn(this.config.path, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env
    });

    return proc;
  }

  // ============================================
  // MCP Mode
  // ============================================

  private async startMCP(
    sessionId: string,
    options: HermesProcessOptions
  ): Promise<ChildProcess> {
    // MCP mode uses hermes mcp serve
    const args = [
      'mcp',
      'serve'
    ];

    const env = {
      ...process.env,
      HERMES_HOME: options.hermesHome || this.getHermesHome(options.profile)
    };

    const proc = spawn(this.config.path, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env
    });

    return proc;
  }

  // ============================================
  // Process Events
  // ============================================

  private setupProcessEvents(managed: ManagedProcess): void {
    const { process, sessionId } = managed;

    // stdout
    process.stdout?.on('data', (data: Buffer) => {
      this.emit('stdout', { sessionId, data: data.toString() });
    });

    // stderr
    process.stderr?.on('data', (data: Buffer) => {
      this.emit('stderr', { sessionId, data: data.toString() });
    });

    // exit
    process.on('exit', (code: number | null) => {
      console.log(`[Hermes Process] Session ${sessionId} exited with code ${code}`);

      managed.status = 'stopped';
      this.emit('exit', { sessionId, code });
    });

    // error
    process.on('error', (error: Error) => {
      console.error(`[Hermes Process] Session ${sessionId} error:`, error);

      managed.status = 'error';
      this.emit('error', { sessionId, error });
    });
  }

  // ============================================
  // Ready Detection
  // ============================================

  private async waitForReady(managed: ManagedProcess): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Hermes process startup timeout'));
      }, 30000);

      const onData = (data: Buffer) => {
        const text = data.toString();

        // Look for ready indicators
        if (
          text.includes('hermes>') ||
          text.includes('Ready') ||
          text.includes('Session started') ||
          text.includes('"type":"ready"')
        ) {
          clearTimeout(timeout);
          managed.status = 'ready';
          managed.process.stdout?.off('data', onData);
          resolve();
        }
      };

      managed.process.stdout?.on('data', onData);

      // Also check if process exits during startup
      managed.process.on('exit', (code) => {
        clearTimeout(timeout);
        reject(new Error(`Hermes process exited during startup with code ${code}`));
      });
    });
  }

  // ============================================
  // Helpers
  // ============================================

  private getHermesHome(profile: string): string {
    if (profile === 'default') {
      return `${process.env.HOME}/.hermes`;
    }
    return `${process.env.HOME}/.hermes/profiles/${profile}`;
  }
}
