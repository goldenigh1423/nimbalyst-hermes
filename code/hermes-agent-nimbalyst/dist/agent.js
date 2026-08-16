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
  log.info?.(`[hermes-backend] activated mode=${config.connectionMode} host=${config.sshHost}`);
  const sessions = /* @__PURE__ */ new Map();
  function getOrThrow(sessionId) {
    const s = sessions.get(sessionId);
    if (!s) throw new Error(`[hermes-backend] session ${sessionId} not found`);
    return s;
  }
  const api = {
    async createSession(input) {
      log.info?.(`[hermes-backend] createSession: ${input.sessionId}`);
      const existing = sessions.get(input.sessionId);
      if (existing?.process) existing.process.kill("SIGTERM");
      sessions.set(input.sessionId, {
        sessionId: input.sessionId,
        workspacePath: input.workspacePath,
        process: null
      });
    },
    async resumeSession(input) {
      if (!sessions.has(input.sessionId)) {
        await api.createSession({ sessionId: input.sessionId, workspacePath: input.workspacePath, model: input.model });
      }
    },
    sendMessage(input) {
      const session = getOrThrow(input.sessionId);
      log.info?.(`[hermes-backend] sendMessage: ${input.content.substring(0, 80)}`);
      if (session.process) {
        session.process.kill("SIGINT");
        session.process = null;
      }
      let proc;
      if (config.connectionMode === "ssh") {
        const escaped = input.content.replace(/'/g, "'\\''");
        const cmd = `${config.hermesBinary} chat -q '${escaped}' -p ${config.hermesProfile}`;
        const args = ["-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=10"];
        if (config.sshKeyPath) args.push("-i", config.sshKeyPath);
        args.push(`${config.sshUser}@${config.sshHost}`, cmd);
        proc = spawn("ssh", args, { stdio: ["pipe", "pipe", "pipe"] });
      } else {
        const args = ["chat", "-q", input.content, "-p", config.hermesProfile];
        if (session.workspacePath) args.push("--in", session.workspacePath);
        proc = spawn(config.hermesBinary, args, { stdio: ["pipe", "pipe", "pipe"] });
      }
      session.process = proc;
      return createEventStream(proc, input.abortSignal);
    },
    abortSession(sessionId) {
      const session = sessions.get(sessionId);
      if (session?.process) {
        session.process.kill("SIGINT");
        session.process = null;
      }
    },
    cleanupSession(sessionId) {
      const session = sessions.get(sessionId);
      if (session?.process) {
        session.process.kill("SIGTERM");
        session.process = null;
      }
      sessions.delete(sessionId);
    }
  };
  return { methods: api };
}
function createEventStream(proc, abortSignal) {
  const buffer = [];
  let resolve = null;
  let done = false;
  let stdout = "";
  let stderr = "";
  proc.stdout?.on("data", (data) => {
    stdout += data.toString();
  });
  proc.stderr?.on("data", (data) => {
    stderr += data.toString();
  });
  proc.on("exit", (code) => {
    if (stdout.trim()) {
      buffer.push({ type: "text", content: stdout });
    }
    if (stderr.trim() && code !== 0) {
      buffer.push({ type: "error", error: stderr });
    }
    buffer.push({
      type: "complete",
      usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 }
    });
    done = true;
    resolve?.();
  });
  proc.on("error", (error) => {
    buffer.push({ type: "error", error: error.message });
    done = true;
    resolve?.();
  });
  abortSignal?.addEventListener("abort", () => {
    proc.kill("SIGINT");
  });
  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          while (!done || buffer.length > 0) {
            if (buffer.length > 0) {
              return { value: buffer.shift(), done: false };
            }
            await new Promise((r) => {
              resolve = r;
            });
          }
          return { value: void 0, done: true };
        }
      };
    }
  };
}
var agent_default = { activate };
export {
  activate,
  agent_default as default
};
