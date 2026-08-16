// ============================================
// Tests - HermesProvider
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HermesProvider } from '../HermesProvider';
import { HermesProcessManager } from '../services/HermesProcessManager';
import { HermesToolBridge } from '../services/HermesToolBridge';
import { GatewayBridge } from '../services/GatewayBridge';
import { MemoryBridge } from '../services/MemoryBridge';
import { HermesConfig } from '../types';

// Mock dependencies
vi.mock('../services/HermesProcessManager');
vi.mock('../services/HermesToolBridge');
vi.mock('../services/GatewayBridge');
vi.mock('../services/MemoryBridge');

describe('HermesProvider', () => {
  let provider: HermesProvider;
  let processManager: HermesProcessManager;
  let toolBridge: HermesToolBridge;
  let gatewayBridge: GatewayBridge;
  let memoryBridge: MemoryBridge;
  let config: HermesConfig;

  beforeEach(() => {
    config = {
      path: 'hermes',
      profile: 'default',
      mode: 'cli',
      apiUrl: 'http://localhost:9119',
      gatewayEnabled: false,
      memoryEnabled: true
    };

    processManager = new HermesProcessManager(config);
    toolBridge = new HermesToolBridge(processManager);
    gatewayBridge = new GatewayBridge(config);
    memoryBridge = new MemoryBridge(processManager);

    provider = new HermesProvider({
      processManager,
      toolBridge,
      gatewayBridge,
      memoryBridge,
      config
    });
  });

  describe('createSession', () => {
    it('should create a session', async () => {
      const mockProcess = {
        sessionId: 'test-session-id',
        process: { stdin: { write: vi.fn() }, stdout: { on: vi.fn() } },
        options: config,
        status: 'ready' as const,
        createdAt: new Date()
      };

      vi.mocked(processManager.start).mockResolvedValue(mockProcess);

      const sessionId = await provider.createSession({
        model: 'test-model',
        workspacePath: '/test/workspace'
      });

      expect(sessionId).toBe('test-session-id');
      expect(processManager.start).toHaveBeenCalledWith({
        profile: 'default',
        model: 'test-model',
        workspace: '/test/workspace',
        mode: 'cli',
        apiUrl: 'http://localhost:9119'
      });
    });
  });

  describe('getStatus', () => {
    it('should return status', async () => {
      vi.mocked(processManager.getAllProcesses).mockReturnValue([]);
      vi.mocked(gatewayBridge.getStatus).mockResolvedValue({ connected: false });

      const status = await provider.getStatus();

      expect(status).toHaveProperty('mode', 'cli');
      expect(status).toHaveProperty('profile', 'default');
      expect(status).toHaveProperty('processes', 0);
      expect(status).toHaveProperty('sessions', 0);
    });
  });
});
