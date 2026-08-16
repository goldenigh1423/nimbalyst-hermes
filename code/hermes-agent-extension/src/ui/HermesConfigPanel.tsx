// ============================================
// HermesConfigPanel - Configuration UI
// ============================================

import React, { useState, useEffect } from 'react';
import { HermesConfig } from '../types';

interface HermesConfigPanelProps {
  config: HermesConfig;
  onConfigChange: (config: Partial<HermesConfig>) => void;
  onTestConnection: () => Promise<boolean>;
}

export const HermesConfigPanel: React.FC<HermesConfigPanelProps> = ({
  config,
  onConfigChange,
  onTestConnection
}) => {
  const [localConfig, setLocalConfig] = useState<HermesConfig>(config);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    onConfigChange(localConfig);
  };

  const handleTest = async () => {
    setConnectionStatus('testing');
    setErrorMessage('');
    try {
      const success = await onTestConnection();
      setConnectionStatus(success ? 'success' : 'error');
      if (!success) {
        setErrorMessage('Connection failed');
      }
    } catch (error: any) {
      setConnectionStatus('error');
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="hermes-config-panel">
      <h3>Hermes Agent Configuration</h3>

      {/* Binary Path */}
      <div className="config-field">
        <label>Hermes Binary Path</label>
        <input
          type="text"
          value={localConfig.path}
          onChange={(e) => setLocalConfig({ ...localConfig, path: e.target.value })}
          placeholder="hermes"
        />
        <span className="hint">Path to hermes binary or command name</span>
      </div>

      {/* Profile */}
      <div className="config-field">
        <label>Profile</label>
        <select
          value={localConfig.profile}
          onChange={(e) => setLocalConfig({ ...localConfig, profile: e.target.value })}
        >
          <option value="default">Default</option>
          <option value="planner">Planner</option>
          <option value="coder">Coder</option>
          <option value="auditor">Auditor</option>
        </select>
        <span className="hint">Hermes profile to use</span>
      </div>

      {/* Mode */}
      <div className="config-field">
        <label>Communication Mode</label>
        <select
          value={localConfig.mode}
          onChange={(e) => setLocalConfig({ ...localConfig, mode: e.target.value as any })}
        >
          <option value="cli">CLI (Recommended)</option>
          <option value="api">API (Proxy)</option>
          <option value="mcp">MCP Server</option>
        </select>
        <span className="hint">How to communicate with Hermes</span>
      </div>

      {/* API URL (only for API mode) */}
      {localConfig.mode === 'api' && (
        <div className="config-field">
          <label>API URL</label>
          <input
            type="text"
            value={localConfig.apiUrl}
            onChange={(e) => setLocalConfig({ ...localConfig, apiUrl: e.target.value })}
            placeholder="http://localhost:9119"
          />
          <span className="hint">Hermes API endpoint</span>
        </div>
      )}

      {/* Toggles */}
      <div className="config-field">
        <label>
          <input
            type="checkbox"
            checked={localConfig.gatewayEnabled}
            onChange={(e) => setLocalConfig({ ...localConfig, gatewayEnabled: e.target.checked })}
          />
          Enable Gateway Bridge
        </label>
        <span className="hint">Connect to Hermes gateway for multi-platform messaging</span>
      </div>

      <div className="config-field">
        <label>
          <input
            type="checkbox"
            checked={localConfig.memoryEnabled}
            onChange={(e) => setLocalConfig({ ...localConfig, memoryEnabled: e.target.checked })}
          />
          Enable Memory Bridge
        </label>
        <span className="hint">Access Hermes memory system (MEMORY.md, Graphify, etc.)</span>
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        <button onClick={handleTest} disabled={connectionStatus === 'testing'}>
          {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
        </button>

        {connectionStatus === 'success' && (
          <span className="status success">✓ Connected</span>
        )}
        {connectionStatus === 'error' && (
          <span className="status error">✗ {errorMessage}</span>
        )}
      </div>

      {/* Actions */}
      <div className="actions">
        <button className="primary" onClick={handleSave}>
          Save Configuration
        </button>
      </div>
    </div>
  );
};
