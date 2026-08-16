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
  // ============================================
  // Session Management
  // ============================================
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
      done: false
    };
    this.sessions.set(sessionId, session);
    return session;
  }
  async resumeSession(sessionId, options) {
    console.log(`[Hermes Agent] Resuming session: ${sessionId}`);
    const session = this.sessions.get(sessionId);
    if (session) {
      return session;
    }
    return this.createSession(options);
  }
  async forkSession(sessionId, options) {
    console.log(`[Hermes Agent] Fork not supported, creating new session`);
    return this.createSession(options);
  }
  // ============================================
  // Message Sending
  // ============================================
  async *sendMessage(session, message) {
    const hermesSession = session;
    console.log(`[Hermes Agent] Sending message to session ${session.id}`);
    if (!hermesSession.process) {
      hermesSession.process = await this.startHermesProcess(hermesSession, message);
      this.setupProcessEvents(hermesSession);
    }
    const msg = message.content.replace(/\n/g, "\\n");
    hermesSession.process.stdin?.write(message.content + "\n");
    hermesSession.done = false;
    hermesSession.eventBuffer = [];
    hermesSession.resolveNext = null;
    yield* this.consumeEvents(hermesSession);
  }
  // ============================================
  // Abort / Cleanup
  // ============================================
  abortSession(session) {
    const hermesSession = session;
    console.log(`[Hermes Agent] Aborting session: ${session.id}`);
    if (hermesSession.process) {
      hermesSession.process.kill("SIGINT");
    }
  }
  cleanupSession(session) {
    const hermesSession = session;
    console.log(`[Hermes Agent] Cleaning up session: ${session.id}`);
    if (hermesSession.process) {
      hermesSession.process.kill("SIGTERM");
      hermesSession.process = null;
    }
    this.sessions.delete(session.id);
  }
  // ============================================
  // Process Management
  // ============================================
  async startHermesProcess(session, message) {
    const { config } = session;
    const workspace = message.sessionId || config.workspacePath || process.cwd();
    if (config.connectionMode === "ssh") {
      return this.startSSHProcess(config, workspace);
    } else {
      return this.startLocalProcess(config, workspace);
    }
  }
  startLocalProcess(config, workspace) {
    const args = [
      "chat",
      "--json",
      "-p",
      config.hermesProfile,
      "--in",
      workspace
    ];
    console.log(`[Hermes Agent] Starting local: ${config.hermesBinary} ${args.join(" ")}`);
    return (0, import_child_process.spawn)(config.hermesBinary, args, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: workspace
    });
  }
  startSSHProcess(config, workspace) {
    const hermesCmd = `${config.hermesBinary} chat --json -p ${config.hermesProfile} --in ${workspace}`;
    const sshArgs = [
      "-o",
      "StrictHostKeyChecking=no",
      "-o",
      "ConnectTimeout=10",
      "-i",
      config.sshKeyPath,
      `${config.sshUser}@${config.sshHost}`,
      hermesCmd
    ];
    console.log(`[Hermes Agent] Starting SSH: ssh ${sshArgs.join(" ")}`);
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
    let buffer = "";
    proc.stdout?.on("data", (data) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const event = this.parseEvent(line);
        if (event) {
          session.eventBuffer.push(event);
          session.resolveNext?.();
        }
      }
    });
    proc.stderr?.on("data", (data) => {
      const text = data.toString().trim();
      if (text) {
        session.eventBuffer.push({
          type: "text",
          content: text + "\n"
        });
        session.resolveNext?.();
      }
    });
    proc.on("exit", (code) => {
      console.log(`[Hermes Agent] Process exited with code ${code}`);
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
  parseEvent(line) {
    try {
      const data = JSON.parse(line);
      switch (data.type) {
        case "text":
        case "content_block_delta":
          return {
            type: "text",
            content: data.text || data.delta?.text || ""
          };
        case "tool_call":
        case "tool_use":
          return {
            type: "tool_call",
            toolCall: {
              id: data.id || `tool-${Date.now()}`,
              name: data.name || data.tool_name || "",
              arguments: data.input || data.arguments || {}
            }
          };
        case "tool_result":
        case "tool_result_content":
          return {
            type: "tool_result",
            toolResult: {
              id: data.id,
              name: data.name || data.tool_name || "",
              result: {
                success: true,
                output: data.content || data.result
              }
            }
          };
        case "error":
          return {
            type: "error",
            error: data.error || data.message || "Unknown error"
          };
        case "complete":
        case "message_stop":
          return {
            type: "complete",
            content: data.content || "",
            usage: data.usage ? {
              input_tokens: data.usage.input_tokens || 0,
              output_tokens: data.usage.output_tokens || 0,
              total_tokens: data.usage.total_tokens || 0
            } : void 0
          };
        case "usage":
          return {
            type: "usage",
            usage: {
              input_tokens: data.input_tokens || 0,
              output_tokens: data.output_tokens || 0,
              total_tokens: (data.input_tokens || 0) + (data.output_tokens || 0)
            }
          };
        default:
          if (data.text || data.content) {
            return {
              type: "text",
              content: data.text || data.content
            };
          }
          return null;
      }
    } catch {
      if (line.trim()) {
        return {
          type: "text",
          content: line + "\n"
        };
      }
      return null;
    }
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
    sshKeyPath: context.config.sshKeyPath || "~/.ssh/id_rsa",
    hermesBinary: context.config.hermesBinary || "hermes",
    hermesProfile: context.config.hermesProfile || "coder",
    workspacePath: context.workspacePath || ""
  };
  console.log(`[Hermes Agent] Backend module loaded (mode: ${config.connectionMode})`);
  if (config.connectionMode === "ssh" && !config.sshHost) {
    console.warn("[Hermes Agent] SSH mode selected but no sshHost configured!");
  }
  return new HermesProtocol(config);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createProtocol
});
