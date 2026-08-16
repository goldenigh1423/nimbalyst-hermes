/**
 * HermesAgentSettings - Settings panel for the Hermes Agent extension
 *
 * Allows configuring connection mode (local/SSH), SSH credentials,
 * hermes binary path, and profile selection.
 */

import React, { useState } from 'react';

interface SettingsProps {
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
}

export function HermesAgentSettings({ config, onConfigChange }: SettingsProps) {
  const [connectionMode, setConnectionMode] = useState(
    (config.connectionMode as string) || 'local'
  );
  const [sshHost, setSshHost] = useState((config.sshHost as string) || '');
  const [sshUser, setSshUser] = useState((config.sshUser as string) || 'root');
  const [sshKeyPath, setSshKeyPath] = useState(
    (config.sshKeyPath as string) || '~/.ssh/id_rsa'
  );
  const [hermesBinary, setHermesBinary] = useState(
    (config.hermesBinary as string) || 'hermes'
  );
  const [hermesProfile, setHermesProfile] = useState(
    (config.hermesProfile as string) || 'coder'
  );
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // This would call the backend to test the connection
      setTestResult('Configuration saved. Connection will be tested on first use.');
    } catch (err: any) {
      setTestResult(`Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '500px' }}>
      <h3 style={{ marginBottom: '16px' }}>Hermes Agent Configuration</h3>

      {/* Connection Mode */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          Connection Mode
        </label>
        <select
          value={connectionMode}
          onChange={(e) => {
            setConnectionMode(e.target.value);
            onConfigChange('connectionMode', e.target.value);
          }}
          style={{ width: '100%', padding: '6px 8px' }}
        >
          <option value="local">Local (hermes installed locally)</option>
          <option value="ssh">SSH (connect to remote VPS)</option>
        </select>
        <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
          {connectionMode === 'local'
            ? 'Runs hermes binary directly on this machine.'
            : 'Connects to a remote VPS via SSH and runs hermes there.'}
        </p>
      </div>

      {/* SSH Settings (only shown in SSH mode) */}
      {connectionMode === 'ssh' && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              SSH Host
            </label>
            <input
              type="text"
              value={sshHost}
              onChange={(e) => {
                setSshHost(e.target.value);
                onConfigChange('sshHost', e.target.value);
              }}
              placeholder="169.58.56.108"
              style={{ width: '100%', padding: '6px 8px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              SSH User
            </label>
            <input
              type="text"
              value={sshUser}
              onChange={(e) => {
                setSshUser(e.target.value);
                onConfigChange('sshUser', e.target.value);
              }}
              placeholder="root"
              style={{ width: '100%', padding: '6px 8px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              SSH Key Path
            </label>
            <input
              type="text"
              value={sshKeyPath}
              onChange={(e) => {
                setSshKeyPath(e.target.value);
                onConfigChange('sshKeyPath', e.target.value);
              }}
              placeholder="~/.ssh/id_rsa"
              style={{ width: '100%', padding: '6px 8px' }}
            />
          </div>
        </>
      )}

      {/* Hermes Binary */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          Hermes Binary Path
        </label>
        <input
          type="text"
          value={hermesBinary}
          onChange={(e) => {
            setHermesBinary(e.target.value);
            onConfigChange('hermesBinary', e.target.value);
          }}
          placeholder="hermes"
          style={{ width: '100%', padding: '6px 8px' }}
        />
      </div>

      {/* Profile */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          Hermes Profile
        </label>
        <select
          value={hermesProfile}
          onChange={(e) => {
            setHermesProfile(e.target.value);
            onConfigChange('hermesProfile', e.target.value);
          }}
          style={{ width: '100%', padding: '6px 8px' }}
        >
          <option value="default">Default</option>
          <option value="coder">Coder</option>
          <option value="planner">Planner</option>
          <option value="auditor">Auditor</option>
        </select>
      </div>

      {/* Test Button */}
      <div style={{ marginTop: '16px' }}>
        <button
          onClick={handleTest}
          disabled={testing}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: testing ? 'not-allowed' : 'pointer',
          }}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: testResult.startsWith('Error') ? '#fde8e8' : '#e8f5e9',
            borderRadius: '4px',
            fontSize: '13px',
          }}
        >
          {testResult}
        </div>
      )}
    </div>
  );
}
