// ============================================
// Tests - DBAIOSBridge
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DBAIOSBridge } from '../services/DBAIOSBridge';

// Mock pg
vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue({ release: vi.fn() }),
    query: vi.fn(),
    end: vi.fn()
  }))
}));

describe('DBAIOSBridge', () => {
  let db: DBAIOSBridge;

  beforeEach(() => {
    db = new DBAIOSBridge({
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'test',
      password: 'test'
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      const result = await db.connect();
      expect(result).toBe(true);
      expect(db.isConnected()).toBe(true);
    });
  });

  describe('getProjects', () => {
    it('should return projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Test Project', status_name: 'development' }
      ];

      vi.mocked(db['pool'].query).mockResolvedValue({ rows: mockProjects } as any);

      const projects = await db.getProjects();
      expect(projects).toEqual(mockProjects);
    });
  });

  describe('createProject', () => {
    it('should create a project', async () => {
      const mockProject = { id: '1', name: 'New Project' };
      vi.mocked(db['pool'].query).mockResolvedValue({ rows: [mockProject] } as any);

      const project = await db.createProject({
        name: 'New Project',
        statusId: 1,
        ownerId: 'user-1',
        createdBy: 'user-1'
      });

      expect(project).toEqual(mockProject);
    });
  });
});
