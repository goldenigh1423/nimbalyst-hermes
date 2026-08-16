// src/agent.ts
import { spawn } from "child_process";
function resolveConfig(ctx) {
  const cfg = ctx.config || {};
  return {
    connectionMode: cfg.connectionMode || "local",
    sshHost: cfg.sshHost || "",
    sshUser: cfg.sshUser || "root",
    sshKeyPath: cfg.sshKeyPath || "",
    hermesBinary: cfg.hermesBinary || "hermes",
    hermesProfile: cfg.hermesProfile || "coder"
  };
}
async function activate(ctx) {
  const log = ctx.runtimeContext?.logger ?? ctx.logger ?? console;
  const extensionId = ctx.runtimeContext?.extensionId ?? ctx.extensionId;
  const config = resolveConfig(ctx);
  log.info?.(
    `[hermes-backend] activated extensionId=${extensionId} mode=${config.connectionMode} host=${config.sshHost}`
  );
  const sessions = /* @__PURE__ */ new Map();
  function getOrThrow(sessionId) {
    const s = sessions.get(sessionId);
    if (!s) throw new Error(`[hermes-backend] session ${sessionId} not found`);
    return s;
  }
  function spawnHermes(session, message, callbacks) {
    let proc;
    if (config.connectionMode === "ssh") {
      const escapedMessage = message.replace(/'/g, "'\\''");
      const hermesCmd = `${config.hermesBinary} chat -q '${escapedMessage}' -p ${config.hermesProfile}`;
      const sshArgs = [
        "-o",
        "StrictHostKeyChecking=no",
        "-o",
        "ConnectTimeout=10"
      ];
      if (config.sshKeyPath) {
        sshArgs.push("-i", config.sshKeyPath);
      }
      sshArgs.push(`${config.sshUser}@${config.sshHost}`, hermesCmd);
      log.info?.(`[hermes-backend] SSH: ssh ${sshArgs.join(" ")}`);
      proc = spawn("ssh", sshArgs, { stdio: ["pipe", "pipe", "pipe"] });
    } else {
      const args = ["chat", "-q", message, "-p", config.hermesProfile];
      if (session.workspacePath) {
        args.push("--in", session.workspacePath);
      }
      log.info?.(`[hermes-backend] Local: ${config.hermesBinary} ${args.join(" ")}`);
      proc = spawn(config.hermesBinary, args, { stdio: ["pipe", "pipe", "pipe"] });
    }
    let stdoutBuffer = "";
    let stderrBuffer = "";
    proc.stdout?.on("data", (data) => {
      stdoutBuffer += data.toString();
    });
    proc.stderr?.on("data", (data) => {
      stderrBuffer += data.toString();
    });
    proc.on("exit", (code) => {
      log.info?.(`[hermes-backend] Process exited with code ${code}`);
      if (stdoutBuffer.trim()) {
        callbacks.onText?.(stdoutBuffer);
      }
      if (stderrBuffer.trim()) {
        if (code !== 0 || stderrBuffer.includes("Error") || stderrBuffer.includes("error")) {
          callbacks.onError?.(stderrBuffer);
        } else {
          callbacks.onText?.(stderrBuffer);
        }
      }
      callbacks.onComplete?.({
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0
      });
    });
    proc.on("error", (error) => {
      log.error?.(`[hermes-backend] Process error:`, error);
      callbacks.onError?.(error.message);
    });
    return proc;
  }
  const api = {
    async createSession(input) {
      log.info?.(`[hermes-backend] createSession: ${input.sessionId}`);
      const existing = sessions.get(input.sessionId);
      if (existing?.process) {
        existing.process.kill("SIGTERM");
      }
      sessions.set(input.sessionId, {
        sessionId: input.sessionId,
        workspacePath: input.workspacePath,
        modelKey: input.model || "default",
        process: null,
        abortController: null
      });
    },
    async resumeSession(input) {
      log.info?.(`[hermes-backend] resumeSession: ${input.sessionId}`);
      if (!sessions.has(input.sessionId)) {
        await api.createSession({
          sessionId: input.sessionId,
          workspacePath: input.workspacePath,
          model: input.model
        });
      }
    },
    async sendMessage(input, callbacks) {
      const session = getOrThrow(input.sessionId);
      log.info?.(`[hermes-backend] sendMessage to ${input.sessionId}: ${input.content.substring(0, 50)}...`);
      if (session.process) {
        session.process.kill("SIGINT");
        session.process = null;
      }
      const abortController = new AbortController();
      session.abortController = abortController;
      session.process = spawnHermes(session, input.content, callbacks);
    },
    abortSession(sessionId) {
      const session = sessions.get(sessionId);
      if (session) {
        log.info?.(`[hermes-backend] abortSession: ${sessionId}`);
        session.abortController?.abort();
        if (session.process) {
          session.process.kill("SIGINT");
          session.process = null;
        }
      }
    },
    cleanupSession(sessionId) {
      const session = sessions.get(sessionId);
      if (session) {
        log.info?.(`[hermes-backend] cleanupSession: ${sessionId}`);
        if (session.process) {
          session.process.kill("SIGTERM");
          session.process = null;
        }
        sessions.delete(sessionId);
      }
    }
  };
  return { methods: api };
}
var agent_default = { activate };
export {
  activate,
  agent_default as default
};
