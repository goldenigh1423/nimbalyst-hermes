# 🔀 Nimbalyst + Hermes — Plan Maestro de Integración

**Fecha:** 2026-08-16
**Versión:** 2.0 (Extendido)
**Objetivo:** Conectar Hermes Agent como backend de agentes dentro de Nimbalyst

---

## 📋 Resumen Ejecutivo

**Decisión:** Modificar Nimbalyst + Conectar Hermes (Opción A)
**Esfuerzo:** 6-8 semanas (8 fases)
**Resultado:** Workspace visual con 70+ herramientas AI, 42 plataformas de gateway, memoria persistente, y colaboración real-time.

---

## 🏗️ Arquitectura Final

```
┌─────────────────────────────────────────────────────────────────┐
│                    NIMBALYST (Visual Workspace)                 │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Editores │ │  Kanban  │ │  Tasks   │ │ Terminal │         │
│  │ (10)     │ │  (3)     │ │  (4)     │ │ Ghostty  │         │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘         │
│       │             │             │             │               │
│       └─────────────┴──────┬──────┴─────────────┘               │
│                            │                                    │
│                   ┌────────┴────────┐                           │
│                   │  HERMES PROVIDER │                          │
│                   │  (AI Provider)   │                          │
│                   └────────┬────────┘                           │
│                            │                                    │
│  ┌─────────────────────────┼─────────────────────────┐         │
│  │                         │                         │         │
│  ▼                         ▼                         ▼         │
│ ┌──────────┐       ┌──────────┐              ┌──────────┐     │
│ │ Tools    │       │ Gateway  │              │  Memory  │     │
│ │ Bridge   │       │ Bridge   │              │  Bridge  │     │
│ │ (70+)    │       │ (42 plat)│              │(Graphify)│     │
│ └──────────┘       └──────────┘              └──────────┘     │
│                                                                 │
│  ┌──────────┐       ┌──────────┐              ┌──────────┐     │
│ │ Skills   │       │   MCP    │              │   Cron   │     │
│ │ Extension│       │  Server  │              │  Bridge  │     │
│ └──────────┘       └──────────┘              └──────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HERMES AGENT (Backend)                       │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  Tools   │ │ Gateway  │ │  Memory  │ │  Skills  │         │
│  │  (70+)   │ │ (42 plat)│ │(Graphify)│ │  (60+)   │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │   MCP    │ │   Cron   │ │ Profiles │ │   Code   │         │
│  │ Servers  │ │  Jobs    │ │  System  │ │   RAG    │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📅 Fases de Implementación

### Fase 1: Hermes AI Provider (Semana 1)
**Objetivo:** Conectar Hermes como un agente más dentro de Nimbalyst.

### Fase 2: Exponer Herramientas (Semana 2)
**Objetivo:** Las 70+ herramientas de Hermes disponibles en Nimbalyst.

### Fase 3: Gateway Bridge (Semana 3)
**Objetivo:** Los 42 canales de gateway de Hermes accesibles desde Nimbalyst.

### Fase 4: Shared Memory (Semana 3-4)
**Objetivo:** Sistema de memoria de Hermes accesible desde Nimbalyst.

### Fase 5: Skills como Extensiones (Semana 4)
**Objetivo:** Skills de Hermes convertidos a extensiones de Nimbalyst.

### Fase 6: MCP Integration (Semana 5)
**Objetivo:** Servidores MCP de Hermes accesibles desde Nimbalyst.

### Fase 7: Scheduled Jobs / Cron (Semana 6)
**Objetivo:** Sistema de cron de Hermes accesible desde Nimbalyst.

### Fase 8: Desktop Feature Parity (Semana 7-8)
**Objetivo:** Funciones del desktop de Hermes que faltan en Nimbalyst.

---

## 📊 Estado Actual

| Fase | Estado | Archivo |
|------|--------|---------|
| 1. Hermes AI Provider | ⏳ Pendiente | `phases/01-hermes-provider.md` |
| 2. Exponer Herramientas | ⏳ Pendiente | `phases/02-tool-bridge.md` |
| 3. Gateway Bridge | ⏳ Pendiente | `phases/03-gateway-bridge.md` |
| 4. Shared Memory | ⏳ Pendiente | `phases/04-shared-memory.md` |
| 5. Skills como Extensiones | ⏳ Pendiente | `phases/05-skills-extensions.md` |
| 6. MCP Integration | ⏳ Pendiente | `phases/06-mcp-integration.md` |
| 7. Scheduled Jobs | ⏳ Pendiente | `phases/07-cron-bridge.md` |
| 8. Desktop Feature Parity | ⏳ Pendiente | `phases/08-desktop-features.md` |

---

*Plan en progreso — subagente comparando desktop features*
