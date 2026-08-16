// src/components/HermesAgentSettings.tsx
import React, { useState } from "react";
function HermesAgentSettings({ config, onConfigChange }) {
  const [connectionMode, setConnectionMode] = useState(
    config.connectionMode || "local"
  );
  const [sshHost, setSshHost] = useState(config.sshHost || "");
  const [sshUser, setSshUser] = useState(config.sshUser || "root");
  const [sshKeyPath, setSshKeyPath] = useState(
    config.sshKeyPath || "~/.ssh/id_rsa"
  );
  const [hermesBinary, setHermesBinary] = useState(
    config.hermesBinary || "hermes"
  );
  const [hermesProfile, setHermesProfile] = useState(
    config.hermesProfile || "coder"
  );
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
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
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "16px", maxWidth: "500px" } }, /* @__PURE__ */ React.createElement("h3", { style: { marginBottom: "16px" } }, "Hermes Agent Configuration"), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", marginBottom: "4px", fontWeight: 600 } }, "Connection Mode"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: connectionMode,
      onChange: (e) => {
        setConnectionMode(e.target.value);
        onConfigChange("connectionMode", e.target.value);
      },
      style: { width: "100%", padding: "6px 8px" }
    },
    /* @__PURE__ */ React.createElement("option", { value: "local" }, "Local (hermes installed locally)"),
    /* @__PURE__ */ React.createElement("option", { value: "ssh" }, "SSH (connect to remote VPS)")
  ), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12px", color: "#888", marginTop: "4px" } }, connectionMode === "local" ? "Runs hermes binary directly on this machine." : "Connects to a remote VPS via SSH and runs hermes there.")), connectionMode === "ssh" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", marginBottom: "4px", fontWeight: 600 } }, "SSH Host"), /* @__PURE__ */ React.createElement(
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
  )), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", marginBottom: "4px", fontWeight: 600 } }, "SSH User"), /* @__PURE__ */ React.createElement(
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
  )), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", marginBottom: "4px", fontWeight: 600 } }, "SSH Key Path"), /* @__PURE__ */ React.createElement(
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
  ))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", marginBottom: "4px", fontWeight: 600 } }, "Hermes Binary Path"), /* @__PURE__ */ React.createElement(
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
  )), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", marginBottom: "4px", fontWeight: 600 } }, "Hermes Profile"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: hermesProfile,
      onChange: (e) => {
        setHermesProfile(e.target.value);
        onConfigChange("hermesProfile", e.target.value);
      },
      style: { width: "100%", padding: "6px 8px" }
    },
    /* @__PURE__ */ React.createElement("option", { value: "default" }, "Default"),
    /* @__PURE__ */ React.createElement("option", { value: "coder" }, "Coder"),
    /* @__PURE__ */ React.createElement("option", { value: "planner" }, "Planner"),
    /* @__PURE__ */ React.createElement("option", { value: "auditor" }, "Auditor")
  )), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "16px" } }, /* @__PURE__ */ React.createElement(
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
  )), testResult && /* @__PURE__ */ React.createElement(
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
export {
  HermesAgentSettings,
  activate,
  components,
  deactivate
};
