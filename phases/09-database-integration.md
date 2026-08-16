# Fase 9: Database Integration (PostgreSQL AIOS)

**Objetivo:** Conectar la base de datos PostgreSQL AIOS con Nimbalyst+Hermes para gestión de proyectos.
**Esfuerzo:** 1 semana
**Dependencias:** Fase 1 (HermesProvider)

---

## 📋 Descripción

Integrar la base de datos PostgreSQL AIOS (proyectos, hitos, fases, tareas, bugs, comentarios, historial) con Nimbalyst, permitiendo:
- Visualizar proyectos en Nimbalyst
- Crear/gestionar tareas desde Nimbalyst
- Sincronizar el tracker de Nimbalyst con la DB AIOS
- Los agentes de Hermes pueden leer/escribir en la DB

---

## 🏗️ Arquitectura

```
Nimbalyst UI
    │
    ├── Tracker Panel ←→ DB AIOS Bridge ←→ PostgreSQL AIOS
    │   (Kanban, Grid,      (API layer)      (projects,
    │    Timeline, Inbox)                     milestones,
    │                                         phases, tasks,
    │                                         bugs, comments,
    │                                         history)
    │
    └── Plans Panel ←→ DB AIOS Bridge
        (Plans system)    (sync plans ↔ projects)
```

---

## 📊 Schema de DB AIOS

### Jerarquía de Proyectos
```
projects
├── milestones
│   ├── phases
│   │   └── tasks
│   └── phases
└── milestones
```

### Tablas Principales
| Tabla | Descripción | Registros actuales |
|-------|-------------|-------------------|
| `users` | Usuarios (admin, developer, client) | 1 |
| `projects` | Proyectos principales | 2 |
| `milestones` | Hitos del proyecto | 0 |
| `phases` | Fases del hito | 0 |
| `tasks` | Tareas de la fase | 0 |
| `bugs` | Bugs (con FK directas) | 0 |
| `comments` | Comentarios (con FK directas) | 0 |
| `attachments` | Archivos adjuntos | 0 |
| `history` | Historial de cambios | 7 |
| `time_entries` | Registro de horas | 0 |
| `pipeline_statuses` | Estados del pipeline | 6 |

### Pipeline de Estados
```
backlog → planning → approval → development → testing → completed
```

---

## 🔧 Implementación

### 9.1 DB AIOS Bridge

```typescript
export class DBAIOSBridge {
  private connection: pg.Pool;

  constructor(config: DBConfig) {
    this.connection = new pg.Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password
    });
  }

  // ============================================
  // PROJECTS
  // ============================================

  async getProjects(): Promise<Project[]> {
    const result = await this.connection.query(`
      SELECT p.*, ps.name as status_name, u.name as owner_name
      FROM projects p
      JOIN pipeline_statuses ps ON ps.id = p.status_id
      JOIN users u ON u.id = p.owner_id
      ORDER BY p.created_at DESC
    `);
    return result.rows;
  }

  async getProject(id: string): Promise<Project> {
    const result = await this.connection.query(`
      SELECT p.*, ps.name as status_name, u.name as owner_name
      FROM projects p
      JOIN pipeline_statuses ps ON ps.id = p.status_id
      JOIN users u ON u.id = p.owner_id
      WHERE p.id = $1
    `, [id]);
    return result.rows[0];
  }

  async createProject(data: CreateProjectInput): Promise<Project> {
    const result = await this.connection.query(`
      INSERT INTO projects (name, description, status_id, owner_id, created_by, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [data.name, data.description, data.statusId, data.ownerId, data.createdBy, data.tags]);
    return result.rows[0];
  }

  async updateProject(id: string, data: UpdateProjectInput): Promise<Project> {
    const result = await this.connection.query(`
      UPDATE projects
      SET name = COALESCE($2, name),
          description = COALESCE($3, description),
          status_id = COALESCE($4, status_id),
          tags = COALESCE($5, tags),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, data.name, data.description, data.statusId, data.tags]);
    return result.rows[0];
  }

  // ============================================
  // MILESTONES
  // ============================================

  async getMilestones(projectId: string): Promise<Milestone[]> {
    const result = await this.connection.query(`
      SELECT m.*, ps.name as status_name
      FROM milestones m
      JOIN pipeline_statuses ps ON ps.id = m.status_id
      WHERE m.project_id = $1
      ORDER BY m.sort_order
    `, [projectId]);
    return result.rows;
  }

  async createMilestone(data: CreateMilestoneInput): Promise<Milestone> {
    const result = await this.connection.query(`
      INSERT INTO milestones (project_id, name, description, status_id, sort_order, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [data.projectId, data.name, data.description, data.statusId, data.sortOrder, data.createdBy]);
    return result.rows[0];
  }

  // ============================================
  // PHASES
  // ============================================

  async getPhases(milestoneId: string): Promise<Phase[]> {
    const result = await this.connection.query(`
      SELECT ph.*, ps.name as status_name
      FROM phases ph
      JOIN pipeline_statuses ps ON ps.id = ph.status_id
      WHERE ph.milestone_id = $1
      ORDER BY ph.sort_order
    `, [milestoneId]);
    return result.rows;
  }

  async createPhase(data: CreatePhaseInput): Promise<Phase> {
    const result = await this.connection.query(`
      INSERT INTO phases (milestone_id, name, description, status_id, sort_order, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [data.milestoneId, data.name, data.description, data.statusId, data.sortOrder, data.createdBy]);
    return result.rows[0];
  }

  // ============================================
  // TASKS
  // ============================================

  async getTasks(phaseId: string): Promise<Task[]> {
    const result = await this.connection.query(`
      SELECT t.*, ps.name as status_name
      FROM tasks t
      JOIN pipeline_statuses ps ON ps.id = t.status_id
      WHERE t.phase_id = $1
      ORDER BY t.sort_order
    `, [phaseId]);
    return result.rows;
  }

  async createTask(data: CreateTaskInput): Promise<Task> {
    const result = await this.connection.query(`
      INSERT INTO tasks (phase_id, name, description, status_id, sort_order, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [data.phaseId, data.name, data.description, data.statusId, data.sortOrder, data.createdBy]);
    return result.rows[0];
  }

  async updateTask(id: string, data: UpdateTaskInput): Promise<Task> {
    const result = await this.connection.query(`
      UPDATE tasks
      SET name = COALESCE($2, name),
          description = COALESCE($3, description),
          status_id = COALESCE($4, status_id),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, data.name, data.description, data.statusId]);
    return result.rows[0];
  }

  // ============================================
  // BUGS
  // ============================================

  async getBugs(filters: BugFilters): Promise<Bug[]> {
    let query = `
      SELECT b.*, u.name as reported_by_name, u2.name as assigned_to_name
      FROM bugs b
      JOIN users u ON u.id = b.reported_by
      LEFT JOIN users u2 ON u2.id = b.assigned_to
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.projectId) {
      query += ` AND b.project_id = $${paramIndex++}`;
      params.push(filters.projectId);
    }
    if (filters.status) {
      query += ` AND b.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY b.reported_at DESC`;
    const result = await this.connection.query(query, params);
    return result.rows;
  }

  // ============================================
  // HISTORY
  // ============================================

  async getHistory(entityType: string, entityId: string): Promise<HistoryEntry[]> {
    const column = `${entityType}_id`;
    const result = await this.connection.query(`
      SELECT h.*, u.name as user_name
      FROM history h
      JOIN users u ON u.id = h.user_id
      WHERE h.${column} = $1
      ORDER BY h.created_at DESC
    `, [entityId]);
    return result.rows;
  }

  async addHistory(data: AddHistoryInput): Promise<HistoryEntry> {
    const result = await this.connection.query(`
      INSERT INTO history (project_id, milestone_id, phase_id, task_id, action, old_value, new_value, description, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [data.projectId, data.milestoneId, data.phaseId, data.taskId, data.action, data.oldValue, data.newValue, data.description, data.userId]);
    return result.rows[0];
  }

  // ============================================
  // VIEWS
  // ============================================

  async getProjectSummary(): Promise<ProjectSummary[]> {
    const result = await this.connection.query(`
      SELECT * FROM v_project_summary
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async getPendingBugs(): Promise<Bug[]> {
    const result = await this.connection.query(`
      SELECT * FROM v_pending_bugs
      ORDER BY severity DESC, reported_at DESC
    `);
    return result.rows;
  }
}
```

### 9.2 Tracker ↔ DB AIOS Sync

```typescript
export class TrackerDBSync {
  private db: DBAIOSBridge;
  private nimbalyst: NimbalystAPI;

  // Sincronizar proyectos de DB AIOS → Nimbalyst Tracker
  async syncProjectsToTracker(): Promise<void> {
    const projects = await this.db.getProjects();

    for (const project of projects) {
      // Crear item en tracker de Nimbalyst
      await this.nimbalyst.createTrackerItem({
        type: 'project',
        title: project.name,
        description: project.description,
        status: this.mapPipelineStatus(project.status_name),
        metadata: {
          dbId: project.id,
          source: 'aios'
        }
      });
    }
  }

  // Sincronizar tareas de DB AIOS → Nimbalyst Tracker
  async syncTasksToTracker(): Promise<void> {
    const projects = await this.db.getProjects();

    for (const project of projects) {
      const milestones = await this.db.getMilestones(project.id);

      for (const milestone of milestones) {
        const phases = await this.db.getPhases(milestone.id);

        for (const phase of phases) {
          const tasks = await this.db.getTasks(phase.id);

          for (const task of tasks) {
            await this.nimbalyst.createTrackerItem({
              type: 'task',
              title: task.name,
              description: task.description,
              status: this.mapPipelineStatus(task.status_name),
              milestone: milestone.name,
              metadata: {
                dbId: task.id,
                projectId: project.id,
                source: 'aios'
              }
            });
          }
        }
      }
    }
  }

  // Sincronizar cambios de Nimbalyst → DB AIOS
  async syncTrackerToDB(): Promise<void> {
    const items = await this.nimbalyst.getTrackerItems({
      filter: { metadata: { source: 'aios' } }
    });

    for (const item of items) {
      const dbId = item.metadata.dbId;

      if (item.type === 'task') {
        await this.db.updateTask(dbId, {
          name: item.title,
          description: item.description,
          statusId: this.reverseMapStatus(item.status)
        });
      }
    }
  }

  private mapPipelineStatus(dbStatus: string): string {
    const mapping: Record<string, string> = {
      'backlog': 'to-do',
      'planning': 'to-do',
      'approval': 'in-progress',
      'development': 'in-progress',
      'testing': 'in-review',
      'completed': 'done'
    };
    return mapping[dbStatus] || 'to-do';
  }

  private reverseMapStatus(trackerStatus: string): number {
    const mapping: Record<string, number> = {
      'to-do': 1,
      'in-progress': 4,
      'in-review': 5,
      'done': 6
    };
    return mapping[trackerStatus] || 1;
  }
}
```

### 9.3 Panel UI en Nimbalyst

```typescript
export class AIOSProjectPanel extends React.Component {
  render() {
    return (
      <div className="aios-panel">
        <ProjectList
          projects={this.state.projects}
          onSelect={this.handleProjectSelect}
          onStatusChange={this.handleStatusChange}
        />
        <ProjectDetail
          project={this.state.selectedProject}
          milestones={this.state.milestones}
          onMilestoneSelect={this.handleMilestoneSelect}
        />
        <MilestoneDetail
          milestone={this.state.selectedMilestone}
          phases={this.state.phases}
          onPhaseSelect={this.handlePhaseSelect}
        />
        <PhaseDetail
          phase={this.state.selectedPhase}
          tasks={this.state.tasks}
          onTaskSelect={this.handleTaskSelect}
          onTaskStatusChange={this.handleTaskStatusChange}
        />
        <BugList
          bugs={this.state.bugs}
          onBugSelect={this.handleBugSelect}
        />
        <HistoryTimeline
          history={this.state.history}
        />
      </div>
    );
  }
}
```

---

## 📊 Vistas de la DB

### v_project_summary
```sql
CREATE VIEW v_project_summary AS
SELECT
  p.id,
  p.name,
  p.description,
  ps.name as status,
  u.name as owner,
  p.estimated_hours,
  p.actual_hours,
  p.tags,
  p.priority,
  p.created_at,
  COUNT(DISTINCT m.id) as milestone_count,
  COUNT(DISTINCT ph.id) as phase_count,
  COUNT(DISTINCT t.id) as task_count,
  COUNT(DISTINCT b.id) as bug_count
FROM projects p
JOIN pipeline_statuses ps ON ps.id = p.status_id
JOIN users u ON u.id = p.owner_id
LEFT JOIN milestones m ON m.project_id = p.id
LEFT JOIN phases ph ON ph.milestone_id = m.id
LEFT JOIN tasks t ON t.phase_id = ph.id
LEFT JOIN bugs b ON b.project_id = p.id
GROUP BY p.id, ps.name, u.name;
```

### v_pending_bugs
```sql
CREATE VIEW v_pending_bugs AS
SELECT
  b.*,
  p.name as project_name,
  u.name as reported_by_name,
  u2.name as assigned_to_name
FROM bugs b
LEFT JOIN projects p ON p.id = b.project_id
JOIN users u ON u.id = b.reported_by
LEFT JOIN users u2 ON u2.id = b.assigned_to
WHERE b.status IN ('open', 'in_progress')
ORDER BY
  CASE b.severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;
```

---

## 🔗 Integración con Hermes

### Hermes Tools para DB AIOS

```typescript
// Herramientas de Hermes para interactuar con la DB
const hermesDBTools = {
  'db_get_projects': async () => db.getProjects(),
  'db_get_project': async (id: string) => db.getProject(id),
  'db_create_project': async (data) => db.createProject(data),
  'db_update_project': async (id, data) => db.updateProject(id, data),
  'db_get_tasks': async (phaseId) => db.getTasks(phaseId),
  'db_create_task': async (data) => db.createTask(data),
  'db_update_task': async (id, data) => db.updateTask(id, data),
  'db_get_bugs': async (filters) => db.getBugs(filters),
  'db_get_history': async (type, id) => db.getHistory(type, id),
  'db_add_history': async (data) => db.addHistory(data)
};
```

---

## ✅ Criterios de Aceptación

- [ ] DB AIOS Bridge conecta a PostgreSQL
- [ ] Se pueden listar proyectos
- [ ] Se pueden crear/actualizar tareas
- [ ] Se pueden ver bugs
- [ ] Se puede ver historial
- [ ] Tracker de Nimbalyst sincroniza con DB
- [ ] Panel de proyectos funcional en Nimbalyst
- [ ] Agentes de Hermes pueden leer/escribir DB
- [ ] Pipeline de estados funciona (backlog→completed)
