import { Router, Request, Response } from 'express';
import { csvDataLoader } from '../services/csvDataLoader.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Helper to sanitize param to string
function paramToStr(p: string | string[] | undefined): string {
  if (Array.isArray(p)) return p[0] || '';
  return p || '';
}

/**
 * GET /api/employees
 * List all employees with dynamic progress metrics (useful for HR and demo persona switchers)
 */
router.get('/employees', async (_req: Request, res: Response) => {
  try {
    const employees = await csvDataLoader.getAllEmployees();
    res.json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (err: any) {
    logger.error('Error fetching employees list:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/employees/:id
 * Retrieve employee profile by ID or email, with resolved manager and buddy
 */
router.get('/employees/:id', async (req: Request, res: Response) => {
  try {
    const id = paramToStr(req.params.id);
    const employee = await csvDataLoader.getEmployee(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: `Employee with ID or email "${id}" was not found in dataset.`,
      });
    }

    res.json({
      success: true,
      employee,
    });
  } catch (err: any) {
    logger.error(`Error fetching employee ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/employees/:id/tasks
 * Retrieve personalized onboarding tasks for the employee with attached resources
 */
router.get('/employees/:id/tasks', async (req: Request, res: Response) => {
  try {
    const id = paramToStr(req.params.id);
    const employee = await csvDataLoader.getEmployee(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: `Employee "${id}" was not found.`,
      });
    }

    const tasks = await csvDataLoader.getEmployeeTasks(employee.employeeId);
    res.json({
      success: true,
      employeeId: employee.employeeId,
      role: employee.role,
      department: employee.department,
      count: tasks.length,
      tasks,
    });
  } catch (err: any) {
    logger.error(`Error fetching tasks for ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/employees/:id/progress
 * Retrieve progress statistics and records for an employee
 */
router.get('/employees/:id/progress', async (req: Request, res: Response) => {
  try {
    const id = paramToStr(req.params.id);
    const employee = await csvDataLoader.getEmployee(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: `Employee "${id}" was not found.`,
      });
    }

    const metrics = await csvDataLoader.getEmployeeProgressMetrics(employee.employeeId);
    res.json({
      success: true,
      ...metrics,
    });
  } catch (err: any) {
    logger.error(`Error fetching progress for ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/employees/:id/resources
 * Retrieve available learning & onboarding resources filtered for employee
 */
router.get('/employees/:id/resources', async (req: Request, res: Response) => {
  try {
    const id = paramToStr(req.params.id);
    const employee = await csvDataLoader.getEmployee(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: `Employee "${id}" was not found.`,
      });
    }

    const resources = await csvDataLoader.getEmployeeResources(employee.employeeId);
    res.json({
      success: true,
      employeeId: employee.employeeId,
      count: resources.length,
      resources,
    });
  } catch (err: any) {
    logger.error(`Error fetching resources for ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/resources
 * Retrieve all enterprise learning & onboarding resources
 */
router.get('/resources', async (_req: Request, res: Response) => {
  try {
    const resources = await csvDataLoader.getAllResources();
    res.json({
      success: true,
      count: resources.length,
      resources,
    });
  } catch (err: any) {
    logger.error('Error fetching all resources:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/contacts
 * Retrieve all enterprise support contacts and escalation hierarchy
 */
router.get('/contacts', async (_req: Request, res: Response) => {
  try {
    const contacts = await csvDataLoader.getAllContacts();
    res.json({
      success: true,
      count: contacts.length,
      contacts,
    });
  } catch (err: any) {
    logger.error('Error fetching contacts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/progress/:progressId
 * Update progress record status (Completed, Pending, In Progress, Overdue)
 */
router.patch('/progress/:progressId', async (req: Request, res: Response) => {
  try {
    const progressId = paramToStr(req.params.progressId);
    const { status, completedDate } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Field "status" is required (e.g. Completed, Pending, In Progress, Overdue).',
      });
    }

    const result = await csvDataLoader.updateProgress(progressId, status, completedDate);
    res.json(result);
  } catch (err: any) {
    logger.error(`Error updating progress ${req.params.progressId}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tasks
 * Add an onboarding task assigned to an employee (Manager / HR feature)
 */
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const { taskName, applicableRole, department, day, priority, assignedBy, employeeId, resourceId } = req.body;

    if (!taskName) {
      return res.status(400).json({
        success: false,
        error: 'Field "taskName" is required.',
      });
    }

    if (employeeId) {
      const result = await csvDataLoader.createAndAssignTask({
        taskName,
        applicableRole,
        department,
        day,
        priority,
        assignedBy,
        employeeId,
        resourceId,
      });
      return res.status(201).json(result);
    }

    // Cohort-wide HR task
    res.status(200).json({ success: true, message: 'Use /api/checklists/:id/tasks for template task creation' });
  } catch (err: any) {
    logger.error('Error creating and assigning task:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/employees/:id/dashboard
 * Master unified data endpoint for personalized onboarding dashboard
 */
router.get('/employees/:id/dashboard', async (req: Request, res: Response) => {
  try {
    const id = paramToStr(req.params.id);
    const dashboard = await csvDataLoader.getEmployeeDashboard(id);
    res.json(dashboard);
  } catch (err: any) {
    logger.error(`Error loading dashboard for ${req.params.id}:`, err);
    res.status(err.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: err.message,
    });
  }
});

// ==============================================================
// HR WORKSPACE & CHECKLIST TEMPLATE ROUTES
// ==============================================================

/**
 * GET /api/checklists/metrics
 * HR Workspace high-level overview metrics
 */
router.get('/checklists/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await csvDataLoader.getHRWorkspaceMetrics();
    res.json({
      success: true,
      metrics,
      ...metrics,
    });
  } catch (err: any) {
    logger.error('Error fetching HR metrics:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/checklists
 * List all checklist templates with counts & status
 */
router.get('/checklists', async (_req: Request, res: Response) => {
  try {
    const templates = await csvDataLoader.getAllChecklistTemplates();
    res.json({
      success: true,
      count: templates.length,
      checklists: templates,
      templates,
    });
  } catch (err: any) {
    logger.error('Error listing checklist templates:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/checklists
 * Create a new checklist template with tasks and optional publish
 */
router.post('/checklists', async (req: Request, res: Response) => {
  try {
    const { checklistName, applicableRole, department, location, durationDays, createdBy, status, tasks } = req.body;
    if (!checklistName) {
      return res.status(400).json({
        success: false,
        error: 'Field "checklistName" is required.',
      });
    }

    const template = await csvDataLoader.createChecklistTemplate({
      checklistName,
      applicableRole,
      department,
      location,
      durationDays,
      createdBy,
      status,
      tasks,
    });

    res.status(201).json({
      success: true,
      checklist: template,
      template,
    });
  } catch (err: any) {
    logger.error('Error creating checklist template:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/checklists/:id
 * Retrieve a specific checklist template with all tasks and resources
 */
router.get('/checklists/:id', async (req: Request, res: Response) => {
  try {
    const id = paramToStr(req.params.id);
    const template = await csvDataLoader.getChecklistTemplate(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Checklist template "${id}" was not found.`,
      });
    }
    res.json({
      success: true,
      checklist: template,
      template,
    });
  } catch (err: any) {
    logger.error(`Error fetching checklist ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/checklists/:id
 * Update an existing checklist template & tasks
 */
router.put('/checklists/:id', async (req: Request, res: Response) => {
  try {
    const id = paramToStr(req.params.id);
    const template = await csvDataLoader.updateChecklistTemplate(id, req.body);
    res.json({
      success: true,
      checklist: template,
      template,
    });
  } catch (err: any) {
    logger.error(`Error updating checklist ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/checklists/:id
 * Archive/delete a checklist template
 */
router.delete('/checklists/:id', async (req: Request, res: Response) => {
  try {
    const id = paramToStr(req.params.id);
    const result = await csvDataLoader.deleteChecklistTemplate(id);
    res.json(result);
  } catch (err: any) {
    logger.error(`Error deleting checklist ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/checklists/:id/publish
 * Toggle or set checklist status (Published or Draft)
 */
router.post('/checklists/:id/publish', async (req: Request, res: Response) => {
  try {
    const id = paramToStr(req.params.id);
    const { status } = req.body;
    const template = await csvDataLoader.togglePublishChecklist(id, status);
    res.json({
      success: true,
      checklist: template,
      template,
      assignedJoinersCount: template?.assignedEmployeesCount || 0,
    });
  } catch (err: any) {
    logger.error(`Error publishing checklist ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/checklists/:id/duplicate
 * Duplicate a checklist template as Draft
 */
router.post('/checklists/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const id = paramToStr(req.params.id);
    const template = await csvDataLoader.duplicateChecklistTemplate(id);
    res.status(201).json({
      success: true,
      checklist: template,
      template,
    });
  } catch (err: any) {
    logger.error(`Error duplicating checklist ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/checklists/:id/employees
 * List all employees assigned to this checklist with their live progress %
 */
router.get('/checklists/:id/employees', async (req: Request, res: Response) => {
  try {
    const id = paramToStr(req.params.id);
    const employees = await csvDataLoader.getChecklistAssignedEmployees(id);
    res.json({
      success: true,
      checklistId: id,
      count: employees.length,
      employees,
    });
  } catch (err: any) {
    logger.error(`Error fetching checklist employees for ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/checklists/:id/tasks
 * Add an individual task to a checklist template
 */
router.post('/checklists/:id/tasks', async (req: Request, res: Response) => {
  try {
    const id = paramToStr(req.params.id);
    const task = await csvDataLoader.addTaskToChecklist(id, req.body);
    res.status(201).json({
      success: true,
      task,
    });
  } catch (err: any) {
    logger.error(`Error adding task to checklist ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/tasks/:id
 * Update an individual task
 */
router.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const id = paramToStr(req.params.id);
    const task = await csvDataLoader.updateTask(id, req.body);
    res.json({
      success: true,
      task,
    });
  } catch (err: any) {
    logger.error(`Error updating task ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete an individual task
 */
router.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const id = paramToStr(req.params.id);
    const result = await csvDataLoader.deleteTask(id);
    res.json(result);
  } catch (err: any) {
    logger.error(`Error deleting task ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
