import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { aiService } from '../services/aiService.js';

const router = Router();

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
