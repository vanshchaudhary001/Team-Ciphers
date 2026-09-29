import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { findDownstreamTaskIds } from '../services/dependencyEngine.js';
import { aiService } from '../services/aiService.js';

const router = Router();

// POST /api/v1/unstick/analyze
router.post('/analyze', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId, query, category } = req.body;

    if (!taskId && !query) {
      return res.status(400).json({
        success: false,
        error: 'Either taskId or a natural language query is required for UNSTICK analysis',
      });
    }

    const result = await aiService.processUnstickQuery(
      req.user!.id,
      query || 'Why is this task blocked?',
      taskId
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/blockers/:id
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const blockerId = String(req.params.id);
    const blocker = await prisma.blocker.findUnique({
      where: { id: blockerId },
      include: {
        rootTask: {
          include: { ownerGroup: true },
        },
        affectedTask: true,
        responsibleOwnerGroup: {
          include: {
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
        journey: {
          include: {
            employeeProfile: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
    });

    if (!blocker) {
      return res.status(404).json({ success: false, error: 'Blocker not found' });
    }

    return res.json({ success: true, blocker });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/blockers/:id/impact
router.get('/:id/impact', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const blockerId = String(req.params.id);
    const blocker = await prisma.blocker.findUnique({
      where: { id: blockerId },
      include: {
        journey: {
          include: { tasks: true },
        },
      },
    });

    if (!blocker) {
      return res.status(404).json({ success: false, error: 'Blocker not found' });
    }

    const dependencies = await prisma.journeyTaskDependency.findMany({
      where: { journeyTask: { journeyId: blocker.journeyId } },
    });

    const downstreamIds = findDownstreamTaskIds(blocker.rootTaskId, dependencies);
    const impactedTasks = (blocker as any).journey.tasks.filter((t: any) => downstreamIds.includes(t.id));

    return res.json({
      success: true,
      rootTaskId: blocker.rootTaskId,
      downstreamImpactCount: impactedTasks.length,
      impactedTasks: impactedTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        state: t.state,
        purpose: t.purpose,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/blockers/:id/nudge
router.post('/:id/nudge', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const blockerId = String(req.params.id);
    const blocker = await prisma.blocker.findUnique({
      where: { id: blockerId },
      include: {
        rootTask: { include: { ownerGroup: true } },
        journey: {
          include: {
            employeeProfile: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
    });

    if (!blocker) {
      return res.status(404).json({ success: false, error: 'Blocker not found' });
    }

    // Rate limiting: check last nudged timestamp
    if (blocker.lastNudgedAt) {
      const diffSec = (Date.now() - new Date(blocker.lastNudgedAt).getTime()) / 1000;
      if (diffSec < 10) {
        return res.status(429).json({
          success: false,
          error: `Please wait ${Math.ceil(10 - diffSec)} seconds before nudging again to prevent alert fatigue.`,
        });
      }
    }

    // Update blocker record
    const updated = await prisma.blocker.update({
      where: { id: blocker.id },
      data: {
        nudgedCount: { increment: 1 },
        lastNudgedAt: new Date(),
      },
    });

    const blockerData = blocker as any;

    // Record audit log
    await prisma.auditLog.create({
      data: {
        companyId: blocker.companyId,
        userId: req.user!.id,
        action: 'BLOCKER_NUDGED',
        entityType: 'Blocker',
        entityId: blocker.id,
        reason: req.body.reason || 'Gentle nudge requested regarding pending dependency',
        metadata: JSON.stringify({
          nudgeCount: updated.nudgedCount,
          rootTask: blockerData.rootTask?.title,
          nudgedBy: req.user!.name,
        }),
      },
    });

    // Find recipient: owner user or owner group members
    let recipientUserId = blocker.responsibleUserId;
    if (!recipientUserId && blocker.responsibleOwnerGroupId) {
      const member = await prisma.ownerGroupMember.findFirst({
        where: { ownerGroupId: blocker.responsibleOwnerGroupId },
      });
      if (member) recipientUserId = member.userId;
    }

    // Create Notification
    if (recipientUserId) {
      await prisma.notification.create({
        data: {
          companyId: blocker.companyId,
          userId: recipientUserId,
          type: 'OWNER_NUDGE',
          title: `Nudge: ${blockerData.rootTask?.title}`,
          message: `${req.user!.name} sent a friendly reminder about "${blockerData.rootTask?.title}" for ${blockerData.journey?.employeeProfile?.user?.name}.`,
          relatedTaskId: blocker.rootTaskId,
          relatedBlockerId: blocker.id,
        },
      });
    }

    return res.json({
      success: true,
      message: `Nudge successfully sent to ${blockerData.rootTask?.ownerGroup?.name || 'task owner'}.`,
      blocker: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/blockers/:id/escalate
router.post('/:id/escalate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const blockerId = String(req.params.id);
    const blocker = await prisma.blocker.findUnique({
      where: { id: blockerId },
      include: {
        rootTask: { include: { ownerGroup: true } },
        journey: {
          include: {
            employeeProfile: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
    });

    if (!blocker) {
      return res.status(404).json({ success: false, error: 'Blocker not found' });
    }

    const updated = await prisma.blocker.update({
      where: { id: blocker.id },
      data: {
        status: 'ESCALATED',
        escalatedAt: new Date(),
      },
    });

    const blockerData = blocker as any;

    // Record audit log
    await prisma.auditLog.create({
      data: {
        companyId: blocker.companyId,
        userId: req.user!.id,
        action: 'BLOCKER_ESCALATED',
        entityType: 'Blocker',
        entityId: blocker.id,
        reason: reason || 'SLA breach or mission-critical blocker escalation',
        metadata: JSON.stringify({
          escalatedBy: req.user!.name,
          rootTask: blockerData.rootTask?.title,
        }),
      },
    });

    // Notify HR Admins
    const hrUsers = await prisma.user.findMany({
      where: {
        companyId: blocker.companyId,
        role: { in: ['HR_ADMIN', 'COMPANY_ADMIN'] },
      },
    });

    for (const hr of hrUsers) {
      await prisma.notification.create({
        data: {
          companyId: blocker.companyId,
          userId: hr.id,
          type: 'SLA_BREACH',
          title: `ESCALATION: ${blockerData.rootTask?.title}`,
          message: `Blocker on "${blockerData.rootTask?.title}" has been escalated for ${blockerData.journey?.employeeProfile?.user?.name}. Reason: ${reason || 'Priority escalation'}.`,
          relatedTaskId: blocker.rootTaskId,
          relatedBlockerId: blocker.id,
        },
      });
    }

    return res.json({
      success: true,
      message: 'Blocker escalated to HR & Leadership',
      blocker: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
