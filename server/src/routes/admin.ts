import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { detectCycle } from '../services/dependencyEngine.js';

const router = Router();

router.use(authenticateToken);

// GET /api/v1/admin/company
router.get('/company', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
      include: {
        departments: true,
        locations: true,
        roles: true,
        ownerGroups: {
          include: {
            members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
          },
        },
      },
    });

    return res.json({ success: true, company });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/admin/companies (For platform admin or company switching demo)
router.get('/companies', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { users: true, employeeProfiles: true, journeys: true },
        },
      },
    });

    return res.json({ success: true, companies });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/admin/templates/validate (Checks for cycles using dependency engine)
router.post('/templates/validate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tasks } = req.body;
    // tasks: Array<{ id: string, title: string, prerequisiteIds: string[] }>
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ success: false, error: 'Array of tasks required' });
    }

    const validation = detectCycle(tasks);
    return res.json({
      success: true,
      valid: validation.valid,
      cycle: validation.cycle,
      error: validation.error,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/admin/knowledge-sources
router.get('/knowledge-sources', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sources = await prisma.knowledgeSource.findMany({
      where: { companyId: req.user!.companyId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, sources });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/admin/knowledge-sources
router.post('/knowledge-sources', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, excerpt, content, sourceUrl, category } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    const source = await prisma.knowledgeSource.create({
      data: {
        companyId: req.user!.companyId,
        title,
        excerpt: excerpt || content.slice(0, 150),
        content,
        sourceUrl,
        category: category || 'GUIDE',
        owner: req.user!.name,
      },
    });

    return res.status(201).json({ success: true, source });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/admin/reset-demo (Instant 1-click reset for judges)
router.post('/reset-demo', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Dynamically re-execute seed logic
    const { execSync } = await import('child_process');
    execSync('npx.cmd tsx prisma/seed.ts', { stdio: 'inherit' });

    return res.json({
      success: true,
      message: 'Demo state has been completely reset to initial scenario! Aarav is blocked on VPN, and 4 downstream tasks are locked.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
