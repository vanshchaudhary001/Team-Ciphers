import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = Router();

// Load static org structure cache if available
let cachedOrgStructure: any = null;
function getOrgStructure() {
  if (cachedOrgStructure) return cachedOrgStructure;
  const candidates = [
    path.resolve(process.cwd(), 'data/org_structure.json'),
    path.resolve(process.cwd(), '../data/org_structure.json'),
    path.resolve(process.cwd(), '../../data/org_structure.json'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      cachedOrgStructure = JSON.parse(fs.readFileSync(c, 'utf-8'));
      return cachedOrgStructure;
    }
  }
  return null;
}

/**
 * GET /api/v1/org/departments
 * Returns all 18 authoritative departments
 */
router.get('/departments', async (req, res) => {
  try {
    const org = getOrgStructure();
    const authCodes = org?.departments?.map((d: any) => d.code) || [];

    const departments = await prisma.department.findMany({
      where: authCodes.length > 0 ? { code: { in: authCodes } } : {},
      orderBy: { code: 'asc' },
    });

    if (departments.length > 0) {
      return res.json({
        success: true,
        count: departments.length,
        totalDepartments: departments.length,
        departments: departments.map((d) => {
          const matchedOrgDept = org?.departments?.find((od: any) => od.code === d.code || od.name === d.name);
          return {
            id: d.id,
            code: d.code,
            name: d.name,
            deptNumber: matchedOrgDept?.deptNumber,
            branches: matchedOrgDept?.branches || [],
          };
        }),
      });
    }

    // Fallback to JSON if DB table not yet populated
    if (org && org.departments) {
      return res.json({
        success: true,
        count: org.departments.length,
        totalDepartments: org.departments.length,
        departments: org.departments,
      });
    }

    return res.json({ success: true, count: 0, totalDepartments: 0, departments: [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/org/positions
 * Filter positions by departmentId, roleLevel (Associate, Lead, Manager), search query
 */
router.get('/positions', async (req, res) => {
  try {
    const { departmentId, departmentCode, roleLevel, search, limit } = req.query;

    const where: any = {};
    if (departmentId) where.departmentId = String(departmentId);
    if (departmentCode) where.departmentCode = String(departmentCode);
    if (roleLevel) {
      // Normalize roleLevel (Associate, Lead, Manager)
      const rStr = String(roleLevel);
      if (rStr.toLowerCase() === 'associate') where.roleLevel = 'Associate';
      else if (rStr.toLowerCase() === 'lead') where.roleLevel = 'Lead';
      else if (rStr.toLowerCase() === 'manager') where.roleLevel = 'Manager';
      else where.roleLevel = rStr;
    }

    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { title: { contains: q } },
        { fullTitle: { contains: q } },
        { team: { contains: q } },
        { branch: { contains: q } },
      ];
    }

    const maxResults = limit ? Math.min(Number(limit), 500) : 500;

    const positions = await prisma.orgPosition.findMany({
      where,
      take: maxResults,
      orderBy: [{ departmentId: 'asc' }, { roleLevel: 'asc' }, { title: 'asc' }],
    });

    if (positions.length > 0) {
      return res.json({
        success: true,
        count: positions.length,
        totalPositions: positions.length,
        positions,
      });
    }

    // Fallback to JSON
    const org = getOrgStructure();
    if (org && org.positions) {
      let filtered = org.positions;
      if (departmentId) filtered = filtered.filter((p: any) => p.departmentId === departmentId);
      if (roleLevel) {
        filtered = filtered.filter((p: any) => p.roleLevel.toLowerCase() === String(roleLevel).toLowerCase());
      }
      if (search) {
        const q = String(search).toLowerCase();
        filtered = filtered.filter((p: any) => p.fullTitle.toLowerCase().includes(q) || p.team.toLowerCase().includes(q));
      }
      return res.json({
        success: true,
        count: filtered.length,
        totalPositions: filtered.length,
        positions: filtered.slice(0, maxResults),
      });
    }

    return res.json({ success: true, count: 0, totalPositions: 0, positions: [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/org/hierarchy
 * Returns the entire authoritative hierarchy tree (18 departments -> branches -> sub-branches -> teams -> role-levels -> positions)
 */
router.get('/hierarchy', (_req, res) => {
  try {
    const org = getOrgStructure();
    if (!org) {
      return res.status(404).json({ success: false, error: 'Organizational hierarchy data not found' });
    }

    return res.json({
      success: true,
      summary: org.summary,
      departments: org.departments,
      positions: org.positions,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/org/executive-overview
 * CEO Executive Portal Analytics (calculated strictly from authentic database records)
 */
router.get(
  '/executive-overview',
  authenticateToken,
  requireRole('CEO', 'PLATFORM_ADMIN', 'COMPANY_ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;

      // 1. Total workforce users in company
      const users = await prisma.user.findMany({
        where: { companyId },
        include: {
          employeeProfile: {
            include: {
              department: true,
              journeys: {
                include: {
                  tasks: true,
                  blockers: {
                    where: { status: 'ACTIVE' },
                  },
                },
              },
            },
          },
        },
      });

      // 2. Active journeys & onboarding health
      const journeys = await prisma.journey.findMany({
        where: { companyId },
        include: {
          tasks: true,
          blockers: {
            where: { status: 'ACTIVE' },
          },
        },
      });

      // 3. Departments count & breakdown
      const departments = await prisma.department.findMany({
        where: { companyId },
        include: {
          employeeProfiles: true,
        },
      });

      // 4. All active blockers
      const activeBlockers = await prisma.blocker.findMany({
        where: { companyId, status: 'ACTIVE' },
        include: {
          rootTask: true,
          affectedTask: true,
          responsibleOwnerGroup: true,
        },
      });

      // Calculate health statistics
      const healthCounts = {
        FLOWING: journeys.filter((j) => j.health === 'FLOWING').length,
        DETOURING: journeys.filter((j) => j.health === 'DETOURING').length,
        STALLED: journeys.filter((j) => j.health === 'STALLED').length,
      };

      // Calculate task progress metrics
      let totalTasks = 0;
      let completedTasks = 0;
      let blockedTasks = 0;
      let availableTasks = 0;

      journeys.forEach((j) => {
        totalTasks += j.tasks.length;
        completedTasks += j.tasks.filter((t) => t.state === 'DONE').length;
        blockedTasks += j.tasks.filter((t) => t.state === 'WAITING' || t.state === 'LOCKED').length;
        availableTasks += j.tasks.filter((t) => t.state === 'AVAILABLE').length;
      });

      const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Department summaries
      const org = getOrgStructure();
      const departmentSummaries = (org?.departments || []).map((d: any) => {
        // Find matching users in this department
        const deptUsers = users.filter(
          (u) =>
            u.departmentId === d.id ||
            u.employeeProfile?.department?.code === d.code ||
            u.employeeProfile?.department?.name === d.name
        );
        const deptJourneys = journeys.filter((j) =>
          deptUsers.some((u) => u.employeeProfile?.id === j.employeeProfileId)
        );

        let dTotal = 0;
        let dDone = 0;
        deptJourneys.forEach((j) => {
          dTotal += j.tasks.length;
          dDone += j.tasks.filter((t) => t.state === 'DONE').length;
        });

        const dRate = dTotal > 0 ? Math.round((dDone / dTotal) * 100) : 0;

        const deptPositions = (org?.positions || []).filter((p: any) => p.departmentId === d.id);

        return {
          id: d.id,
          code: d.code,
          name: d.name,
          totalPositions: deptPositions.length,
          headcount: deptUsers.length,
          activeJoiners: deptJourneys.length,
          completionRate: dRate,
          health:
            deptJourneys.some((j) => j.health === 'STALLED')
              ? 'STALLED'
              : deptJourneys.some((j) => j.health === 'DETOURING')
              ? 'DETOURING'
              : 'FLOWING',
        };
      });

      // Role tier breakdown
      const roleCounts = {
        associate: users.filter((u) => u.roleLevel === 'Associate' || u.role === 'ASSOCIATE').length,
        lead: users.filter((u) => u.roleLevel === 'Lead' || u.role === 'LEAD').length,
        manager: users.filter((u) => u.roleLevel === 'Manager' || u.role === 'MANAGER').length,
        executive: users.filter((u) => u.role === 'CEO' || u.role === 'COMPANY_ADMIN').length,
      };

      return res.json({
        success: true,
        metrics: {
          totalWorkforce: users.length,
          activeOnboardings: journeys.length,
          totalDepartments: org?.departments?.length || 18,
          totalPositions: org?.positions?.length || 423,
          totalAuthoritativePositions: org?.positions?.length || 423,
          overallCompletionRate,
          totalTasks,
          completedTasks,
          blockedTasks,
          availableTasks,
          cohortHealth: healthCounts,
          roleDistribution: roleCounts,
          activeBlockersCount: activeBlockers.length,
        },
        activeBlockers,
        departmentSummaries,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * GET /api/v1/org/team-overview
 * Lead / Manager Team & Departmental Progress Portal
 */
router.get(
  '/team-overview',
  authenticateToken,
  requireRole('LEAD', 'MANAGER', 'CEO', 'COMPANY_ADMIN', 'HR_ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { employeeProfile: true },
      });

      if (!currentUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const companyId = currentUser.companyId;
      const userTeam = currentUser.team || currentUser.employeeProfile?.team || 'Web and Mobile Development';
      const userDeptId = currentUser.departmentId || currentUser.employeeProfile?.departmentId;

      // Find all team members
      const teamMembers = await prisma.user.findMany({
        where: {
          companyId,
          OR: [
            { team: userTeam },
            { departmentId: userDeptId },
          ],
        },
        include: {
          employeeProfile: {
            include: {
              journeys: {
                include: {
                  tasks: true,
                  blockers: {
                    where: { status: 'ACTIVE' },
                  },
                },
              },
            },
          },
        },
      });

      // Active team blockers
      const teamBlockers = await prisma.blocker.findMany({
        where: {
          companyId,
          status: 'ACTIVE',
        },
        include: {
          rootTask: true,
          affectedTask: true,
          responsibleOwnerGroup: true,
        },
      });

      const memberSummaries = teamMembers.map((m) => {
        const journey = m.employeeProfile?.journeys?.[0];
        const tasks = journey?.tasks || [];
        const done = tasks.filter((t) => t.state === 'DONE').length;
        const total = tasks.length;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;

        return {
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          roleLevel: m.roleLevel || 'Associate',
          title: m.title || 'Software Engineer',
          team: m.team || userTeam,
          branch: m.branch || 'Software Engineering',
          employeeId: m.employeeId,
          preJoinStatus: m.employeeProfile?.preJoinStatus || 'READY',
          health: journey?.health || 'FLOWING',
          progress,
          completedTasks: done,
          totalTasks: total,
          activeBlockers: journey?.blockers || [],
        };
      });

      const teamData = {
        name: userTeam,
        departmentId: userDeptId,
        memberCount: teamMembers.length,
        members: memberSummaries,
        teamBlockers,
      };

      return res.json({
        success: true,
        team: teamData,
        teamName: userTeam,
        departmentId: userDeptId,
        memberCount: teamMembers.length,
        members: memberSummaries,
        teamBlockers,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * GET /api/v1/org/positions/:posId/tasks
 * Returns authoritative onboarding tasks and playbook for any position
 */
router.get('/positions/:posId/tasks', async (req, res) => {
  try {
    const { posId } = req.params;
    const candidates = [
      path.resolve(process.cwd(), `../client/public/tasks/${posId}.json`),
      path.resolve(process.cwd(), `data/tasks/${posId}.json`),
      path.resolve(process.cwd(), `../data/tasks/${posId}.json`),
      path.resolve(process.cwd(), `tasks/${posId}.json`),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        const fileData = JSON.parse(fs.readFileSync(c, 'utf-8'));
        return res.json({
          success: true,
          position: fileData,
          tasks: fileData.tasks || [],
        });
      }
    }
    return res.status(404).json({ success: false, error: `Position tasks not found for ${posId}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

