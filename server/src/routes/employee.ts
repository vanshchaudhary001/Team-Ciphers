import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import {
  recalculateJourney,
  findDownstreamTaskIds,
} from '../services/dependencyEngine.js';

const router = Router();

// GET /api/v1/me/journey
router.get('/journey', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        employeeProfile: {
          include: {
            department: true,
            location: true,
            role: true,
            journeys: {
              include: {
                tasks: {
                  include: {
                    ownerGroup: true,
                    assignedUser: { select: { id: true, name: true, email: true } },
                    notes: true,
                  },
                  orderBy: { orderIndex: 'asc' },
                },
                blockers: {
                  where: { status: 'ACTIVE' },
                  include: {
                    rootTask: true,
                    affectedTask: true,
                    responsibleOwnerGroup: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.employeeProfile) {
      return res.status(404).json({ success: false, error: 'Employee profile not found' });
    }

    const journey = user.employeeProfile.journeys[0];
    if (!journey) {
      return res.status(404).json({ success: false, error: 'No active journey found for employee' });
    }

    // Load all task dependencies in this journey
    const dependencies = await prisma.journeyTaskDependency.findMany({
      where: { journeyTask: { journeyId: journey.id } },
    });

    // Attach prerequisites and downstream dependents to each task
    const tasksWithDeps = journey.tasks.map((task) => {
      const prereqs = dependencies
        .filter((d) => d.journeyTaskId === task.id)
        .map((d) => d.dependsOnTaskId);

      const downstream = dependencies
        .filter((d) => d.dependsOnTaskId === task.id)
        .map((d) => d.journeyTaskId);

      return {
        ...task,
        prerequisiteIds: prereqs,
        downstreamIds: downstream,
      };
    });

    // Recommended Next Move: first task that is AVAILABLE
    const nextMove = tasksWithDeps.find((t) => t.state === 'AVAILABLE') || null;

    const stats = {
      total: tasksWithDeps.length,
      done: tasksWithDeps.filter((t) => t.state === 'DONE').length,
      available: tasksWithDeps.filter((t) => t.state === 'AVAILABLE').length,
      waiting: tasksWithDeps.filter((t) => t.state === 'WAITING').length,
      locked: tasksWithDeps.filter((t) => t.state === 'LOCKED').length,
    };

    return res.json({
      success: true,
      profile: user.employeeProfile,
      journey: {
        id: journey.id,
        name: journey.name,
        health: journey.health,
        startDate: journey.startDate,
        stats,
        nextMove,
        tasks: tasksWithDeps,
        activeBlockers: journey.blockers,
        dependencies,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/me/sidequests
router.get('/sidequests', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        employeeProfile: {
          include: {
            journeys: {
              include: {
                tasks: {
                  include: { ownerGroup: true },
                },
                blockers: {
                  where: { status: 'ACTIVE' },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.employeeProfile || !user.employeeProfile.journeys[0]) {
      return res.status(404).json({ success: false, error: 'Journey not found' });
    }

    const journey = user.employeeProfile.journeys[0];
    const dependencies = await prisma.journeyTaskDependency.findMany({
      where: { journeyTask: { journeyId: journey.id } },
    });

    // Collect all downstream task IDs affected by any active blocker
    const blockedDownstreamIds = new Set<string>();
    for (const blocker of journey.blockers) {
      const down = findDownstreamTaskIds(blocker.rootTaskId, dependencies);
      down.forEach((id) => blockedDownstreamIds.add(id));
      blockedDownstreamIds.add(blocker.rootTaskId);
      blockedDownstreamIds.add(blocker.affectedTaskId);
    }

    // SideQuests are AVAILABLE tasks that do not depend on the active blockers
    const sidequests = journey.tasks.filter((task) => {
      if (task.state !== 'AVAILABLE') return false;
      if (blockedDownstreamIds.has(task.id)) return false;
      return true;
    });

    return res.json({
      success: true,
      sidequests: sidequests.map((t) => ({
        id: t.id,
        title: t.title,
        purpose: t.purpose,
        instructions: t.instructions,
        category: t.category,
        slaHours: t.slaHours,
        state: t.state,
        reason: 'All prerequisites satisfied; completely independent from active blocker chain.',
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/tasks/:id
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId = String(req.params.id);
    const task = await prisma.journeyTask.findUnique({
      where: { id: taskId },
      include: {
        journey: {
          include: {
            employeeProfile: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
        ownerGroup: true,
        assignedUser: { select: { id: true, name: true, email: true } },
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Tenant check
    if (task.companyId !== req.user!.companyId && req.user!.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ success: false, error: 'Cross-tenant access prohibited' });
    }

    const dependencies = await prisma.journeyTaskDependency.findMany({
      where: { journeyTask: { journeyId: task.journeyId } },
    });

    const prereqIds = dependencies
      .filter((d) => d.journeyTaskId === task.id)
      .map((d) => d.dependsOnTaskId);

    const downstreamIds = dependencies
      .filter((d) => d.dependsOnTaskId === task.id)
      .map((d) => d.journeyTaskId);

    const relatedTasks = await prisma.journeyTask.findMany({
      where: { id: { in: [...prereqIds, ...downstreamIds] } },
    });

    const prerequisites = relatedTasks.filter((t) => prereqIds.includes(t.id));
    const downstream = relatedTasks.filter((t) => downstreamIds.includes(t.id));

    // Fetch matching approved knowledge resources
    const resources = await prisma.knowledgeSource.findMany({
      where: {
        companyId: task.companyId,
        status: 'APPROVED',
      },
      take: 3,
    });

    return res.json({
      success: true,
      task: {
        ...task,
        prerequisites,
        downstream,
        approvedResources: resources,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/tasks/:id/complete
router.post('/:id/complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId = String(req.params.id);
    const task = await prisma.journeyTask.findUnique({
      where: { id: taskId },
      include: {
        journey: {
          include: { employeeProfile: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Check authorization: must be user's own task or authorized admin/owner
    const isOwner = task.journey.employeeProfile.userId === req.user!.id;
    const isPrivileged = ['HR_ADMIN', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'].includes(req.user!.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to complete this employee task',
      });
    }

    // If task requires owner approval and current actor is just the employee:
    if (task.ownerGroupId && !isPrivileged) {
      return res.status(400).json({
        success: false,
        error: 'This task requires external owner approval and cannot be self-completed by the employee.',
      });
    }

    // Must be in AVAILABLE state or WAITING (if privileged)
    if (task.state === 'LOCKED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot complete a LOCKED task until all upstream prerequisites are resolved.',
      });
    }

    // Prevent duplicate completion
    if (task.state === 'DONE') {
      return res.status(400).json({
        success: false,
        error: 'This task is already completed.',
      });
    }

    // Update task to DONE
    const updated = await prisma.journeyTask.update({
      where: { id: task.id },
      data: {
        state: 'DONE',
        completedAt: new Date(),
        completedBy: req.user!.name,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        companyId: task.companyId,
        userId: req.user!.id,
        action: 'TASK_COMPLETED',
        entityType: 'JourneyTask',
        entityId: task.id,
        previousState: task.state,
        newState: 'DONE',
        reason: 'Marked complete by user',
      },
    });

    // Recalculate downstream graph
    const recalculation = await recalculateJourney(task.journeyId);

    // Create notification
    await prisma.notification.create({
      data: {
        companyId: task.companyId,
        userId: task.journey.employeeProfile.userId,
        type: 'TASK_COMPLETED',
        title: `Task Completed: ${task.title}`,
        message: `Great job! "${task.title}" has been completed. Downstream dependencies recalculating.`,
        relatedTaskId: task.id,
      },
    });

    return res.json({
      success: true,
      message: 'Task completed successfully',
      task: updated,
      recalculation,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/tasks/:id/still-not-working
router.post('/:id/still-not-working', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide a reason why this is not working' });
    }

    const taskId = String(req.params.id);
    const task = await prisma.journeyTask.findUnique({
      where: { id: taskId },
      include: {
        journey: {
          include: { employeeProfile: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Flag task and preserve prior completion in audit log
    const updated = await prisma.journeyTask.update({
      where: { id: task.id },
      data: {
        stillNotWorkingReason: reason,
        flaggedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: task.companyId,
        userId: req.user!.id,
        action: 'TASK_FLAGGED_NOT_WORKING',
        entityType: 'JourneyTask',
        entityId: task.id,
        reason,
        metadata: JSON.stringify({ flaggedBy: req.user!.name, previousState: task.state }),
      },
    });

    // Notify HR / Owner
    await prisma.notification.create({
      data: {
        companyId: task.companyId,
        userId: task.journey.employeeProfile.userId,
        type: 'BLOCKER_DETECTED',
        title: `Issue Reported: ${task.title}`,
        message: `Employee reported: "${reason}". IT and HR have been alerted.`,
        relatedTaskId: task.id,
      },
    });

    return res.json({
      success: true,
      message: 'Issue reported to support team',
      task: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
