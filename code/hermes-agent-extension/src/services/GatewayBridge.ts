// ============================================
// GatewayBridge - Gateway Platform Bridge
// ============================================

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import {
  HermesConfig,
  GatewayPlatform,
  GatewayMessage
} from '../types';

export class GatewayBridge extends EventEmitter {
  private config: HermesConfig;
  private ws: WebSocket | null = null;
  private platforms: Map<string, GatewayPlatform> = new Map();
  private messages: GatewayMessage[] = [];
  private connected: boolean = false;

  constructor(config: HermesConfig) {
    super();
    this.config = config;
  }

  // ============================================
  // Connection
  // ============================================

  async connect(): Promise<void> {
    if (!this.config.gatewayEnabled) {
      console.log('[Gateway Bridge] Gateway disabled');
      return;
    }

    console.log('[Gateway Bridge] Connecting...');

    try {
      // Connect to Hermes gateway WebSocket
      const gatewayUrl = this.config.apiUrl.replace('http', 'ws') + '/gateway/ws';
      this.ws = new WebSocket(gatewayUrl);

      this.ws.on('open', () => {
        console.log('[Gateway Bridge] Connected');
        this.connected = true;
        this.emit('connected');
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('close', () => {
        console.log('[Gateway Bridge] Disconnected');
        this.connected = false;
        this.emit('disconnected');
      });

      this.ws.on('error', (error: Error) => {
        console.error('[Gateway Bridge] Error:', error);
        this.emit('error', error);
      });
    } catch (error) {
      console.error('[Gateway Bridge] Connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  // ============================================
  // Message Handling
  // ============================================

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'platform_status':
          this.handlePlatformStatus(message);
          break;
        case 'incoming_message':
          this.handleIncomingMessage(message);
          break;
        case 'session_created':
          this.handleSessionCreated(message);
          break;
        default:
          console.log('[Gateway Bridge] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[Gateway Bridge] Parse error:', error);
    }
  }

  private handlePlatformStatus(message: any): void {
    const platform: GatewayPlatform = {
      id: message.platform,
      name: message.name || message.platform,
      status: message.status,
      message.connected ? 'connected' : 'disconnected',
      message.config || {}
    };

    this.platforms.set(platform.id, platform);
    this.emit('platform_status', platform);
  }

  private handleIncomingMessage(message: any): void {
    const gatewayMessage: GatewayMessage = {
      id: message.id,
      platform: message.platform,
      sessionId: message.session_id,
      content: message.content,
      sender: message.sender,
      timestamp: new Date(message.timestamp),
      direction: 'incoming'
    };

    this.messages.push(gatewayMessage);
    this.emit('message', gatewayMessage);
  }

  private handleSessionCreated(message: any): void {
    this.emit('session_created', {
      sessionId: message.session_id,
      platform: message.platform
    });
  }

  // ============================================
  // Send Message
  // ============================================

  async sendMessage(
    platform: string,
    sessionId: string,
    content: string
  ): Promise<void> {
    if (!this.connected || !this.ws) {
      throw new Error('Gateway not connected');
    }

    const message = {
      type: 'send_message',
      platform,
      session_id: sessionId,
      content
    };

    this.ws.send(JSON.stringify(message));

    // Track sent message
    this.messages.push({
      id: Date.now().toString(),
      platform,
      sessionId,
      content,
      sender: 'user',
      timestamp: new Date(),
      direction: 'outgoing'
    });
  }

  // ============================================
  // Status
  // ============================================

  async getStatus(): Promise<any> {
    return {
      connected: this.connected,
      platforms: Array.from(this.platforms.values()),
      messageCount: this.messages.length
    };
  }

  getPlatforms(): GatewayPlatform[] {
    return Array.from(this.platforms.values());
  }

  getMessages(platform?: string): GatewayMessage[] {
    if (platform) {
      return this.messages.filter(m => m.platform === platform);
    }
    return this.messages;
  }
}
