var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/agent.ts
var agent_exports = {};
__export(agent_exports, {
  createProtocol: () => createProtocol
});
module.exports = __toCommonJS(agent_exports);
var import_child_process = require("child_process");
var HermesProtocol = class {
  platform = "hermes";
  sessions = /* @__PURE__ */ new Map();
  config;
  constructor(config) {
    this.config = config;
    console.log(`[Hermes Agent] Protocol initialized (mode: ${config.connectionMode})`);
  }
  async createSession(options) {
    const sessionId = `hermes-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[Hermes Agent] Creating session: ${sessionId}`);
    const session = {
      id: sessionId,
      platform: this.platform,
      process: null,
      config: { ...this.config },
      eventBuffer: [],
      resolveNext: null,
      done: false,
      currentMode: "idle"
    };
    this.sessions.set(sessionId, session);
    return session;
  }
  async resumeSession(sessionId, options) {
    const session = this.sessions.get(sessionId);
    if (session) return session;
    return this.createSession(options);
  }
  async forkSession(sessionId, options) {
    return this.createSession(options);
  }
  async *sendMessage(session, message) {
    const hermesSession = session;
    console.log(`[Hermes Agent] Sending message to session ${session.id}`);
    const proc = this.spawnHermes(hermesSession, message.content);
    hermesSession.process = proc;
    hermesSession.done = false;
    hermesSession.eventBuffer = [];
    hermesSession.resolveNext = null;
    this.setupProcessEvents(hermesSession);
    yield* this.consumeEvents(hermesSession);
  }
  abortSession(session) {
    const hermesSession = session;
    if (hermesSession.process) {
      hermesSession.process.kill("SIGINT");
    }
  }
  cleanupSession(session) {
    const hermesSession = session;
    if (hermesSession.process) {
      hermesSession.process.kill("SIGTERM");
      hermesSession.process = null;
    }
    this.sessions.delete(session.id);
  }
  // ============================================
  // Process Spawning
  // ============================================
  spawnHermes(session, message) {
    const { config } = session;
    if (config.connectionMode === "ssh") {
      return this.spawnSSH(config, message);
    } else {
      return this.spawnLocal(config, message);
    }
  }
  spawnLocal(config, message) {
    const args = [
      "chat",
      "-q",
      message,
      "-p",
      config.hermesProfile
    ];
    if (config.workspacePath) {
      args.push("--in", config.workspacePath);
    }
    console.log(`[Hermes Agent] Local: ${config.hermesBinary} ${args.join(" ")}`);
    return (0, import_child_process.spawn)(config.hermesBinary, args, {
      stdio: ["pipe", "pipe", "pipe"]
    });
  }
  spawnSSH(config, message) {
    const escapedMessage = message.replace(/'/g, "'\\''");
    const hermesCmd = `${config.hermesBinary} chat -q '${escapedMessage}' -p ${config.hermesProfile}`;
    const sshArgs = [
      "-o",
      "StrictHostKeyChecking=no",
      "-o",
      "ConnectTimeout=10",
      `${config.sshUser}@${config.sshHost}`,
      hermesCmd
    ];
    if (config.sshKeyPath) {
      sshArgs.splice(0, 0, "-i", config.sshKeyPath);
    }
    console.log(`[Hermes Agent] SSH: ssh ${sshArgs.join(" ")}`);
    return (0, import_child_process.spawn)("ssh", sshArgs, {
      stdio: ["pipe", "pipe", "pipe"]
    });
  }
  // ============================================
  // Event Processing
  // ============================================
  setupProcessEvents(session) {
    const proc = session.process;
    if (!proc) return;
    let stdoutBuffer = "";
    let stderrBuffer = "";
    proc.stdout?.on("data", (data) => {
      stdoutBuffer += data.toString();
    });
    proc.stderr?.on("data", (data) => {
      stderrBuffer += data.toString();
    });
    proc.on("exit", (code) => {
      console.log(`[Hermes Agent] Process exited with code ${code}`);
      if (stdoutBuffer.trim()) {
        session.eventBuffer.push({
          type: "text",
          content: stdoutBuffer
        });
      }
      if (stderrBuffer.trim()) {
        session.eventBuffer.push({
          type: "text",
          content: stderrBuffer
        });
      }
      session.eventBuffer.push({
        type: "complete",
        usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 }
      });
      session.done = true;
      session.resolveNext?.();
    });
    proc.on("error", (error) => {
      console.error(`[Hermes Agent] Process error:`, error);
      session.eventBuffer.push({
        type: "error",
        error: error.message
      });
      session.done = true;
      session.resolveNext?.();
    });
  }
  async *consumeEvents(session) {
    while (!session.done || session.eventBuffer.length > 0) {
      if (session.eventBuffer.length > 0) {
        const event = session.eventBuffer.shift();
        yield event;
        if (event.type === "complete" || event.type === "error") {
          return;
        }
      } else {
        await new Promise((resolve) => {
          session.resolveNext = resolve;
        });
      }
    }
  }
};
function createProtocol(context) {
  const config = {
    connectionMode: context.config.connectionMode || "local",
    sshHost: context.config.sshHost || "",
    sshUser: context.config.sshUser || "root",
    sshKeyPath: context.config.sshKeyPath || "",
    hermesBinary: context.config.hermesBinary || "hermes",
    hermesProfile: context.config.hermesProfile || "coder",
    workspacePath: context.workspacePath || ""
  };
  console.log(`[Hermes Agent] Backend loaded (mode: ${config.connectionMode})`);
  return new HermesProtocol(config);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createProtocol
});
