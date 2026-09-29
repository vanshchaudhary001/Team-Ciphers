import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { aiService } from '../services/aiService.js';
import { nvidiaClient } from '../services/nvidiaClient.js';

const router = Router();

/**
 * Public: POST /api/v1/ai/nvidia-copilot
 * Intelligent day-one onboarding copilot powered by NVIDIA NIM
 */
router.post('/nvidia-copilot', async (req: Request, res: Response) => {
  try {
    const { query, role, company, branch, buddyName, hrName, currentBlocker, pendingTasks } = req.body;

    if (!query || String(query).trim().length === 0) {
      return res.status(400).json({ success: false, error: 'A query is required' });
    }

    const reply = await nvidiaClient.askOnboardingCopilot(String(query), {
      role,
      company,
      branch,
      buddyName,
      hrName,
      currentBlocker,
      pendingTasks,
    });

    return res.json({
      success: true,
      data: reply,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Authenticated routes below
router.use(authenticateToken);

// POST /api/v1/ai/ask
router.post('/ask', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { question, taskId } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'A question is required' });
    }

    const response = await aiService.processUnstickQuery(req.user!.id, question, taskId);

    return res.json({
      success: true,
      data: response,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/ai/knowledge
router.get('/knowledge', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sources = await prisma.knowledgeSource.findMany({
      where: {
        companyId: req.user!.companyId,
        status: 'APPROVED',
      },
      orderBy: { title: 'asc' },
    });

    return res.json({ success: true, sources });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
