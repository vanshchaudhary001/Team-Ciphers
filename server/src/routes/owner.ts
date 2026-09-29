import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { recalculateJourney, findDownstreamTaskIds } from '../services/dependencyEngine.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('TASK_OWNER', 'HR_ADMIN', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'));

// GET /api/v1/owner/actions
router.get('/actions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const companyId = req.user!.companyId;

    const memberships = await prisma.ownerGroupMember.findMany({
      where: { userId },
      select: { ownerGroupId: true },
    });
    const groupIds = memberships.map((m) => m.ownerGroupId);

    const tasks = await prisma.journeyTask.findMany({
      where: {
        companyId,
        state: { in: ['WAITING', 'AVAILABLE'] },
        OR: [
          { assignedUserId: userId },
          { ownerGroupId: { in: groupIds } },
          ...(req.user!.role === 'COMPANY_ADMIN' || req.user!.role === 'HR_ADMIN' ? [{ ownerGroupId: { not: null } }] : []),
        ],
      },
      include: {
        journey: {
          include: {
            employeeProfile: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                department: true,
                location: true,
              },
            },
          },
        },
        ownerGroup: true,
        notes: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const actionsWithImpact = await Promise.all(
      tasks.map(async (t) => {
        const deps = await prisma.journeyTaskDependency.findMany({
          where: { journeyTask: { journeyId: t.journeyId } },
        });

        const downstreamIds = findDownstreamTaskIds(t.id, deps);
        const waitingHours = Math.max(
          1,
          Math.round((Date.now() - new Date(t.updatedAt || t.createdAt).getTime()) / (1000 * 60 * 60))
        );

        return {
          id: t.id,
          title: t.title,
          purpose: t.purpose,
          instructions: t.instructions,
          state: t.state,
          category: t.category,
          slaHours: t.slaHours,
          waitingHours,
          delayReason: t.delayReason,
          stillNotWorkingReason: t.stillNotWorkingReason,
          employee: {
            name: t.journey.employeeProfile.user.name,
            email: t.journey.employeeProfile.user.email,
            department: t.journey.employeeProfile.department?.name || 'Engineering',
            location: t.journey.employeeProfile.location?.name || 'Bengaluru',
            joiningDate: t.journey.employeeProfile.joiningDate,
          },
          ownerGroupName: t.ownerGroup?.name || 'Unassigned Team',
          downstreamImpactCount: downstreamIds.length,
          notes: t.notes,
        };
      })
    );

    return res.json({
      success: true,
      actions: actionsWithImpact,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/owner/tasks/:id/approve
router.post('/tasks/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
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
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (task.companyId !== req.user!.companyId && req.user!.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ success: false, error: 'Cross-tenant access prohibited' });
    }

    const updated = await prisma.journeyTask.update({
      where: { id: task.id },
      data: {
        state: 'DONE',
        completedAt: new Date(),
        completedBy: req.user!.name,
      },
    });

    const taskData = task as any;

    await prisma.auditLog.create({
      data: {
        companyId: task.companyId,
        userId: req.user!.id,
        action: 'OWNER_APPROVED',
        entityType: 'JourneyTask',
        entityId: task.id,
        previousState: task.state,
        newState: 'DONE',
        reason: 'Approved by task owner',
        metadata: JSON.stringify({
          taskTitle: task.title,
          approvedBy: req.user!.name,
          employee: taskData.journey?.employeeProfile?.user?.name,
        }),
      },
    });

    // Recalculate downstream graph — unlocks downstream tasks!
    const recalculation = await recalculateJourney(task.journeyId);

    // Notify employee
    await prisma.notification.create({
      data: {
        companyId: task.companyId,
        userId: taskData.journey.employeeProfile.userId,
        type: 'DEPENDENCY_UNLOCKED',
        title: `Prerequisite Approved: ${task.title}`,
        message: `${req.user!.name} approved "${task.title}". Your downstream tasks have now unlocked and are available to start!`,
        relatedTaskId: task.id,
      },
    });

    return res.json({
      success: true,
      message: `"${task.title}" approved successfully. Downstream dependencies recalculated.`,
      task: updated,
      recalculation,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/owner/tasks/:id/delay
router.post('/tasks/:id/delay', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason, newEtaHours } = req.body;
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'A valid delay reason is required' });
    }

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
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const updated = await prisma.journeyTask.update({
      where: { id: task.id },
      data: {
        delayReason: reason,
        dueAt: newEtaHours ? new Date(Date.now() + newEtaHours * 60 * 60 * 1000) : task.dueAt,
      },
    });

    const taskData = task as any;

    await prisma.auditLog.create({
      data: {
        companyId: task.companyId,
        userId: req.user!.id,
        action: 'TASK_DELAYED',
        entityType: 'JourneyTask',
        entityId: task.id,
        reason,
        metadata: JSON.stringify({ delayedBy: req.user!.name, newEtaHours }),
      },
    });

    await prisma.notification.create({
      data: {
        companyId: task.companyId,
        userId: taskData.journey.employeeProfile.userId,
        type: 'TASK_DELAYED',
        title: `Task Delayed: ${task.title}`,
        message: `Status update from owner: "${reason}". Please proceed with other available tasks.`,
        relatedTaskId: task.id,
      },
    });

    return res.json({
      success: true,
      message: 'Task delay logged and notified to employee',
      task: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/owner/tasks/:id/reassign
router.post('/tasks/:id/reassign', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ success: false, error: 'Target owner user ID required' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser || targetUser.companyId !== req.user!.companyId) {
      return res.status(400).json({ success: false, error: 'Invalid target owner user in company' });
    }

    const taskId = String(req.params.id);
    const task = await prisma.journeyTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const updated = await prisma.journeyTask.update({
      where: { id: task.id },
      data: { assignedUserId: targetUserId },
    });

    await prisma.auditLog.create({
      data: {
        companyId: task.companyId,
        userId: req.user!.id,
        action: 'REASSIGNED',
        entityType: 'JourneyTask',
        entityId: task.id,
        reason: `Reassigned from ${req.user!.name} to ${targetUser.name}`,
      },
    });

    return res.json({
      success: true,
      message: `Task successfully reassigned to ${targetUser.name}`,
      task: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/owner/tasks/:id/notes
router.post('/tasks/:id/notes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { note } = req.body;
    if (!note || note.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Note text is required' });
    }

    const taskId = String(req.params.id);
    const noteRecord = await prisma.taskNote.create({
      data: {
        journeyTaskId: taskId,
        userId: req.user!.id,
        authorName: req.user!.name,
        authorRole: req.user!.role,
        note,
      },
    });

    return res.json({
      success: true,
      note: noteRecord,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
