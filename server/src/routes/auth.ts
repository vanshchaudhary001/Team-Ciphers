import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { generateToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: 'Valid email and password required' });
    }

    const { email, password } = parse.data;
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        employeeProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (user.accountStatus && user.accountStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive. Please contact your organization administrator.',
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roleLevel: user.roleLevel,
      employeeId: user.employeeId,
      departmentId: user.departmentId,
      branch: user.branch,
      subBranch: user.subBranch,
      team: user.team,
      positionId: user.positionId,
      title: user.title,
      accountStatus: user.accountStatus,
      companyId: user.companyId,
      employeeProfileId: user.employeeProfile?.id,
    });

    // Lookup department info if departmentId exists
    const dept = user.departmentId
      ? await prisma.department.findUnique({ where: { id: user.departmentId } })
      : null;

    // Lookup position info if positionId exists
    const position = user.positionId
      ? await prisma.orgPosition.findUnique({ where: { id: user.positionId } })
      : null;

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleLevel: user.roleLevel || 'Associate',
        employeeId: user.employeeId,
        departmentId: user.departmentId,
        departmentName: dept?.name,
        branch: user.branch,
        subBranch: user.subBranch,
        team: user.team,
        positionId: user.positionId,
        positionTitle: position?.fullTitle || user.title,
        title: user.title,
        accountStatus: user.accountStatus,
        company: {
          id: user.company.id,
          name: user.company.name,
          emailDomain: user.company.emailDomain,
        },
        employeeProfileId: user.employeeProfile?.id,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/auth/demo-switch (Allows judges & reviewers to instantly switch personas)
router.post('/demo-switch', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Demo email required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true, employeeProfile: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Demo account not found' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roleLevel: user.roleLevel,
      employeeId: user.employeeId,
      departmentId: user.departmentId,
      branch: user.branch,
      subBranch: user.subBranch,
      team: user.team,
      positionId: user.positionId,
      title: user.title,
      accountStatus: user.accountStatus,
      companyId: user.companyId,
      employeeProfileId: user.employeeProfile?.id,
    });

    const dept = user.departmentId
      ? await prisma.department.findUnique({ where: { id: user.departmentId } })
      : null;

    const position = user.positionId
      ? await prisma.orgPosition.findUnique({ where: { id: user.positionId } })
      : null;

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleLevel: user.roleLevel || 'Associate',
        employeeId: user.employeeId,
        departmentId: user.departmentId,
        departmentName: dept?.name,
        branch: user.branch,
        subBranch: user.subBranch,
        team: user.team,
        positionId: user.positionId,
        positionTitle: position?.fullTitle || user.title,
        title: user.title,
        accountStatus: user.accountStatus,
        company: {
          id: user.company.id,
          name: user.company.name,
          emailDomain: user.company.emailDomain,
        },
        employeeProfileId: user.employeeProfile?.id,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        company: true,
        employeeProfile: {
          include: {
            department: true,
            location: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const dept = user.departmentId
      ? await prisma.department.findUnique({ where: { id: user.departmentId } })
      : null;

    const position = user.positionId
      ? await prisma.orgPosition.findUnique({ where: { id: user.positionId } })
      : null;

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleLevel: user.roleLevel || 'Associate',
        employeeId: user.employeeId,
        departmentId: user.departmentId,
        departmentName: dept?.name || user.employeeProfile?.department?.name,
        branch: user.branch || user.employeeProfile?.branch,
        subBranch: user.subBranch || user.employeeProfile?.subBranch,
        team: user.team || user.employeeProfile?.team,
        positionId: user.positionId || user.employeeProfile?.positionId,
        positionTitle: position?.fullTitle || user.employeeProfile?.positionTitle || user.title,
        title: user.title,
        accountStatus: user.accountStatus,
        company: user.company,
        profile: user.employeeProfile,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
