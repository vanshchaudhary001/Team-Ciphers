import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Start Smart database seed with authoritative organizational structure...');

  const passwordHash = await bcrypt.hash('demo1234', 10);

  // 1. Seed Companies
  const technova = await prisma.company.upsert({
    where: { emailDomain: 'technova.demo' },
    update: {
      name: 'TechNova Solutions',
      industry: 'Technology',
      defaultLocation: 'Bengaluru',
      timezone: 'Asia/Kolkata',
    },
    create: {
      name: 'TechNova Solutions',
      emailDomain: 'technova.demo',
      industry: 'Technology',
      defaultLocation: 'Bengaluru',
      timezone: 'Asia/Kolkata',
    },
  });

  const finwise = await prisma.company.upsert({
    where: { emailDomain: 'finwise.demo' },
    update: {
      name: 'Finwise Capital',
      industry: 'Fintech',
      defaultLocation: 'Mumbai',
      timezone: 'Asia/Kolkata',
    },
    create: {
      name: 'Finwise Capital',
      emailDomain: 'finwise.demo',
      industry: 'Fintech',
      defaultLocation: 'Mumbai',
      timezone: 'Asia/Kolkata',
    },
  });

  console.log('✅ Companies seeded: TechNova Solutions, Finwise Capital');

  // 2. Load and Seed Authoritative Organizational Structure
  // Try locating data/org_structure.json
  const orgJsonPathCandidates = [
    path.resolve(process.cwd(), 'data/org_structure.json'),
    path.resolve(process.cwd(), '../data/org_structure.json'),
    path.resolve(process.cwd(), '../../data/org_structure.json'),
  ];
  let orgData: any = null;
  for (const p of orgJsonPathCandidates) {
    if (fs.existsSync(p)) {
      orgData = JSON.parse(fs.readFileSync(p, 'utf-8'));
      break;
    }
  }

  if (!orgData) {
    throw new Error('data/org_structure.json not found! Run scripts/generate_authoritative_org_data.py first.');
  }

  console.log(`📊 Found ${orgData.departments.length} departments and ${orgData.positions.length} positions from authoritative document.`);

  // Seed all 18 Departments in DB
  const deptMap = new Map<string, any>();
  for (const d of orgData.departments) {
    const dept = await prisma.department.upsert({
      where: {
        companyId_code: {
          companyId: technova.id,
          code: d.code,
        },
      },
      update: {
        name: d.name,
      },
      create: {
        companyId: technova.id,
        name: d.name,
        code: d.code,
      },
    });
    deptMap.set(d.id, dept);
    deptMap.set(d.name, dept);
    deptMap.set(d.code, dept);
  }
  console.log(`✅ Seeded all 18 authoritative departments for TechNova.`);

  // Seed all 423 OrgPositions
  // Clear existing positions to ensure fresh clean mapping
  await prisma.orgPosition.deleteMany({});
  
  for (const pos of orgData.positions) {
    await prisma.orgPosition.create({
      data: {
        id: pos.id,
        departmentId: pos.departmentId,
        departmentCode: pos.departmentCode,
        departmentName: pos.departmentName,
        branch: pos.branch,
        subBranch: pos.subBranch,
        team: pos.team,
        roleLevel: pos.roleLevel,
        roleTier: pos.roleTier,
        title: pos.title,
        fullTitle: pos.fullTitle,
        isExecutive: pos.isExecutive || false,
        isCeo: pos.isCeo || false,
        hierarchyPath: pos.hierarchyPath,
      },
    });
  }
  console.log(`✅ Seeded all ${orgData.positions.length} authoritative positions into OrgPosition table.`);

  // 3. Locations
  const blrLoc = await prisma.location.findFirst({
    where: { companyId: technova.id, name: 'Bengaluru' },
  }) || await prisma.location.create({
    data: { companyId: technova.id, name: 'Bengaluru', timezone: 'Asia/Kolkata' },
  });

  const hydLoc = await prisma.location.findFirst({
    where: { companyId: technova.id, name: 'Hyderabad' },
  }) || await prisma.location.create({
    data: { companyId: technova.id, name: 'Hyderabad', timezone: 'Asia/Kolkata' },
  });

  const delLoc = await prisma.location.findFirst({
    where: { companyId: technova.id, name: 'Delhi' },
  }) || await prisma.location.create({
    data: { companyId: technova.id, name: 'Delhi', timezone: 'Asia/Kolkata' },
  });

  const remoteLoc = await prisma.location.findFirst({
    where: { companyId: technova.id, name: 'Remote' },
  }) || await prisma.location.create({
    data: { companyId: technova.id, name: 'Remote', timezone: 'Asia/Kolkata', isRemote: true },
  });

  // 4. Owner Groups
  const itOwnerGroup = await prisma.ownerGroup.upsert({
    where: { companyId_code: { companyId: technova.id, code: 'IT_OPS' } },
    update: { name: 'IT Operations' },
    create: {
      companyId: technova.id,
      name: 'IT Operations',
      code: 'IT_OPS',
      description: 'Handles hardware provisioning, VPN certificates, and infrastructure access',
    },
  });

  const hrOwnerGroup = await prisma.ownerGroup.upsert({
    where: { companyId_code: { companyId: technova.id, code: 'HR_OPS' } },
    update: { name: 'HR People Operations' },
    create: {
      companyId: technova.id,
      name: 'HR People Operations',
      code: 'HR_OPS',
      description: 'Handles documentation, benefits, and buddy allocation',
    },
  });

  const secOwnerGroup = await prisma.ownerGroup.upsert({
    where: { companyId_code: { companyId: technova.id, code: 'SECURITY' } },
    update: { name: 'Cybersecurity Engineering' },
    create: {
      companyId: technova.id,
      name: 'Cybersecurity Engineering',
      code: 'SECURITY',
      description: 'Handles security audits, SSO setup, and compliance tokens',
    },
  });

  // 5. Seed Core Role Personas
  // Get departments
  const engDept = deptMap.get('DEP-06');
  const genMgmtDept = deptMap.get('DEP-08');
  const hrDept = deptMap.get('DEP-10');
  const sharedDept = deptMap.get('DEP-04');
  const analyticsDept = deptMap.get('DEP-02');
  const designDept = deptMap.get('DEP-05');
  const marketingDept = deptMap.get('DEP-13');
  const secDept = deptMap.get('DEP-18');
  const salesDept = deptMap.get('DEP-17');
  const finDept = deptMap.get('DEP-07');

  // CEO Position from docx: Manager - Chief Executive Officer under GENERAL MANAGEMENT
  const ceoPos = orgData.positions.find((p: any) => p.isCeo) || orgData.positions.find((p: any) => p.title === 'Chief Executive Officer');
  // Manager Position from docx: Manager - Engineering Manager under Software Engineering
  const mgrPos = orgData.positions.find((p: any) => p.departmentId === 'DEP-06' && p.roleLevel === 'Manager' && p.title.includes('Manager')) || orgData.positions.find((p: any) => p.fullTitle === 'Manager - Principal Software Engineer');
  // Lead Position from docx: Lead - Senior Software Engineer under Software Engineering
  const leadPos = orgData.positions.find((p: any) => p.departmentId === 'DEP-06' && p.roleLevel === 'Lead' && p.title.includes('Senior')) || orgData.positions.find((p: any) => p.fullTitle === 'Lead - Senior Software Engineer');
  // Associate Position from docx: Associate - Software Engineer under Software Engineering
  const assocPos = orgData.positions.find((p: any) => p.departmentId === 'DEP-06' && p.roleLevel === 'Associate' && p.title === 'Software Engineer') || orgData.positions.find((p: any) => p.fullTitle === 'Associate - Software Engineer');

  // A. ASSOCIATE USER
  const associateUser = await prisma.user.upsert({
    where: { email: 'associate@technova.demo' },
    update: {
      passwordHash,
      name: 'Aarav Sharma',
      role: 'ASSOCIATE',
      employeeId: 'EMP-ASC-001',
      departmentId: engDept?.id,
      branch: assocPos?.branch || 'Software Engineering',
      subBranch: assocPos?.subBranch || 'Web and Mobile Development',
      team: assocPos?.team || 'Web and Mobile Development',
      roleLevel: 'Associate',
      positionId: assocPos?.id || 'POS-0112',
      title: assocPos?.title || 'Software Engineer',
      accountStatus: 'ACTIVE',
    },
    create: {
      companyId: technova.id,
      email: 'associate@technova.demo',
      passwordHash,
      name: 'Aarav Sharma',
      role: 'ASSOCIATE',
      employeeId: 'EMP-ASC-001',
      departmentId: engDept?.id,
      branch: assocPos?.branch || 'Software Engineering',
      subBranch: assocPos?.subBranch || 'Web and Mobile Development',
      team: assocPos?.team || 'Web and Mobile Development',
      roleLevel: 'Associate',
      positionId: assocPos?.id || 'POS-0112',
      title: assocPos?.title || 'Software Engineer',
      accountStatus: 'ACTIVE',
    },
  });

  // Also preserve aarav@technova.demo as Associate alias
  const aaravUser = await prisma.user.upsert({
    where: { email: 'aarav@technova.demo' },
    update: {
      passwordHash,
      name: 'Aarav Sharma',
      role: 'ASSOCIATE',
      employeeId: 'EMP-ASC-001',
      departmentId: engDept?.id,
      branch: assocPos?.branch || 'Software Engineering',
      subBranch: assocPos?.subBranch || 'Web and Mobile Development',
      team: assocPos?.team || 'Web and Mobile Development',
      roleLevel: 'Associate',
      positionId: assocPos?.id || 'POS-0112',
      title: assocPos?.title || 'Software Engineer',
      accountStatus: 'ACTIVE',
    },
    create: {
      companyId: technova.id,
      email: 'aarav@technova.demo',
      passwordHash,
      name: 'Aarav Sharma',
      role: 'ASSOCIATE',
      employeeId: 'EMP-ASC-001',
      departmentId: engDept?.id,
      branch: assocPos?.branch || 'Software Engineering',
      subBranch: assocPos?.subBranch || 'Web and Mobile Development',
      team: assocPos?.team || 'Web and Mobile Development',
      roleLevel: 'Associate',
      positionId: assocPos?.id || 'POS-0112',
      title: assocPos?.title || 'Software Engineer',
      accountStatus: 'ACTIVE',
    },
  });

  // B. LEAD USER
  const leadUser = await prisma.user.upsert({
    where: { email: 'lead@technova.demo' },
    update: {
      passwordHash,
      name: 'Priya Lead',
      role: 'LEAD',
      employeeId: 'EMP-LED-001',
      departmentId: engDept?.id,
      branch: leadPos?.branch || 'Software Engineering',
      subBranch: leadPos?.subBranch || 'Web and Mobile Development',
      team: leadPos?.team || 'Web and Mobile Development',
      roleLevel: 'Lead',
      positionId: leadPos?.id || 'POS-0113',
      title: leadPos?.title || 'Senior Software Engineer',
      accountStatus: 'ACTIVE',
    },
    create: {
      companyId: technova.id,
      email: 'lead@technova.demo',
      passwordHash,
      name: 'Priya Lead',
      role: 'LEAD',
      employeeId: 'EMP-LED-001',
      departmentId: engDept?.id,
      branch: leadPos?.branch || 'Software Engineering',
      subBranch: leadPos?.subBranch || 'Web and Mobile Development',
      team: leadPos?.team || 'Web and Mobile Development',
      roleLevel: 'Lead',
      positionId: leadPos?.id || 'POS-0113',
      title: leadPos?.title || 'Senior Software Engineer',
      accountStatus: 'ACTIVE',
    },
  });

  // C. MANAGER USER
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@technova.demo' },
    update: {
      passwordHash,
      name: 'Rohan Verma',
      role: 'MANAGER',
      employeeId: 'EMP-MGR-001',
      departmentId: engDept?.id,
      branch: mgrPos?.branch || 'Software Engineering',
      subBranch: mgrPos?.subBranch || 'Web and Mobile Development',
      team: mgrPos?.team || 'Web and Mobile Development',
      roleLevel: 'Manager',
      positionId: mgrPos?.id || 'POS-0114',
      title: mgrPos?.title || 'Principal Software Engineer',
      accountStatus: 'ACTIVE',
    },
    create: {
      companyId: technova.id,
      email: 'manager@technova.demo',
      passwordHash,
      name: 'Rohan Verma',
      role: 'MANAGER',
      employeeId: 'EMP-MGR-001',
      departmentId: engDept?.id,
      branch: mgrPos?.branch || 'Software Engineering',
      subBranch: mgrPos?.subBranch || 'Web and Mobile Development',
      team: mgrPos?.team || 'Web and Mobile Development',
      roleLevel: 'Manager',
      positionId: mgrPos?.id || 'POS-0114',
      title: mgrPos?.title || 'Principal Software Engineer',
      accountStatus: 'ACTIVE',
    },
  });

  // D. CEO USER (EXECUTIVE ACCESS)
  const ceoUser = await prisma.user.upsert({
    where: { email: 'ceo@technova.demo' },
    update: {
      passwordHash,
      name: 'Rajesh Mehta',
      role: 'CEO',
      employeeId: 'EMP-CEO-001',
      departmentId: genMgmtDept?.id,
      branch: ceoPos?.branch || 'Executive Leadership',
      subBranch: ceoPos?.subBranch || 'Executive Leadership',
      team: ceoPos?.team || 'Executive Leadership',
      roleLevel: 'Manager',
      positionId: ceoPos?.id || 'POS-0182',
      title: ceoPos?.title || 'Chief Executive Officer',
      accountStatus: 'ACTIVE',
      permissions: JSON.stringify(['ALL', 'EXECUTIVE_VIEW', 'ORG_WIDE_AUDIT']),
    },
    create: {
      companyId: technova.id,
      email: 'ceo@technova.demo',
      passwordHash,
      name: 'Rajesh Mehta',
      role: 'CEO',
      employeeId: 'EMP-CEO-001',
      departmentId: genMgmtDept?.id,
      branch: ceoPos?.branch || 'Executive Leadership',
      subBranch: ceoPos?.subBranch || 'Executive Leadership',
      team: ceoPos?.team || 'Executive Leadership',
      roleLevel: 'Manager',
      positionId: ceoPos?.id || 'POS-0182',
      title: ceoPos?.title || 'Chief Executive Officer',
      accountStatus: 'ACTIVE',
      permissions: JSON.stringify(['ALL', 'EXECUTIVE_VIEW', 'ORG_WIDE_AUDIT']),
    },
  });

  // Other system users
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@technova.demo' },
    update: {
      passwordHash,
      name: 'Priya Sharma (HR)',
      role: 'HR_ADMIN',
      employeeId: 'EMP-HR-001',
      departmentId: hrDept?.id,
      branch: 'Human Resources Operations',
      subBranch: 'People Operations',
      team: 'People Operations',
      roleLevel: 'Lead',
      title: 'Lead People Partner',
      accountStatus: 'ACTIVE',
    },
    create: {
      companyId: technova.id,
      email: 'hr@technova.demo',
      passwordHash,
      name: 'Priya Sharma (HR)',
      role: 'HR_ADMIN',
      employeeId: 'EMP-HR-001',
      departmentId: hrDept?.id,
      branch: 'Human Resources Operations',
      subBranch: 'People Operations',
      team: 'People Operations',
      roleLevel: 'Lead',
      title: 'Lead People Partner',
      accountStatus: 'ACTIVE',
    },
  });

  const itOwnerUser = await prisma.user.upsert({
    where: { email: 'it.owner@technova.demo' },
    update: {
      passwordHash,
      name: 'Vikram IT (IT Ops)',
      role: 'TASK_OWNER',
      employeeId: 'EMP-IT-001',
      departmentId: sharedDept?.id,
      branch: 'Business Operations',
      subBranch: 'Infrastructure Support',
      team: 'IT Operations',
      roleLevel: 'Lead',
      title: 'IT Systems Lead',
      accountStatus: 'ACTIVE',
    },
    create: {
      companyId: technova.id,
      email: 'it.owner@technova.demo',
      passwordHash,
      name: 'Vikram IT (IT Ops)',
      role: 'TASK_OWNER',
      employeeId: 'EMP-IT-001',
      departmentId: sharedDept?.id,
      branch: 'Business Operations',
      subBranch: 'Infrastructure Support',
      team: 'IT Operations',
      roleLevel: 'Lead',
      title: 'IT Systems Lead',
      accountStatus: 'ACTIVE',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@technova.demo' },
    update: {
      passwordHash,
      name: 'Neha Admin',
      role: 'COMPANY_ADMIN',
      employeeId: 'EMP-ADM-001',
      departmentId: genMgmtDept?.id,
      branch: 'Business Leadership',
      subBranch: 'Business Unit Management',
      team: 'Business Unit Management',
      roleLevel: 'Manager',
      title: 'Director of Operations',
      accountStatus: 'ACTIVE',
    },
    create: {
      companyId: technova.id,
      email: 'admin@technova.demo',
      passwordHash,
      name: 'Neha Admin',
      role: 'COMPANY_ADMIN',
      employeeId: 'EMP-ADM-001',
      departmentId: genMgmtDept?.id,
      branch: 'Business Leadership',
      subBranch: 'Business Unit Management',
      team: 'Business Unit Management',
      roleLevel: 'Manager',
      title: 'Director of Operations',
      accountStatus: 'ACTIVE',
    },
  });

  // Link IT Owner to group
  await prisma.ownerGroupMember.upsert({
    where: {
      ownerGroupId_userId: {
        ownerGroupId: itOwnerGroup.id,
        userId: itOwnerUser.id,
      },
    },
    update: {},
    create: {
      ownerGroupId: itOwnerGroup.id,
      userId: itOwnerUser.id,
    },
  });

  // 6. Additional Team Members across Departments (Real Workforce Data)
  const additionalEmployees = [
    {
      name: 'Diya Singh',
      email: 'diya.singh@technova.demo',
      role: 'ASSOCIATE',
      roleLevel: 'Associate',
      deptId: analyticsDept?.id,
      branch: 'Data Analytics',
      subBranch: 'Product Analytics',
      team: 'Product Analytics',
      posTitle: 'Associate - Data Analyst',
      title: 'Data Analyst',
      managerName: 'Karan Iyer',
      managerEmail: 'manager@technova.demo',
      buddyName: 'Priya Lead',
      buddyEmail: 'lead@technova.demo',
      locationId: delLoc.id,
      health: 'FLOWING',
    },
    {
      name: 'Rohan Kapoor',
      email: 'rohan.kapoor@technova.demo',
      role: 'ASSOCIATE',
      roleLevel: 'Associate',
      deptId: designDept?.id,
      branch: 'Product Design',
      subBranch: 'UX Design',
      team: 'UX Design',
      posTitle: 'Associate - UX Designer',
      title: 'UX Designer',
      managerName: 'Rohan Verma',
      managerEmail: 'manager@technova.demo',
      buddyName: 'Priya Lead',
      buddyEmail: 'lead@technova.demo',
      locationId: blrLoc.id,
      health: 'FLOWING',
    },
    {
      name: 'Meera Iyer',
      email: 'meera.iyer@technova.demo',
      role: 'ASSOCIATE',
      roleLevel: 'Associate',
      deptId: marketingDept?.id,
      branch: 'Digital Marketing',
      subBranch: 'Growth Marketing',
      team: 'Growth Marketing',
      posTitle: 'Associate - Growth Specialist',
      title: 'Growth Specialist',
      managerName: 'Rohan Verma',
      managerEmail: 'manager@technova.demo',
      buddyName: 'Priya Lead',
      buddyEmail: 'lead@technova.demo',
      locationId: blrLoc.id,
      health: 'FLOWING',
    },
    {
      name: 'Arjun Malhotra',
      email: 'arjun.malhotra@technova.demo',
      role: 'ASSOCIATE',
      roleLevel: 'Associate',
      deptId: secDept?.id,
      branch: 'Cybersecurity Engineering',
      subBranch: 'Cloud Security',
      team: 'Cloud Security',
      posTitle: 'Associate - Cloud Security Engineer',
      title: 'Cloud Security Engineer',
      managerName: 'Rohan Verma',
      managerEmail: 'manager@technova.demo',
      buddyName: 'Priya Lead',
      buddyEmail: 'lead@technova.demo',
      locationId: hydLoc.id,
      health: 'DETOURING',
    },
  ];

  for (let i = 0; i < additionalEmployees.length; i++) {
    const emp = additionalEmployees[i];
    const u = await prisma.user.upsert({
      where: { email: emp.email },
      update: {
        passwordHash,
        name: emp.name,
        role: emp.role,
        employeeId: `EMP-ASC-${100 + i}`,
        departmentId: emp.deptId,
        branch: emp.branch,
        subBranch: emp.subBranch,
        team: emp.team,
        roleLevel: emp.roleLevel,
        title: emp.title,
        accountStatus: 'ACTIVE',
      },
      create: {
        companyId: technova.id,
        email: emp.email,
        passwordHash,
        name: emp.name,
        role: emp.role,
        employeeId: `EMP-ASC-${100 + i}`,
        departmentId: emp.deptId,
        branch: emp.branch,
        subBranch: emp.subBranch,
        team: emp.team,
        roleLevel: emp.roleLevel,
        title: emp.title,
        accountStatus: 'ACTIVE',
      },
    });

    const prof = await prisma.employeeProfile.upsert({
      where: { userId: u.id },
      update: {
        companyId: technova.id,
        departmentId: emp.deptId,
        locationId: emp.locationId,
        managerName: emp.managerName,
        managerEmail: emp.managerEmail,
        buddyName: emp.buddyName,
        buddyEmail: emp.buddyEmail,
        employeeId: `EMP-ASC-${100 + i}`,
        branch: emp.branch,
        subBranch: emp.subBranch,
        team: emp.team,
        roleLevel: emp.roleLevel,
        positionTitle: emp.posTitle,
        workMode: 'HYBRID',
        preJoinStatus: 'READY',
        joiningDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
      },
      create: {
        userId: u.id,
        companyId: technova.id,
        departmentId: emp.deptId,
        locationId: emp.locationId,
        managerName: emp.managerName,
        managerEmail: emp.managerEmail,
        buddyName: emp.buddyName,
        buddyEmail: emp.buddyEmail,
        employeeId: `EMP-ASC-${100 + i}`,
        branch: emp.branch,
        subBranch: emp.subBranch,
        team: emp.team,
        roleLevel: emp.roleLevel,
        positionTitle: emp.posTitle,
        workMode: 'HYBRID',
        preJoinStatus: 'READY',
        joiningDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
      },
    });

    // Create a journey for each employee
    const ej = await prisma.journey.create({
      data: {
        companyId: technova.id,
        employeeProfileId: prof.id,
        name: `${emp.title} Onboarding Journey`,
        health: emp.health,
        startDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
      },
    });

    // Seed standard tasks
    await prisma.journeyTask.create({
      data: {
        journeyId: ej.id,
        companyId: technova.id,
        title: 'Device & MDM Configuration',
        category: 'EQUIPMENT',
        state: 'DONE',
        required: true,
        completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        orderIndex: 1,
      },
    });

    await prisma.journeyTask.create({
      data: {
        journeyId: ej.id,
        companyId: technova.id,
        title: 'Team Orientation & 1-on-1 Meet',
        category: 'ORIENTATION',
        state: emp.health === 'FLOWING' ? 'DONE' : 'AVAILABLE',
        required: true,
        completedAt: emp.health === 'FLOWING' ? new Date(Date.now() - 6 * 60 * 60 * 1000) : null,
        orderIndex: 2,
      },
    });

    await prisma.journeyTask.create({
      data: {
        journeyId: ej.id,
        companyId: technova.id,
        title: `${emp.branch} Tooling Access & Provisioning`,
        category: 'ACCESS',
        state: emp.health === 'FLOWING' ? 'AVAILABLE' : 'WAITING',
        required: true,
        orderIndex: 3,
      },
    });
  }

  // 7. Seed Associate Profile & Full Journey for Aarav / Associate
  const associateProfile = await prisma.employeeProfile.upsert({
    where: { userId: associateUser.id },
    update: {
      companyId: technova.id,
      departmentId: engDept?.id,
      locationId: blrLoc.id,
      managerName: 'Rohan Verma',
      managerEmail: 'manager@technova.demo',
      buddyName: 'Priya Lead',
      buddyEmail: 'lead@technova.demo',
      employeeId: 'EMP-ASC-001',
      branch: assocPos?.branch || 'Software Engineering',
      subBranch: assocPos?.subBranch || 'Web and Mobile Development',
      team: assocPos?.team || 'Web and Mobile Development',
      roleLevel: 'Associate',
      positionId: assocPos?.id || 'POS-0112',
      positionTitle: assocPos?.fullTitle || 'Associate - Software Engineer',
      workMode: 'HYBRID',
      preJoinStatus: 'AT_RISK',
      joiningDate: new Date(),
    },
    create: {
      userId: associateUser.id,
      companyId: technova.id,
      departmentId: engDept?.id,
      locationId: blrLoc.id,
      managerName: 'Rohan Verma',
      managerEmail: 'manager@technova.demo',
      buddyName: 'Priya Lead',
      buddyEmail: 'lead@technova.demo',
      employeeId: 'EMP-ASC-001',
      branch: assocPos?.branch || 'Software Engineering',
      subBranch: assocPos?.subBranch || 'Web and Mobile Development',
      team: assocPos?.team || 'Web and Mobile Development',
      roleLevel: 'Associate',
      positionId: assocPos?.id || 'POS-0112',
      positionTitle: assocPos?.fullTitle || 'Associate - Software Engineer',
      workMode: 'HYBRID',
      preJoinStatus: 'AT_RISK',
      joiningDate: new Date(),
    },
  });

  // Seed Lead Employee Profile
  await prisma.employeeProfile.upsert({
    where: { userId: leadUser.id },
    update: {
      companyId: technova.id,
      departmentId: engDept?.id,
      locationId: blrLoc.id,
      managerName: 'Rohan Verma',
      managerEmail: 'manager@technova.demo',
      buddyName: 'Neha Admin',
      buddyEmail: 'admin@technova.demo',
      employeeId: 'EMP-LED-001',
      branch: leadPos?.branch || 'Software Engineering',
      subBranch: leadPos?.subBranch || 'Web and Mobile Development',
      team: leadPos?.team || 'Web and Mobile Development',
      roleLevel: 'Lead',
      positionId: leadPos?.id || 'POS-0113',
      positionTitle: leadPos?.fullTitle || 'Lead - Senior Software Engineer',
      workMode: 'HYBRID',
      preJoinStatus: 'READY',
      joiningDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
    create: {
      userId: leadUser.id,
      companyId: technova.id,
      departmentId: engDept?.id,
      locationId: blrLoc.id,
      managerName: 'Rohan Verma',
      managerEmail: 'manager@technova.demo',
      buddyName: 'Neha Admin',
      buddyEmail: 'admin@technova.demo',
      employeeId: 'EMP-LED-001',
      branch: leadPos?.branch || 'Software Engineering',
      subBranch: leadPos?.subBranch || 'Web and Mobile Development',
      team: leadPos?.team || 'Web and Mobile Development',
      roleLevel: 'Lead',
      positionId: leadPos?.id || 'POS-0113',
      positionTitle: leadPos?.fullTitle || 'Lead - Senior Software Engineer',
      workMode: 'HYBRID',
      preJoinStatus: 'READY',
      joiningDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
  });

  // Seed Manager Employee Profile
  await prisma.employeeProfile.upsert({
    where: { userId: managerUser.id },
    update: {
      companyId: technova.id,
      departmentId: engDept?.id,
      locationId: blrLoc.id,
      managerName: 'Rajesh Mehta',
      managerEmail: 'ceo@technova.demo',
      employeeId: 'EMP-MGR-001',
      branch: mgrPos?.branch || 'Software Engineering',
      subBranch: mgrPos?.subBranch || 'Web and Mobile Development',
      team: mgrPos?.team || 'Web and Mobile Development',
      roleLevel: 'Manager',
      positionId: mgrPos?.id || 'POS-0114',
      positionTitle: mgrPos?.fullTitle || 'Manager - Principal Software Engineer',
      workMode: 'HYBRID',
      preJoinStatus: 'READY',
      joiningDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    },
    create: {
      userId: managerUser.id,
      companyId: technova.id,
      departmentId: engDept?.id,
      locationId: blrLoc.id,
      managerName: 'Rajesh Mehta',
      managerEmail: 'ceo@technova.demo',
      employeeId: 'EMP-MGR-001',
      branch: mgrPos?.branch || 'Software Engineering',
      subBranch: mgrPos?.subBranch || 'Web and Mobile Development',
      team: mgrPos?.team || 'Web and Mobile Development',
      roleLevel: 'Manager',
      positionId: mgrPos?.id || 'POS-0114',
      positionTitle: mgrPos?.fullTitle || 'Manager - Principal Software Engineer',
      workMode: 'HYBRID',
      preJoinStatus: 'READY',
      joiningDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    },
  });

  // Seed CEO Employee Profile
  await prisma.employeeProfile.upsert({
    where: { userId: ceoUser.id },
    update: {
      companyId: technova.id,
      departmentId: genMgmtDept?.id,
      locationId: blrLoc.id,
      employeeId: 'EMP-CEO-001',
      branch: ceoPos?.branch || 'Executive Leadership',
      subBranch: ceoPos?.subBranch || 'Executive Leadership',
      team: ceoPos?.team || 'Executive Leadership',
      roleLevel: 'Manager',
      positionId: ceoPos?.id || 'POS-0182',
      positionTitle: ceoPos?.fullTitle || 'Manager - Chief Executive Officer',
      workMode: 'HYBRID',
      preJoinStatus: 'READY',
      joiningDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    },
    create: {
      userId: ceoUser.id,
      companyId: technova.id,
      departmentId: genMgmtDept?.id,
      locationId: blrLoc.id,
      employeeId: 'EMP-CEO-001',
      branch: ceoPos?.branch || 'Executive Leadership',
      subBranch: ceoPos?.subBranch || 'Executive Leadership',
      team: ceoPos?.team || 'Executive Leadership',
      roleLevel: 'Manager',
      positionId: ceoPos?.id || 'POS-0182',
      positionTitle: ceoPos?.fullTitle || 'Manager - Chief Executive Officer',
      workMode: 'HYBRID',
      preJoinStatus: 'READY',
      joiningDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    },
  });

  // Clean and recreate Aarav's detailed onboarding DAG journey
  const existingJourneys = await prisma.journey.findMany({
    where: { employeeProfileId: associateProfile.id },
  });
  for (const ej of existingJourneys) {
    await prisma.journeyTaskDependency.deleteMany({
      where: { journeyTask: { journeyId: ej.id } },
    });
    await prisma.blocker.deleteMany({
      where: { journeyId: ej.id },
    });
    await prisma.taskNote.deleteMany({
      where: { task: { journeyId: ej.id } },
    });
    await prisma.journeyTask.deleteMany({
      where: { journeyId: ej.id },
    });
    await prisma.journey.delete({
      where: { id: ej.id },
    });
  }

  const aaravJourney = await prisma.journey.create({
    data: {
      companyId: technova.id,
      employeeProfileId: associateProfile.id,
      name: 'Associate Software Engineer First-Week Journey',
      health: 'DETOURING',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  // Task 1: Laptop Provisioning -> DONE
  const tLaptop = await prisma.journeyTask.create({
    data: {
      journeyId: aaravJourney.id,
      companyId: technova.id,
      title: 'Laptop Provisioning & Device Setup',
      purpose: 'Unbox corporate MacBook Pro and install MDM device management profile.',
      instructions: 'Power on your MacBook, select TechNova Wi-Fi, and enroll in Jamf Pro MDM.',
      category: 'EQUIPMENT',
      state: 'DONE',
      required: true,
      completedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      completedBy: 'Vikram IT (IT Ops)',
      orderIndex: 1,
    },
  });

  // Task 2: VPN Approval -> WAITING (Root Blocker)
  const tVpn = await prisma.journeyTask.create({
    data: {
      journeyId: aaravJourney.id,
      companyId: technova.id,
      title: 'VPN Certificate & Access Approval',
      purpose: 'Generate secure WireGuard/OpenVPN certificate for TechNova internal cluster access.',
      instructions: 'IT Operations verifies hardware identity and issues internal VPN credentials.',
      category: 'ACCESS',
      state: 'WAITING',
      required: true,
      ownerGroupId: itOwnerGroup.id,
      assignedUserId: itOwnerUser.id,
      slaHours: 8,
      orderIndex: 2,
    },
  });

  // Task 3: GitHub Access -> LOCKED (Prereq: VPN)
  const tGithub = await prisma.journeyTask.create({
    data: {
      journeyId: aaravJourney.id,
      companyId: technova.id,
      title: 'GitHub Enterprise Organization Access',
      purpose: 'Grant membership to the TechNova GitHub organization and core engineering teams.',
      instructions: 'Authorize 2FA on GitHub and accept the TechNova organization invite.',
      category: 'ACCESS',
      state: 'LOCKED',
      required: true,
      orderIndex: 3,
    },
  });

  // Task 4: Repository Access -> LOCKED (Prereq: GitHub)
  const tRepo = await prisma.journeyTask.create({
    data: {
      journeyId: aaravJourney.id,
      companyId: technova.id,
      title: 'Core Repository Access & SSH Keys',
      purpose: 'Configure personal SSH signing keys and clone the core platform codebase.',
      instructions: 'Generate ed25519 SSH keys and verify read/write access to repos.',
      category: 'ACCESS',
      state: 'LOCKED',
      required: true,
      orderIndex: 4,
    },
  });

  // Task 5: Development Environment -> LOCKED (Prereq: Repo)
  const tDevEnv = await prisma.journeyTask.create({
    data: {
      journeyId: aaravJourney.id,
      companyId: technova.id,
      title: 'Local Development Environment Setup',
      purpose: 'Initialize Docker Compose services, Node runtimes, and local PostgreSQL databases.',
      instructions: 'Run `make bootstrap` and confirm all 6 microservices pass health checks.',
      category: 'ORIENTATION',
      state: 'LOCKED',
      required: true,
      orderIndex: 5,
    },
  });

  // Task 6: First Coding Task -> LOCKED (Prereq: DevEnv)
  const tFirstCode = await prisma.journeyTask.create({
    data: {
      journeyId: aaravJourney.id,
      companyId: technova.id,
      title: 'First Onboarding PR & Deployment',
      purpose: 'Complete an onboarding starter ticket, open a PR, and trigger CI/CD pipeline.',
      instructions: 'Pick up ticket ENG-101 in Jira, make the change, run unit tests, and submit PR.',
      category: 'ORIENTATION',
      state: 'LOCKED',
      required: true,
      orderIndex: 6,
    },
  });

  // Task 7: Security Training -> AVAILABLE (SideQuest)
  const tSecurity = await prisma.journeyTask.create({
    data: {
      journeyId: aaravJourney.id,
      companyId: technova.id,
      title: 'Security Awareness & Compliance Training',
      purpose: 'Complete 30-minute interactive module on SOC2 compliance and phishing protection.',
      instructions: 'Log in to KnowBe4 training portal using SSO and complete the 2026 course.',
      category: 'TRAINING',
      state: 'AVAILABLE',
      required: true,
      slaHours: 48,
      orderIndex: 7,
    },
  });

  // Task 8: Engineering Orientation -> AVAILABLE (SideQuest)
  const tOrientation = await prisma.journeyTask.create({
    data: {
      journeyId: aaravJourney.id,
      companyId: technova.id,
      title: 'Engineering Culture & Architecture Deep Dive',
      purpose: 'Read the architectural design records (ADRs) and watch the recorded system overview video.',
      instructions: 'Review Notion wiki: /engineering/architecture-overview-2026.',
      category: 'ORIENTATION',
      state: 'AVAILABLE',
      required: false,
      slaHours: 72,
      orderIndex: 8,
    },
  });

  // Task 9: Buddy 1-on-1 -> AVAILABLE (SideQuest)
  const tBuddy = await prisma.journeyTask.create({
    data: {
      journeyId: aaravJourney.id,
      companyId: technova.id,
      title: '1-on-1 Coffee Chat with Onboarding Lead',
      purpose: 'Schedule a 30-minute introduction call to discuss team rituals and get unblocked.',
      instructions: 'Book a slot on Google Calendar with Priya Lead.',
      category: 'HR',
      state: 'AVAILABLE',
      required: false,
      slaHours: 24,
      orderIndex: 9,
    },
  });

  // Wire up Dependencies:
  await prisma.journeyTaskDependency.createMany({
    data: [
      { journeyTaskId: tVpn.id, dependsOnTaskId: tLaptop.id },
      { journeyTaskId: tGithub.id, dependsOnTaskId: tVpn.id },
      { journeyTaskId: tRepo.id, dependsOnTaskId: tGithub.id },
      { journeyTaskId: tDevEnv.id, dependsOnTaskId: tRepo.id },
      { journeyTaskId: tFirstCode.id, dependsOnTaskId: tDevEnv.id },
      { journeyTaskId: tSecurity.id, dependsOnTaskId: tLaptop.id },
      { journeyTaskId: tOrientation.id, dependsOnTaskId: tLaptop.id },
      { journeyTaskId: tBuddy.id, dependsOnTaskId: tLaptop.id },
    ],
  });

  // Blocker for VPN
  await prisma.blocker.create({
    data: {
      journeyId: aaravJourney.id,
      companyId: technova.id,
      rootTaskId: tVpn.id,
      affectedTaskId: tGithub.id,
      status: 'ACTIVE',
      rootCauseSummary: 'VPN Certificate is awaiting IT Operations approval. Downstream tasks (GitHub, Repos, DevEnv, PR) are locked.',
      responsibleOwnerGroupId: itOwnerGroup.id,
      responsibleUserId: itOwnerUser.id,
      detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  });

  // 8. Seed Knowledge Base Sources
  await prisma.knowledgeSource.deleteMany({});
  await prisma.knowledgeSource.createMany({
    data: [
      {
        companyId: technova.id,
        title: 'VPN Certificate & Access Runbook (IT-RB-004)',
        excerpt: 'Standard operating procedure for issuing internal WireGuard VPN certificates and handling SLA escalation.',
        content: `### WireGuard VPN Issuance Runbook
1. Ensure the employee laptop is registered in Jamf Pro MDM.
2. Verify hardware certificate and serial number against the inventory database.
3. Generate profile using internal CLI: \`vpn-admin issue --user {email}\`.
4. The employee receives an automated invite containing their tunnel config.
5. In case of delay beyond 4 hours, employee can trigger 1-click Nudge to IT Operations on-call engineer.`,
        category: 'RUNBOOK',
        owner: 'IT Operations (Vikram IT)',
        status: 'APPROVED',
      },
      {
        companyId: technova.id,
        title: 'GitHub Enterprise Access & Team Allocation Policy',
        excerpt: 'Rules governing automated invite dispatch to github.com/technova-solutions upon VPN clearance.',
        content: `### GitHub Organization Access
- Prerequisites: Verified VPN certificate and active SSO identity.
- Team assignment: Employees in Engineering are added to @technova/engineering and their respective team repos.
- 2FA Requirement: Strict mandatory hardware key (YubiKey) or TOTP authenticator app.`,
        category: 'POLICY',
        owner: 'Security Engineering',
        status: 'APPROVED',
      },
      {
        companyId: technova.id,
        title: 'TechNova Onboarding FAQ & First-Week Survival Guide',
        excerpt: 'Frequently asked questions covering meal allowances, Slack channels, buddy pairing, and expense reimbursements.',
        content: `### Welcome to TechNova Solutions!
- **Where do I get IT support?** #it-helpdesk or the UNSTICK button in StartSmart.
- **How does Buddy pairing work?** Every joiner is assigned a Lead/Mentor in their sub-branch to guide daily tasks.
- **What if a prerequisite task is stuck?** StartSmart will immediately identify SideQuests (Compliance training, ADR reading, Coffee chats) so your Day 1 is never wasted.`,
        category: 'GUIDE',
        owner: 'HR People Operations',
        status: 'APPROVED',
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log('==================================================');
  console.log('DEMO ACCOUNTS FOR EVALUATION (Password: demo1234):');
  console.log('1. ASSOCIATE : associate@technova.demo  (Aarav Sharma - Associate Software Engineer)');
  console.log('2. LEAD      : lead@technova.demo       (Priya Lead - Lead Senior Software Engineer)');
  console.log('3. MANAGER   : manager@technova.demo    (Rohan Verma - Manager Engineering Manager)');
  console.log('4. CEO       : ceo@technova.demo        (Rajesh Mehta - Chief Executive Officer)');
  console.log('5. HR ADMIN  : hr@technova.demo         (Priya Sharma - Lead People Partner)');
  console.log('6. IT OWNER  : it.owner@technova.demo   (Vikram IT - IT Systems Lead)');
  console.log('7. ADMIN     : admin@technova.demo      (Neha Admin - Director of Operations)');
  console.log('==================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
