import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Helper to determine if currentUser can manage targetUser
 */
export async function canUserManageTarget(
  currentUser: { id: string; role: string; email: string; team?: string | null; companyId: string },
  targetUser: { id: string; role: string; email: string; team?: string | null; companyId: string; employeeProfile?: any }
): Promise<{ allowed: boolean; reason?: string }> {
  // Tenant isolation
  if (currentUser.companyId !== targetUser.companyId && currentUser.role !== 'PLATFORM_ADMIN') {
    return { allowed: false, reason: 'Cross-tenant access prohibited' };
  }

  // Associates cannot manage anyone
  if (currentUser.role === 'ASSOCIATE' || currentUser.role === 'EMPLOYEE') {
    return { allowed: false, reason: 'Associates have execution-only access and cannot manage tasks' };
  }

  // Target is Manager or CEO - Leads cannot manage Managers
  if (targetUser.role === 'MANAGER' || targetUser.role === 'CEO' || targetUser.role === 'COMPANY_ADMIN') {
    return { allowed: false, reason: 'Subordinates cannot manage Manager or Executive tasks' };
  }

  // Target is Lead
  if (targetUser.role === 'LEAD') {
    // Only Manager, CEO, or Admin can manage Leads
    if (currentUser.role === 'MANAGER' || currentUser.role === 'CEO' || currentUser.role === 'COMPANY_ADMIN' || currentUser.role === 'HR_ADMIN') {
      return { allowed: true };
    }
    // Lead cannot manage another Lead or own lead task definition
    return { allowed: false, reason: 'Leads cannot manage other Leads or alter their own task definitions' };
  }

  // Target is Associate
  if (targetUser.role === 'ASSOCIATE' || targetUser.role === 'EMPLOYEE') {
    // Manager, CEO, Admin can manage any Associate in the company
    if (currentUser.role === 'MANAGER' || currentUser.role === 'CEO' || currentUser.role === 'COMPANY_ADMIN' || currentUser.role === 'HR_ADMIN') {
      return { allowed: true };
    }

    // Lead can manage Associates within their management scope
    if (currentUser.role === 'LEAD') {
      // Check if Associate reports directly to this Lead or is in the same team
      const prof = targetUser.employeeProfile;
      const isDirectReport =
        (prof?.buddyEmail && prof.buddyEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
        (prof?.managerEmail && prof.managerEmail.toLowerCase() === currentUser.email.toLowerCase());
      
      const isSameTeam =
        currentUser.team && targetUser.team &&
        currentUser.team.toLowerCase() === targetUser.team.toLowerCase();

      if (isDirectReport || isSameTeam) {
        return { allowed: true };
      }

      return { allowed: false, reason: 'Lead can only manage Associates within their assigned reporting or team scope' };
    }
  }

  return { allowed: false, reason: 'Unauthorized management attempt' };
}

/**
 * GET /api/v1/task-management/subordinates
 * Returns all subordinates manageable by the authenticated user
 */
router.get('/subordinates', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user!;
    if (currentUser.role === 'ASSOCIATE' || currentUser.role === 'EMPLOYEE') {
      return res.status(403).json({
        success: false,
        error: 'Associates have execution-only access and cannot view task management subordinates',
      });
    }

    let usersQuery: any = {
      companyId: currentUser.companyId,
      id: { not: currentUser.id },
    };

    if (currentUser.role === 'LEAD') {
      // Lead can only see Associates in their team or reporting to them
      usersQuery.role = { in: ['ASSOCIATE', 'EMPLOYEE'] };
      if (currentUser.team) {
        usersQuery.OR = [
          { team: currentUser.team },
          { employeeProfile: { buddyEmail: currentUser.email } },
          { employeeProfile: { managerEmail: currentUser.email } },
        ];
      }
    } else if (currentUser.role === 'MANAGER' || currentUser.role === 'CEO' || currentUser.role === 'COMPANY_ADMIN' || currentUser.role === 'HR_ADMIN') {
      // Manager can see both Leads and Associates
      usersQuery.role = { in: ['LEAD', 'ASSOCIATE', 'EMPLOYEE'] };
    }

    const subordinates = await prisma.user.findMany({
      where: usersQuery,
      include: {
        employeeProfile: {
          include: {
            department: true,
            journeys: {
              include: {
                tasks: {
                  where: { managementStatus: 'ACTIVE' },
                },
              },
            },
          },
        },
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    const formatted = subordinates.map((sub) => {
      const journey = sub.employeeProfile?.journeys?.[0];
      const tasks = journey?.tasks || [];
      const done = tasks.filter((t) => t.state === 'DONE').length;
      const total = tasks.length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        id: sub.id,
        name: sub.name,
        email: sub.email,
        role: sub.role,
        roleLevel: sub.roleLevel || (sub.role === 'LEAD' ? 'Lead' : 'Associate'),
        title: sub.title || (sub.role === 'LEAD' ? 'Senior Team Lead' : 'Associate Specialist'),
        department: sub.employeeProfile?.department?.name || 'Engineering',
        team: sub.team || 'Core Team',
        employeeId: sub.employeeId || `EMP-${sub.id.slice(0, 6)}`,
        journeyId: journey?.id,
        totalTasks: total,
        completedTasks: done,
        progress,
        managerEmail: sub.employeeProfile?.managerEmail,
        buddyEmail: sub.employeeProfile?.buddyEmail,
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      subordinates: formatted,
    });
  } catch (err: any) {
    logger.error('Error fetching task management subordinates:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/task-management/employees/:employeeId/tasks or /api/v1/employees/:employeeId/tasks
 * Returns full task plan for an employee (active + archived)
 */
router.get(['/employees/:employeeId/tasks', '/:employeeId/tasks'], authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const currentUser = req.user!;

    // Resolve target user
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: employeeId },
          { employeeId: employeeId },
          { email: employeeId },
        ],
      },
      include: {
        employeeProfile: {
          include: {
            journeys: {
              include: {
                tasks: {
                  include: {
                    history: { orderBy: { createdAt: 'desc' }, take: 10 },
                  },
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, error: `Employee "${employeeId}" not found` });
    }

    // Associate can ONLY view their own tasks
    if (currentUser.role === 'ASSOCIATE' || currentUser.role === 'EMPLOYEE') {
      if (currentUser.id !== targetUser.id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Associates cannot view tasks of other employees',
        });
      }
    } else {
      // For Manager / Lead, check management authority
      const authCheck = await canUserManageTarget(currentUser, targetUser);
      if (!authCheck.allowed && currentUser.id !== targetUser.id) {
        return res.status(403).json({
          success: false,
          error: authCheck.reason || 'Forbidden: You do not have permission to view this employee tasks',
        });
      }
    }

    const journey = targetUser.employeeProfile?.journeys?.[0];
    const tasks = journey?.tasks || [];

    return res.json({
      success: true,
      employee: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        roleLevel: targetUser.roleLevel,
        team: targetUser.team,
        employeeId: targetUser.employeeId,
      },
      count: tasks.length,
      tasks: tasks.map((t) => ({
        id: t.id,
        taskId: t.id,
        journeyId: t.journeyId,
        title: t.title,
        taskName: t.title,
        description: t.purpose || t.instructions || '',
        instructions: t.instructions || '',
        purpose: t.purpose,
        category: t.category,
        day: t.day || 'Day 1',
        priority: t.priority || 'Medium',
        estimatedDuration: t.estimatedDuration || '45 mins',
        resourceLinks: t.resourceLinks,
        state: t.state,
        status: t.state === 'DONE' ? 'Completed' : 'Pending',
        managementStatus: t.managementStatus, // ACTIVE, ARCHIVED
        originType: t.originType,             // DEFAULT, CUSTOM, MODIFIED
        isCustom: t.isCustom,
        isModified: t.isModified,
        managedByRole: t.managedByRole,
        modifiedById: t.modifiedById,
        version: t.version,
        orderIndex: t.orderIndex,
        completedAt: t.completedAt,
        history: t.history || [],
      })),
    });
  } catch (err: any) {
    logger.error('Error fetching employee tasks for management:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/task-management/employees/:employeeId/tasks or /api/v1/employees/:employeeId/tasks
 * Adds a new custom onboarding task for an employee
 */
router.post(['/employees/:employeeId/tasks', '/:employeeId/tasks'], authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const currentUser = req.user!;

    // Resolve target employee
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: employeeId },
          { employeeId: employeeId },
          { email: employeeId },
        ],
      },
      include: {
        employeeProfile: {
          include: {
            journeys: true,
          },
        },
      },
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, error: `Employee "${employeeId}" not found` });
    }

    // Validate management authority
    const authCheck = await canUserManageTarget(currentUser, targetUser);
    if (!authCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: authCheck.reason || 'Forbidden: You cannot add tasks for this employee',
      });
    }

    const {
      title,
      taskName,
      description,
      instructions,
      day = 'Day 1',
      priority = 'Medium',
      category = 'ORIENTATION',
      estimatedDuration = '45 mins',
      resourceLinks,
      slaHours = 24,
    } = req.body;

    const taskTitle = (title || taskName || '').trim();
    if (!taskTitle) {
      return res.status(400).json({ success: false, error: 'Task title / name is required' });
    }

    let journey = targetUser.employeeProfile?.journeys?.[0];
    if (!journey) {
      // Create journey if not yet established
      journey = await prisma.journey.create({
        data: {
          companyId: targetUser.companyId,
          employeeProfileId: targetUser.employeeProfile!.id,
          name: `${targetUser.name} Onboarding Journey`,
          health: 'FLOWING',
        },
      });
    }

    // Determine orderIndex: place at end of current tasks
    const count = await prisma.journeyTask.count({
      where: { journeyId: journey.id },
    });

    const newTask = await prisma.journeyTask.create({
      data: {
        journeyId: journey.id,
        companyId: targetUser.companyId,
        title: taskTitle,
        purpose: description || taskTitle,
        instructions: instructions || description || '',
        category,
        day,
        priority,
        estimatedDuration,
        resourceLinks: typeof resourceLinks === 'string' ? resourceLinks : JSON.stringify(resourceLinks || []),
        state: 'AVAILABLE',
        required: true,
        orderIndex: count + 1,
        slaHours: Number(slaHours) || 24,
        managementStatus: 'ACTIVE',
        originType: 'CUSTOM',
        isCustom: true,
        isModified: false,
        managedByRole: currentUser.role,
        modifiedById: currentUser.id,
        version: 1,
      },
    });

    // Record audit history
    await prisma.taskAuditHistory.create({
      data: {
        journeyTaskId: newTask.id,
        companyId: targetUser.companyId,
        modifiedById: currentUser.id,
        modifiedByName: currentUser.name,
        modifiedByRole: currentUser.role,
        action: 'TASK_CREATED',
        summary: `${currentUser.name} (${currentUser.role}) added custom task "${taskTitle}" for ${targetUser.name}`,
        newValue: JSON.stringify({ title: taskTitle, day, priority, category }),
      },
    });

    // Also log to company AuditLog
    await prisma.auditLog.create({
      data: {
        companyId: targetUser.companyId,
        userId: currentUser.id,
        action: 'TASK_CREATED',
        entityType: 'JourneyTask',
        entityId: newTask.id,
        metadata: JSON.stringify({
          createdFor: targetUser.email,
          title: taskTitle,
          day,
          priority,
          role: currentUser.role,
        }),
      },
    });

    // Notify employee of new task assignment
    await prisma.notification.create({
      data: {
        companyId: targetUser.companyId,
        userId: targetUser.id,
        type: 'TASK_ASSIGNED',
        title: `New Onboarding Task: ${taskTitle}`,
        message: `${currentUser.name} (${currentUser.role}) assigned a new task: "${taskTitle}" (${day})`,
        relatedTaskId: newTask.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Task added successfully.',
      task: newTask,
    });
  } catch (err: any) {
    logger.error('Error creating custom task:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/v1/task-management/tasks/:taskId or /api/v1/tasks/:taskId
 * Edits task definitions (title, description, instructions, day, priority, etc.)
 * Includes conflict detection (optimistic concurrency) & audit trail
 */
const updateTaskHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const currentUser = req.user!;

    // Resolve task with journey and employee
    const task = await prisma.journeyTask.findUnique({
      where: { id: taskId },
      include: {
        journey: {
          include: {
            employeeProfile: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, error: `Task "${taskId}" not found` });
    }

    const targetUser = task.journey.employeeProfile.user;

    // Check authority
    const authCheck = await canUserManageTarget(currentUser, targetUser);
    if (!authCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: authCheck.reason || 'Forbidden: You cannot modify this task',
      });
    }

    // Conflict detection: if client provided expected version and it does not match
    const { expectedVersion } = req.body;
    if (expectedVersion !== undefined && Number(expectedVersion) !== task.version) {
      return res.status(409).json({
        success: false,
        conflict: true,
        currentVersion: task.version,
        error: 'This task was updated by another manager. Please review the latest version before saving your changes.',
      });
    }

    const {
      title,
      taskName,
      description,
      instructions,
      day,
      priority,
      category,
      estimatedDuration,
      resourceLinks,
      required,
      deadline,
    } = req.body;

    const updates: any = {
      version: task.version + 1,
      isModified: true,
      originType: task.originType === 'CUSTOM' ? 'CUSTOM' : 'MODIFIED',
      managedByRole: currentUser.role,
      modifiedById: currentUser.id,
      updatedAt: new Date(),
    };

    const changesRecorded: Array<{ field: string; prev: any; next: any }> = [];

    const newTitle = (title || taskName);
    if (newTitle && newTitle !== task.title) {
      changesRecorded.push({ field: 'title', prev: task.title, next: newTitle });
      updates.title = newTitle;
    }
    if (description !== undefined && description !== task.purpose) {
      changesRecorded.push({ field: 'purpose', prev: task.purpose, next: description });
      updates.purpose = description;
    }
    if (instructions !== undefined && instructions !== task.instructions) {
      changesRecorded.push({ field: 'instructions', prev: task.instructions, next: instructions });
      updates.instructions = instructions;
    }
    if (day !== undefined && day !== task.day) {
      changesRecorded.push({ field: 'day', prev: task.day, next: day });
      updates.day = day;
    }
    if (priority !== undefined && priority !== task.priority) {
      changesRecorded.push({ field: 'priority', prev: task.priority, next: priority });
      updates.priority = priority;
    }
    if (category !== undefined && category !== task.category) {
      changesRecorded.push({ field: 'category', prev: task.category, next: category });
      updates.category = category;
    }
    if (estimatedDuration !== undefined && estimatedDuration !== task.estimatedDuration) {
      changesRecorded.push({ field: 'estimatedDuration', prev: task.estimatedDuration, next: estimatedDuration });
      updates.estimatedDuration = estimatedDuration;
    }
    if (resourceLinks !== undefined) {
      const resStr = typeof resourceLinks === 'string' ? resourceLinks : JSON.stringify(resourceLinks);
      if (resStr !== task.resourceLinks) {
        changesRecorded.push({ field: 'resourceLinks', prev: task.resourceLinks, next: resStr });
        updates.resourceLinks = resStr;
      }
    }
    if (required !== undefined && required !== task.required) {
      changesRecorded.push({ field: 'required', prev: String(task.required), next: String(required) });
      updates.required = Boolean(required);
    }
    if (deadline !== undefined) {
      const dDate = deadline ? new Date(deadline) : null;
      changesRecorded.push({ field: 'dueAt', prev: task.dueAt?.toISOString(), next: dDate?.toISOString() });
      updates.dueAt = dDate;
    }

    const updatedTask = await prisma.journeyTask.update({
      where: { id: task.id },
      data: updates,
    });

    // Record each change in TaskAuditHistory
    for (const ch of changesRecorded) {
      let actionType = 'TASK_UPDATED';
      if (ch.field === 'priority') actionType = 'PRIORITY_CHANGED';
      else if (ch.field === 'day' || ch.field === 'dueAt') actionType = 'DEADLINE_CHANGED';

      await prisma.taskAuditHistory.create({
        data: {
          journeyTaskId: task.id,
          companyId: task.companyId,
          modifiedById: currentUser.id,
          modifiedByName: currentUser.name,
          modifiedByRole: currentUser.role,
          action: actionType,
          fieldName: ch.field,
          previousValue: String(ch.prev || ''),
          newValue: String(ch.next || ''),
          summary: `${currentUser.name} (${currentUser.role}) changed ${ch.field}: "${ch.prev || ''}" → "${ch.next || ''}"`,
        },
      });
    }

    // Company-level audit
    await prisma.auditLog.create({
      data: {
        companyId: task.companyId,
        userId: currentUser.id,
        action: 'TASK_UPDATED',
        entityType: 'JourneyTask',
        entityId: task.id,
        metadata: JSON.stringify({
          taskTitle: updatedTask.title,
          changes: changesRecorded,
          editorRole: currentUser.role,
        }),
      },
    });

    // Notify employee of update
    await prisma.notification.create({
      data: {
        companyId: task.companyId,
        userId: targetUser.id,
        type: 'TASK_ASSIGNED',
        title: `Task Updated: ${updatedTask.title}`,
        message: `Your onboarding task "${updatedTask.title}" has been updated by your ${currentUser.role === 'MANAGER' ? 'Manager' : 'Lead'}.`,
        relatedTaskId: task.id,
      },
    });

    return res.json({
      success: true,
      message: 'Task updated successfully.',
      task: updatedTask,
      changes: changesRecorded,
    });
  } catch (err: any) {
    logger.error('Error modifying task definition:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

router.patch(['/tasks/:taskId', '/:taskId'], authenticateToken, updateTaskHandler);
router.put(['/tasks/:taskId', '/:taskId'], authenticateToken, updateTaskHandler);

/**
 * POST /api/v1/task-management/tasks/:taskId/archive or /api/v1/tasks/:taskId/archive
 * Soft archive task preserving historical completion and audit records
 */
router.post(['/tasks/:taskId/archive', '/:taskId/archive'], authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const currentUser = req.user!;

    const task = await prisma.journeyTask.findUnique({
      where: { id: taskId },
      include: {
        journey: {
          include: {
            employeeProfile: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, error: `Task "${taskId}" not found` });
    }

    const targetUser = task.journey.employeeProfile.user;

    // Check authority
    const authCheck = await canUserManageTarget(currentUser, targetUser);
    if (!authCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: authCheck.reason || 'Forbidden: You cannot archive this task',
      });
    }

    const updatedTask = await prisma.journeyTask.update({
      where: { id: task.id },
      data: {
        managementStatus: 'ARCHIVED',
        version: task.version + 1,
        managedByRole: currentUser.role,
        modifiedById: currentUser.id,
      },
    });

    await prisma.taskAuditHistory.create({
      data: {
        journeyTaskId: task.id,
        companyId: task.companyId,
        modifiedById: currentUser.id,
        modifiedByName: currentUser.name,
        modifiedByRole: currentUser.role,
        action: 'TASK_ARCHIVED',
        summary: `${currentUser.name} (${currentUser.role}) archived task "${task.title}". Historical execution state preserved.`,
        previousValue: 'ACTIVE',
        newValue: 'ARCHIVED',
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: task.companyId,
        userId: currentUser.id,
        action: 'TASK_ARCHIVED',
        entityType: 'JourneyTask',
        entityId: task.id,
        metadata: JSON.stringify({
          title: task.title,
          employeeId: targetUser.email,
          hadProgress: task.state === 'DONE',
        }),
      },
    });

    return res.json({
      success: true,
      message: 'Task archived successfully.',
      task: updatedTask,
    });
  } catch (err: any) {
    logger.error('Error archiving task:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/task-management/tasks/:taskId/restore or /api/v1/tasks/:taskId/restore
 * Restore an archived task back to ACTIVE status
 */
router.post(['/tasks/:taskId/restore', '/:taskId/restore'], authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const currentUser = req.user!;

    const task = await prisma.journeyTask.findUnique({
      where: { id: taskId },
      include: {
        journey: {
          include: {
            employeeProfile: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, error: `Task "${taskId}" not found` });
    }

    const targetUser = task.journey.employeeProfile.user;

    const authCheck = await canUserManageTarget(currentUser, targetUser);
    if (!authCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: authCheck.reason || 'Forbidden: You cannot restore this task',
      });
    }

    const updatedTask = await prisma.journeyTask.update({
      where: { id: task.id },
      data: {
        managementStatus: 'ACTIVE',
        version: task.version + 1,
        managedByRole: currentUser.role,
        modifiedById: currentUser.id,
      },
    });

    await prisma.taskAuditHistory.create({
      data: {
        journeyTaskId: task.id,
        companyId: task.companyId,
        modifiedById: currentUser.id,
        modifiedByName: currentUser.name,
        modifiedByRole: currentUser.role,
        action: 'TASK_RESTORED',
        summary: `${currentUser.name} (${currentUser.role}) restored task "${task.title}" to active plan.`,
        previousValue: 'ARCHIVED',
        newValue: 'ACTIVE',
      },
    });

    return res.json({
      success: true,
      message: 'Task restored successfully.',
      task: updatedTask,
    });
  } catch (err: any) {
    logger.error('Error restoring task:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/task-management/tasks/:taskId/reset-default or /api/v1/tasks/:taskId/reset-default
 * Restore a modified task back to default template configuration
 */
router.post(['/tasks/:taskId/reset-default', '/:taskId/reset-default'], authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const currentUser = req.user!;

    const task = await prisma.journeyTask.findUnique({
      where: { id: taskId },
      include: {
        journey: {
          include: {
            employeeProfile: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, error: `Task "${taskId}" not found` });
    }

    const targetUser = task.journey.employeeProfile.user;
    const authCheck = await canUserManageTarget(currentUser, targetUser);
    if (!authCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: authCheck.reason || 'Forbidden: You cannot reset this task',
      });
    }

    const updatedTask = await prisma.journeyTask.update({
      where: { id: task.id },
      data: {
        originType: 'DEFAULT',
        isModified: false,
        version: task.version + 1,
        managedByRole: currentUser.role,
        modifiedById: currentUser.id,
      },
    });

    await prisma.taskAuditHistory.create({
      data: {
        journeyTaskId: task.id,
        companyId: task.companyId,
        modifiedById: currentUser.id,
        modifiedByName: currentUser.name,
        modifiedByRole: currentUser.role,
        action: 'DEFAULT_RESTORED',
        summary: `${currentUser.name} (${currentUser.role}) restored task "${task.title}" to default configuration.`,
      },
    });

    return res.json({
      success: true,
      message: 'Task restored to default template.',
      task: updatedTask,
    });
  } catch (err: any) {
    logger.error('Error resetting task to default:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/task-management/tasks/reorder or /api/v1/tasks/reorder
 * Reorders tasks by assigning new order indices
 */
router.post(['/tasks/reorder', '/reorder'], authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user!;
    const { orderedTaskIds } = req.body;

    if (!Array.isArray(orderedTaskIds) || orderedTaskIds.length === 0) {
      return res.status(400).json({ success: false, error: 'orderedTaskIds array is required' });
    }

    // Verify first task to check management authority
    const firstTask = await prisma.journeyTask.findUnique({
      where: { id: orderedTaskIds[0] },
      include: {
        journey: {
          include: {
            employeeProfile: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!firstTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const targetUser = firstTask.journey.employeeProfile.user;
    const authCheck = await canUserManageTarget(currentUser, targetUser);
    if (!authCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: authCheck.reason || 'Forbidden: You cannot reorder tasks for this employee',
      });
    }

    // Update orderIndex sequentially
    const updates = orderedTaskIds.map((tId: string, idx: number) =>
      prisma.journeyTask.update({
        where: { id: tId },
        data: { orderIndex: idx + 1 },
      })
    );
    await prisma.$transaction(updates);

    await prisma.taskAuditHistory.create({
      data: {
        journeyTaskId: firstTask.id,
        companyId: firstTask.companyId,
        modifiedById: currentUser.id,
        modifiedByName: currentUser.name,
        modifiedByRole: currentUser.role,
        action: 'TASK_REORDERED',
        summary: `${currentUser.name} (${currentUser.role}) reordered ${orderedTaskIds.length} tasks in the onboarding plan.`,
      },
    });

    return res.json({
      success: true,
      message: 'Tasks reordered successfully.',
      count: orderedTaskIds.length,
    });
  } catch (err: any) {
    logger.error('Error reordering tasks:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/task-management/tasks/:taskId/history or /api/v1/tasks/:taskId/history
 * Returns full audit trail for a task
 */
router.get(['/tasks/:taskId/history', '/:taskId/history'], authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const currentUser = req.user!;

    const task = await prisma.journeyTask.findUnique({
      where: { id: taskId },
      include: {
        journey: {
          include: {
            employeeProfile: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const targetUser = task.journey.employeeProfile.user;

    // Associate can only view history of their own tasks
    if (currentUser.role === 'ASSOCIATE' || currentUser.role === 'EMPLOYEE') {
      if (currentUser.id !== targetUser.id) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
    } else {
      const authCheck = await canUserManageTarget(currentUser, targetUser);
      if (!authCheck.allowed && currentUser.id !== targetUser.id) {
        return res.status(403).json({ success: false, error: authCheck.reason || 'Forbidden' });
      }
    }

    const history = await prisma.taskAuditHistory.findMany({
      where: { journeyTaskId: taskId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      taskId,
      taskTitle: task.title,
      originType: task.originType,
      managementStatus: task.managementStatus,
      version: task.version,
      count: history.length,
      history,
    });
  } catch (err: any) {
    logger.error('Error fetching task history:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/v1/task-management/tasks/:taskId or /api/v1/tasks/:taskId
 * Removes/Archives task safely (preserves history)
 */
router.delete(['/tasks/:taskId', '/:taskId'], authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const currentUser = req.user!;

    const task = await prisma.journeyTask.findUnique({
      where: { id: taskId },
      include: {
        journey: {
          include: {
            employeeProfile: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const targetUser = task.journey.employeeProfile.user;
    const authCheck = await canUserManageTarget(currentUser, targetUser);
    if (!authCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: authCheck.reason || 'Forbidden: You cannot delete/archive this task',
      });
    }

    // Always soft-archive to ensure historical audit integrity
    const updated = await prisma.journeyTask.update({
      where: { id: task.id },
      data: {
        managementStatus: 'ARCHIVED',
        version: task.version + 1,
        managedByRole: currentUser.role,
        modifiedById: currentUser.id,
      },
    });

    await prisma.taskAuditHistory.create({
      data: {
        journeyTaskId: task.id,
        companyId: task.companyId,
        modifiedById: currentUser.id,
        modifiedByName: currentUser.name,
        modifiedByRole: currentUser.role,
        action: 'TASK_ARCHIVED',
        summary: `${currentUser.name} (${currentUser.role}) archived task "${task.title}".`,
        previousValue: 'ACTIVE',
        newValue: 'ARCHIVED',
      },
    });

    return res.json({
      success: true,
      message: 'Task archived successfully.',
      task: updated,
    });
  } catch (err: any) {
    logger.error('Error deleting task:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
