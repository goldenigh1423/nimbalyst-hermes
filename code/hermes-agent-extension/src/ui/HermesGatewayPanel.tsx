// ============================================
// HermesGatewayPanel - Gateway Status UI
// ============================================

import React, { useState, useEffect } from 'react';
import { GatewayPlatform, GatewayMessage } from '../types';

interface HermesGatewayPanelProps {
  platforms: GatewayPlatform[];
  messages: GatewayMessage[];
  onSendMessage: (platform: string, message: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const HermesGatewayPanel: React.FC<HermesGatewayPanelProps> = ({
  platforms,
  messages,
  onSendMessage,
  onRefresh
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const connectedPlatforms = platforms.filter(p => p.status === 'connected');
  const platformMessages = selectedPlatform
    ? messages.filter(m => m.platform === selectedPlatform)
    : messages;

  const handleSend = async () => {
    if (!selectedPlatform || !messageText.trim()) return;

    setSending(true);
    try {
      await onSendMessage(selectedPlatform, messageText);
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="hermes-gateway-panel">
      <h3>Hermes Gateway</h3>

      {/* Platform List */}
      <div className="platforms-section">
        <h4>Platforms ({connectedPlatforms.length}/{platforms.length})</h4>
        <div className="platform-list">
          {platforms.map(platform => (
            <div
              key={platform.id}
              className={`platform-item ${platform.status} ${selectedPlatform === platform.id ? 'selected' : ''}`}
              onClick={() => setSelectedPlatform(platform.id)}
            >
              <span className="platform-icon">
                {platform.status === 'connected' ? '🟢' : '🔴'}
              </span>
              <span className="platform-name">{platform.name}</span>
              <span className="platform-status">{platform.status}</span>
            </div>
          ))}
        </div>
        <button onClick={onRefresh} className="refresh-btn">
          Refresh
        </button>
      </div>

      {/* Messages */}
      <div className="messages-section">
        <h4>
          Messages
          {selectedPlatform && ` - ${selectedPlatform}`}
        </h4>
        <div className="message-list">
          {platformMessages.length === 0 ? (
            <div className="empty-state">No messages</div>
          ) : (
            platformMessages.map(msg => (
              <div key={msg.id} className={`message-item ${msg.direction}`}>
                <div className="message-header">
                  <span className="message-sender">{msg.sender}</span>
                  <span className="message-platform">{msg.platform}</span>
                  <span className="message-time">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Send Message */}
      {selectedPlatform && (
        <div className="send-section">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={`Send to ${selectedPlatform}...`}
            rows={3}
          />
          <button
            onClick={handleSend}
            disabled={sending || !messageText.trim()}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      )}
    </div>
  );
};
