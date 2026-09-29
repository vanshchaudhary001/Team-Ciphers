import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// GET /api/v1/help/requests
router.get('/requests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isHrOrAdmin = ['HR_ADMIN', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'].includes(req.user!.role);

    const requests = await prisma.humanHelpRequest.findMany({
      where: {
        companyId: req.user!.companyId,
        ...(isHrOrAdmin
          ? {}
          : { employeeProfile: { userId: req.user!.id } }),
      },
      include: {
        employeeProfile: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, requests });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/help/requests
router.post('/requests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetType, subject, message, urgency } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, error: 'Subject and message are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { employeeProfile: true },
    });

    if (!user || !user.employeeProfile) {
      return res.status(404).json({ success: false, error: 'Employee profile not found' });
    }

    const request = await prisma.humanHelpRequest.create({
      data: {
        companyId: user.companyId,
        employeeProfileId: user.employeeProfile.id,
        targetType: targetType || 'HR',
        subject,
        message,
        urgency: urgency || 'NORMAL',
        status: 'OPEN',
      },
    });

    // Notify HR
    const hrAdmins = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
        role: { in: ['HR_ADMIN', 'COMPANY_ADMIN'] },
      },
    });

    for (const admin of hrAdmins) {
      await prisma.notification.create({
        data: {
          companyId: user.companyId,
          userId: admin.id,
          type: 'HUMAN_HELP_UPDATE',
          title: `Human Help Request: ${subject}`,
          message: `${user.name} requested assistance (${targetType || 'HR'}): "${message.slice(0, 100)}..."`,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Human help request submitted successfully. A representative will contact you shortly.',
      request,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/help/requests/:id/respond
router.post('/requests/:id/respond', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { responseText, status } = req.body;
    if (!responseText) {
      return res.status(400).json({ success: false, error: 'Response text is required' });
    }

    const requestId = String(req.params.id);
    const existing = await prisma.humanHelpRequest.findUnique({
      where: { id: requestId },
      include: { employeeProfile: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const updated = await prisma.humanHelpRequest.update({
      where: { id: requestId },
      data: {
        response: responseText,
        status: status || 'RESOLVED',
        assignedToUserId: req.user!.id,
      },
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        companyId: existing.companyId,
        userId: existing.employeeProfile.userId,
        type: 'HUMAN_HELP_UPDATE',
        title: `Response to: ${existing.subject}`,
        message: `${req.user!.name} replied: "${responseText.slice(0, 120)}..."`,
      },
    });

    return res.json({ success: true, request: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
