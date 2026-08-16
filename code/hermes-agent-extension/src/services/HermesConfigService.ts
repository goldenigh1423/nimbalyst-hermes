// ============================================
// HermesConfigService - Persistent Configuration
// ============================================

import { HermesConfig, DBConfig } from '../types';

const DEFAULT_HERMES_CONFIG: HermesConfig = {
  path: 'hermes',
  profile: 'default',
  mode: 'cli',
  apiUrl: 'http://localhost:9119',
  gatewayEnabled: false,
  memoryEnabled: true
};

const DEFAULT_DB_CONFIG: DBConfig = {
  host: '169.58.56.108',
  port: 5432,
  database: 'aios',
  user: 'postgres',
  password: ''
};

export class HermesConfigService {
  private storage: StorageAdapter;
  private hermesConfig: HermesConfig;
  private dbConfig: DBConfig;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.hermesConfig = DEFAULT_HERMES_CONFIG;
    this.dbConfig = DEFAULT_DB_CONFIG;
  }

  // ============================================
  // Initialization
  // ============================================

  async initialize(): Promise<void> {
    // Load saved config
    const savedHermes = await this.storage.get('hermes_config');
    if (savedHermes) {
      this.hermesConfig = { ...DEFAULT_HERMES_CONFIG, ...JSON.parse(savedHermes) };
    }

    const savedDB = await this.storage.get('db_config');
    if (savedDB) {
      this.dbConfig = { ...DEFAULT_DB_CONFIG, ...JSON.parse(savedDB) };
    }

    console.log('[Config] Initialized:', {
      hermes: this.hermesConfig,
      db: { ...this.dbConfig, password: '***' }
    });
  }

  // ============================================
  // Hermes Config
  // ============================================

  getHermesConfig(): HermesConfig {
    return { ...this.hermesConfig };
  }

  async updateHermesConfig(updates: Partial<HermesConfig>): Promise<void> {
    this.hermesConfig = { ...this.hermesConfig, ...updates };
    await this.storage.set('hermes_config', JSON.stringify(this.hermesConfig));
    console.log('[Config] Hermes config updated:', updates);
  }

  // ============================================
  // DB Config
  // ============================================

  getDBConfig(): DBConfig {
    return { ...this.dbConfig };
  }

  async updateDBConfig(updates: Partial<DBConfig>): Promise<void> {
    this.dbConfig = { ...this.dbConfig, ...updates };
    await this.storage.set('db_config', JSON.stringify(this.dbConfig));
    console.log('[Config] DB config updated:', { ...updates, password: updates.password ? '***' : undefined });
  }

  // ============================================
  // Validation
  // ============================================

  validateHermesConfig(config: Partial<HermesConfig>): ValidationResult {
    const errors: string[] = [];

    if (config.path && config.path.trim() === '') {
      errors.push('Hermes path cannot be empty');
    }

    if (config.mode && !['cli', 'api', 'mcp'].includes(config.mode)) {
      errors.push('Invalid mode: must be cli, api, or mcp');
    }

    if (config.apiUrl && !config.apiUrl.startsWith('http')) {
      errors.push('API URL must start with http:// or https://');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateDBConfig(config: Partial<DBConfig>): ValidationResult {
    const errors: string[] = [];

    if (!config.host) errors.push('Database host is required');
    if (!config.port) errors.push('Database port is required');
    if (!config.database) errors.push('Database name is required');
    if (!config.user) errors.push('Database user is required');

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// ============================================
// Types
// ============================================

interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================
// Storage Adapters
// ============================================

export class ElectronStoreAdapter implements StorageAdapter {
  private store: any;

  constructor(store: any) {
    this.store = store;
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

export class MemoryStorageAdapter implements StorageAdapter {
  private data: Map<string, string> = new Map();

  async get(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }
}
