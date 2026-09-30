const fs = require('fs');
const path = require('path');

function parseCsv(filename) {
  const content = fs.readFileSync(path.join('data', filename), 'utf8').trim();
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
  isMandatory: t.is_mandatory
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
fs.writeFileSync(path.join('data', 'datasets.json'), JSON.stringify(combined, null, 2), 'utf8');
console.log('Successfully written datasets.json with sizes:', {
  employees: employees.length,
  contacts: contacts.length,
  resources: resources.length,
  tasks: tasks.length,
  progress: progress.length
});
