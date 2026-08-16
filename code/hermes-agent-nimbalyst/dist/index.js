var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.tsx
var index_exports = {};
__export(index_exports, {
  HermesAgentSettings: () => HermesAgentSettings,
  activate: () => activate,
  components: () => components,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(index_exports);

// src/components/HermesAgentSettings.tsx
var import_react = __toESM(require("react"));
function HermesAgentSettings({ config, onConfigChange }) {
  const [connectionMode, setConnectionMode] = (0, import_react.useState)(
    config.connectionMode || "local"
  );
  const [sshHost, setSshHost] = (0, import_react.useState)(config.sshHost || "");
  const [sshUser, setSshUser] = (0, import_react.useState)(config.sshUser || "root");
  const [sshKeyPath, setSshKeyPath] = (0, import_react.useState)(
    config.sshKeyPath || "~/.ssh/id_rsa"
  );
  const [hermesBinary, setHermesBinary] = (0, import_react.useState)(
    config.hermesBinary || "hermes"
  );
  const [hermesProfile, setHermesProfile] = (0, import_react.useState)(
    config.hermesProfile || "coder"
  );
  const [testResult, setTestResult] = (0, import_react.useState)(null);
  const [testing, setTesting] = (0, import_react.useState)(false);
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult("Configuration saved. Connection will be tested on first use.");
    } catch (err) {
      setTestResult(`Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };
  return /* @__PURE__ */ import_react.default.createElement("div", { style: { padding: "16px", maxWidth: "500px" } }, /* @__PURE__ */ import_react.default.createElement("h3", { style: { marginBottom: "16px" } }, "Hermes Agent Configuration"), /* @__PURE__ */ import_react.default.createElement("div", { style: { marginBottom: "12px" } }, /* @__PURE__ */ import_react.default.createElement("label", { style: { display: "block", marginBottom: "4px", fontWeight: 600 } }, "Connection Mode"), /* @__PURE__ */ import_react.default.createElement(
    "select",
    {
      value: connectionMode,
      onChange: (e) => {
        setConnectionMode(e.target.value);
        onConfigChange("connectionMode", e.target.value);
      },
      style: { width: "100%", padding: "6px 8px" }
    },
    /* @__PURE__ */ import_react.default.createElement("option", { value: "local" }, "Local (hermes installed locally)"),
    /* @__PURE__ */ import_react.default.createElement("option", { value: "ssh" }, "SSH (connect to remote VPS)")
  ), /* @__PURE__ */ import_react.default.createElement("p", { style: { fontSize: "12px", color: "#888", marginTop: "4px" } }, connectionMode === "local" ? "Runs hermes binary directly on this machine." : "Connects to a remote VPS via SSH and runs hermes there.")), connectionMode === "ssh" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { style: { marginBottom: "12px" } }, /* @__PURE__ */ import_react.default.createElement("label", { style: { display: "block", marginBottom: "4px", fontWeight: 600 } }, "SSH Host"), /* @__PURE__ */ import_react.default.createElement(
    "input",
    {
      type: "text",
      value: sshHost,
      onChange: (e) => {
        setSshHost(e.target.value);
        onConfigChange("sshHost", e.target.value);
      },
      placeholder: "169.58.56.108",
      style: { width: "100%", padding: "6px 8px" }
    }
  )), /* @__PURE__ */ import_react.default.createElement("div", { style: { marginBottom: "12px" } }, /* @__PURE__ */ import_react.default.createElement("label", { style: { display: "block", marginBottom: "4px", fontWeight: 600 } }, "SSH User"), /* @__PURE__ */ import_react.default.createElement(
    "input",
    {
      type: "text",
      value: sshUser,
      onChange: (e) => {
        setSshUser(e.target.value);
        onConfigChange("sshUser", e.target.value);
      },
      placeholder: "root",
      style: { width: "100%", padding: "6px 8px" }
    }
  )), /* @__PURE__ */ import_react.default.createElement("div", { style: { marginBottom: "12px" } }, /* @__PURE__ */ import_react.default.createElement("label", { style: { display: "block", marginBottom: "4px", fontWeight: 600 } }, "SSH Key Path"), /* @__PURE__ */ import_react.default.createElement(
    "input",
    {
      type: "text",
      value: sshKeyPath,
      onChange: (e) => {
        setSshKeyPath(e.target.value);
        onConfigChange("sshKeyPath", e.target.value);
      },
      placeholder: "~/.ssh/id_rsa",
      style: { width: "100%", padding: "6px 8px" }
    }
  ))), /* @__PURE__ */ import_react.default.createElement("div", { style: { marginBottom: "12px" } }, /* @__PURE__ */ import_react.default.createElement("label", { style: { display: "block", marginBottom: "4px", fontWeight: 600 } }, "Hermes Binary Path"), /* @__PURE__ */ import_react.default.createElement(
    "input",
    {
      type: "text",
      value: hermesBinary,
      onChange: (e) => {
        setHermesBinary(e.target.value);
        onConfigChange("hermesBinary", e.target.value);
      },
      placeholder: "hermes",
      style: { width: "100%", padding: "6px 8px" }
    }
  )), /* @__PURE__ */ import_react.default.createElement("div", { style: { marginBottom: "12px" } }, /* @__PURE__ */ import_react.default.createElement("label", { style: { display: "block", marginBottom: "4px", fontWeight: 600 } }, "Hermes Profile"), /* @__PURE__ */ import_react.default.createElement(
    "select",
    {
      value: hermesProfile,
      onChange: (e) => {
        setHermesProfile(e.target.value);
        onConfigChange("hermesProfile", e.target.value);
      },
      style: { width: "100%", padding: "6px 8px" }
    },
    /* @__PURE__ */ import_react.default.createElement("option", { value: "default" }, "Default"),
    /* @__PURE__ */ import_react.default.createElement("option", { value: "coder" }, "Coder"),
    /* @__PURE__ */ import_react.default.createElement("option", { value: "planner" }, "Planner"),
    /* @__PURE__ */ import_react.default.createElement("option", { value: "auditor" }, "Auditor")
  )), /* @__PURE__ */ import_react.default.createElement("div", { style: { marginTop: "16px" } }, /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      onClick: handleTest,
      disabled: testing,
      style: {
        padding: "8px 16px",
        backgroundColor: "#0078d4",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: testing ? "not-allowed" : "pointer"
      }
    },
    testing ? "Testing..." : "Test Connection"
  )), testResult && /* @__PURE__ */ import_react.default.createElement(
    "div",
    {
      style: {
        marginTop: "12px",
        padding: "8px 12px",
        backgroundColor: testResult.startsWith("Error") ? "#fde8e8" : "#e8f5e9",
        borderRadius: "4px",
        fontSize: "13px"
      }
    },
    testResult
  ));
}

// src/index.tsx
async function activate(context) {
  console.log("[Hermes Agent] Extension activated");
}
async function deactivate() {
  console.log("[Hermes Agent] Extension deactivated");
}
var components = {
  HermesAgentSettings
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HermesAgentSettings,
  activate,
  components,
  deactivate
});
