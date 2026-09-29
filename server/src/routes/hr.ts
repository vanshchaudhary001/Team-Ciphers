import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { findDownstreamTaskIds } from '../services/dependencyEngine.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'));

// GET /api/v1/hr/dashboard
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    const employees = await prisma.employeeProfile.findMany({
      where: { companyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: true,
        role: true,
        journeys: {
          include: {
            tasks: true,
            blockers: {
              where: { status: 'ACTIVE' },
              include: {
                rootTask: { include: { ownerGroup: true } },
                affectedTask: true,
                responsibleOwnerGroup: true,
              },
            },
          },
        },
      },
    });

    const activeJourneys = employees.flatMap((e) => e.journeys);

    const flowingCount = activeJourneys.filter((j) => j.health === 'FLOWING').length;
    const detouringCount = activeJourneys.filter((j) => j.health === 'DETOURING').length;
    const stalledCount = activeJourneys.filter((j) => j.health === 'STALLED').length;

    // Load all active blockers
    const activeBlockers = await prisma.blocker.findMany({
      where: { companyId, status: 'ACTIVE' },
      include: {
        journey: {
          include: {
            employeeProfile: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
        rootTask: { include: { ownerGroup: true } },
        affectedTask: true,
        responsibleOwnerGroup: true,
      },
      orderBy: { detectedAt: 'asc' },
    });

    const blockersWithImpact = await Promise.all(
      activeBlockers.map(async (b) => {
        const deps = await prisma.journeyTaskDependency.findMany({
          where: { journeyTask: { journeyId: b.journeyId } },
        });

        const downstreamIds = findDownstreamTaskIds(b.rootTaskId, deps);
        const waitingHours = Math.max(
          1,
          Math.round((Date.now() - new Date(b.detectedAt).getTime()) / (1000 * 60 * 60))
        );

        const slaHours = b.rootTask.slaHours || 24;
        const isSlaBreached = waitingHours > slaHours;

        return {
          id: b.id,
          employeeName: b.journey.employeeProfile.user.name,
          employeeEmail: b.journey.employeeProfile.user.email,
          rootBlockerTitle: b.rootTask.title,
          affectedTaskTitle: b.affectedTask.title,
          responsibleOwner: b.responsibleOwnerGroup?.name || 'IT Operations',
          waitingHours,
          slaHours,
          isSlaBreached,
          downstreamImpactCount: downstreamIds.length,
          status: b.status,
          nudgedCount: b.nudgedCount,
          lastNudgedAt: b.lastNudgedAt,
          detectedAt: b.detectedAt,
        };
      })
    );

    const slaBreachCount = blockersWithImpact.filter((b) => b.isSlaBreached).length;

    return res.json({
      success: true,
      summary: {
        activeJoiners: employees.length,
        flowingCount,
        detouringCount,
        stalledCount,
        activeBlockersCount: blockersWithImpact.length,
        slaBreachCount,
      },
      blockers: blockersWithImpact,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/hr/employees
router.get('/employees', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { department, health, search } = req.query;

    const employees = await prisma.employeeProfile.findMany({
      where: {
        companyId,
        ...(department ? { department: { name: String(department) } } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: true,
        location: true,
        role: true,
        journeys: {
          include: {
            tasks: true,
            blockers: { where: { status: 'ACTIVE' } },
          },
        },
      },
    });

    let filtered = employees;

    if (health) {
      filtered = filtered.filter((e) => e.journeys.some((j) => j.health === health));
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.user.name.toLowerCase().includes(q) ||
          e.user.email.toLowerCase().includes(q) ||
          e.department?.name.toLowerCase().includes(q)
      );
    }

    const result = filtered.map((e) => {
      const journey = e.journeys[0];
      const tasks = journey ? journey.tasks : [];
      return {
        id: e.id,
        userId: e.userId,
        name: e.user.name,
        email: e.user.email,
        department: e.department?.name || 'General',
        location: e.location?.name || 'Remote',
        role: e.role?.title || 'Team Member',
        workMode: e.workMode,
        joiningDate: e.joiningDate,
        preJoinStatus: e.preJoinStatus,
        journeyId: journey?.id,
        journeyHealth: journey?.health || 'FLOWING',
        totalTasks: tasks.length,
        doneTasks: tasks.filter((t) => t.state === 'DONE').length,
        waitingTasks: tasks.filter((t) => t.state === 'WAITING').length,
        lockedTasks: tasks.filter((t) => t.state === 'LOCKED').length,
        availableTasks: tasks.filter((t) => t.state === 'AVAILABLE').length,
        activeBlockersCount: journey?.blockers.length || 0,
      };
    });

    return res.json({ success: true, employees: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/hr/employees/:id
router.get('/employees/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profileId = String(req.params.id);
    const profile = await prisma.employeeProfile.findUnique({
      where: { id: profileId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: true,
        location: true,
        role: true,
        journeys: {
          include: {
            tasks: {
              include: {
                ownerGroup: true,
                assignedUser: { select: { id: true, name: true } },
                notes: true,
              },
              orderBy: { orderIndex: 'asc' },
            },
            blockers: {
              where: { status: 'ACTIVE' },
              include: {
                rootTask: { include: { ownerGroup: true } },
                affectedTask: true,
                responsibleOwnerGroup: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    if (profile.companyId !== req.user!.companyId && req.user!.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ success: false, error: 'Cross-tenant access prohibited' });
    }

    const journey = (profile as any).journeys?.[0];
    let dependencies: any[] = [];
    if (journey) {
      dependencies = await prisma.journeyTaskDependency.findMany({
        where: { journeyTask: { journeyId: journey.id } },
      });
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        companyId: profile.companyId,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return res.json({
      success: true,
      profile,
      journey,
      dependencies,
      auditLogs,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/hr/joiners
router.post('/joiners', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, roleTitle, departmentCode, locationName, managerName, buddyName, workMode, joiningDate } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    const companyId = req.user!.companyId;

    const user = await prisma.user.create({
      data: {
        companyId,
        name,
        email,
        passwordHash: '$2a$10$wT3J0r72.g1.99eWfX20gO1GqX/Y1M6K5F7R4a8B.7L6C2v/U3YqG', // demo1234
        role: 'EMPLOYEE',
        title: roleTitle || 'Team Member',
      },
    });

    const department = await prisma.department.findFirst({
      where: { companyId, code: departmentCode || 'ENG' },
    });

    const location = await prisma.location.findFirst({
      where: { companyId, name: locationName || 'Bengaluru' },
    });

    const profile = await prisma.employeeProfile.create({
      data: {
        userId: user.id,
        companyId,
        departmentId: department?.id,
        locationId: location?.id,
        managerName: managerName || 'Priya Sharma',
        buddyName: buddyName || 'Rahul Mehta',
        workMode: workMode || 'HYBRID',
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        preJoinStatus: 'READY',
      },
    });

    const journey = await prisma.journey.create({
      data: {
        companyId,
        employeeProfileId: profile.id,
        name: `${roleTitle || 'Standard'} First-Week Journey`,
        health: 'FLOWING',
      },
    });

    const t1 = await prisma.journeyTask.create({
      data: {
        journeyId: journey.id,
        companyId,
        title: 'Account Setup & SSO Activation',
        purpose: 'Activate corporate email and multi-factor authentication.',
        category: 'ACCESS',
        state: 'AVAILABLE',
        orderIndex: 1,
      },
    });

    const t2 = await prisma.journeyTask.create({
      data: {
        journeyId: journey.id,
        companyId,
        title: 'Security Awareness Module',
        purpose: 'Complete basic cybersecurity awareness training.',
        category: 'TRAINING',
        state: 'LOCKED',
        orderIndex: 2,
      },
    });

    await prisma.journeyTaskDependency.create({
      data: { journeyTaskId: t2.id, dependsOnTaskId: t1.id },
    });

    return res.status(201).json({
      success: true,
      message: 'New joiner created successfully with personalized journey',
      profile,
      journey,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/hr/knowledge-gaps
router.get('/knowledge-gaps', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const gaps = await prisma.knowledgeGap.findMany({
      where: { companyId: req.user!.companyId },
      orderBy: { occurrenceCount: 'desc' },
    });

    return res.json({ success: true, gaps });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/hr/knowledge-gaps/:id/documentation-task
router.post('/knowledge-gaps/:id/documentation-task', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const gapId = String(req.params.id);
    const gap = await prisma.knowledgeGap.findUnique({
      where: { id: gapId },
    });

    if (!gap) {
      return res.status(404).json({ success: false, error: 'Knowledge gap not found' });
    }

    const updated = await prisma.knowledgeGap.update({
      where: { id: gap.id },
      data: { status: 'IN_PROGRESS' },
    });

    await prisma.auditLog.create({
      data: {
        companyId: gap.companyId,
        userId: req.user!.id,
        action: 'KNOWLEDGE_GAP_TASK_CREATED',
        entityType: 'KnowledgeGap',
        entityId: gap.id,
        reason: 'Converted repeated question into documentation task',
        metadata: JSON.stringify({ question: gap.normalizedQuestion }),
      },
    });

    return res.json({
      success: true,
      message: 'Documentation task created for knowledge gap',
      gap: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/hr/pre-join-readiness
router.get('/pre-join-readiness', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const employees = await prisma.employeeProfile.findMany({
      where: { companyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: true,
        journeys: {
          include: {
            tasks: true,
            blockers: { where: { status: 'ACTIVE' }, include: { rootTask: true } },
          },
        },
      },
    });

    const readinessList = employees.map((emp) => {
      const journey = emp.journeys[0];
      const tasks = journey?.tasks || [];
      const blockers = journey?.blockers || [];

      const laptopTask = tasks.find((t) => t.category === 'EQUIPMENT' || t.title.toLowerCase().includes('laptop'));
      const vpnTask = tasks.find((t) => t.title.toLowerCase().includes('vpn'));
      const docsTask = tasks.find((t) => t.category === 'HR' || t.title.toLowerCase().includes('document'));

      let status = emp.preJoinStatus;
      let reasons: string[] = [];

      if (blockers.length > 0) {
        status = 'AT_RISK';
        reasons = blockers.map((b) => b.rootCauseSummary);
      }

      if (laptopTask && laptopTask.state === 'WAITING') {
        status = 'BLOCKED';
        reasons.push('Laptop hardware dispatch is waiting.');
      } else if (vpnTask && vpnTask.state === 'WAITING') {
        status = 'AT_RISK';
        reasons.push('VPN clearance pending with IT.');
      }

      return {
        employeeId: emp.id,
        name: emp.user.name,
        email: emp.user.email,
        department: emp.department?.name || 'Engineering',
        joiningDate: emp.joiningDate,
        status,
        reasons,
        checklist: {
          laptop: laptopTask?.state || 'AVAILABLE',
          vpn: vpnTask?.state || 'WAITING',
          documentation: docsTask?.state || 'AVAILABLE',
          buddyAssigned: !!emp.buddyName,
          managerAssigned: !!emp.managerName,
        },
      };
    });

    return res.json({ success: true, readiness: readinessList });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
