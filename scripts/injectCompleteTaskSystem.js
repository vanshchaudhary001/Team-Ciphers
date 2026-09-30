const fs = require('fs');
const path = require('path');

// 1. Build rich datasets.json
function parseCsv(filename) {
  const content = fs.readFileSync(path.join(__dirname, '..', 'data', filename), 'utf8').trim();
  const lines = content.split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = [];
    let cur = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        values.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    values.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => {
      let val = values[i] !== undefined ? values[i] : '';
      val = val.replace(/^"|"$/g, '');
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      obj[h] = val;
    });
    return obj;
  });
}

const employees = parseCsv('employee_table.csv').map(e => ({
  employeeId: e.employee_id,
  name: e.name,
  role: e.role,
  department: e.department,
  location: e.location,
  joiningDate: e.joining_date,
  managerId: e.manager_id,
  buddyId: e.buddy_id,
  email: `${e.name.toLowerCase().replace(/\s+/g, '.')}@demo-company.com`
}));

const contacts = parseCsv('contacts.csv').map(c => ({
  contactId: c.contact_id,
  name: c.name,
  team: c.team,
  role: c.role,
  purpose: c.purpose,
  email: c.email,
  phone: c.phone,
  availability: c.availability,
  escalationTo: c.escalation_to || null
}));

const resources = parseCsv('resources.csv').map(r => ({
  resourceId: r.resource_id,
  resourceName: r.resource_name,
  category: r.category,
  link: r.link,
  accessLevel: r.access_level,
  resourceType: r.resource_type,
  description: r.description
}));

const TASK_DESCRIPTIONS = {
  T001: 'Activate corporate single sign-on credentials and verify user directory profile.',
  T002: 'Configure Microsoft Authenticator and register security passkey.',
  T003: 'Submit emergency contacts, statutory identity docs, and personal bio.',
  T004: 'Review corporate mission, workplace conduct rules, and company values.',
  T005: 'Complete mandatory cyber threat, phishing defense, and data protection module.',
  T006: 'Connect 1-on-1 with your assigned senior buddy for workplace norms and team intro.',
  T007: 'Join welcome orientation session with People Operations and leadership team.',
  T008: 'Configure corporate mailbox, calendar sync, and email signature.',
  T009: 'Learn leave application process, holiday calendars, and working hour policies.',
  T010: 'Explore health insurance, wellness stipends, and retirement benefits.',
  T011: 'Complete workplace ergonomics, fire safety, and emergency protocol module.',
  T012: 'Align on first-week priorities, 30-60-90 day milestones, and expectations.',
  T013: 'Join squad Slack/Teams channels and bookmark team knowledge bases.',
  T014: 'Accept enterprise GitHub organization invitation and link SSH signing keys.',
  T015: 'Install IDE, compilers, container runtime, and run local test suite.',
  T016: 'Read code formatting, linting rules, PR review SLAs, and branch naming conventions.',
  T017: 'Review microservice blueprints, database schemas, and API gateway specs.',
  T018: 'Clone monorepo, configure pre-commit hooks, and verify local build.',
  T019: 'Learn SAST/DAST scanning, secret management, and secure dependency handling.',
  T020: 'Join sprint planning or team standup to introduce yourself to teammates.',
  T021: 'Configure Power BI, Tableau, dbt CLI, and Python analytical libraries.',
  T022: 'Request read permissions for Snowflake/BigQuery staging schemas.',
  T023: 'Understand PII data masking, compliance guidelines, and export policies.',
  T024: 'Study standard corporate metric definitions, KPI models, and dashboard templates.',
  T025: 'Meet data engineers and business intelligence peers to discuss current pipelines.',
  T026: 'Activate Figma enterprise seat, font packages, and asset libraries.',
  T027: 'Request access to Figma workspace, component tokens, and UX research archives.',
  T028: 'Study typography tokens, elevation scales, grid systems, and component states.',
  T029: 'Review brand voice, color harmony, iconography, and illustration guidelines.',
  T030: 'Attend weekly design critique and introduce yourself to product designers.',
  T031: 'Acquire administrative access to HRIS, Workday, and applicant tracker.',
  T032: 'Study grievance procedures, leave policies, compensation bands, and onboarding flows.',
  T033: 'Understand document verification, compliance filing, and digital dossier retention.',
  T034: 'Complete statutory labor law, workplace equality, and POSH training certification.',
  T035: 'Join the People Operations weekly sync and meet recruitment & talent partners.',
  T036: 'Get access to HubSpot, Google Analytics 4, SEMrush, and social management tools.',
  T037: 'Review corporate brand voice, messaging guidelines, and approved media assets.',
  T038: 'Read quarterly GTM roadmap, target persona profiles, and campaign briefs.',
  T039: 'Obtain permissions for campaign dashboards, conversion tracking, and CRM reports.',
  T040: 'Meet content strategists, performance marketers, and growth lead.'
};

const tasks = parseCsv('onboarding_tasks.csv').map(t => ({
  taskId: t.task_id,
  checklistId: t.checklist_id || null,
  taskName: t.task_name,
  applicableRole: t.applicable_role,
  department: t.department,
  day: t.day,
  priority: t.priority,
  assignedBy: t.assigned_by,
  deadline: t.deadline,
  resourceId: t.resource_id,
  isMandatory: t.is_mandatory !== false,
  description: TASK_DESCRIPTIONS[t.task_id] || `${t.task_name} for ${t.department} track.`
}));

const progress = parseCsv('progress.csv').map(p => ({
  progressId: p.progress_id,
  employeeId: p.employee_id,
  taskId: p.task_id,
  status: p.status,
  assignedDate: p.assigned_date,
  dueDate: p.due_date,
  completedDate: p.completed_date || null
}));

const combined = { employees, contacts, resources, tasks, progress };
const datasetsJsonStr = JSON.stringify(combined, null, 2);

fs.writeFileSync(path.join(__dirname, '..', 'data', 'datasets.json'), datasetsJsonStr, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'client', 'public', 'datasets.json'), datasetsJsonStr, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'client', 'datasets.json'), datasetsJsonStr, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'client', 'dist', 'datasets.json'), datasetsJsonStr, 'utf8');

console.log('Saved datasets.json across client and data folders.');
