import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Start Smart database seed...');

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

  const medcore = await prisma.company.upsert({
    where: { emailDomain: 'medcore.demo' },
    update: {
      name: 'MedCore Health Systems',
      industry: 'Healthcare',
      defaultLocation: 'Delhi',
      timezone: 'Asia/Kolkata',
    },
    create: {
      name: 'MedCore Health Systems',
      emailDomain: 'medcore.demo',
      industry: 'Healthcare',
      defaultLocation: 'Delhi',
      timezone: 'Asia/Kolkata',
    },
  });

  console.log('✅ Companies seeded: TechNova, Finwise, MedCore');

  // 2. Seed Departments, Locations, Roles for TechNova
  const engDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: technova.id, code: 'ENG' } },
    update: {},
    create: { companyId: technova.id, name: 'Engineering', code: 'ENG' },
  });

  const hrDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: technova.id, code: 'HR' } },
    update: {},
    create: { companyId: technova.id, name: 'Human Resources', code: 'HR' },
  });

  const itDept = await prisma.department.upsert({
    where: { companyId_code: { companyId: technova.id, code: 'IT' } },
    update: {},
    create: { companyId: technova.id, name: 'Information Technology', code: 'IT' },
  });

  const blrLoc = await prisma.location.findFirst({
    where: { companyId: technova.id, name: 'Bengaluru' },
  }) || await prisma.location.create({
    data: { companyId: technova.id, name: 'Bengaluru', timezone: 'Asia/Kolkata' },
  });

  await prisma.location.findFirst({
    where: { companyId: technova.id, name: 'Delhi' },
  }) || await prisma.location.create({
    data: { companyId: technova.id, name: 'Delhi', timezone: 'Asia/Kolkata' },
  });

  await prisma.location.findFirst({
    where: { companyId: technova.id, name: 'Remote' },
  }) || await prisma.location.create({
    data: { companyId: technova.id, name: 'Remote', timezone: 'Asia/Kolkata', isRemote: true },
  });

  const seRole = await prisma.role.findFirst({
    where: { companyId: technova.id, title: 'Software Engineer' },
  }) || await prisma.role.create({
    data: { companyId: technova.id, departmentId: engDept.id, title: 'Software Engineer' },
  });

  // 3. Seed Owner Groups
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

  // 4. Seed Users for TechNova
  const aaravUser = await prisma.user.upsert({
    where: { email: 'aarav@technova.demo' },
    update: { passwordHash, name: 'Aarav Sharma', role: 'EMPLOYEE', title: 'Software Engineer' },
    create: {
      companyId: technova.id,
      email: 'aarav@technova.demo',
      passwordHash,
      name: 'Aarav Sharma',
      role: 'EMPLOYEE',
      title: 'Software Engineer',
    },
  });

  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@technova.demo' },
    update: { passwordHash, name: 'Priya Sharma (HR)', role: 'HR_ADMIN', title: 'Lead People Partner' },
    create: {
      companyId: technova.id,
      email: 'hr@technova.demo',
      passwordHash,
      name: 'Priya Sharma (HR)',
      role: 'HR_ADMIN',
      title: 'Lead People Partner',
    },
  });

  const itOwnerUser = await prisma.user.upsert({
    where: { email: 'it.owner@technova.demo' },
    update: { passwordHash, name: 'Vikram IT (IT Ops)', role: 'TASK_OWNER', title: 'IT Systems Lead' },
    create: {
      companyId: technova.id,
      email: 'it.owner@technova.demo',
      passwordHash,
      name: 'Vikram IT (IT Ops)',
      role: 'TASK_OWNER',
      title: 'IT Systems Lead',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@technova.demo' },
    update: { passwordHash, name: 'Neha Admin', role: 'COMPANY_ADMIN', title: 'Director of Operations' },
    create: {
      companyId: technova.id,
      email: 'admin@technova.demo',
      passwordHash,
      name: 'Neha Admin',
      role: 'COMPANY_ADMIN',
      title: 'Director of Operations',
    },
  });

  // Connect IT Owner to IT Operations group
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

  // 5. Seed Aarav Employee Profile
  const aaravProfile = await prisma.employeeProfile.upsert({
    where: { userId: aaravUser.id },
    update: {
      companyId: technova.id,
      departmentId: engDept.id,
      locationId: blrLoc.id,
      roleId: seRole.id,
      managerName: 'Priya Sharma',
      managerEmail: 'hr@technova.demo',
      buddyName: 'Rahul Mehta',
      buddyEmail: 'rahul.mehta@technova.demo',
      workMode: 'HYBRID',
      preJoinStatus: 'AT_RISK',
      joiningDate: new Date(),
    },
    create: {
      userId: aaravUser.id,
      companyId: technova.id,
      departmentId: engDept.id,
      locationId: blrLoc.id,
      roleId: seRole.id,
      managerName: 'Priya Sharma',
      managerEmail: 'hr@technova.demo',
      buddyName: 'Rahul Mehta',
      buddyEmail: 'rahul.mehta@technova.demo',
      workMode: 'HYBRID',
      preJoinStatus: 'AT_RISK',
      joiningDate: new Date(),
    },
  });

  // 6. Seed Onboarding Journey for Aarav
  // Clean existing journey tasks & dependencies for idempotency
  const existingJourney = await prisma.journey.findFirst({
    where: { employeeProfileId: aaravProfile.id },
  });

  if (existingJourney) {
    await prisma.journeyTaskDependency.deleteMany({
      where: { journeyTask: { journeyId: existingJourney.id } },
    });
    await prisma.blocker.deleteMany({
      where: { journeyId: existingJourney.id },
    });
    await prisma.taskNote.deleteMany({
      where: { task: { journeyId: existingJourney.id } },
    });
    await prisma.journeyTask.deleteMany({
      where: { journeyId: existingJourney.id },
    });
    await prisma.journey.delete({
      where: { id: existingJourney.id },
    });
  }

  const aaravJourney = await prisma.journey.create({
    data: {
      companyId: technova.id,
      employeeProfileId: aaravProfile.id,
      name: 'Software Engineer First-Week Journey',
      health: 'DETOURING', // VPN is waiting, but SideQuests like Security Training are available!
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
    },
  });

  // Tasks in exact required order & states:
  // 1. Laptop Provisioning -> DONE
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

  // 2. VPN Approval -> WAITING (Owner: IT Operations)
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

  // 3. GitHub Access -> LOCKED (Prereq: VPN Approval)
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

  // 4. Repository Access -> LOCKED (Prereq: GitHub Access)
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

  // 5. Development Environment -> LOCKED (Prereq: Repository Access)
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

  // 6. First Coding Task -> LOCKED (Prereq: Development Environment)
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

  // Independent tasks:
  // 7. Security Training -> AVAILABLE (Prereq: Laptop Provisioning)
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

  // 8. Engineering Orientation -> AVAILABLE (Prereq: Laptop Provisioning)
  const tOrientation = await prisma.journeyTask.create({
    data: {
      journeyId: aaravJourney.id,
      companyId: technova.id,
      title: 'Engineering Culture & Architecture Deep Dive',
      purpose: 'Review engineering handbook, PR review etiquette, and deployment guidelines.',
      instructions: 'Watch recorded 45-minute architectural walkthrough in Notion.',
      category: 'ORIENTATION',
      state: 'AVAILABLE',
      required: false,
      slaHours: 72,
      orderIndex: 8,
    },
  });

  // 9. Meet Your Buddy -> AVAILABLE (No prereqs)
  const tBuddy = await prisma.journeyTask.create({
    data: {
      journeyId: aaravJourney.id,
      companyId: technova.id,
      title: '1-on-1 Coffee Chat with Onboarding Buddy',
      purpose: 'Meet Rahul Mehta to discuss team norms, questions, and get your first week bearings.',
      instructions: 'Schedule 30 mins on Google Calendar with Rahul Mehta.',
      category: 'HR',
      state: 'AVAILABLE',
      required: false,
      slaHours: 24,
      orderIndex: 9,
    },
  });

  // 10. Company Policies Acknowledgment -> AVAILABLE (No prereqs)
  const tPolicy = await prisma.journeyTask.create({
    data: {
      journeyId: aaravJourney.id,
      companyId: technova.id,
      title: 'Code of Conduct & Remote Work Policy',
      purpose: 'Acknowledge company code of ethics, IP assignment, and remote work policy.',
      instructions: 'Review and sign electronic consent form in BambooHR.',
      category: 'HR',
      state: 'AVAILABLE',
      required: true,
      slaHours: 48,
      orderIndex: 10,
    },
  });

  // Create Dependencies:
  // Primary chain: Laptop -> VPN -> GitHub -> Repo -> DevEnv -> FirstCode
  await prisma.journeyTaskDependency.createMany({
    data: [
      { journeyTaskId: tVpn.id, dependsOnTaskId: tLaptop.id },
      { journeyTaskId: tGithub.id, dependsOnTaskId: tVpn.id },
      { journeyTaskId: tRepo.id, dependsOnTaskId: tGithub.id },
      { journeyTaskId: tDevEnv.id, dependsOnTaskId: tRepo.id },
      { journeyTaskId: tFirstCode.id, dependsOnTaskId: tDevEnv.id },
      // Security & Orientation depend on Laptop
      { journeyTaskId: tSecurity.id, dependsOnTaskId: tLaptop.id },
      { journeyTaskId: tOrientation.id, dependsOnTaskId: tLaptop.id },
    ],
  });

  // Create Active Blocker Record for Aarav
  await prisma.blocker.create({
    data: {
      journeyId: aaravJourney.id,
      companyId: technova.id,
      rootTaskId: tVpn.id,
      affectedTaskId: tGithub.id,
      status: 'ACTIVE',
      rootCauseSummary: 'GitHub access is waiting because VPN approval is incomplete with IT Operations. 4 downstream tasks are blocked.',
      responsibleOwnerGroupId: itOwnerGroup.id,
      responsibleUserId: itOwnerUser.id,
      detectedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    },
  });

  // 7. Seed Sample Secondary Employees for TechNova HR View
  // Riya Mehta - Laptop Delivery Blocker
  const riyaUser = await prisma.user.upsert({
    where: { email: 'riya.mehta@technova.demo' },
    update: { passwordHash, name: 'Riya Mehta', role: 'EMPLOYEE', title: 'Data Analyst' },
    create: {
      companyId: technova.id,
      email: 'riya.mehta@technova.demo',
      passwordHash,
      name: 'Riya Mehta',
      role: 'EMPLOYEE',
      title: 'Data Analyst',
    },
  });

  const riyaProfile = await prisma.employeeProfile.upsert({
    where: { userId: riyaUser.id },
    update: {
      companyId: technova.id,
      departmentId: engDept.id,
      locationId: blrLoc.id,
      managerName: 'Priya Sharma',
      buddyName: 'Ankit Data',
      workMode: 'REMOTE',
      preJoinStatus: 'BLOCKED',
      joiningDate: new Date(),
    },
    create: {
      userId: riyaUser.id,
      companyId: technova.id,
      departmentId: engDept.id,
      locationId: blrLoc.id,
      managerName: 'Priya Sharma',
      buddyName: 'Ankit Data',
      workMode: 'REMOTE',
      preJoinStatus: 'BLOCKED',
      joiningDate: new Date(),
    },
  });

  const riyaJourney = await prisma.journey.create({
    data: {
      companyId: technova.id,
      employeeProfileId: riyaProfile.id,
      name: 'Data Analyst First-Week Journey',
      health: 'STALLED',
      startDate: new Date(Date.now() - 32 * 60 * 60 * 1000),
    },
  });

  const riyaLaptop = await prisma.journeyTask.create({
    data: {
      journeyId: riyaJourney.id,
      companyId: technova.id,
      title: 'Laptop Courier Delivery & Tracking',
      purpose: 'MacBook shipment delivery via BlueDart.',
      category: 'EQUIPMENT',
      state: 'WAITING',
      ownerGroupId: itOwnerGroup.id,
      assignedUserId: itOwnerUser.id,
      orderIndex: 1,
    },
  });

  await prisma.blocker.create({
    data: {
      journeyId: riyaJourney.id,
      companyId: technova.id,
      rootTaskId: riyaLaptop.id,
      affectedTaskId: riyaLaptop.id,
      status: 'ACTIVE',
      rootCauseSummary: 'Laptop shipment delayed in transit with BlueDart courier.',
      responsibleOwnerGroupId: itOwnerGroup.id,
      responsibleUserId: itOwnerUser.id,
      detectedAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
    },
  });

  // Kabir Singh - HR Documentation Blocker
  const kabirUser = await prisma.user.upsert({
    where: { email: 'kabir.singh@technova.demo' },
    update: { passwordHash, name: 'Kabir Singh', role: 'EMPLOYEE', title: 'Product Manager' },
    create: {
      companyId: technova.id,
      email: 'kabir.singh@technova.demo',
      passwordHash,
      name: 'Kabir Singh',
      role: 'EMPLOYEE',
      title: 'Product Manager',
    },
  });

  const kabirProfile = await prisma.employeeProfile.upsert({
    where: { userId: kabirUser.id },
    update: {
      companyId: technova.id,
      departmentId: hrDept.id,
      locationId: blrLoc.id,
      managerName: 'Priya Sharma',
      buddyName: 'Sunita PM',
      workMode: 'ONSITE',
      preJoinStatus: 'AT_RISK',
      joiningDate: new Date(),
    },
    create: {
      userId: kabirUser.id,
      companyId: technova.id,
      departmentId: hrDept.id,
      locationId: blrLoc.id,
      managerName: 'Priya Sharma',
      buddyName: 'Sunita PM',
      workMode: 'ONSITE',
      preJoinStatus: 'AT_RISK',
      joiningDate: new Date(),
    },
  });

  const kabirJourney = await prisma.journey.create({
    data: {
      companyId: technova.id,
      employeeProfileId: kabirProfile.id,
      name: 'Product Manager Journey',
      health: 'DETOURING',
      startDate: new Date(Date.now() - 20 * 60 * 60 * 1000),
    },
  });

  const kabirDoc = await prisma.journeyTask.create({
    data: {
      journeyId: kabirJourney.id,
      companyId: technova.id,
      title: 'HR Background Verification & Documentation',
      purpose: 'Submit previous employment certificate and government ID.',
      category: 'HR',
      state: 'WAITING',
      ownerGroupId: hrOwnerGroup.id,
      orderIndex: 1,
    },
  });

  await prisma.blocker.create({
    data: {
      journeyId: kabirJourney.id,
      companyId: technova.id,
      rootTaskId: kabirDoc.id,
      affectedTaskId: kabirDoc.id,
      status: 'ACTIVE',
      rootCauseSummary: 'Pending background check documents verification.',
      responsibleOwnerGroupId: hrOwnerGroup.id,
      detectedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    },
  });

  // 8. Seed Knowledge Sources for TechNova
  await prisma.knowledgeSource.deleteMany({ where: { companyId: technova.id } });
  await prisma.knowledgeSource.createMany({
    data: [
      {
        companyId: technova.id,
        title: 'TechNova VPN & Zero-Trust Remote Access Policy',
        excerpt: 'VPN approval is handled by IT Operations and requires verified device posture in Jamf Pro.',
        content: `TechNova employs WireGuard-based Zero Trust Network Access (ZTNA). 
1. New joiners must have their laptop provisioned and enrolled in Jamf Pro before a VPN certificate is issued.
2. IT Operations reviews device integrity within 8 business hours.
3. Once approved, the WireGuard configuration file is automatically pushed to your managed device profile.
4. You do not need to submit manual Jira tickets; IT is notified automatically upon laptop enrollment.`,
        sourceUrl: 'https://wiki.technova.internal/it/vpn-guide',
        category: 'GUIDE',
        owner: 'IT Operations Team',
        status: 'APPROVED',
      },
      {
        companyId: technova.id,
        title: 'GitHub Enterprise Organization & Repository Onboarding',
        excerpt: 'GitHub access requires active TechNova VPN and mandatory hardware 2FA key configuration.',
        content: `Access to TechNova GitHub Enterprise (github.com/technova-solutions):
1. Prerequisites: Active VPN approval is strictly mandatory before GitHub IP allowlisting will succeed.
2. Once your VPN is active, visit sso.technova.internal/github to link your verified work email.
3. You will receive an invitation to join the 'technova-engineers' team within 15 minutes.
4. Ensure hardware FIDO2 or 1Password WebAuthn 2FA is enabled.`,
        sourceUrl: 'https://wiki.technova.internal/eng/github-access',
        category: 'GUIDE',
        owner: 'DevOps & Infrastructure',
        status: 'APPROVED',
      },
      {
        companyId: technova.id,
        title: 'Local Development Environment & Docker Microservices Standard',
        excerpt: 'Step-by-step setup guide for Node.js 22, Docker Compose, and PostgreSQL 16 runtimes.',
        content: `Standard engineering stack setup:
1. Clone the core repository with 'git clone git@github.com:technova/core-platform.git'.
2. Execute 'make bootstrap' to install node packages, configure local envs, and pull containers.
3. Run 'docker compose up -d' to start local Redis and Postgres databases.
4. Health checks are accessible at http://localhost:8080/health.`,
        sourceUrl: 'https://wiki.technova.internal/eng/local-dev-guide',
        category: 'RUNBOOK',
        owner: 'Core Engineering Guild',
        status: 'APPROVED',
      },
      {
        companyId: technova.id,
        title: 'Security Compliance & SOC2 Type II Engineering Guidelines',
        excerpt: 'Mandatory guidelines on code reviews, secret management, and customer data privacy.',
        content: `TechNova Security Handbook:
1. Never commit secrets, API keys, or raw JWTs into version control. GitGuardian will automatically revoke exposed credentials.
2. All pull requests require at least 2 approving reviews and green automated test pipelines.
3. Complete your KnowBe4 security awareness module within your first 48 hours.`,
        sourceUrl: 'https://wiki.technova.internal/security/soc2-handbook',
        category: 'POLICY',
        owner: 'InfoSec Team',
        status: 'APPROVED',
      },
    ],
  });

  // 9. Seed Sample Knowledge Gap
  await prisma.knowledgeGap.deleteMany({ where: { companyId: technova.id } });
  await prisma.knowledgeGap.create({
    data: {
      companyId: technova.id,
      normalizedQuestion: 'how to request aws staging sandbox credentials',
      category: 'ACCESS',
      occurrenceCount: 3,
      status: 'OPEN',
      suggestedOwner: 'Cloud Infrastructure Team',
    },
  });

  // 10. Seed Notifications for Aarav and IT Owner
  await prisma.notification.deleteMany({ where: { companyId: technova.id } });
  await prisma.notification.createMany({
    data: [
      {
        companyId: technova.id,
        userId: aaravUser.id,
        type: 'TASK_COMPLETED',
        title: 'Laptop Provisioning Completed',
        message: 'Your laptop setup was verified by IT Operations. Welcome to TechNova!',
        relatedTaskId: tLaptop.id,
        isRead: true,
      },
      {
        companyId: technova.id,
        userId: aaravUser.id,
        type: 'BLOCKER_DETECTED',
        title: 'Waiting for VPN Approval',
        message: 'GitHub access is locked until IT Operations issues your VPN certificate. You can work on Security Training meanwhile.',
        relatedTaskId: tVpn.id,
        isRead: false,
      },
      {
        companyId: technova.id,
        userId: itOwnerUser.id,
        type: 'TASK_ASSIGNED',
        title: 'Action Required: VPN Certificate for Aarav Sharma',
        message: 'Aarav completed laptop setup. Please review and approve VPN certificate generation.',
        relatedTaskId: tVpn.id,
        isRead: false,
      },
    ],
  });

  // 11. Seed Finwise & MedCore for Tenant Isolation Demonstrations
  const finwiseAdmin = await prisma.user.upsert({
    where: { email: 'admin@finwise.demo' },
    update: { passwordHash, name: 'Finwise Admin', role: 'COMPANY_ADMIN' },
    create: {
      companyId: finwise.id,
      email: 'admin@finwise.demo',
      passwordHash,
      name: 'Finwise Admin',
      role: 'COMPANY_ADMIN',
    },
  });

  const finwiseEmployee = await prisma.user.upsert({
    where: { email: 'rohit@finwise.demo' },
    update: { passwordHash, name: 'Rohit Verma', role: 'EMPLOYEE' },
    create: {
      companyId: finwise.id,
      email: 'rohit@finwise.demo',
      passwordHash,
      name: 'Rohit Verma',
      role: 'EMPLOYEE',
    },
  });

  const medcoreAdmin = await prisma.user.upsert({
    where: { email: 'admin@medcore.demo' },
    update: { passwordHash, name: 'MedCore Admin', role: 'COMPANY_ADMIN' },
    create: {
      companyId: medcore.id,
      email: 'admin@medcore.demo',
      passwordHash,
      name: 'MedCore Admin',
      role: 'COMPANY_ADMIN',
    },
  });

  console.log('🎉 Seed completed successfully!');
  console.log('TechNova Demo Accounts:');
  console.log(' - Employee: aarav@technova.demo (Password: demo1234)');
  console.log(' - HR Admin: hr@technova.demo (Password: demo1234)');
  console.log(' - IT Owner: it.owner@technova.demo (Password: demo1234)');
  console.log(' - Company Admin: admin@technova.demo (Password: demo1234)');
  console.log('Finwise Demo: admin@finwise.demo / rohit@finwise.demo');
  console.log('MedCore Demo: admin@medcore.demo');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
