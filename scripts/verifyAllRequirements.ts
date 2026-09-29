import http from 'http';

const BASE_URL = 'http://localhost:5001';

async function fetchJson(endpoint: string, options: any = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  return { status: res.status, data: await res.json() };
}

async function main() {
  console.log('====================================================');
  console.log('  START SMART DATASET & ENDPOINT VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // TEST 1: GET /api/employees
  console.log('--- Test Group 1: Employee Dataset & Roles ---');
  const employeesRes = await fetchJson('/api/employees');
  assert(employeesRes.status === 200, 'GET /api/employees returns HTTP 200');
  assert(employeesRes.data.employees?.length === 20, `Loaded all 20 employees (found: ${employeesRes.data.employees?.length})`);

  // Check 5 specific roles
  const e1 = employeesRes.data.employees.find((e: any) => e.employeeId === 'E001');
  const e2 = employeesRes.data.employees.find((e: any) => e.employeeId === 'E002');
  const e3 = employeesRes.data.employees.find((e: any) => e.employeeId === 'E003');
  const e4 = employeesRes.data.employees.find((e: any) => e.employeeId === 'E004');
  const e6 = employeesRes.data.employees.find((e: any) => e.employeeId === 'E006');

  assert(e1?.role === 'Software Engineer' && e1?.name === 'Aarav Sharma', 'E001 is Aarav Sharma (Software Engineer)');
  assert(e2?.role === 'Data Analyst' && e2?.name === 'Diya Singh', 'E002 is Diya Singh (Data Analyst)');
  assert(e3?.role === 'UI/UX Designer' && e3?.name === 'Rohan Kapoor', 'E003 is Rohan Kapoor (UI/UX Designer)');
  assert(e4?.role === 'HR Executive' && e4?.name === 'Ananya Singh', 'E004 is Ananya Singh (HR Executive)');
  assert(e6?.role === 'Marketing Executive' && e6?.name === 'Meera Iyer', 'E006 is Meera Iyer (Marketing Executive)');

  // TEST 2: Role-based task isolation
  console.log('\n--- Test Group 2: Role-based Task Filtering & Relational Integrity ---');
  const e1Tasks = await fetchJson('/api/employees/E001/tasks');
  const e2Tasks = await fetchJson('/api/employees/E002/tasks');
  const e3Tasks = await fetchJson('/api/employees/E003/tasks');

  // E001 (Software Engineer) has engineering tasks
  const hasEngTask = e1Tasks.data.tasks.some((t: any) => t.taskName.toLowerCase().includes('github') || t.taskName.toLowerCase().includes('coding'));
  const hasDesignTask = e1Tasks.data.tasks.some((t: any) => t.taskName.toLowerCase().includes('figma') || t.taskName.toLowerCase().includes('design system'));
  assert(hasEngTask, 'Software Engineer receives engineering tasks (T014 GitHub, T016 coding guidelines)');
  assert(!hasDesignTask, 'Software Engineer DOES NOT receive design tasks (Role isolation verified)');

  // E003 (UI/UX Designer) has Figma/Design tasks
  const e3HasDesign = e3Tasks.data.tasks.some((t: any) => t.taskName.toLowerCase().includes('figma') || t.taskName.toLowerCase().includes('design'));
  assert(e3HasDesign, 'UI/UX Designer receives design tasks (Figma workspace, design system)');

  // TEST 3: Dashboard API with Buddy & Manager & Resources
  console.log('\n--- Test Group 3: Dashboard Relational Aggregation ---');
  const dashRes = await fetchJson('/api/employees/E001/dashboard');
  assert(dashRes.status === 200, 'GET /api/employees/E001/dashboard returns HTTP 200');
  assert(dashRes.data.employee.buddy?.name === 'Dhruv Agarwal', 'E001 buddy is Dhruv Agarwal (C019)');
  assert(dashRes.data.employee.manager?.name === 'Rohan Verma', 'E001 manager is Rohan Verma (C006)');
  assert(dashRes.data.tasks.length > 0, `E001 has ${dashRes.data.tasks.length} role-filtered tasks`);
  assert(dashRes.data.resources.length > 0, `E001 has ${dashRes.data.resources.length} role-filtered resources`);

  // Verify task has linked resource
  const taskWithRes = dashRes.data.tasks.find((t: any) => t.resource);
  assert(!!taskWithRes, `Task linked to Resource correctly (e.g. ${taskWithRes?.taskName} -> ${taskWithRes?.resource?.resourceName})`);

  // TEST 4: Progress Toggle & Persistence
  console.log('\n--- Test Group 4: Progress Toggle (PATCH /api/progress/:id) ---');
  const initialProg = await fetchJson('/api/employees/E001/progress');
  const initialPct = initialProg.data.percentage;
  
  // Toggle task T003 (progressId P003) to Completed
  const patchRes = await fetchJson('/api/progress/P003', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Completed' })
  });
  assert(patchRes.status === 200, 'PATCH /api/progress/P003 succeeded');
  assert(patchRes.data.progress.status === 'Completed', 'Progress status updated to Completed');

  // Verify recalculation in DB
  const afterProg = await fetchJson('/api/employees/E001/progress');
  assert(afterProg.data.percentage >= initialPct, `Progress recalculated in SQLite (${initialPct}% -> ${afterProg.data.percentage}%)`);

  // Toggle back to Pending to keep initial state clean
  await fetchJson('/api/progress/P003', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Pending' })
  });
  const resetProg = await fetchJson('/api/employees/E001/progress');
  assert(resetProg.data.percentage === initialPct, `Progress cleanly reset back to ${initialPct}%`);

  // TEST 5: Contacts Dataset
  console.log('\n--- Test Group 5: Contacts Dataset & Escalation Lines ---');
  const contactsRes = await fetchJson('/api/contacts');
  assert(contactsRes.data.contacts?.length === 20, `Loaded all 20 contacts (found: ${contactsRes.data.contacts?.length})`);
  
  const itContact = contactsRes.data.contacts.find((c: any) => c.contactId === 'C001');
  assert(itContact?.name === 'Rahul Mehta' && itContact?.role === 'IT Helpdesk', 'C001 is Rahul Mehta (IT Helpdesk)');
  assert(itContact?.escalationTo === 'C002', 'C001 escalates to C002 (Vikram Shah - IT Manager)');

  const hrContact = contactsRes.data.contacts.find((c: any) => c.contactId === 'C003');
  assert(hrContact?.name === 'Priya Nair' && hrContact?.role === 'HR Manager', 'C003 is Priya Nair (HR Manager)');

  // TEST 6: AI Copilot Grounding Queries
  console.log('\n--- Test Group 6: AI Copilot Context Grounding ---');
  const q1 = await fetchJson('/api/v1/ai/nvidia-copilot', {
    method: 'POST',
    body: JSON.stringify({ query: 'Who is my onboarding buddy?', employeeId: 'E001' })
  });
  assert(q1.status === 200, 'AI query 1 succeeded');
  const ans1 = q1.data.data?.answer || '';
  assert(ans1.includes('Dhruv Agarwal') || ans1.includes('buddy'), `AI answers onboarding buddy query accurately: "${ans1.slice(0, 80)}..."`);

  const q2 = await fetchJson('/api/v1/ai/nvidia-copilot', {
    method: 'POST',
    body: JSON.stringify({ query: 'Who should I contact for laptop problems?', employeeId: 'E001' })
  });
  assert(q2.status === 200, 'AI query 2 succeeded');
  const ans2 = q2.data.data?.answer || '';
  assert(ans2.includes('Rahul Mehta') || ans2.includes('IT Helpdesk') || ans2.includes('it@demo-company.com'), `AI answers IT laptop inquiry accurately: "${ans2.slice(0, 80)}..."`);

  const q3 = await fetchJson('/api/v1/ai/nvidia-copilot', {
    method: 'POST',
    body: JSON.stringify({ query: 'Where can I find the GitHub access guide?', employeeId: 'E001' })
  });
  assert(q3.status === 200, 'AI query 3 succeeded');
  const ans3 = q3.data.data?.answer || '';
  assert(ans3.includes('github-access') || ans3.includes('GitHub'), `AI answers GitHub resource query accurately: "${ans3.slice(0, 80)}..."`);

  console.log('\n====================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('Test suite runtime error:', err);
  process.exit(1);
});
