// ============================================
// Hermes Agent Extension - Entry Point
// ============================================

import { HermesProvider } from './HermesProvider';
import { HermesProcessManager } from './services/HermesProcessManager';
import { HermesToolBridge } from './services/HermesToolBridge';
import { GatewayBridge } from './services/GatewayBridge';
import { MemoryBridge } from './services/MemoryBridge';
import { HermesConfig } from './types';

// Extension lifecycle
export function activate(ctx: ExtensionContext) {
  console.log('[Hermes Agent] Activating extension...');

  // Load configuration
  const config: HermesConfig = {
    path: ctx.getConfig('hermes.path') || 'hermes',
    profile: ctx.getConfig('hermes.profile') || 'default',
    mode: ctx.getConfig('hermes.mode') || 'cli',
    apiUrl: ctx.getConfig('hermes.api.url') || 'http://localhost:9119',
    gatewayEnabled: ctx.getConfig('hermes.gateway.enabled') || false,
    memoryEnabled: ctx.getConfig('hermes.memory.enabled') || true
  };

  // Initialize services
  const processManager = new HermesProcessManager(config);
  const toolBridge = new HermesToolBridge(processManager);
  const gatewayBridge = new GatewayBridge(config);
  const memoryBridge = new MemoryBridge(processManager);

  // Register AI provider
  const provider = new HermesProvider({
    processManager,
    toolBridge,
    gatewayBridge,
    memoryBridge,
    config
  });

  ctx.registerAgentProvider({
    id: 'hermes',
    provider: provider,
    displayName: 'Hermes Agent',
    icon: 'smart_toy',
    description: 'AI agent with 70+ tools and 42 gateway platforms'
  });

  // Register slash commands
  ctx.registerSlashCommand({
    id: 'hermes.status',
    title: 'Hermes Status',
    handler: async () => {
      const status = await provider.getStatus();
      return JSON.stringify(status, null, 2);
    }
  });

  ctx.registerSlashCommand({
    id: 'hermes.skills',
    title: 'Hermes Skills',
    handler: async () => {
      const skills = await toolBridge.executeTool('skills_list', {});
      return JSON.stringify(skills, null, 2);
    }
  });

  ctx.registerSlashCommand({
    id: 'hermes.memory',
    title: 'Hermes Memory',
    handler: async () => {
      const memory = await memoryBridge.getMemory();
      return JSON.stringify(memory, null, 2);
    }
  });

  ctx.registerSlashCommand({
    id: 'hermes.gateway',
    title: 'Hermes Gateway',
    handler: async () => {
      const status = await gatewayBridge.getStatus();
      return JSON.stringify(status, null, 2);
    }
  });

  ctx.registerSlashCommand({
    id: 'hermes.cron',
    title: 'Hermes Cron',
    handler: async () => {
      const jobs = await toolBridge.executeTool('cronjob', { action: 'list' });
      return JSON.stringify(jobs, null, 2);
    }
  });

  // Register panels
  ctx.registerPanel({
    id: 'hermes-config',
    title: 'Hermes Config',
    icon: 'settings',
    placement: 'sidebar',
    component: 'HermesConfigPanel'
  });

  ctx.registerPanel({
    id: 'hermes-gateway',
    title: 'Hermes Gateway',
    icon: 'lan',
    placement: 'sidebar',
    component: 'HermesGatewayPanel'
  });

  ctx.registerPanel({
    id: 'hermes-memory',
    title: 'Hermes Memory',
    icon: 'memory',
    placement: 'sidebar',
    component: 'HermesMemoryPanel'
  });

  // Register AI tools
  const tools = toolBridge.getToolDefinitions();
  for (const tool of tools) {
    ctx.registerAITool({
      name: `hermes.${tool.name}`,
      description: tool.description,
      parameters: tool.parameters,
      handler: async (args: Record<string, any>) => {
        return await toolBridge.executeTool(tool.name, args);
      }
    });
  }

  console.log(`[Hermes Agent] Extension activated (mode: ${config.mode}, profile: ${config.profile})`);

  // Store references for deactivation
  ctx.store('provider', provider);
  ctx.store('processManager', processManager);
  ctx.store('gatewayBridge', gatewayBridge);
}

export function deactivate(ctx: ExtensionContext) {
  console.log('[Hermes Agent] Deactivating extension...');

  const processManager = ctx.getStore('processManager') as HermesProcessManager;
  const gatewayBridge = ctx.getStore('gatewayBridge') as GatewayBridge;

  // Cleanup
  processManager?.stopAll();
  gatewayBridge?.disconnect();

  console.log('[Hermes Agent] Extension deactivated');
}
