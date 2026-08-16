// ============================================
// DBAIOSBridge - PostgreSQL AIOS Integration
// ============================================

import { Pool, PoolClient } from 'pg';
import {
  Project,
  Milestone,
  Phase,
  Task,
  Bug,
  HistoryEntry,
  HermesConfig
} from '../types';

export interface DBConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export class DBAIOSBridge {
  private pool: Pool;
  private connected: boolean = false;

  constructor(config: DBConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });
  }

  // ============================================
  // Connection
  // ============================================

  async connect(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      client.release();
      this.connected = true;
      console.log('[DB AIOS] Connected');
      return true;
    } catch (error: any) {
      console.error('[DB AIOS] Connection failed:', error.message);
      this.connected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    this.connected = false;
    console.log('[DB AIOS] Disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  // ============================================
  // PROJECTS
  // ============================================

  async getProjects(): Promise<Project[]> {
    const result = await this.pool.query(`
      SELECT p.*, ps.name as status_name, u.name as owner_name
      FROM projects p
      JOIN pipeline_statuses ps ON ps.id = p.status_id
      JOIN users u ON u.id = p.owner_id
      ORDER BY p.created_at DESC
    `);
    return result.rows;
  }

  async getProject(id: string): Promise<Project | null> {
    const result = await this.pool.query(`
      SELECT p.*, ps.name as status_name, u.name as owner_name
      FROM projects p
      JOIN pipeline_statuses ps ON ps.id = p.status_id
      JOIN users u ON u.id = p.owner_id
      WHERE p.id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  async createProject(data: {
    name: string;
    description?: string;
    statusId: number;
    ownerId: string;
    createdBy: string;
    tags?: string[];
  }): Promise<Project> {
    const result = await this.pool.query(`
      INSERT INTO projects (name, description, status_id, owner_id, created_by, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [data.name, data.description, data.statusId, data.ownerId, data.createdBy, data.tags || []]);
    return result.rows[0];
  }

  async updateProject(id: string, data: {
    name?: string;
    description?: string;
    statusId?: number;
    tags?: string[];
  }): Promise<Project> {
    const result = await this.pool.query(`
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
    const result = await this.pool.query(`
      SELECT m.*, ps.name as status_name
      FROM milestones m
      JOIN pipeline_statuses ps ON ps.id = m.status_id
      WHERE m.project_id = $1
      ORDER BY m.sort_order
    `, [projectId]);
    return result.rows;
  }

  async createMilestone(data: {
    projectId: string;
    name: string;
    description?: string;
    statusId: number;
    sortOrder?: number;
    createdBy: string;
  }): Promise<Milestone> {
    const result = await this.pool.query(`
      INSERT INTO milestones (project_id, name, description, status_id, sort_order, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [data.projectId, data.name, data.description, data.statusId, data.sortOrder || 0, data.createdBy]);
    return result.rows[0];
  }

  // ============================================
  // PHASES
  // ============================================

  async getPhases(milestoneId: string): Promise<Phase[]> {
    const result = await this.pool.query(`
      SELECT ph.*, ps.name as status_name
      FROM phases ph
      JOIN pipeline_statuses ps ON ps.id = ph.status_id
      WHERE ph.milestone_id = $1
      ORDER BY ph.sort_order
    `, [milestoneId]);
    return result.rows;
  }

  async createPhase(data: {
    milestoneId: string;
    name: string;
    description?: string;
    statusId: number;
    sortOrder?: number;
    createdBy: string;
  }): Promise<Phase> {
    const result = await this.pool.query(`
      INSERT INTO phases (milestone_id, name, description, status_id, sort_order, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [data.milestoneId, data.name, data.description, data.statusId, data.sortOrder || 0, data.createdBy]);
    return result.rows[0];
  }

  // ============================================
  // TASKS
  // ============================================

  async getTasks(phaseId: string): Promise<Task[]> {
    const result = await this.pool.query(`
      SELECT t.*, ps.name as status_name
      FROM tasks t
      JOIN pipeline_statuses ps ON ps.id = t.status_id
      WHERE t.phase_id = $1
      ORDER BY t.sort_order
    `, [phaseId]);
    return result.rows;
  }

  async createTask(data: {
    phaseId: string;
    name: string;
    description?: string;
    statusId: number;
    sortOrder?: number;
    createdBy: string;
  }): Promise<Task> {
    const result = await this.pool.query(`
      INSERT INTO tasks (phase_id, name, description, status_id, sort_order, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [data.phaseId, data.name, data.description, data.statusId, data.sortOrder || 0, data.createdBy]);
    return result.rows[0];
  }

  async updateTask(id: string, data: {
    name?: string;
    description?: string;
    statusId?: number;
  }): Promise<Task> {
    const result = await this.pool.query(`
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

  async getBugs(filters?: {
    projectId?: string;
    status?: string;
    severity?: string;
  }): Promise<Bug[]> {
    let query = `
      SELECT b.*, u.name as reported_by_name, u2.name as assigned_to_name
      FROM bugs b
      JOIN users u ON u.id = b.reported_by
      LEFT JOIN users u2 ON u2.id = b.assigned_to
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.projectId) {
      query += ` AND b.project_id = $${paramIndex++}`;
      params.push(filters.projectId);
    }
    if (filters?.status) {
      query += ` AND b.status = $${paramIndex++}`;
      params.push(filters.status);
    }
    if (filters?.severity) {
      query += ` AND b.severity = $${paramIndex++}`;
      params.push(filters.severity);
    }

    query += ` ORDER BY b.reported_at DESC`;
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  // ============================================
  // HISTORY
  // ============================================

  async getHistory(entityType: string, entityId: string): Promise<HistoryEntry[]> {
    const column = `${entityType}_id`;
    const result = await this.pool.query(`
      SELECT h.*, u.name as user_name
      FROM history h
      JOIN users u ON u.id = h.user_id
      WHERE h.${column} = $1
      ORDER BY h.created_at DESC
    `, [entityId]);
    return result.rows;
  }

  async addHistory(data: {
    projectId?: string;
    milestoneId?: string;
    phaseId?: string;
    taskId?: string;
    action: string;
    oldValue?: any;
    newValue?: any;
    description?: string;
    userId: string;
  }): Promise<HistoryEntry> {
    const result = await this.pool.query(`
      INSERT INTO history (project_id, milestone_id, phase_id, task_id, action, old_value, new_value, description, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      data.projectId, data.milestoneId, data.phaseId, data.taskId,
      data.action, data.oldValue, data.newValue, data.description, data.userId
    ]);
    return result.rows[0];
  }

  // ============================================
  // VIEWS
  // ============================================

  async getProjectSummary(): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM v_project_summary ORDER BY created_at DESC`);
    return result.rows;
  }

  async getPendingBugs(): Promise<Bug[]> {
    const result = await this.pool.query(`SELECT * FROM v_pending_bugs`);
    return result.rows;
  }

  // ============================================
  // PIPELINE STATUSES
  // ============================================

  async getPipelineStatuses(): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM pipeline_statuses ORDER BY sort_order`);
    return result.rows;
  }

  // ============================================
  // USERS
  // ============================================

  async getUsers(): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM users WHERE is_active = true ORDER BY name`);
    return result.rows;
  }
}
