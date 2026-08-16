# Fase 3: Gateway Bridge

**Objetivo:** Los 42 canales de gateway de Hermes accesibles desde Nimbalyst.
**Esfuerzo:** 1 semana
**Dependencias:** Fase 1

---

## 📋 Descripción

Crear un puente que conecte el gateway multi-plataforma de Hermes (42 plataformas) con la UI de Nimbalyst, permitiendo recibir y enviar mensajes desde Telegram, Discord, Slack, WhatsApp, etc.

---

## 🏗️ Arquitectura

```
Telegram ─┐
Discord  ─┤
WhatsApp ─┤
Slack    ─┼──→ Hermes Gateway ──→ GatewayBridge ──→ Nimbalyst UI
Signal   ─┤      (42 platforms)     (WebSocket)      (Session panel)
Email    ─┤
SMS      ─┘
```

---

## 🔧 Implementación

### 3.1 GatewayBridge Service

```typescript
export class GatewayBridge {
  private ws: WebSocket;
  private sessions: Map<string, GatewaySession> = new Map();

  async connect(gatewayUrl: string): Promise<void> {
    this.ws = new WebSocket(gatewayUrl);

    this.ws.on('message', (data) => {
      const event = JSON.parse(data.toString());
      this.handleGatewayEvent(event);
    });
  }

  private handleGatewayEvent(event: GatewayEvent): void {
    switch (event.type) {
      case 'message':
        // Nuevo mensaje de plataforma
        this.handleIncomingMessage(event);
        break;
      case 'session_created':
        // Nueva sesión creada
        this.handleSessionCreated(event);
        break;
      case 'status':
        // Estado del gateway
        this.handleStatusUpdate(event);
        break;
    }
  }

  private handleIncomingMessage(event: GatewayEvent): void {
    // Crear o actualizar sesión en Nimbalyst
    const session = this.getOrCreateSession(event.sessionId);
    session.addMessage(event.message);

    // Notificar UI
    this.emit('message', { session, message: event.message });
  }

  async sendMessage(
    sessionId: string,
    message: string
  ): Promise<void> {
    // Enviar mensaje a través del gateway
    this.ws.send(JSON.stringify({
      type: 'send_message',
      sessionId,
      message,
      platform: this.sessions.get(sessionId)?.platform
    }));
  }
}
```

### 3.2 Gateway Session Manager

```typescript
export class GatewaySessionManager {
  private sessions: Map<string, GatewaySession> = new Map();

  getOrCreateSession(
    sessionId: string,
    platform: string
  ): GatewaySession {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        platform,
        messages: [],
        status: 'active',
        createdAt: new Date()
      });
    }
    return this.sessions.get(sessionId)!;
  }

  getSessionsByPlatform(platform: string): GatewaySession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.platform === platform);
  }

  getActiveSessions(): GatewaySession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.status === 'active');
  }
}
```

### 3.3 Platform Panel UI

```typescript
// Panel en Nimbalyst para mostrar sesiones del gateway
export class GatewayPanel extends React.Component {
  render() {
    return (
      <div className="gateway-panel">
        <PlatformTabs
          platforms={this.state.platforms}
          onSelect={this.handlePlatformSelect}
        />
        <SessionList
          sessions={this.state.sessions}
          onSelect={this.handleSessionSelect}
        />
        <MessageView
          session={this.state.selectedSession}
          onSend={this.handleSendMessage}
        />
      </div>
    );
  }
}
```

---

## 📊 Plataformas Soportadas (Prioridad)

### Prioridad ALTA
| Plataforma | Estado | Notas |
|------------|--------|-------|
| Telegram | ✅ | Más popular |
| Discord | ✅ | Comunidad dev |
| Slack | ✅ | Equipos |
| WhatsApp | ✅ | Masivo |

### Prioridad MEDIA
| Plataforma | Estado | Notas |
|------------|--------|-------|
| Signal | ✅ | Privacy |
| Email | ✅ | Universal |
| Matrix | ✅ | Open source |
| iMessage | ✅ | Apple |

### Prioridad BAJA
| Plataforma | Estado | Notas |
|------------|--------|-------|
| WeChat | ✅ | China |
| QQ | ✅ | China |
| LINE | ✅ | Japan |
| IRC | ✅ | Legacy |

---

## ✅ Criterios de Aceptación

- [ ] Gateway bridge conecta a Hermes gateway
- [ ] Mensajes de plataformas aparecen en Nimbalyst
- [ ] Se pueden enviar respuestas a plataformas
- [ ] Panel de plataformas funcional
- [ ] 4+ plataformas prioritarias funcionando
- [ ] Sesiones se crean automáticamente
