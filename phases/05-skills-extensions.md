# Fase 5: Skills como Extensiones

**Objetivo:** Skills de Hermes convertidos a extensiones de Nimbalyst.
**Esfuerzo:** 1 semana
**Dependencias:** Fase 1, Fase 2

---

## 📋 Descripción

Convertir los skills de Hermes (procedimientos reutilizables) en extensiones de Nimbalyst que se puedan instalar desde el marketplace.

---

## 🏗️ Arquitectura

```
Hermes Skill                    Nimbalyst Extension
├── SKILL.md          →         ├── manifest.json
├── references/       →         ├── dist/references/
├── templates/        →         ├── dist/templates/
├── scripts/          →         ├── dist/scripts/
└── assets/           →         └── dist/assets/
```

---

## 🔧 Implementación

### 5.1 SkillConverter

```typescript
export class SkillConverter {
  // Convertir skill de Hermes a extensión de Nimbalyst
  async convertSkill(skillPath: string): Promise<Extension> {
    // 1. Leer SKILL.md
    const skillMd = await fs.readFile(
      path.join(skillPath, 'SKILL.md'),
      'utf-8'
    );

    // 2. Parsear frontmatter
    const { data, content } = this.parseFrontmatter(skillMd);

    // 3. Crear manifest.json
    const manifest = this.createManifest(data, skillPath);

    // 4. Copiar archivos
    await this.copyFiles(skillPath, manifest);

    // 5. Crear entry point
    await this.createEntryPoint(manifest, content);

    return manifest;
  }

  private createManifest(
    data: FrontmatterData,
    skillPath: string
  ): ExtensionManifest {
    return {
      id: `com.hermes.skill.${data.name}`,
      name: data.name,
      version: data.version || '1.0.0',
      description: data.description,
      main: 'dist/index.js',
      permissions: { ai: true },
      contributions: {
        slashCommands: this.extractSlashCommands(data),
        aiTools: this.extractAITools(data),
        configuration: this.extractConfig(data)
      }
    };
  }
}
```

### 5.2 Skills Prioritarios

| Skill | Extensión | Notas |
|-------|-----------|-------|
| `hermes-agent` | `hermes-agent-config` | Configuración de Hermes |
| `knowledge-management` | `knowledge-management` | Gestión de conocimiento |
| `github-issue-to-pr` | `github-integration` | GitHub workflow |
| `excalidraw` | Ya integrado | No necesita conversión |
| `computer-use` | `computer-use` | Control de escritorio |
| `systematic-debugging` | `debugging-tools` | Debugging asistido |
| `test-driven-development` | `tdd-tools` | TDD workflow |
| `obsidian` | `obsidian-sync` | Sync con Obsidian |

### 5.3 Skill Extension Template

```typescript
// Extension entry point para un skill de Hermes
export function activate(ctx: ExtensionContext) {
  // Registrar slash commands del skill
  ctx.registerSlashCommand({
    id: 'hermes.skill.command',
    title: 'Skill Command',
    handler: async (args) => {
      // Ejecutar skill a través de Hermes
      const result = await hermesBridge.executeSkill(
        'skill-name',
        'command',
        args
      );
      return result;
    }
  });

  // Registrar herramientas del skill
  ctx.registerTool({
    name: 'hermes.skill.tool',
    description: 'Tool from Hermes skill',
    handler: async (args) => {
      return await hermesBridge.executeTool(
        'skill.tool',
        args
      );
    }
  });
}
```

---

## 📊 Skills a Convertir (Prioridad)

### Prioridad ALTA (4 skills)
1. `hermes-agent` — Configuración esencial
2. `knowledge-management` — Gestión de conocimiento
3. `github-*` — GitHub integration
4. `computer-use` — Control de escritorio

### Prioridad MEDIA (6 skills)
5. `systematic-debugging` — Debugging
6. `test-driven-development` — TDD
7. `obsidian` — Obsidian sync
8. `claude-code` — Claude Code delegation
9. `codex` — Codex delegation
10. `opencode` — OpenCode delegation

### Prioridad BAJA (10+ skills)
11. `excalidraw` — Ya integrado
12. `ascii-art` — ASCII art
13. `p5js` — p5.js sketches
14. `manim-video` — Animaciones
15. `comfyui` — Image generation
16. Y más...

---

## ✅ Criterios de Aceptación

- [ ] SkillConverter crea extensiones válidas
- [ ] 4 skills prioritarios convertidos
- [ ] Extensiones se instalan en Nimbalyst
- [ ] Slash commands funcionan
- [ ] AI tools funcionan
- [ ] Marketplace listing funciona
