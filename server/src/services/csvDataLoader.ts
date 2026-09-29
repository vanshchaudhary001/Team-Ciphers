import fs from 'fs';
import path from 'path';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

export interface CsvContactItem {
  contactId: string;
  name: string;
  team: string;
  role: string;
  purpose: string;
  email: string;
  phone: string;
  availability: string;
  escalationTo?: string;
  escalation?: CsvContactItem | null;
}

export interface CsvEmployeeItem {
  employeeId: string;
  name: string;
  role: string;
  department: string;
  location: string;
  joiningDate: string;
  managerId?: string;
  buddyId?: string;
  email: string;
  manager?: CsvContactItem | null;
  buddy?: CsvContactItem | null;
}

export interface CsvTaskItem {
  taskId: string;
  checklistId?: string | null;
  taskName: string;
  applicableRole: string;
  department: string;
  day: string;
  priority: string;
  assignedBy: string;
  deadline?: string;
  resourceId?: string;
  isMandatory: boolean;
  resource?: CsvResourceItem | null;
  progressId?: string;
  status?: string;
  progress?: {
    progressId: string;
    status: string; // Pending, In Progress, Completed, Overdue
    assignedDate: string;
    dueDate?: string;
    completedDate?: string;
  } | null;
}

export interface CsvResourceItem {
  resourceId: string;
  resourceName: string;
  category: string;
  applicableRole: string;
  department: string;
  description: string;
  resourceType: string;
  link: string;
}

// Map M001-M009 to corresponding Contact IDs
const MANAGER_CONTACT_MAP: Record<string, string> = {
  M001: 'C006', // Rohan Verma (Engineering Manager)
  M002: 'C009', // Karan Iyer (Data Manager)
  M003: 'C012', // Kabir Joshi (Design Manager)
  M004: 'C016', // Nikhil Jain (Finance Manager)
  M005: 'C005', // Arjun Malhotra (Engineering Lead)
  M006: 'C003', // Priya Nair (HR Manager)
  M007: 'C002', // Vikram Shah (IT Manager)
  M008: 'C006', // Rohan Verma (Engineering Manager)
  M009: 'C010', // Meera Rao (Operations Manager)
};

// Map B001-B020 to corresponding Buddies / Mentors
const BUDDY_CONTACT_MAP: Record<string, string> = {
  B001: 'C019', // Dhruv Agarwal (Onboarding Buddy)
  B002: 'C020', // Myra Chawla (Onboarding Coordinator)
  B003: 'C011', // Aditi Bansal (Design Lead)
  B004: 'C004', // Sneha Kapoor (HR Executive)
  B005: 'C005', // Arjun Malhotra (Engineering Lead)
  B006: 'C013', // Ishita Singh (Marketing Lead)
  B007: 'C005', // Arjun Malhotra
  B008: 'C008', // Ananya Gupta (Data Team Lead)
  B009: 'C005', // Arjun Malhotra
  B010: 'C008', // Ananya Gupta
  B011: 'C015', // Tara Menon
  B012: 'C011', // Aditi Bansal
  B013: 'C005', // Arjun Malhotra
  B014: 'C004', // Sneha Kapoor
  B015: 'C019', // Dhruv Agarwal
  B016: 'C013', // Ishita Singh
  B017: 'C005', // Arjun Malhotra
  B018: 'C008', // Ananya Gupta
  B019: 'C020', // Myra Chawla
  B020: 'C005', // Arjun Malhotra
};

/**
 * Parses a standard CSV string into array of records
 */
function parseCsvSync(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const row: string[] = [];
    let insideQuotes = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    return row;
  });
}

function findDataDirectory(): string {
  const candidates = [
    path.resolve(process.cwd(), 'data'),
    path.resolve(process.cwd(), '../data'),
    path.resolve('/Users/mahimadhaka/Desktop/Team-Ciphers/data'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Data directory containing CSV datasets could not be located.');
}

export class CsvDataLoaderService {
  private dataDir: string;
  private isLoaded = false;

  constructor() {
    this.dataDir = findDataDirectory();
  }

  /**
   * Loads and validates all 5 CSV datasets into SQLite via Prisma
   */
  public async loadAndSeedDatasets(): Promise<{
    contactsCount: number;
    resourcesCount: number;
    tasksCount: number;
    employeesCount: number;
    progressCount: number;
    validationErrors: string[];
  }> {
    const validationErrors: string[] = [];
    logger.info(`🔄 Loading CSV datasets from: ${this.dataDir}`);

    const contactsPath = path.join(this.dataDir, 'contacts.csv');
    const resourcesPath = path.join(this.dataDir, 'resources.csv');
    const tasksPath = path.join(this.dataDir, 'onboarding_tasks.csv');
    const employeesPath = path.join(this.dataDir, 'employee_table.csv');
    const progressPath = path.join(this.dataDir, 'progress.csv');

    // 1. Contacts
    const contactsRaw = parseCsvSync(fs.readFileSync(contactsPath, 'utf-8'));
    const contactsRows = contactsRaw.slice(1);
    const contactMap = new Map<string, any>();

    for (const row of contactsRows) {
      if (row.length < 8) continue;
      const [contactId, name, team, role, purpose, email, phone, availability, escalationTo] = row;
      if (!contactId || !name) {
        validationErrors.push(`Invalid contact row: ${row.join(',')}`);
        continue;
      }
      contactMap.set(contactId, {
        contactId,
        name,
        team,
        role,
        purpose,
        email,
        phone,
        availability,
        escalationTo: escalationTo || null,
      });
    }

    // 2. Resources
    const resourcesRaw = parseCsvSync(fs.readFileSync(resourcesPath, 'utf-8'));
    const resourcesRows = resourcesRaw.slice(1);
    const resourceMap = new Map<string, any>();

    for (const row of resourcesRows) {
      if (row.length < 8) continue;
      const [resourceId, resourceName, category, applicableRole, department, description, resourceType, link] = row;
      if (!resourceId || !resourceName) {
        validationErrors.push(`Invalid resource row: ${row.join(',')}`);
        continue;
      }
      resourceMap.set(resourceId, {
        resourceId,
        resourceName,
        category,
        applicableRole,
        department,
        description,
        resourceType,
        link,
      });
    }

    // 3. Onboarding Tasks
    const tasksRaw = parseCsvSync(fs.readFileSync(tasksPath, 'utf-8'));
    const tasksRows = tasksRaw.slice(1);
    const taskMap = new Map<string, any>();

    for (const row of tasksRows) {
      if (row.length < 7) continue;
      const [taskId, taskName, applicableRole, department, day, priority, assignedBy, deadline, resourceId, isMandatory] = row;
      if (!taskId || !taskName) {
        validationErrors.push(`Invalid task row: ${row.join(',')}`);
        continue;
      }

      if (resourceId && !resourceMap.has(resourceId)) {
        validationErrors.push(`Task ${taskId} references unknown resource ${resourceId}`);
      }

      taskMap.set(taskId, {
        taskId,
        taskName,
        applicableRole,
        department,
        day,
        priority,
        assignedBy,
        deadline: deadline || `${day}, 5:00 PM`,
        resourceId: resourceId && resourceMap.has(resourceId) ? resourceId : null,
        isMandatory: isMandatory === 'true' || isMandatory === '1' || priority.toLowerCase() === 'high',
      });
    }

    // 4. Employees
    const employeesRaw = parseCsvSync(fs.readFileSync(employeesPath, 'utf-8'));
    const employeesRows = employeesRaw.slice(1);
    const employeeMap = new Map<string, any>();

    for (const row of employeesRows) {
      const clean = row.filter((c) => c.trim().length > 0);
      if (clean.length < 8) continue;
      const [employeeId, name, role, department, location, joiningDate, managerId, buddyId] = clean;
      if (!employeeId || !name) {
        validationErrors.push(`Invalid employee row: ${row.join(',')}`);
        continue;
      }

      const cleanName = name.toLowerCase().replace(/[^a-z]/g, '.');
      const email = `${cleanName}@demo-company.com`;

      employeeMap.set(employeeId, {
        employeeId,
        name,
        role,
        department,
        location,
        joiningDate,
        managerId: managerId || null,
        buddyId: buddyId || null,
        email,
      });
    }

    // 5. Progress
    const progressRaw = parseCsvSync(fs.readFileSync(progressPath, 'utf-8'));
    const progressRows = progressRaw.slice(1);
    const progressMap = new Map<string, any>();

    for (const row of progressRows) {
      if (row.length < 4) continue;
      const [progressId, employeeId, taskId, status, assignedDate, dueDate, completedDate] = row;
      if (!progressId || !employeeId || !taskId) {
        validationErrors.push(`Invalid progress row: ${row.join(',')}`);
        continue;
      }

      if (!employeeMap.has(employeeId)) {
        validationErrors.push(`Progress ${progressId} references unknown employee ${employeeId}`);
        continue;
      }
      if (!taskMap.has(taskId)) {
        validationErrors.push(`Progress ${progressId} references unknown task ${taskId}`);
        continue;
      }

      progressMap.set(`${employeeId}_${taskId}`, {
        progressId,
        employeeId,
        taskId,
        status: status || 'Pending',
        assignedDate: assignedDate || '2026-09-29',
        dueDate: dueDate || '2026-10-05',
        completedDate: completedDate && completedDate !== 'Ñ' ? completedDate : null,
      });
    }

    if (validationErrors.length > 0) {
      logger.warn(`⚠️ Dataset Validation Warnings/Errors:`, validationErrors);
    }

    // ==============================================================
    // SYNC TO DATABASE VIA PRISMA
    // ==============================================================

    // 1. Sync Contacts
    for (const contact of contactMap.values()) {
      await prisma.datasetContact.upsert({
        where: { contactId: contact.contactId },
        create: contact,
        update: contact,
      });
    }

    // 2. Sync Resources
    for (const resource of resourceMap.values()) {
      await prisma.datasetResource.upsert({
        where: { resourceId: resource.resourceId },
        create: resource,
        update: resource,
      });
    }

    // 3. Sync Tasks
    for (const task of taskMap.values()) {
      await prisma.datasetOnboardingTask.upsert({
        where: { taskId: task.taskId },
        create: task,
        update: task,
      });
    }

    // 4. Sync Employees
    for (const emp of employeeMap.values()) {
      await prisma.datasetEmployee.upsert({
        where: { employeeId: emp.employeeId },
        create: emp,
        update: emp,
      });
    }

    // 5. Sync Progress
    for (const prog of progressMap.values()) {
      await prisma.datasetProgress.upsert({
        where: {
          employeeId_taskId: {
            employeeId: prog.employeeId,
            taskId: prog.taskId,
          },
        },
        create: prog,
        update: prog,
      });
    }

    // Ensure all applicable tasks for each employee have an initial progress record if missing
    let autoProgCounter = 100;
    for (const emp of employeeMap.values()) {
      const applicableTasks = Array.from(taskMap.values()).filter(
        (t) =>
          t.applicableRole === 'All' ||
          t.applicableRole.toLowerCase() === emp.role.toLowerCase()
      );

      for (const t of applicableTasks) {
        const key = `${emp.employeeId}_${t.taskId}`;
        if (!progressMap.has(key)) {
          const autoPid = `P_AUTO_${emp.employeeId}_${t.taskId}`;
          const newProg = {
            progressId: autoPid,
            employeeId: emp.employeeId,
            taskId: t.taskId,
            status: 'Pending',
            assignedDate: emp.joiningDate || '2026-09-29',
            dueDate: '2026-10-05',
            completedDate: null,
          };
          await prisma.datasetProgress.upsert({
            where: {
              employeeId_taskId: {
                employeeId: emp.employeeId,
                taskId: t.taskId,
              },
            },
            create: newProg,
            update: {},
          });
          progressMap.set(key, newProg);
          autoProgCounter++;
        }
      }
    }

    // Seed default published checklist templates
    await this.seedDefaultChecklistTemplates();

    this.isLoaded = true;
    logger.info(
      `✅ 5 Datasets synchronized successfully: ${contactMap.size} contacts, ${resourceMap.size} resources, ${taskMap.size} tasks, ${employeeMap.size} employees, ${progressMap.size} progress items.`
    );

    return {
      contactsCount: contactMap.size,
      resourcesCount: resourceMap.size,
      tasksCount: taskMap.size,
      employeesCount: employeeMap.size,
      progressCount: progressMap.size,
      validationErrors,
    };
  }

  /**
   * Helper to ensure datasets are initialized on startup
   */
  public async ensureLoaded(): Promise<void> {
    if (!this.isLoaded) {
      await this.loadAndSeedDatasets();
    }
  }

  /**
   * Resolves contact details for a manager or buddy
   */
  private async resolveContact(contactIdOrMappedId?: string | null): Promise<CsvContactItem | null> {
    if (!contactIdOrMappedId) return null;
    let actualContactId = contactIdOrMappedId;

    if (MANAGER_CONTACT_MAP[contactIdOrMappedId]) {
      actualContactId = MANAGER_CONTACT_MAP[contactIdOrMappedId];
    } else if (BUDDY_CONTACT_MAP[contactIdOrMappedId]) {
      actualContactId = BUDDY_CONTACT_MAP[contactIdOrMappedId];
    }

    const c = await prisma.datasetContact.findUnique({
      where: { contactId: actualContactId },
    });
    if (!c) return null;

    let escalation: CsvContactItem | null = null;
    if (c.escalationTo) {
      const esc = await prisma.datasetContact.findUnique({
        where: { contactId: c.escalationTo },
      });
      if (esc) {
        escalation = {
          contactId: esc.contactId,
          name: esc.name,
          team: esc.team,
          role: esc.role,
          purpose: esc.purpose,
          email: esc.email,
          phone: esc.phone,
          availability: esc.availability,
        };
      }
    }

    return {
      contactId: c.contactId,
      name: c.name,
      team: c.team,
      role: c.role,
      purpose: c.purpose,
      email: c.email,
      phone: c.phone,
      availability: c.availability,
      escalationTo: c.escalationTo || undefined,
      escalation,
    };
  }

  /**
   * Retrieves employee by ID or Email
   */
  public async getEmployee(identifier: string): Promise<CsvEmployeeItem | null> {
    await this.ensureLoaded();
    const clean = identifier.trim().toLowerCase();

    const emp = await prisma.datasetEmployee.findFirst({
      where: {
        OR: [
          { employeeId: { equals: identifier.trim() } },
          { employeeId: { equals: identifier.trim().toUpperCase() } },
          { email: { equals: clean } },
          { name: { contains: identifier.trim() } },
        ],
      },
    });

    if (!emp) return null;

    const manager = await this.resolveContact(emp.managerId);
    const buddy = await this.resolveContact(emp.buddyId);

    return {
      employeeId: emp.employeeId,
      name: emp.name,
      role: emp.role,
      department: emp.department,
      location: emp.location,
      joiningDate: emp.joiningDate,
      managerId: emp.managerId || undefined,
      buddyId: emp.buddyId || undefined,
      email: emp.email || `${emp.name.toLowerCase().replace(/[^a-z]/g, '.')}@demo-company.com`,
      manager,
      buddy,
    };
  }

  /**
   * Retrieves all employees with their progress metrics (useful for HR and demo persona switcher)
   */
  public async getAllEmployees(): Promise<any[]> {
    await this.ensureLoaded();
    const employees = await prisma.datasetEmployee.findMany({
      orderBy: { employeeId: 'asc' },
      include: {
        progress: true,
      },
    });

    const tasks = await prisma.datasetOnboardingTask.findMany();

    return employees.map((emp) => {
      const applicableTasks = tasks.filter(
        (t) =>
          t.applicableRole === 'All' ||
          t.applicableRole.toLowerCase() === emp.role.toLowerCase()
      );
      const progList = emp.progress;
      const completed = progList.filter((p) => p.status === 'Completed').length;
      const total = applicableTasks.length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        employeeId: emp.employeeId,
        name: emp.name,
        role: emp.role,
        department: emp.department,
        location: emp.location,
        joiningDate: emp.joiningDate,
        email: emp.email,
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: total - completed,
        percentage: pct,
      };
    });
  }

  /**
   * Retrieves personalized onboarding tasks for a specific employee
   */
  public async getEmployeeTasks(employeeId: string): Promise<CsvTaskItem[]> {
    await this.ensureLoaded();
    const emp = await prisma.datasetEmployee.findUnique({
      where: { employeeId },
    });
    if (!emp) throw new Error(`Employee with ID "${employeeId}" was not found.`);

    // Match and assign any newly published checklists
    await this.matchAndAssignPublishedChecklistsToEmployee(employeeId);

    // Fetch matching published checklists
    const matchingChecklists = await prisma.datasetChecklistTemplate.findMany({
      where: {
        status: 'Published',
        AND: [
          { OR: [{ applicableRole: 'All' }, { applicableRole: emp.role }] },
          { OR: [{ department: 'All' }, { department: emp.department }] },
          { OR: [{ location: 'All' }, { location: emp.location }] },
        ],
      },
      select: { checklistId: true },
    });
    const checklistIds = matchingChecklists.map((c) => c.checklistId);

    // Fetch applicable tasks:
    // 1. Standalone/legacy tasks without a checklist (checklistId: null) matching role
    // 2. Published checklist tasks matching this employee (checklistId in checklistIds)
    const tasks = await prisma.datasetOnboardingTask.findMany({
      where: {
        OR: [
          {
            checklistId: null,
            OR: [
              { applicableRole: 'All' },
              { applicableRole: emp.role },
            ],
          },
          {
            checklistId: { in: checklistIds },
          },
        ],
      },
      include: {
        resource: true,
      },
      orderBy: [{ day: 'asc' }, { orderIndex: 'asc' }, { taskId: 'asc' }],
    });

    // Fetch progress for this employee
    const progressRecords = await prisma.datasetProgress.findMany({
      where: { employeeId },
    });
    const progressMap = new Map(progressRecords.map((p) => [p.taskId, p]));

    return tasks.map((t) => {
      const p = progressMap.get(t.taskId);
      return {
        taskId: t.taskId,
        checklistId: t.checklistId || undefined,
        taskName: t.taskName,
        applicableRole: t.applicableRole,
        department: t.department,
        day: t.day,
        priority: t.priority,
        assignedBy: t.assignedBy,
        deadline: t.deadline || `${t.day}, 5:00 PM`,
        resourceId: t.resourceId || undefined,
        isMandatory: t.isMandatory,
        progressId: p?.progressId || `P_${emp.employeeId}_${t.taskId}`,
        status: p?.status || 'Pending',
        resource: t.resource
          ? {
              resourceId: t.resource.resourceId,
              resourceName: t.resource.resourceName,
              category: t.resource.category,
              applicableRole: t.resource.applicableRole,
              department: t.resource.department,
              description: t.resource.description,
              resourceType: t.resource.resourceType,
              link: t.resource.link,
            }
          : null,
        progress: p
          ? {
              progressId: p.progressId,
              status: p.status,
              assignedDate: p.assignedDate,
              dueDate: p.dueDate || undefined,
              completedDate: p.completedDate || undefined,
            }
          : {
              progressId: `P_GEN_${emp.employeeId}_${t.taskId}`,
              status: 'Pending',
              assignedDate: emp.joiningDate,
              dueDate: '2026-10-05',
              completedDate: undefined,
            },
      };
    });
  }

  /**
   * Retrieves dynamically calculated progress for an employee
   */
  public async getEmployeeProgressMetrics(employeeId: string): Promise<{
    employeeId: string;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    percentage: number;
    progressList: any[];
  }> {
    const tasks = await this.getEmployeeTasks(employeeId);
    const total = tasks.length;
    const completed = tasks.filter((t) => t.progress?.status === 'Completed').length;
    const overdue = tasks.filter((t) => t.progress?.status === 'Overdue').length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      employeeId,
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      overdueTasks: overdue,
      percentage,
      progressList: tasks.map((t) => ({
        taskId: t.taskId,
        taskName: t.taskName,
        day: t.day,
        priority: t.priority,
        status: t.progress?.status || 'Pending',
        progressId: t.progress?.progressId,
        completedDate: t.progress?.completedDate,
      })),
    };
  }

  /**
   * Retrieves relevant resources for an employee
   */
  public async getEmployeeResources(employeeId: string): Promise<CsvResourceItem[]> {
    await this.ensureLoaded();
    const emp = await prisma.datasetEmployee.findUnique({
      where: { employeeId },
    });
    if (!emp) throw new Error(`Employee with ID "${employeeId}" was not found.`);

    const resources = await prisma.datasetResource.findMany({
      where: {
        OR: [
          { applicableRole: 'All' },
          { applicableRole: emp.role },
          { department: emp.department },
          { department: 'All' },
        ],
      },
      orderBy: { resourceId: 'asc' },
    });

    return resources.map((r) => ({
      resourceId: r.resourceId,
      resourceName: r.resourceName,
      category: r.category,
      applicableRole: r.applicableRole,
      department: r.department,
      description: r.description,
      resourceType: r.resourceType,
      link: r.link,
    }));
  }

  /**
   * Retrieves all available resources
   */
  public async getAllResources(): Promise<CsvResourceItem[]> {
    await this.ensureLoaded();
    const resources = await prisma.datasetResource.findMany({
      orderBy: { resourceId: 'asc' },
    });

    return resources.map((r) => ({
      resourceId: r.resourceId,
      resourceName: r.resourceName,
      category: r.category,
      applicableRole: r.applicableRole,
      department: r.department,
      description: r.description,
      resourceType: r.resourceType,
      link: r.link,
    }));
  }

  /**
   * Retrieves all contacts with escalation details
   */
  public async getAllContacts(): Promise<CsvContactItem[]> {
    await this.ensureLoaded();
    const contacts = await prisma.datasetContact.findMany({
      orderBy: { contactId: 'asc' },
    });

    const contactMap = new Map(contacts.map((c) => [c.contactId, c]));

    return contacts.map((c) => {
      let escalation: any = null;
      if (c.escalationTo && contactMap.has(c.escalationTo)) {
        const esc = contactMap.get(c.escalationTo)!;
        escalation = {
          contactId: esc.contactId,
          name: esc.name,
          team: esc.team,
          role: esc.role,
          purpose: esc.purpose,
          email: esc.email,
          phone: esc.phone,
          availability: esc.availability,
        };
      }
      return {
        contactId: c.contactId,
        name: c.name,
        team: c.team,
        role: c.role,
        purpose: c.purpose,
        email: c.email,
        phone: c.phone,
        availability: c.availability,
        escalationTo: c.escalationTo || undefined,
        escalation,
      };
    });
  }

  /**
   * Updates task progress (Mark Complete / In Progress / Pending)
   */
  public async updateProgress(
    progressId: string,
    status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue',
    completedDate?: string
  ): Promise<{ success: boolean; progress: any; metrics: any }> {
    await this.ensureLoaded();

    // Find progress by ID or search by composite key if synthetic ID
    let prog = await prisma.datasetProgress.findUnique({
      where: { progressId },
    });

    if (!prog && progressId.startsWith('P_AUTO_')) {
      const parts = progressId.split('_'); // P_AUTO_E001_T001
      if (parts.length >= 4) {
        const eid = parts[2];
        const tid = parts[3];
        prog = await prisma.datasetProgress.findUnique({
          where: { employeeId_taskId: { employeeId: eid, taskId: tid } },
        });
      }
    }

    if (!prog) {
      throw new Error(`Progress record with ID "${progressId}" was not found.`);
    }

    const nowIso = new Date().toISOString().split('T')[0];
    const finalCompletedDate = status === 'Completed' ? completedDate || nowIso : null;

    const updated = await prisma.datasetProgress.update({
      where: { progressId: prog.progressId },
      data: {
        status,
        completedDate: finalCompletedDate,
      },
    });

    const metrics = await this.getEmployeeProgressMetrics(prog.employeeId);

    return {
      success: true,
      progress: updated,
      metrics,
    };
  }

  /**
   * Assigns an additional task to an employee (Manager / HR feature)
   */
  public async createAndAssignTask(data: {
    taskName: string;
    applicableRole?: string;
    department?: string;
    day?: string;
    priority?: string;
    assignedBy?: string;
    employeeId: string;
    resourceId?: string;
  }): Promise<any> {
    await this.ensureLoaded();

    const emp = await prisma.datasetEmployee.findUnique({
      where: { employeeId: data.employeeId },
    });
    if (!emp) throw new Error(`Employee with ID "${data.employeeId}" does not exist.`);

    const count = await prisma.datasetOnboardingTask.count();
    const newTaskId = `T${String(count + 1).padStart(3, '0')}`;

    const task = await prisma.datasetOnboardingTask.create({
      data: {
        taskId: newTaskId,
        taskName: data.taskName,
        applicableRole: data.applicableRole || emp.role,
        department: data.department || emp.department,
        day: data.day || 'Day 1',
        priority: data.priority || 'Medium',
        assignedBy: data.assignedBy || 'Manager',
        deadline: `${data.day || 'Day 1'}, 5:00 PM`,
        resourceId: data.resourceId || null,
        isMandatory: data.priority?.toLowerCase() === 'high',
      },
      include: {
        resource: true,
      },
    });

    const progCount = await prisma.datasetProgress.count();
    const newProgressId = `P${String(progCount + 1).padStart(3, '0')}`;
    const nowIso = new Date().toISOString().split('T')[0];

    const progress = await prisma.datasetProgress.create({
      data: {
        progressId: newProgressId,
        employeeId: emp.employeeId,
        taskId: newTaskId,
        status: 'Pending',
        assignedDate: nowIso,
        dueDate: '2026-10-05',
        completedDate: null,
      },
    });

    return {
      success: true,
      task,
      progress,
    };
  }

  /**
   * Master Personalized Dashboard view
   */
  public async getEmployeeDashboard(identifier: string): Promise<any> {
    const employee = await this.getEmployee(identifier);
    if (!employee) throw new Error(`Employee "${identifier}" not found in database.`);

    const tasks = await this.getEmployeeTasks(employee.employeeId);
    const metrics = await this.getEmployeeProgressMetrics(employee.employeeId);
    const resources = await this.getEmployeeResources(employee.employeeId);
    const contacts = await this.getAllContacts();

    // Group tasks by Day
    const dayWiseTasks: Record<string, CsvTaskItem[]> = {};
    for (const t of tasks) {
      if (!dayWiseTasks[t.day]) {
        dayWiseTasks[t.day] = [];
      }
      dayWiseTasks[t.day].push(t);
    }

    // Today's tasks (Day 1)
    const todayTasks = tasks.filter((t) => t.day.toLowerCase() === 'day 1');

    return {
      success: true,
      employee,
      metrics,
      todayTasks,
      dayWiseTasks,
      tasks,
      resources,
      contacts,
    };
  }

  /**
   * Builds real data-grounded context for the AI Copilot
   */
  public async getCopilotContext(identifier: string): Promise<string> {
    try {
      const dashboard = await this.getEmployeeDashboard(identifier);
      const { employee, metrics, todayTasks, tasks, resources, contacts } = dashboard;

      const pendingTasks = tasks.filter((t: CsvTaskItem) => t.progress?.status !== 'Completed');
      const completedTasks = tasks.filter((t: CsvTaskItem) => t.progress?.status === 'Completed');
      const overdueTasks = tasks.filter((t: CsvTaskItem) => t.progress?.status === 'Overdue');

      return `
[ONBOARDING DATASET CONTEXT]
Employee Profile:
- Employee ID: ${employee.employeeId}
- Name: ${employee.name}
- Role: ${employee.role}
- Department: ${employee.department}
- Location: ${employee.location}
- Joining Date: ${employee.joiningDate}
- Email: ${employee.email}
- Manager: ${employee.manager ? `${employee.manager.name} (${employee.manager.role}, Email: ${employee.manager.email}, Phone: ${employee.manager.phone})` : 'Assigned in Portal'}
- Onboarding Buddy: ${employee.buddy ? `${employee.buddy.name} (${employee.buddy.role}, Email: ${employee.buddy.email}, Phone: ${employee.buddy.phone})` : 'Assigned in Portal'}

Progress:
- Overall: ${metrics.completedTasks} / ${metrics.totalTasks} completed (${metrics.percentage}%)
- Pending Tasks Count: ${metrics.pendingTasks}
- Overdue Tasks Count: ${metrics.overdueTasks}

Today's Tasks (Day 1):
${todayTasks.map((t: CsvTaskItem) => `- [${t.progress?.status === 'Completed' ? 'DONE' : 'PENDING'}] ${t.taskName} (${t.priority} priority, Assigned by: ${t.assignedBy})${t.resource ? ` -> Resource: ${t.resource.resourceName} (${t.resource.link})` : ''}`).join('\n')}

Pending Tasks (All Days):
${pendingTasks.map((t: CsvTaskItem) => `- ${t.taskName} [${t.day}] (${t.priority} priority)`).join('\n')}

Completed Tasks:
${completedTasks.map((t: CsvTaskItem) => `- ${t.taskName} [${t.day}] (Completed on: ${t.progress?.completedDate || 'Recently'})`).join('\n')}

Key Department Contacts:
${contacts.slice(0, 8).map((c: CsvContactItem) => `- ${c.name} (${c.role} · ${c.team}): ${c.email}, Phone: ${c.phone} [Availability: ${c.availability}]`).join('\n')}

Available Resources:
${resources.slice(0, 10).map((r: CsvResourceItem) => `- ${r.resourceName} (${r.category}): ${r.description} (URL: ${r.link})`).join('\n')}
`;
    } catch (err: any) {
      return `[Basic Context] User: ${identifier}`;
    }
  }

  // ==============================================================
  // HR WORKSPACE: ONBOARDING CHECKLIST TEMPLATES & MANAGEMENT
  // ==============================================================

  /**
   * Seeds default checklist templates if none exist
   */
  public async seedDefaultChecklistTemplates(): Promise<void> {
    const existingCount = await prisma.datasetChecklistTemplate.count();
    if (existingCount > 0) return;

    logger.info('[Checklist Service] Seeding default HR Onboarding Checklist Templates...');

    const defaults = [
      {
        checklistId: 'CHK_ENG_001',
        checklistName: 'Engineering & Cloud Architecture Onboarding Track',
        applicableRole: 'Software Engineer',
        department: 'Engineering',
        location: 'All',
        durationDays: 30,
        createdBy: 'Priya Nair (HR Operations)',
        status: 'Published',
      },
      {
        checklistId: 'CHK_DATA_001',
        checklistName: 'Enterprise Data & Analytics Onboarding Track',
        applicableRole: 'Data Analyst',
        department: 'Data',
        location: 'All',
        durationDays: 30,
        createdBy: 'Priya Nair (HR Operations)',
        status: 'Published',
      },
      {
        checklistId: 'CHK_DES_001',
        checklistName: 'Product Design, UI/UX & Design Systems Track',
        applicableRole: 'UI/UX Designer',
        department: 'Design',
        location: 'All',
        durationDays: 30,
        createdBy: 'Priya Nair (HR Operations)',
        status: 'Published',
      },
      {
        checklistId: 'CHK_HR_001',
        checklistName: 'People Operations & Global HR Executive Track',
        applicableRole: 'HR Executive',
        department: 'Human Resources',
        location: 'All',
        durationDays: 30,
        createdBy: 'Priya Nair (HR Operations)',
        status: 'Published',
      },
      {
        checklistId: 'CHK_MKT_001',
        checklistName: 'Product Marketing, Growth & Brand Strategy Track',
        applicableRole: 'Marketing Executive',
        department: 'Marketing',
        location: 'All',
        durationDays: 30,
        createdBy: 'Priya Nair (HR Operations)',
        status: 'Published',
      },
      {
        checklistId: 'CHK_GEN_DRAFT',
        checklistName: 'Executive Leadership & Management Onboarding (Draft Proposal)',
        applicableRole: 'All',
        department: 'All',
        location: 'All',
        durationDays: 45,
        createdBy: 'Priya Nair (HR Operations)',
        status: 'Draft',
      },
    ];

    for (const d of defaults) {
      await prisma.datasetChecklistTemplate.create({ data: d });
    }

    // Link existing tasks to their respective templates
    const allTasks = await prisma.datasetOnboardingTask.findMany();
    for (const task of allTasks) {
      let targetChecklistId: string | null = null;
      if (task.applicableRole === 'Software Engineer') targetChecklistId = 'CHK_ENG_001';
      else if (task.applicableRole === 'Data Analyst') targetChecklistId = 'CHK_DATA_001';
      else if (task.applicableRole === 'UI/UX Designer') targetChecklistId = 'CHK_DES_001';
      else if (task.applicableRole === 'HR Executive') targetChecklistId = 'CHK_HR_001';
      else if (task.applicableRole === 'Marketing Executive') targetChecklistId = 'CHK_MKT_001';

      if (targetChecklistId) {
        await prisma.datasetOnboardingTask.update({
          where: { taskId: task.taskId },
          data: { checklistId: targetChecklistId },
        });
      }
    }

    logger.info('[Checklist Service] Default checklist templates seeded successfully.');
  }

  /**
   * Assigns published checklist templates to matching employees without overwriting existing progress
   */
  public async matchAndAssignPublishedChecklistsToEmployee(employeeId: string): Promise<void> {
    const emp = await prisma.datasetEmployee.findUnique({ where: { employeeId } });
    if (!emp) return;

    const publishedChecklists = await prisma.datasetChecklistTemplate.findMany({
      where: {
        status: 'Published',
        AND: [
          {
            OR: [
              { applicableRole: 'All' },
              { applicableRole: emp.role },
            ],
          },
          {
            OR: [
              { department: 'All' },
              { department: emp.department },
            ],
          },
          {
            OR: [
              { location: 'All' },
              { location: emp.location },
            ],
          },
        ],
      },
      include: {
        tasks: true,
      },
    });

    const nowIso = new Date().toISOString().split('T')[0];

    for (const checklist of publishedChecklists) {
      for (const task of checklist.tasks) {
        const existingProgress = await prisma.datasetProgress.findUnique({
          where: {
            employeeId_taskId: {
              employeeId: emp.employeeId,
              taskId: task.taskId,
            },
          },
        });

        if (!existingProgress) {
          const autoPid = `P_${emp.employeeId}_${task.taskId}`;
          await prisma.datasetProgress.create({
            data: {
              progressId: autoPid,
              employeeId: emp.employeeId,
              taskId: task.taskId,
              status: 'Pending',
              assignedDate: emp.joiningDate || nowIso,
              dueDate: task.deadline || '2026-10-15',
              completedDate: null,
            },
          });
        }
      }
    }
  }

  /**
   * Matches and assigns a newly published checklist to all matching employees in the organization
   */
  public async matchAndAssignChecklistToAllMatchingEmployees(checklistId: string): Promise<number> {
    const checklist = await prisma.datasetChecklistTemplate.findUnique({
      where: { checklistId },
      include: { tasks: true },
    });
    if (!checklist || checklist.status !== 'Published') return 0;

    const allEmployees = await prisma.datasetEmployee.findMany();
    let assignedCount = 0;
    const nowIso = new Date().toISOString().split('T')[0];

    for (const emp of allEmployees) {
      const roleMatch = checklist.applicableRole === 'All' || checklist.applicableRole.toLowerCase() === emp.role.toLowerCase();
      const deptMatch = checklist.department === 'All' || checklist.department.toLowerCase() === emp.department.toLowerCase();
      const locMatch = checklist.location === 'All' || checklist.location.toLowerCase() === emp.location.toLowerCase();

      if (!roleMatch || !deptMatch || !locMatch) continue;

      for (const task of checklist.tasks) {
        const existing = await prisma.datasetProgress.findUnique({
          where: {
            employeeId_taskId: {
              employeeId: emp.employeeId,
              taskId: task.taskId,
            },
          },
        });

        if (!existing) {
          const autoPid = `P_${emp.employeeId}_${task.taskId}`;
          await prisma.datasetProgress.create({
            data: {
              progressId: autoPid,
              employeeId: emp.employeeId,
              taskId: task.taskId,
              status: 'Pending',
              assignedDate: emp.joiningDate || nowIso,
              dueDate: task.deadline || '2026-10-15',
              completedDate: null,
            },
          });
          assignedCount++;
        }
      }
    }

    return assignedCount;
  }

  /**
   * Retrieves all checklist templates with task counts and matching employee counts
   */
  public async getAllChecklistTemplates(): Promise<any[]> {
    await this.ensureLoaded();
    const checklists = await prisma.datasetChecklistTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        tasks: {
          orderBy: { orderIndex: 'asc' },
          include: { resource: true },
        },
      },
    });

    const employees = await prisma.datasetEmployee.findMany();

    return checklists.map((chk) => {
      const matchingEmployees = employees.filter((emp) => {
        const roleMatch = chk.applicableRole === 'All' || chk.applicableRole.toLowerCase() === emp.role.toLowerCase();
        const deptMatch = chk.department === 'All' || chk.department.toLowerCase() === emp.department.toLowerCase();
        const locMatch = chk.location === 'All' || chk.location.toLowerCase() === emp.location.toLowerCase();
        return roleMatch && deptMatch && locMatch;
      });

      return {
        checklistId: chk.checklistId,
        checklistName: chk.checklistName,
        applicableRole: chk.applicableRole,
        department: chk.department,
        location: chk.location,
        durationDays: chk.durationDays,
        createdBy: chk.createdBy,
        status: chk.status,
        createdAt: chk.createdAt,
        updatedAt: chk.updatedAt,
        tasksCount: chk.tasks.length,
        assignedEmployeesCount: matchingEmployees.length,
        tasks: chk.tasks,
      };
    });
  }

  /**
   * Retrieves a single checklist template by ID with all tasks and resources
   */
  public async getChecklistTemplate(checklistId: string): Promise<any> {
    await this.ensureLoaded();
    const checklist = await prisma.datasetChecklistTemplate.findUnique({
      where: { checklistId },
      include: {
        tasks: {
          orderBy: [{ orderIndex: 'asc' }, { day: 'asc' }],
          include: { resource: true },
        },
      },
    });
    if (!checklist) return null;

    const employees = await prisma.datasetEmployee.findMany();
    const matchingEmployees = employees.filter((emp) => {
      const roleMatch = checklist.applicableRole === 'All' || checklist.applicableRole.toLowerCase() === emp.role.toLowerCase();
      const deptMatch = checklist.department === 'All' || checklist.department.toLowerCase() === emp.department.toLowerCase();
      const locMatch = checklist.location === 'All' || checklist.location.toLowerCase() === emp.location.toLowerCase();
      return roleMatch && deptMatch && locMatch;
    });

    return {
      ...checklist,
      tasksCount: checklist.tasks.length,
      assignedEmployeesCount: matchingEmployees.length,
    };
  }

  /**
   * Creates a new checklist template with tasks and optional auto-publish
   */
  public async createChecklistTemplate(data: {
    checklistName: string;
    applicableRole?: string;
    department?: string;
    location?: string;
    durationDays?: number;
    createdBy?: string;
    status?: string;
    tasks?: Array<{
      taskName: string;
      day?: string;
      priority?: string;
      assignedBy?: string;
      deadline?: string;
      resourceId?: string;
      isMandatory?: boolean;
      orderIndex?: number;
    }>;
  }): Promise<any> {
    await this.ensureLoaded();
    const count = await prisma.datasetChecklistTemplate.count();
    const checklistId = `CHK_${Date.now().toString(36).toUpperCase()}_${count + 1}`;
    const status = data.status || 'Draft';

    const checklist = await prisma.datasetChecklistTemplate.create({
      data: {
        checklistId,
        checklistName: data.checklistName,
        applicableRole: data.applicableRole || 'All',
        department: data.department || 'All',
        location: data.location || 'All',
        durationDays: Number(data.durationDays) || 30,
        createdBy: data.createdBy || 'Priya Nair (HR)',
        status,
      },
    });

    if (data.tasks && data.tasks.length > 0) {
      let taskCount = await prisma.datasetOnboardingTask.count();
      for (let i = 0; i < data.tasks.length; i++) {
        const t = data.tasks[i];
        taskCount++;
        const newTaskId = `T${String(taskCount).padStart(3, '0')}`;
        await prisma.datasetOnboardingTask.create({
          data: {
            taskId: newTaskId,
            checklistId: checklist.checklistId,
            taskName: t.taskName,
            applicableRole: data.applicableRole || 'All',
            department: data.department || 'All',
            day: t.day || 'Day 1',
            priority: t.priority || 'Medium',
            assignedBy: t.assignedBy || 'HR Operations',
            deadline: t.deadline || `${t.day || 'Day 1'}, 5:00 PM`,
            resourceId: t.resourceId || null,
            isMandatory: t.isMandatory !== undefined ? Boolean(t.isMandatory) : true,
            orderIndex: t.orderIndex !== undefined ? Number(t.orderIndex) : i,
          },
        });
      }
    }

    if (status === 'Published') {
      await this.matchAndAssignChecklistToAllMatchingEmployees(checklist.checklistId);
    }

    return this.getChecklistTemplate(checklist.checklistId);
  }

  /**
   * Updates an existing checklist template
   */
  public async updateChecklistTemplate(
    checklistId: string,
    data: {
      checklistName?: string;
      applicableRole?: string;
      department?: string;
      location?: string;
      durationDays?: number;
      status?: string;
      tasks?: any[];
    }
  ): Promise<any> {
    await this.ensureLoaded();
    const existing = await prisma.datasetChecklistTemplate.findUnique({
      where: { checklistId },
    });
    if (!existing) throw new Error(`Checklist ${checklistId} not found`);

    const updated = await prisma.datasetChecklistTemplate.update({
      where: { checklistId },
      data: {
        checklistName: data.checklistName !== undefined ? data.checklistName : existing.checklistName,
        applicableRole: data.applicableRole !== undefined ? data.applicableRole : existing.applicableRole,
        department: data.department !== undefined ? data.department : existing.department,
        location: data.location !== undefined ? data.location : existing.location,
        durationDays: data.durationDays !== undefined ? Number(data.durationDays) : existing.durationDays,
        status: data.status !== undefined ? data.status : existing.status,
      },
    });

    if (data.tasks && Array.isArray(data.tasks)) {
      for (let i = 0; i < data.tasks.length; i++) {
        const t = data.tasks[i];
        if (t.taskId && !t.taskId.startsWith('TEMP_')) {
          await prisma.datasetOnboardingTask.update({
            where: { taskId: t.taskId },
            data: {
              taskName: t.taskName,
              day: t.day,
              priority: t.priority,
              assignedBy: t.assignedBy,
              resourceId: t.resourceId || null,
              isMandatory: t.isMandatory !== undefined ? Boolean(t.isMandatory) : true,
              orderIndex: i,
            },
          });
        } else {
          const taskCount = await prisma.datasetOnboardingTask.count();
          const newTaskId = `T${String(taskCount + 1).padStart(3, '0')}`;
          await prisma.datasetOnboardingTask.create({
            data: {
              taskId: newTaskId,
              checklistId: checklistId,
              taskName: t.taskName,
              applicableRole: updated.applicableRole,
              department: updated.department,
              day: t.day || 'Day 1',
              priority: t.priority || 'Medium',
              assignedBy: t.assignedBy || 'HR Operations',
              deadline: t.deadline || `${t.day || 'Day 1'}, 5:00 PM`,
              resourceId: t.resourceId || null,
              isMandatory: t.isMandatory !== undefined ? Boolean(t.isMandatory) : true,
              orderIndex: i,
            },
          });
        }
      }
    }

    if (updated.status === 'Published') {
      await this.matchAndAssignChecklistToAllMatchingEmployees(checklistId);
    }

    return this.getChecklistTemplate(checklistId);
  }

  /**
   * Deletes (archives) a checklist template
   */
  public async deleteChecklistTemplate(checklistId: string): Promise<any> {
    await this.ensureLoaded();
    const updated = await prisma.datasetChecklistTemplate.update({
      where: { checklistId },
      data: { status: 'Archived' },
    });
    return { success: true, checklist: updated };
  }

  /**
   * Duplicates a checklist template as Draft
   */
  public async duplicateChecklistTemplate(checklistId: string): Promise<any> {
    await this.ensureLoaded();
    const source = await prisma.datasetChecklistTemplate.findUnique({
      where: { checklistId },
      include: { tasks: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!source) throw new Error(`Checklist ${checklistId} not found`);

    const count = await prisma.datasetChecklistTemplate.count();
    const newChecklistId = `CHK_${Date.now().toString(36).toUpperCase()}_${count + 1}`;

    const newTemplate = await prisma.datasetChecklistTemplate.create({
      data: {
        checklistId: newChecklistId,
        checklistName: `${source.checklistName} (Copy)`,
        applicableRole: source.applicableRole,
        department: source.department,
        location: source.location,
        durationDays: source.durationDays,
        createdBy: 'Priya Nair (HR)',
        status: 'Draft',
      },
    });

    let taskCount = await prisma.datasetOnboardingTask.count();
    for (let i = 0; i < source.tasks.length; i++) {
      const srcTask = source.tasks[i];
      taskCount++;
      const newTaskId = `T${String(taskCount).padStart(3, '0')}`;
      await prisma.datasetOnboardingTask.create({
        data: {
          taskId: newTaskId,
          checklistId: newChecklistId,
          taskName: srcTask.taskName,
          applicableRole: srcTask.applicableRole,
          department: srcTask.department,
          day: srcTask.day,
          priority: srcTask.priority,
          assignedBy: srcTask.assignedBy,
          deadline: srcTask.deadline,
          resourceId: srcTask.resourceId,
          isMandatory: srcTask.isMandatory,
          orderIndex: i,
        },
      });
    }

    return this.getChecklistTemplate(newChecklistId);
  }

  /**
   * Toggles or sets checklist publish status
   */
  public async togglePublishChecklist(checklistId: string, status?: string): Promise<any> {
    await this.ensureLoaded();
    const existing = await prisma.datasetChecklistTemplate.findUnique({
      where: { checklistId },
    });
    if (!existing) throw new Error(`Checklist ${checklistId} not found`);

    const newStatus = status || (existing.status === 'Published' ? 'Draft' : 'Published');
    const updated = await prisma.datasetChecklistTemplate.update({
      where: { checklistId },
      data: { status: newStatus },
    });

    if (newStatus === 'Published') {
      await this.matchAndAssignChecklistToAllMatchingEmployees(checklistId);
    }

    return this.getChecklistTemplate(checklistId);
  }

  /**
   * Retrieves all employees assigned to a checklist with their real-time progress %
   */
  public async getChecklistAssignedEmployees(checklistId: string): Promise<any[]> {
    await this.ensureLoaded();
    const checklist = await prisma.datasetChecklistTemplate.findUnique({
      where: { checklistId },
      include: { tasks: true },
    });
    if (!checklist) throw new Error(`Checklist ${checklistId} not found`);

    const allEmployees = await prisma.datasetEmployee.findMany({
      include: { progress: true },
    });

    const matchingEmployees = allEmployees.filter((emp) => {
      const roleMatch = checklist.applicableRole === 'All' || checklist.applicableRole.toLowerCase() === emp.role.toLowerCase();
      const deptMatch = checklist.department === 'All' || checklist.department.toLowerCase() === emp.department.toLowerCase();
      const locMatch = checklist.location === 'All' || checklist.location.toLowerCase() === emp.location.toLowerCase();
      return roleMatch && deptMatch && locMatch;
    });

    return matchingEmployees.map((emp) => {
      const checklistTaskIds = new Set(checklist.tasks.map((t) => t.taskId));
      const empProgressForChecklist = emp.progress.filter((p) => checklistTaskIds.has(p.taskId));

      const completed = empProgressForChecklist.filter((p) => p.status === 'Completed').length;
      const total = checklist.tasks.length;
      const pending = total - completed;
      const overdue = empProgressForChecklist.filter((p) => p.status === 'Overdue').length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        employeeId: emp.employeeId,
        name: emp.name,
        role: emp.role,
        department: emp.department,
        location: emp.location,
        email: emp.email,
        joiningDate: emp.joiningDate,
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
        overdueTasks: overdue,
        percentage: pct,
      };
    });
  }

  /**
   * Retrieves overall HR Workspace KPI metrics
   */
  public async getHRWorkspaceMetrics(): Promise<any> {
    await this.ensureLoaded();
    const employees = await this.getAllEmployees();
    const checklists = await prisma.datasetChecklistTemplate.findMany({
      include: { tasks: true },
    });

    const totalNewJoiners = employees.length;
    const completedOnboarding = employees.filter((e) => e.percentage === 100).length;
    const activeOnboarding = employees.filter((e) => e.percentage > 0 && e.percentage < 100).length;
    const pendingOnboarding = employees.filter((e) => e.percentage === 0).length;

    const allProgress = await prisma.datasetProgress.findMany();
    const overdueTasks = allProgress.filter((p) => p.status === 'Overdue').length;

    return {
      success: true,
      totalNewJoiners,
      activeOnboarding,
      completedOnboarding,
      pendingOnboarding,
      overdueTasks,
      totalChecklists: checklists.length,
      publishedChecklists: checklists.filter((c) => c.status === 'Published').length,
      draftChecklists: checklists.filter((c) => c.status === 'Draft').length,
      archivedChecklists: checklists.filter((c) => c.status === 'Archived').length,
    };
  }

  /**
   * Adds an individual task to a checklist template
   */
  public async addTaskToChecklist(checklistId: string, taskData: any): Promise<any> {
    await this.ensureLoaded();
    const checklist = await prisma.datasetChecklistTemplate.findUnique({
      where: { checklistId },
    });
    if (!checklist) throw new Error(`Checklist ${checklistId} not found`);

    const taskCount = await prisma.datasetOnboardingTask.count();
    const newTaskId = `T${String(taskCount + 1).padStart(3, '0')}`;
    const orderIndex = await prisma.datasetOnboardingTask.count({ where: { checklistId } });

    const task = await prisma.datasetOnboardingTask.create({
      data: {
        taskId: newTaskId,
        checklistId,
        taskName: taskData.taskName,
        applicableRole: checklist.applicableRole,
        department: checklist.department,
        day: taskData.day || 'Day 1',
        priority: taskData.priority || 'Medium',
        assignedBy: taskData.assignedBy || 'HR Operations',
        deadline: taskData.deadline || `${taskData.day || 'Day 1'}, 5:00 PM`,
        resourceId: taskData.resourceId || null,
        isMandatory: taskData.isMandatory !== undefined ? Boolean(taskData.isMandatory) : true,
        orderIndex,
      },
      include: { resource: true },
    });

    if (checklist.status === 'Published') {
      await this.matchAndAssignChecklistToAllMatchingEmployees(checklistId);
    }

    return task;
  }

  /**
   * Updates an individual task
   */
  public async updateTask(taskId: string, taskData: any): Promise<any> {
    await this.ensureLoaded();
    const task = await prisma.datasetOnboardingTask.update({
      where: { taskId },
      data: {
        taskName: taskData.taskName !== undefined ? taskData.taskName : undefined,
        day: taskData.day !== undefined ? taskData.day : undefined,
        priority: taskData.priority !== undefined ? taskData.priority : undefined,
        assignedBy: taskData.assignedBy !== undefined ? taskData.assignedBy : undefined,
        deadline: taskData.deadline !== undefined ? taskData.deadline : undefined,
        resourceId: taskData.resourceId !== undefined ? taskData.resourceId : undefined,
        isMandatory: taskData.isMandatory !== undefined ? Boolean(taskData.isMandatory) : undefined,
        orderIndex: taskData.orderIndex !== undefined ? Number(taskData.orderIndex) : undefined,
      },
      include: { resource: true },
    });
    return task;
  }

  /**
   * Deletes an individual task
   */
  public async deleteTask(taskId: string): Promise<any> {
    await this.ensureLoaded();
    await prisma.datasetProgress.deleteMany({ where: { taskId } });
    await prisma.datasetOnboardingTask.delete({ where: { taskId } });
    return { success: true, taskId };
  }
}

export const csvDataLoader = new CsvDataLoaderService();
