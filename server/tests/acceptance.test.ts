import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { prisma } from '../src/prisma.js';
import { detectCycle } from '../src/services/dependencyEngine.js';

describe('START SMART Acceptance Tests', () => {
  let aaravToken: string;
  let hrToken: string;
  let itOwnerToken: string;
  let finwiseToken: string;

  beforeAll(async () => {
    // 1. Sign in as Aarav Sharma (Employee)
    const aaravRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'aarav@technova.demo', password: 'demo1234' });
    expect(aaravRes.status).toBe(200);
    aaravToken = aaravRes.body.token;

    // 2. Sign in as HR Admin
    const hrRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hr@technova.demo', password: 'demo1234' });
    expect(hrRes.status).toBe(200);
    hrToken = hrRes.body.token;

    // 3. Sign in as IT Task Owner
    const itRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'it.owner@technova.demo', password: 'demo1234' });
    expect(itRes.status).toBe(200);
    itOwnerToken = itRes.body.token;

    // 4. Sign in as Finwise Employee
    const finwiseRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'rohit@finwise.demo', password: 'demo1234' });
    expect(finwiseRes.status).toBe(200);
    finwiseToken = finwiseRes.body.token;
  });

  describe('1. Authentication & Security', () => {
    it('rejects unauthorized requests without a token', async () => {
      const res = await request(app).get('/api/v1/me/journey');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'aarav@technova.demo', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('enforces role authorization on HR routes', async () => {
      // Employee trying to access HR dashboard
      const res = await request(app)
        .get('/api/v1/hr/dashboard')
        .set('Authorization', `Bearer ${aaravToken}`);
      expect(res.status).toBe(403);
    });

    it('allows HR Admin to access HR dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/hr/dashboard')
        .set('Authorization', `Bearer ${hrToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary).toBeDefined();
    });
  });

  describe('2. Dependency Graph & Initial State', () => {
    it('verifies Aarav initial task states according to specification', async () => {
      const res = await request(app)
        .get('/api/v1/me/journey')
        .set('Authorization', `Bearer ${aaravToken}`);
      expect(res.status).toBe(200);
      expect(res.body.journey).toBeDefined();

      const tasks = res.body.journey.tasks;
      const laptop = tasks.find((t: any) => t.title.includes('Laptop'));
      const vpn = tasks.find((t: any) => t.title.includes('VPN'));
      const github = tasks.find((t: any) => t.title.includes('GitHub'));
      const security = tasks.find((t: any) => t.title.includes('Security'));

      expect(laptop.state).toBe('DONE');
      expect(vpn.state).toBe('WAITING');
      expect(github.state).toBe('LOCKED');
      expect(security.state).toBe('AVAILABLE');
      expect(res.body.journey.health).toBe('DETOURING');
    });

    it('prevents direct completion of a LOCKED task', async () => {
      const journeyRes = await request(app)
        .get('/api/v1/me/journey')
        .set('Authorization', `Bearer ${aaravToken}`);
      const github = journeyRes.body.journey.tasks.find((t: any) => t.title.includes('GitHub'));

      const res = await request(app)
        .post(`/api/v1/tasks/${github.id}/complete`)
        .set('Authorization', `Bearer ${aaravToken}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('LOCKED');
    });
  });

  describe('3. UNSTICK Root Blocker Recovery & SideQuests', () => {
    it('accurately identifies VPN Approval as root blocker for locked GitHub access', async () => {
      const journeyRes = await request(app)
        .get('/api/v1/me/journey')
        .set('Authorization', `Bearer ${aaravToken}`);
      const github = journeyRes.body.journey.tasks.find((t: any) => t.title.includes('GitHub'));

      const res = await request(app)
        .post('/api/v1/unstick/analyze')
        .set('Authorization', `Bearer ${aaravToken}`)
        .send({ taskId: github.id, query: "I can't access GitHub" });

      expect(res.status).toBe(200);
      expect(res.body.data.diagnosis).toBeDefined();
      expect(res.body.data.diagnosis.rootBlockerTitle).toContain('VPN');
      expect(res.body.data.diagnosis.responsibleOwnerGroupName).toContain('IT');
      expect(res.body.data.diagnosis.downstreamImpactCount).toBe(4);
    });

    it('calculates SideQuests excluding blocker-affected tasks', async () => {
      const res = await request(app)
        .get('/api/v1/me/sidequests')
        .set('Authorization', `Bearer ${aaravToken}`);
      expect(res.status).toBe(200);
      expect(res.body.sidequests.length).toBeGreaterThan(0);

      const titles = res.body.sidequests.map((s: any) => s.title);
      expect(titles.some((t: string) => t.includes('Security'))).toBe(true);
      // Downstream tasks must NOT be in sidequests
      expect(titles.some((t: string) => t.includes('Repository'))).toBe(false);
      expect(titles.some((t: string) => t.includes('Development Environment'))).toBe(false);
    });
  });

  describe('4. Cycle Detection in Dependency Engine', () => {
    it('detects and rejects circular dependency graphs', () => {
      const cyclicGraph = [
        { id: '1', title: 'Task A', prerequisiteIds: ['3'] },
        { id: '2', title: 'Task B', prerequisiteIds: ['1'] },
        { id: '3', title: 'Task C', prerequisiteIds: ['2'] }, // A -> B -> C -> A
      ];

      const result = detectCycle(cyclicGraph);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Circular dependency detected');
    });

    it('approves acyclic directed graphs', () => {
      const validGraph = [
        { id: '1', title: 'Task A', prerequisiteIds: [] },
        { id: '2', title: 'Task B', prerequisiteIds: ['1'] },
        { id: '3', title: 'Task C', prerequisiteIds: ['1', '2'] },
      ];

      const result = detectCycle(validGraph);
      expect(result.valid).toBe(true);
    });
  });

  describe('5. Full End-to-End Unlock Flow (The Judge Scenario)', () => {
    it('IT Owner approves VPN Approval, which unlocks GitHub Access to AVAILABLE', async () => {
      // 1. Owner views pending actions
      const actionsRes = await request(app)
        .get('/api/v1/owner/actions')
        .set('Authorization', `Bearer ${itOwnerToken}`);
      expect(actionsRes.status).toBe(200);

      const vpnAction = actionsRes.body.actions.find((a: any) => a.title.includes('VPN'));
      expect(vpnAction).toBeDefined();

      // 2. Owner approves VPN Approval
      const approveRes = await request(app)
        .post(`/api/v1/owner/tasks/${vpnAction.id}/approve`)
        .set('Authorization', `Bearer ${itOwnerToken}`);
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.task.state).toBe('DONE');

      // 3. Aarav inspects updated journey — GitHub Access is now UNLOCKED and AVAILABLE!
      const updatedJourneyRes = await request(app)
        .get('/api/v1/me/journey')
        .set('Authorization', `Bearer ${aaravToken}`);
      expect(updatedJourneyRes.status).toBe(200);

      const updatedTasks = updatedJourneyRes.body.journey.tasks;
      const updatedGithub = updatedTasks.find((t: any) => t.title.includes('GitHub'));
      expect(updatedGithub.state).toBe('AVAILABLE'); // UNLOCKED!

      // Downstream tasks from GitHub (Repository Access) should still be LOCKED
      const updatedRepo = updatedTasks.find((t: any) => t.title.includes('Repository'));
      expect(updatedRepo.state).toBe('LOCKED');

      // 4. Aarav can now complete GitHub Access
      const completeGithubRes = await request(app)
        .post(`/api/v1/tasks/${updatedGithub.id}/complete`)
        .set('Authorization', `Bearer ${aaravToken}`);
      expect(completeGithubRes.status).toBe(200);

      // 5. Repository Access now unlocks to AVAILABLE!
      const afterGithubRes = await request(app)
        .get('/api/v1/me/journey')
        .set('Authorization', `Bearer ${aaravToken}`);
      const afterRepo = afterGithubRes.body.journey.tasks.find((t: any) => t.title.includes('Repository'));
      expect(afterRepo.state).toBe('AVAILABLE');
    });
  });
});
