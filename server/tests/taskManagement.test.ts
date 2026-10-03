import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { prisma } from '../src/prisma.js';

describe('Role-Based Task Management & Hierarchical Task Control (Specification Section 33)', () => {
  let associateToken: string;
  let leadToken: string;
  let managerToken: string;
  let leadBToken: string;

  let associateUser: any;
  let leadUser: any;
  let managerUser: any;
  let leadBUser: any;
  let associateBUser: any;

  let associateTaskId: string;
  let leadTaskId: string;
  let managerTaskId: string;

  beforeAll(async () => {
    // 1. Ensure test users exist
    associateUser = await prisma.user.findFirst({
      where: { email: 'associate@technova.demo' },
      include: { employeeProfile: { include: { journeys: { include: { tasks: true } } } } },
    });

    leadUser = await prisma.user.findFirst({
      where: { email: 'lead@technova.demo' },
      include: { employeeProfile: { include: { journeys: { include: { tasks: true } } } } },
    });

    managerUser = await prisma.user.findFirst({
      where: { email: 'manager@technova.demo' },
      include: { employeeProfile: { include: { journeys: { include: { tasks: true } } } } },
    });

    // Create or retrieve Lead B and Associate B in a different team to test Lead A vs Lead B scoping (Section 9 & Test 4)
    leadBUser = await prisma.user.upsert({
      where: { email: 'lead.b@technova.demo' },
      update: {
        role: 'LEAD',
        roleLevel: 'Lead',
        team: 'Cloud Infrastructure Team',
        departmentId: managerUser.departmentId,
      },
      create: {
        companyId: managerUser.companyId,
        email: 'lead.b@technova.demo',
        passwordHash: associateUser.passwordHash,
        name: 'Neha Lead (Team B)',
        role: 'LEAD',
        roleLevel: 'Lead',
        team: 'Cloud Infrastructure Team',
        departmentId: managerUser.departmentId,
        accountStatus: 'ACTIVE',
      },
      include: { employeeProfile: true },
    });

    if (!leadBUser.employeeProfile) {
      await prisma.employeeProfile.create({
        data: {
          userId: leadBUser.id,
          companyId: managerUser.companyId,
          roleLevel: 'Lead',
          team: 'Cloud Infrastructure Team',
          joiningDate: new Date(),
        },
      });
    }

    associateBUser = await prisma.user.upsert({
      where: { email: 'associate.b@technova.demo' },
      update: {
        role: 'ASSOCIATE',
        roleLevel: 'Associate',
        team: 'Cloud Infrastructure Team',
        departmentId: managerUser.departmentId,
      },
      create: {
        companyId: managerUser.companyId,
        email: 'associate.b@technova.demo',
        passwordHash: associateUser.passwordHash,
        name: 'Karan Associate (Under Lead B)',
        role: 'ASSOCIATE',
        roleLevel: 'Associate',
        team: 'Cloud Infrastructure Team',
        departmentId: managerUser.departmentId,
        accountStatus: 'ACTIVE',
      },
      include: { employeeProfile: { include: { journeys: { include: { tasks: true } } } } },
    });

    if (!associateBUser.employeeProfile) {
      const prof = await prisma.employeeProfile.create({
        data: {
          userId: associateBUser.id,
          companyId: managerUser.companyId,
          roleLevel: 'Associate',
          team: 'Cloud Infrastructure Team',
          buddyEmail: 'lead.b@technova.demo',
          managerEmail: 'manager@technova.demo',
          joiningDate: new Date(),
        },
      });
      const j = await prisma.journey.create({
        data: {
          companyId: managerUser.companyId,
          employeeProfileId: prof.id,
          name: 'Cloud Onboarding',
        },
      });
      await prisma.journeyTask.create({
        data: {
          journeyId: j.id,
          companyId: managerUser.companyId,
          title: 'Cloud Security Audit',
          state: 'AVAILABLE',
          managementStatus: 'ACTIVE',
        },
      });
    }

    // Ensure Lead and Manager have at least 1 task in a journey for tests 3 & 5
    if (!leadUser.employeeProfile?.journeys?.[0]) {
      const j = await prisma.journey.create({
        data: {
          companyId: leadUser.companyId,
          employeeProfileId: leadUser.employeeProfile!.id,
          name: 'Lead Onboarding Journey',
        },
      });
      const t = await prisma.journeyTask.create({
        data: {
          journeyId: j.id,
          companyId: leadUser.companyId,
          title: 'Lead Architecture Alignment',
          state: 'AVAILABLE',
          managementStatus: 'ACTIVE',
        },
      });
      leadTaskId = t.id;
    } else {
      const t = leadUser.employeeProfile.journeys[0].tasks[0] ||
        await prisma.journeyTask.create({
          data: {
            journeyId: leadUser.employeeProfile.journeys[0].id,
            companyId: leadUser.companyId,
            title: 'Lead Architecture Alignment',
            state: 'AVAILABLE',
            managementStatus: 'ACTIVE',
          },
        });
      leadTaskId = t.id;
    }

    if (!managerUser.employeeProfile?.journeys?.[0]) {
      const j = await prisma.journey.create({
        data: {
          companyId: managerUser.companyId,
          employeeProfileId: managerUser.employeeProfile!.id,
          name: 'Manager Onboarding Journey',
        },
      });
      const t = await prisma.journeyTask.create({
        data: {
          journeyId: j.id,
          companyId: managerUser.companyId,
          title: 'Executive Strategic Planning',
          state: 'AVAILABLE',
          managementStatus: 'ACTIVE',
        },
      });
      managerTaskId = t.id;
    } else {
      const t = managerUser.employeeProfile.journeys[0].tasks[0] ||
        await prisma.journeyTask.create({
          data: {
            journeyId: managerUser.employeeProfile.journeys[0].id,
            companyId: managerUser.companyId,
            title: 'Executive Strategic Planning',
            state: 'AVAILABLE',
            managementStatus: 'ACTIVE',
          },
        });
      managerTaskId = t.id;
    }

    associateTaskId = associateUser.employeeProfile.journeys[0].tasks[0].id;

    // Login each persona to get tokens
    const assocRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'associate@technova.demo', password: 'demo1234' });
    expect(assocRes.status).toBe(200);
    associateToken = assocRes.body.token;

    const leadRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'lead@technova.demo', password: 'demo1234' });
    expect(leadRes.status).toBe(200);
    leadToken = leadRes.body.token;

    const leadBRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'lead.b@technova.demo', password: 'demo1234' });
    expect(leadBRes.status).toBe(200);
    leadBToken = leadBRes.body.token;

    const mgrRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'manager@technova.demo', password: 'demo1234' });
    expect(mgrRes.status).toBe(200);
    managerToken = mgrRes.body.token;
  });

  // TEST 1: Login as Associate. Attempt: Create task -> DENIED (403 Forbidden).
  it('TEST 1: rejects task creation attempt by Associate with 403 Forbidden', async () => {
    const res = await request(app)
      .post(`/api/v1/task-management/employees/${associateUser.id}/tasks`)
      .set('Authorization', `Bearer ${associateToken}`)
      .send({
        title: 'Unauthorized Task Created by Associate',
        day: 'Day 2',
        priority: 'High',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // TEST 2: Login as Associate. Attempt: Edit task through API -> 403 Forbidden.
  it('TEST 2: rejects task update attempt by Associate through API with 403 Forbidden', async () => {
    const res = await request(app)
      .patch(`/api/v1/task-management/tasks/${associateTaskId}`)
      .set('Authorization', `Bearer ${associateToken}`)
      .send({
        title: 'Tampered Title by Associate',
        priority: 'Low',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);

    // Also verify PUT /api/tasks/:id rejects Associate
    const putRes = await request(app)
      .put(`/api/tasks/${associateTaskId}`)
      .set('Authorization', `Bearer ${associateToken}`)
      .send({ taskName: 'Associate Put Hack' });
    expect(putRes.status).toBe(403);
  });

  // TEST 3: Login as Lead. Attempt to edit own Lead task through subordinate task-management interface -> DENIED.
  it('TEST 3: rejects Lead attempting to modify own Lead task definitions with 403 Forbidden', async () => {
    const res = await request(app)
      .patch(`/api/v1/task-management/tasks/${leadTaskId}`)
      .set('Authorization', `Bearer ${leadToken}`)
      .send({
        title: 'Lead altering own task description',
        priority: 'Low',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Leads cannot manage other Leads or alter their own task definitions');
  });

  // TEST 4: Login as Lead A. Attempt to modify Associate belonging to Lead B -> DENIED.
  it('TEST 4: rejects Lead A attempting to modify Associate belonging to Lead B with 403 Forbidden', async () => {
    // Get task of associate B
    const assocBTask = await prisma.journeyTask.findFirst({
      where: { journey: { employeeProfile: { user: { email: 'associate.b@technova.demo' } } } },
    });
    expect(assocBTask).toBeDefined();

    const res = await request(app)
      .patch(`/api/v1/task-management/tasks/${assocBTask!.id}`)
      .set('Authorization', `Bearer ${leadToken}`) // Lead A
      .send({
        title: 'Unauthorized Cross-Team Edit',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // TEST 5: Login as Lead. Attempt to modify Manager task -> DENIED.
  it('TEST 5: rejects Lead attempting to modify a Manager task with 403 Forbidden', async () => {
    const res = await request(app)
      .patch(`/api/v1/task-management/tasks/${managerTaskId}`)
      .set('Authorization', `Bearer ${leadToken}`)
      .send({
        title: 'Lead trying to override Manager task',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // TEST 6: Login as Manager. Modify Lead task -> ALLOWED.
  it('TEST 6: allows Manager to modify Lead task and records audit history', async () => {
    const res = await request(app)
      .patch(`/api/v1/task-management/tasks/${leadTaskId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Updated Lead Architecture Alignment by Manager',
        priority: 'High',
        day: 'Day 3',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.task.title).toBe('Updated Lead Architecture Alignment by Manager');
    expect(res.body.task.priority).toBe('High');
    expect(res.body.task.isModified).toBe(true);
    expect(res.body.task.originType).toBe('MODIFIED');

    // Verify history audit record was logged
    const histRes = await request(app)
      .get(`/api/v1/task-management/tasks/${leadTaskId}/history`)
      .set('Authorization', `Bearer ${managerToken}`);
    expect(histRes.status).toBe(200);
    expect(histRes.body.count).toBeGreaterThan(0);
    expect(histRes.body.history[0].modifiedByRole).toBe('MANAGER');
  });

  // TEST 7: Login as Manager. Modify Associate task -> ALLOWED.
  it('TEST 7: allows Manager to modify Associate task', async () => {
    const res = await request(app)
      .patch(`/api/v1/task-management/tasks/${associateTaskId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        priority: 'High',
        day: 'Day 2',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.task.priority).toBe('High');
  });

  // TEST 8: Lead creates Associate task. Associate logs in -> New task appears.
  let createdAssociateTaskId: string;
  it('TEST 8: Lead creates task for assigned Associate; appears in Associate task plan', async () => {
    const res = await request(app)
      .post(`/api/v1/task-management/employees/${associateUser.id}/tasks`)
      .set('Authorization', `Bearer ${leadToken}`)
      .send({
        title: 'Meet Senior Technical Architect',
        description: '1-on-1 architecture design review session',
        day: 'Day 2',
        priority: 'High',
        category: 'MENTORING',
        estimatedDuration: '45 mins',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.task.originType).toBe('CUSTOM');
    expect(res.body.task.isCustom).toBe(true);
    createdAssociateTaskId = res.body.task.id;

    // Associate logs in and fetches tasks
    const assocViewRes = await request(app)
      .get(`/api/v1/task-management/employees/${associateUser.id}/tasks`)
      .set('Authorization', `Bearer ${associateToken}`);

    expect(assocViewRes.status).toBe(200);
    const found = assocViewRes.body.tasks.find((t: any) => t.id === createdAssociateTaskId);
    expect(found).toBeDefined();
    expect(found.title).toBe('Meet Senior Technical Architect');
    expect(found.originType).toBe('CUSTOM');
  });

  // TEST 9: Manager modifies that task -> Associate sees Manager latest version.
  it('TEST 9: Manager overrides the Lead-created task; Associate sees authoritative Manager update', async () => {
    const mgrEditRes = await request(app)
      .patch(`/api/v1/task-management/tasks/${createdAssociateTaskId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Meet Principal Cloud Architect (Manager Overridden)',
        priority: 'Medium',
        day: 'Day 4',
      });

    expect(mgrEditRes.status).toBe(200);
    expect(mgrEditRes.body.task.title).toBe('Meet Principal Cloud Architect (Manager Overridden)');

    // Associate inspects task plan
    const assocViewRes = await request(app)
      .get(`/api/v1/task-management/employees/${associateUser.id}/tasks`)
      .set('Authorization', `Bearer ${associateToken}`);

    expect(assocViewRes.status).toBe(200);
    const task = assocViewRes.body.tasks.find((t: any) => t.id === createdAssociateTaskId);
    expect(task.title).toBe('Meet Principal Cloud Architect (Manager Overridden)');
    expect(task.day).toBe('Day 4');
  });

  // TEST 10: Associate completes task. Manager and Lead see updated completion status.
  it('TEST 10: Associate completes task; Lead and Manager see updated completion status', async () => {
    // Complete the task
    const completeRes = await request(app)
      .post(`/api/v1/tasks/${createdAssociateTaskId}/complete`)
      .set('Authorization', `Bearer ${associateToken}`);

    expect(completeRes.status).toBe(200);

    // Lead verifies completion
    const leadViewRes = await request(app)
      .get(`/api/v1/task-management/employees/${associateUser.id}/tasks`)
      .set('Authorization', `Bearer ${leadToken}`);

    expect(leadViewRes.status).toBe(200);
    const leadTaskView = leadViewRes.body.tasks.find((t: any) => t.id === createdAssociateTaskId);
    expect(leadTaskView.state).toBe('DONE');
    expect(leadTaskView.status).toBe('Completed');

    // Manager verifies completion
    const mgrViewRes = await request(app)
      .get(`/api/v1/task-management/employees/${associateUser.id}/tasks`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(mgrViewRes.status).toBe(200);
    const mgrTaskView = mgrViewRes.body.tasks.find((t: any) => t.id === createdAssociateTaskId);
    expect(mgrTaskView.state).toBe('DONE');
  });

  // Additional Concurrency & Conflict Test (Section 20)
  it('Section 20: detects stale version conflict and prevents silent data overwrite', async () => {
    // Attempt edit with old version (e.g. version 0)
    const conflictRes = await request(app)
      .patch(`/api/v1/task-management/tasks/${createdAssociateTaskId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Conflict overwrite attempt',
        expectedVersion: 0,
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.conflict).toBe(true);
    expect(conflictRes.body.error).toContain('This task was updated by another manager');
  });

  // Soft removal / archiving test (Section 7 & 17)
  it('Section 7: archiving a completed task preserves completion records and removes from active count', async () => {
    const archiveRes = await request(app)
      .post(`/api/v1/task-management/tasks/${createdAssociateTaskId}/archive`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.task.managementStatus).toBe('ARCHIVED');

    // Historical completion still preserved on task
    const checkTask = await prisma.journeyTask.findUnique({
      where: { id: createdAssociateTaskId },
    });
    expect(checkTask?.managementStatus).toBe('ARCHIVED');
    expect(checkTask?.state).toBe('DONE'); // Progress preserved!

    // Restore task
    const restoreRes = await request(app)
      .post(`/api/v1/task-management/tasks/${createdAssociateTaskId}/restore`)
      .set('Authorization', `Bearer ${managerToken}`);
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.task.managementStatus).toBe('ACTIVE');
  });
});
