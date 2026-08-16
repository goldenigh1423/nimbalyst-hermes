// ============================================
// Hermes Agent Extension - Type Definitions
// ============================================

// Hermes Process Types
export interface HermesProcessOptions {
  profile: string;
  model?: string;
  workspace?: string;
  hermesHome?: string;
  mode: 'cli' | 'api' | 'mcp';
  apiUrl?: string;
}

export interface ManagedProcess {
  sessionId: string;
  process: ChildProcess;
  options: HermesProcessOptions;
  status: 'starting' | 'ready' | 'busy' | 'error' | 'stopped';
  createdAt: Date;
}

// Protocol Event Types
export type ProtocolEventType =
  | 'text'
  | 'tool_call'
  | 'tool_result'
  | 'error'
  | 'complete'
  | 'usage'
  | 'planning_mode_entered'
  | 'planning_mode_exited';

export interface ProtocolEvent {
  type: ProtocolEventType;
  content?: string;
  toolName?: string;
  toolArgs?: Record<string, any>;
  toolResult?: any;
  error?: string;
  usage?: UsageInfo;
  timestamp: Date;
}

export interface UsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

// Session Types
export interface HermesSession {
  id: string;
  profile: string;
  model?: string;
  workspace?: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  messages: ProtocolEvent[];
  createdAt: Date;
  updatedAt: Date;
}

// Tool Types
export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  parameters: Record<string, any>;
  handler: (args: Record<string, any>) => Promise<any>;
}

export type ToolCategory =
  | 'web'
  | 'terminal'
  | 'files'
  | 'code'
  | 'memory'
  | 'browser'
  | 'skills'
  | 'vision'
  | 'diagrams'
  | 'cron'
  | 'smart_home'
  | 'desktop';

export interface ToolResult {
  type: 'text' | 'file' | 'image' | 'error' | 'diff';
  content: string;
  metadata?: Record<string, any>;
}

// Gateway Types
export interface GatewayPlatform {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
}

export interface GatewayMessage {
  id: string;
  platform: string;
  sessionId: string;
  content: string;
  sender: string;
  timestamp: Date;
  direction: 'incoming' | 'outgoing';
}

// Memory Types
export interface MemoryData {
  memory: string;
  user: string;
  entries: MemoryEntry[];
}

export interface MemoryEntry {
  content: string;
  target: 'memory' | 'user';
  timestamp: Date;
}

export interface GraphNode {
  id: string;
  label: string;
  group?: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphStats {
  nodes: number;
  edges: number;
  communities: number;
}

// MCP Types
export interface MCPServer {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  status: 'running' | 'stopped' | 'error';
}

export interface MCPTool {
  name: string;
  description: string;
  server: string;
  parameters: Record<string, any>;
}

// Cron Types
export interface CronJob {
  id: string;
  name?: string;
  schedule: string;
  prompt?: string;
  skills?: string[];
  deliver?: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  status: 'active' | 'paused' | 'error';
}

export interface CreateJobOptions {
  schedule: string;
  prompt: string;
  name?: string;
  deliver?: string;
  skills?: string[];
  script?: string;
  noAgent?: boolean;
  workdir?: string;
}

// Database Types (AIOS)
export interface Project {
  id: string;
  name: string;
  description: string;
  status_id: number;
  status_name: string;
  owner_id: string;
  owner_name: string;
  estimated_hours: number;
  actual_hours: number;
  tags: string[];
  priority: number;
  created_at: Date;
  updated_at: Date;
}

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description: string;
  status_id: number;
  status_name: string;
  sort_order: number;
  created_at: Date;
}

export interface Phase {
  id: string;
  milestone_id: string;
  name: string;
  description: string;
  status_id: number;
  status_name: string;
  sort_order: number;
  created_at: Date;
}

export interface Task {
  id: string;
  phase_id: string;
  name: string;
  description: string;
  status_id: number;
  status_name: string;
  sort_order: number;
  estimated_hours: number;
  actual_hours: number;
  created_at: Date;
  updated_at: Date;
}

export interface Bug {
  id: string;
  project_id?: string;
  milestone_id?: string;
  phase_id?: string;
  task_id?: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reported_by: string;
  assigned_to?: string;
  reported_at: Date;
  resolved_at?: Date;
}

export interface HistoryEntry {
  id: string;
  project_id?: string;
  milestone_id?: string;
  phase_id?: string;
  task_id?: string;
  action: string;
  old_value?: any;
  new_value?: any;
  description?: string;
  user_id: string;
  user_name?: string;
  created_at: Date;
}

// Config Types
export interface HermesConfig {
  path: string;
  profile: string;
  mode: 'cli' | 'api' | 'mcp';
  apiUrl: string;
  gatewayEnabled: boolean;
  memoryEnabled: boolean;
}

// Event Types
export interface HermesEvent {
  type: 'message' | 'tool_call' | 'tool_result' | 'error' | 'status';
  data: any;
  timestamp: Date;
}

export type HermesEventHandler = (event: HermesEvent) => void;
