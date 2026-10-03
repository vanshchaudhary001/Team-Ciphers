import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('Organizational Structure & Hierarchy Authorization Tests', () => {
  let associateToken: string;
  let leadToken: string;
  let managerToken: string;
  let ceoToken: string;

  beforeAll(async () => {
    // 1. Sign in as Associate
    const assocRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'associate@technova.demo', password: 'demo1234' });
    expect(assocRes.status).toBe(200);
    associateToken = assocRes.body.token;

    // 2. Sign in as Lead
    const leadRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'lead@technova.demo', password: 'demo1234' });
    expect(leadRes.status).toBe(200);
    leadToken = leadRes.body.token;

    // 3. Sign in as Manager
    const mgrRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'manager@technova.demo', password: 'demo1234' });
    expect(mgrRes.status).toBe(200);
    managerToken = mgrRes.body.token;

    // 4. Sign in as CEO
    const ceoRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ceo@technova.demo', password: 'demo1234' });
    expect(ceoRes.status).toBe(200);
    ceoToken = ceoRes.body.token;
  });

  describe('1. Departments & Positions Data Integrity', () => {
    it('returns all 18 authoritative departments', async () => {
      const res = await request(app)
        .get('/api/v1/org/departments')
        .set('Authorization', `Bearer ${associateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.totalDepartments).toBe(18);
      expect(res.body.departments.length).toBe(18);

      const deptNames = res.body.departments.map((d: any) => d.name);
      expect(deptNames).toContain('ADMINISTRATION');
      expect(deptNames).toContain('ANALYTICS');
      expect(deptNames).toContain('GENERAL MANAGEMENT');
      expect(deptNames).toContain('SECURITY ENGINEERING');
      expect(deptNames).toContain('ENGINEERING, DEVELOPMENT AND SERVICES');
    });

    it('returns all 423 authoritative positions', async () => {
      const res = await request(app)
        .get('/api/v1/org/positions')
        .set('Authorization', `Bearer ${associateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.totalPositions).toBe(423);
      expect(res.body.positions.length).toBe(423);
    });

    it('correctly filters positions by roleLevel: Associate', async () => {
      const res = await request(app)
        .get('/api/v1/org/positions?roleLevel=Associate')
        .set('Authorization', `Bearer ${associateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.positions.length).toBeGreaterThan(0);
      expect(res.body.positions.every((p: any) => p.roleLevel === 'Associate')).toBe(true);
    });

    it('correctly filters positions by roleLevel: Lead', async () => {
      const res = await request(app)
        .get('/api/v1/org/positions?roleLevel=Lead')
        .set('Authorization', `Bearer ${associateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.positions.length).toBeGreaterThan(0);
      expect(res.body.positions.every((p: any) => p.roleLevel === 'Lead')).toBe(true);
    });

    it('correctly filters positions by roleLevel: Manager', async () => {
      const res = await request(app)
        .get('/api/v1/org/positions?roleLevel=Manager')
        .set('Authorization', `Bearer ${associateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.positions.length).toBeGreaterThan(0);
      expect(res.body.positions.every((p: any) => p.roleLevel === 'Manager')).toBe(true);
    });

    it('contains the CEO position under GENERAL MANAGEMENT', async () => {
      const res = await request(app)
        .get('/api/v1/org/positions?departmentName=GENERAL MANAGEMENT')
        .set('Authorization', `Bearer ${associateToken}`);

      expect(res.status).toBe(200);
      const ceoPos = res.body.positions.find((p: any) => p.title.includes('Chief Executive Officer'));
      expect(ceoPos).toBeDefined();
      expect(ceoPos.branch).toBe('Executive Leadership');
    });
  });

  describe('2. Backend Role Authorization Enforcement', () => {
    it('blocks Associate from accessing Executive Overview (CEO endpoint)', async () => {
      const res = await request(app)
        .get('/api/v1/org/executive-overview')
        .set('Authorization', `Bearer ${associateToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Access denied');
    });

    it('blocks Lead from accessing Executive Overview (CEO endpoint)', async () => {
      const res = await request(app)
        .get('/api/v1/org/executive-overview')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(403);
    });

    it('allows CEO to access Executive Overview', async () => {
      const res = await request(app)
        .get('/api/v1/org/executive-overview')
        .set('Authorization', `Bearer ${ceoToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.totalDepartments).toBe(18);
      expect(res.body.metrics.totalPositions).toBe(423);
      expect(res.body.departmentSummaries.length).toBe(18);
    });

    it('blocks Associate from accessing Team Overview (Lead/Manager endpoint)', async () => {
      const res = await request(app)
        .get('/api/v1/org/team-overview')
        .set('Authorization', `Bearer ${associateToken}`);

      expect(res.status).toBe(403);
    });

    it('allows Lead to access Team Overview', async () => {
      const res = await request(app)
        .get('/api/v1/org/team-overview')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.team).toBeDefined();
    });

    it('allows Manager to access Team Overview', async () => {
      const res = await request(app)
        .get('/api/v1/org/team-overview')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Login & Role Mapping Verification', () => {
    it('returns proper roleLevel and position info upon login', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'associate@technova.demo', password: 'demo1234' });

      expect(res.status).toBe(200);
      expect(res.body.user.roleLevel).toBe('Associate');
      expect(res.body.user.positionTitle).toBeDefined();
      expect(res.body.user.departmentName).toBeDefined();
    });

    it('returns CEO role upon CEO login', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'ceo@technova.demo', password: 'demo1234' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('CEO');
      expect(res.body.user.positionTitle).toContain('Chief Executive Officer');
    });
  });
});
