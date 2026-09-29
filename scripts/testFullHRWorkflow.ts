/**
 * Automated Verification Script for Complete HR Partner Workflow:
 * HR Login
 * → HR Workspace
 * → Create Checklist
 * → Add Tasks
 * → Save Draft
 * → Publish
 * → New Joiner matching role/department/location
 * → Checklist automatically becomes available
 * → Employee sees tasks
 * → Employee completes task
 * → Progress updates
 * → HR sees updated progress
 */

const BASE_URL = 'http://localhost:5001';

async function fetchJson(endpoint: string, options: any = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log('================================================================');
  console.log('  START SMART: END-TO-END HR PARTNER WORKFLOW VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // STEP 1: HR Login / Identity
  console.log('--- Step 1: HR Authentication & Identity Resolution ---');
  const hrContactsRes = await fetchJson('/api/contacts');
  assert(hrContactsRes.status === 200, 'GET /api/contacts returned 200');
  const hrPartner = hrContactsRes.data.contacts.find((c: any) => c.role.includes('HR') || c.name.includes('Priya'));
  assert(!!hrPartner, `HR Partner identified: ${hrPartner?.name} (${hrPartner?.role})`);

  // STEP 2: HR Workspace Metrics & Checklists
  console.log('\n--- Step 2: HR Workspace 5 KPI Telemetry & Checklist Roster ---');
  const initialMetricsRes = await fetchJson('/api/checklists/metrics');
  assert(initialMetricsRes.status === 200, 'GET /api/checklists/metrics returned 200');
  const m = initialMetricsRes.data.metrics;
  assert(m.totalNewJoiners === 20, `Metric: Total New Joiners = ${m.totalNewJoiners}`);
  assert(m.activeOnboarding >= 0, `Metric: Active Onboarding = ${m.activeOnboarding}`);
  assert(m.completedOnboarding >= 0, `Metric: Completed Onboarding = ${m.completedOnboarding}`);
  assert(m.pendingOnboarding >= 0, `Metric: Pending Onboarding = ${m.pendingOnboarding}`);
  assert(m.overdueTasks >= 0, `Metric: Overdue Tasks = ${m.overdueTasks}`);

  const initialChecklists = await fetchJson('/api/checklists');
  assert(initialChecklists.status === 200, 'GET /api/checklists returned 200');
  const list = initialChecklists.data.checklists || initialChecklists.data.templates || [];
  console.log(`Found ${list.length} existing checklist templates.`);

  // STEP 3: Create Checklist (Save Draft)
  console.log('\n--- Step 3: Create Checklist & Save Draft ---');
  const testChecklistName = `Test Cloud DevOps Track - ${Date.now()}`;
  const createDraftRes = await fetchJson('/api/checklists', {
    method: 'POST',
    body: JSON.stringify({
      checklistName: testChecklistName,
      applicableRole: 'Software Engineer',
      department: 'Engineering',
      location: 'Bengaluru',
      durationDays: 14,
      createdBy: 'Priya Nair (Lead HR)',
      status: 'Draft',
      tasks: [
        {
          taskName: 'Setup Kubernetes & Docker Container Sandbox',
          day: 'Day 2',
          priority: 'High',
          assignedBy: 'Engineering Lead',
          resourceId: 'R010',
          isMandatory: true,
          orderIndex: 1
        }
      ]
    })
  });

  assert(createDraftRes.status === 201, 'POST /api/checklists created new checklist draft (201)');
  const createdChecklist = createDraftRes.data.checklist;
  assert(createdChecklist.status === 'Draft', `Checklist status is 'Draft' (${createdChecklist.checklistId})`);
  assert(createdChecklist.applicableRole === 'Software Engineer', 'Applicable role is Software Engineer');
  assert(createdChecklist.department === 'Engineering', 'Department is Engineering');
  assert(createdChecklist.location === 'Bengaluru', 'Location is Bengaluru');

  // Verify that as a DRAFT, it has NOT assigned tasks to employees yet
  const e1TasksBeforePublish = await fetchJson('/api/employees/E001/tasks');
  const hasDraftTask = e1TasksBeforePublish.data.tasks.some((t: any) => t.checklistId === createdChecklist.checklistId);
  assert(!hasDraftTask, 'Draft checklist tasks are NOT yet assigned to joiners before publishing');

  // STEP 4: Add Another Task to the Checklist
  console.log('\n--- Step 4: Add / Update Tasks in Checklist ---');
  const addTaskRes = await fetchJson(`/api/checklists/${createdChecklist.checklistId}/tasks`, {
    method: 'POST',
    body: JSON.stringify({
      taskName: 'Configure Microservices CI/CD Pipeline Tokens',
      day: 'Day 3',
      priority: 'High',
      assignedBy: 'IT Team',
      resourceId: 'R009',
      isMandatory: true,
      orderIndex: 2
    })
  });
  assert(addTaskRes.status === 201, 'POST /api/checklists/:id/tasks added 2nd task to template');
  const addedTask = addTaskRes.data.task;

  // STEP 5: Publish Checklist
  console.log('\n--- Step 5: Publish Checklist & Trigger Automatic Matching ---');
  const publishRes = await fetchJson(`/api/checklists/${createdChecklist.checklistId}/publish`, {
    method: 'POST',
    body: JSON.stringify({ status: 'Published' })
  });
  assert(publishRes.status === 200, 'POST /api/checklists/:id/publish succeeded');
  assert(publishRes.data.checklist.status === 'Published', 'Checklist status updated to Published');
  assert(publishRes.data.assignedJoinersCount > 0, `Auto-matched and assigned to ${publishRes.data.assignedJoinersCount} joiners`);

  // STEP 6: Verify Matching Joiner Automatically Receives Tasks
  console.log('\n--- Step 6: Verify Matching Joiner (E001: Software Engineer, Engineering, Bengaluru) ---');
  const e1TasksAfterPublish = await fetchJson('/api/employees/E001/tasks');
  const e1NewTasks = e1TasksAfterPublish.data.tasks.filter((t: any) => t.checklistId === createdChecklist.checklistId);
  assert(e1NewTasks.length === 2, `E001 automatically sees both newly published checklist tasks (Found: ${e1NewTasks.length})`);
  assert(e1NewTasks.some((t: any) => t.taskName.includes('Kubernetes')), 'Task 1 (Kubernetes Sandbox) present');
  assert(e1NewTasks.some((t: any) => t.taskName.includes('CI/CD Pipeline')), 'Task 2 (CI/CD Pipeline) present');

  // STEP 7: Verify Non-Matching Employee Is ISOLATED
  console.log('\n--- Step 7: Verify Non-Matching Isolation (E002: Data Analyst, Data, Delhi) ---');
  const e2Tasks = await fetchJson('/api/employees/E002/tasks');
  const e2HasChecklist = e2Tasks.data.tasks.some((t: any) => t.checklistId === createdChecklist.checklistId);
  assert(!e2HasChecklist, 'E002 (Data Analyst in Delhi) did NOT receive the Bengaluru Software Engineer checklist');

  // STEP 8: Employee Completes Task & Progress Updates
  console.log('\n--- Step 8: Employee Completes Task & Progress Updates ---');
  const targetTask = e1NewTasks[0];
  const targetProgressId = targetTask.progressId;
  assert(!!targetProgressId, `Found progress record: ${targetProgressId} (status: ${targetTask.status})`);

  const initialE1Progress = await fetchJson('/api/employees/E001/progress');
  const initialE1Pct = initialE1Progress.data.percentage;

  const patchProgressRes = await fetchJson(`/api/progress/${targetProgressId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Completed' })
  });
  assert(patchProgressRes.status === 200, `PATCH /api/progress/${targetProgressId} set to 'Completed'`);

  const updatedE1Progress = await fetchJson('/api/employees/E001/progress');
  assert(updatedE1Progress.data.percentage >= initialE1Pct, `E001 progress % updated in database: ${initialE1Pct}% -> ${updatedE1Progress.data.percentage}%`);

  // STEP 9: HR Sees Updated Progress Live
  console.log('\n--- Step 9: HR Views Updated Progress in Real-Time ---');
  const assignedEmployeesRes = await fetchJson(`/api/checklists/${createdChecklist.checklistId}/employees`);
  assert(assignedEmployeesRes.status === 200, 'GET /api/checklists/:id/employees returned 200');
  const matchedEmp = assignedEmployeesRes.data.employees.find((e: any) => e.employeeId === 'E001');
  assert(!!matchedEmp, `E001 listed in checklist's assigned employees`);
  assert(matchedEmp.completedTasks > 0, `HR sees E001 has ${matchedEmp.completedTasks}/${matchedEmp.totalTasks} tasks completed (${matchedEmp.percentage}%)`);

  // STEP 10: Clean up test checklist (Archive)
  console.log('\n--- Step 10: Archive / Clean up Test Checklist ---');
  const archiveRes = await fetchJson(`/api/checklists/${createdChecklist.checklistId}`, {
    method: 'DELETE'
  });
  assert(archiveRes.status === 200, 'DELETE /api/checklists/:id successfully archived the test checklist');

  console.log('\n================================================================');
  console.log(`  VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
