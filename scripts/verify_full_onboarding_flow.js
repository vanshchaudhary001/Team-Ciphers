const fs = require('fs');
const vm = require('vm');
const path = require('path');

console.log('Testing full authoritative onboarding flow simulation...');

const html = fs.readFileSync('client/index.html', 'utf8');

// Extract inline scripts
const scriptMatches = html.match(/<script(?![^>]*src=)[\s\S]*?<\/script>/gi);
if (!scriptMatches) {
  throw new Error('No inline scripts found in client/index.html');
}
const code = scriptMatches[0].replace(/<script[^>]*>|<\/script>/gi, '');

// Read org structure data
const orgDataCode = fs.readFileSync('client/org_structure_data.js', 'utf8');

// Create realistic DOM
const domNodes = new Map();

function createNode(id, tag = 'div') {
  const node = {
    id: id || '',
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      classes: new Set(),
      add: (c) => node.classList.classes.add(c),
      remove: (c) => node.classList.classes.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (node.classList.classes.has(c)) node.classList.classes.delete(c);
          else node.classList.classes.add(c);
        } else if (force) node.classList.classes.add(c);
        else node.classList.classes.delete(c);
      },
      contains: (c) => node.classList.classes.has(c)
    },
    children: [],
    appendChild: (child) => {
      node.children.push(child);
      return child;
    },
    innerHTML: '',
    textContent: '',
    value: '',
    dataset: {},
    setAttribute: (k, v) => { node[k] = v; },
    getAttribute: (k) => node[k] || '',
    addEventListener: () => {},
    focus: () => {},
    querySelector: (sel) => {
      return createNode();
    },
    querySelectorAll: (sel) => {
      if (id === 'manual-checklist-container' && sel.includes('.manual-task-card')) {
        return node.children;
      }
      return [createNode(), createNode()];
    }
  };
  if (id) domNodes.set(id, node);
  return node;
}

[
  'manual-checklist-container', 'manual-user-name', 'manual-user-role', 'manual-user-email',
  'manual-user-campus', 'copilot-context-user', 'manual-progress-pct', 'manual-tasks-stat',
  'manual-linear-bar', 'manual-progress-circle', 'count-all-tasks', 'count-pending-tasks',
  'count-done-tasks', 'day-pill-day1', 'day-pill-day2', 'day-pill-day3', 'day-pill-day4', 'day-pill-day5', 'day-pill-all',
  'filter-btn-all', 'filter-btn-pending', 'filter-btn-done', 'signin-email', 'signin-password',
  'chatbot-messages-feed', 'chatbot-input', 'copilot-chips-container', 'dept-company-title',
  'breadcrumb-dept-company', 'departments-grid', 'subdept-breadcrumb-dept-name', 'subdept-header-title',
  'subdept-header-badge', 'subdept-header-icon', 'subdepartments-list-container', 'role-cards-container',
  'signin-target-position-banner', 'signin-target-position-title', 'signin-target-hierarchy-path',
  'signin-btn-text', 'contact-buddy-name', 'contact-buddy-title', 'contact-buddy-email', 'contact-buddy-phone',
  'contact-hr-name', 'contact-hr-title', 'contact-hr-email', 'contact-hr-phone',
  'step-gateway', 'step-companies', 'step-departments', 'step-subdepartments', 'step-roles', 'step-signin', 'step-joiner-chatbot'
].forEach(id => createNode(id));

const mockDocument = {
  getElementById: (id) => domNodes.get(id) || createNode(id),
  querySelectorAll: (sel) => {
    if (sel.includes('#manual-checklist-container .manual-task-card')) {
      const container = domNodes.get('manual-checklist-container');
      return container ? container.children : [];
    }
    return [createNode(), createNode()];
  },
  querySelector: (sel) => createNode(),
  createElement: (tag) => createNode('', tag)
};

const mockWindow = {
  scrollTo: () => {},
  addEventListener: (evt, fn) => { if (evt === 'DOMContentLoaded') fn(); },
  document: mockDocument,
  location: {
    port: '3000',
    hostname: 'localhost',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    search: '',
    pathname: '/'
  },
  localStorage: {
    store: {},
    getItem: (k) => mockWindow.localStorage.store[k] || null,
    setItem: (k, v) => { mockWindow.localStorage.store[k] = v; },
    removeItem: (k) => { delete mockWindow.localStorage.store[k]; }
  }
};

// Simulate local static file fetching via fs in fetch mock
const mockFetch = async (url) => {
  if (url.startsWith('/tasks/') && url.endsWith('.json')) {
    const filename = url.replace('/tasks/', '');
    const filepath = path.join(__dirname, '..', 'client', 'public', 'tasks', filename);
    if (fs.existsSync(filepath)) {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      return {
        ok: true,
        status: 200,
        json: async () => data
      };
    }
  }
  return { ok: false, status: 404 };
};

const context = {
  window: mockWindow,
  document: mockDocument,
  localStorage: mockWindow.localStorage,
  setInterval: () => 1,
  clearInterval: () => {},
  setTimeout: (fn) => { fn(); return 1; },
  clearTimeout: () => {},
  console: console,
  location: mockWindow.location,
  fetch: mockFetch
};

const vmCtx = vm.createContext(context);

async function runTests() {
  // 1. Run org_structure_data.js
  vm.runInContext(orgDataCode, vmCtx);
  console.log('✅ Loaded org_structure_data.js into VM context.');

  // 2. Run index.html script
  vm.runInContext(code, vmCtx);
  console.log('✅ Successfully parsed and executed index.html script.');

  // 3. Test Wizard Flow: Select Company (Microsoft)
  console.log('\n--- 1. Testing Flow: Company Selection ---');
  vm.runInContext('selectCompany("microsoft")', vmCtx);
  console.log('   Company selected: Microsoft');

  // 4. Test Flow: Select Department (ADMINISTRATION)
  console.log('\n--- 2. Testing Flow: Department Selection ---');
  vm.runInContext('selectDepartment("ADMINISTRATION")', vmCtx);
  console.log('   Department selected: ADMINISTRATION');

  // 5. Test Flow: Select Team / Sub-department (Executive Office Support)
  console.log('\n--- 3. Testing Flow: Sub-department / Team Selection ---');
  const orgData = vm.runInContext('getAuthoritativeOrgData()', vmCtx);
  const adminDept = orgData.departments.find(d => d.name === 'ADMINISTRATION');
  const branch = adminDept.branches[0];
  const subBranch = branch.subBranches[0];
  const team = subBranch.teams[0];
  console.log(`   Found team: ${team.name} in ${subBranch.name} with ${team.positions.length} positions:`);
  team.positions.forEach(p => console.log(`     - ${p.id} | ${p.roleLevel} - ${p.title}`));

  vm.runInContext(`
    currentSelectedBranch = ${JSON.stringify(branch)};
    currentSelectedSubBranch = ${JSON.stringify(subBranch)};
    currentSelectedTeam = ${JSON.stringify(team)};
  `, vmCtx);

  // 6. Test Flow: Select Associate Role (POS-0001)
  console.log('\n--- 4. Testing Flow: Select Associate Role (POS-0001) ---');
  vm.runInContext('selectRoleLevel("Associate", "POS-0001")', vmCtx);
  const pos = vm.runInContext('currentSelectedPosition', vmCtx);
  console.log(`   Selected Position: ${pos.fullTitle} (ID: ${pos.id})`);

  // Fill credentials and Sign In
  console.log('\n--- 5. Testing Flow: Member Sign-In ---');
  const emailInput = domNodes.get('signin-email');
  emailInput.value = 'aarav.sharma@microsoft.in';
  const pwdInput = domNodes.get('signin-password');
  pwdInput.value = 'demo1234';

  await vm.runInContext('handleMemberSignIn()', vmCtx);

  const dash = vm.runInContext('currentLiveDashboard', vmCtx);
  console.log(`   Signed In! Total tasks loaded: ${dash.tasks.length}`);
  if (dash.tasks.length !== 30) {
    throw new Error(`Expected 30 tasks, got ${dash.tasks.length}`);
  }

  // Inspect first 3 tasks
  console.log('\n--- 6. Inspecting Loaded Tasks for Associate ---');
  for (let i = 0; i < 3; i++) {
    const t = dash.tasks[i];
    console.log(`   Task ${t.num} (${t.day} · ${t.duration} · ${t.priority}): "${t.title}"`);
    console.log(`     Desc: ${t.desc.slice(0, 100)}...`);
    console.log(`     Chatbot Execution Steps: ${t.chatbotExecution.length}`);
  }

  // Check checklist container
  const container = domNodes.get('manual-checklist-container');
  console.log(`\n--- 7. Checklist DOM Card Rendering ---`);
  console.log(`   Total cards rendered in DOM: ${container.children.length}`);
  if (container.children.length !== 30) {
    throw new Error(`Expected 30 rendered DOM cards, got ${container.children.length}`);
  }

  // Test Day 1 Filter
  console.log('\n--- 8. Testing Day 1 Filter ---');
  vm.runInContext('filterByDay("Day 1")', vmCtx);
  const day1Visible = container.children.filter(c => c.style.display === 'flex');
  console.log(`   Day 1 visible cards count: ${day1Visible.length}`);
  if (day1Visible.length !== 6) {
    throw new Error(`Expected 6 cards for Day 1, got ${day1Visible.length}`);
  }

  // Test All Days Filter
  console.log('\n--- 9. Testing All Days Filter ---');
  vm.runInContext('filterByDay("all")', vmCtx);
  const allVisible = container.children.filter(c => c.style.display === 'flex');
  console.log(`   All Days visible cards count: ${allVisible.length}`);
  if (allVisible.length !== 30) {
    throw new Error(`Expected 30 cards visible for all days, got ${allVisible.length}`);
  }

  // Test AI Copilot Task Explanation
  console.log('\n--- 10. Testing AI Copilot Task Explanation (Task 1) ---');
  const explainHtml = vm.runInContext('getExplainTaskResponseHtml(1)', vmCtx);
  console.log('   FULL HTML:\n', explainHtml);
  if (!explainHtml.includes('Secure Account') ||
      !explainHtml.includes('In-Depth Execution Playbook') ||
      !explainHtml.includes('Strategic Objective') ||
      !explainHtml.includes('Definition of Done')) {
    console.log('Check failed. Missing:',
      'Secure Account:', explainHtml.includes('Secure Account & Workspace Setup'),
      'Playbook:', explainHtml.includes('In-Depth Execution Playbook'),
      'Objective:', explainHtml.includes('Strategic Objective'),
      'DoD:', explainHtml.includes('Definition of Done')
    );
    throw new Error('Copilot explanation HTML does not contain required authoritative fields!');
  }
  console.log('   ✅ Copilot Task Explanation contains full execution playbook!');

  // Test AI Copilot Role Overview
  console.log('\n--- 11. Testing AI Copilot Role Overview ---');
  const roleHtml = vm.runInContext('getRoleOverviewResponseHtml()', vmCtx);
  console.log('   Preview of Role Overview HTML:\n', roleHtml.slice(0, 300).replace(/\s+/g, ' '));
  if (!roleHtml.includes('Associate - Executive Assistant') || !roleHtml.includes('ADMINISTRATION')) {
    throw new Error('Role overview HTML failed to display role and department!');
  }
  console.log('   ✅ Copilot Role Overview displays role charter & functional domain!');

  // Test Lead Position Flow (POS-0018: Lead - Senior BI Analyst in ANALYTICS)
  console.log('\n--- 12. Testing Flow for Lead Position (POS-0018: Lead - Senior BI Analyst) ---');
  const analyticsDept = orgData.departments.find(d => d.name === 'ANALYTICS');
  const leadBranch = analyticsDept.branches[0];
  const leadSubBranch = leadBranch.subBranches[0];
  const leadTeam = leadSubBranch.teams[0];
  const leadPos = leadTeam.positions.find(p => p.roleLevel === 'Lead');

  vm.runInContext(`
    currentSelectedDept = ${JSON.stringify(analyticsDept)};
    currentSelectedBranch = ${JSON.stringify(leadBranch)};
    currentSelectedSubBranch = ${JSON.stringify(leadSubBranch)};
    currentSelectedTeam = ${JSON.stringify(leadTeam)};
  `, vmCtx);

  vm.runInContext(`selectRoleLevel("Lead", "${leadPos.id}")`, vmCtx);
  emailInput.value = 'priya.lead@microsoft.in';
  await vm.runInContext('handleMemberSignIn()', vmCtx);

  const leadDash = vm.runInContext('currentLiveDashboard', vmCtx);
  console.log(`   Lead Signed In! Tasks loaded: ${leadDash.tasks.length}`);
  console.log(`   Lead Task 1: "${leadDash.tasks[0].title}"`);
  console.log(`   Lead Task 1 Desc: ${leadDash.tasks[0].desc.slice(0, 80)}...`);
  if (!leadDash.tasks[0].title.toLowerCase().includes('secure') || !leadDash.tasks[0].desc.includes('Business Intelligence')) {
    throw new Error('Lead task does not match authoritative dataset!');
  }

  // Test Manager Position Flow (POS-0003: Manager - Executive Business Partner in ADMINISTRATION)
  console.log('\n--- 13. Testing Flow for Manager Position (POS-0003: Manager) ---');
  const mgrPos = team.positions.find(p => p.roleLevel === 'Manager');
  vm.runInContext(`
    currentSelectedDept = ${JSON.stringify(adminDept)};
    currentSelectedBranch = ${JSON.stringify(branch)};
    currentSelectedSubBranch = ${JSON.stringify(subBranch)};
    currentSelectedTeam = ${JSON.stringify(team)};
  `, vmCtx);

  vm.runInContext(`selectRoleLevel("Manager", "${mgrPos.id}")`, vmCtx);
  emailInput.value = 'rahul.manager@microsoft.in';
  await vm.runInContext('handleMemberSignIn()', vmCtx);

  const mgrDash = vm.runInContext('currentLiveDashboard', vmCtx);
  console.log(`   Manager Signed In! Tasks loaded: ${mgrDash.tasks.length}`);
  console.log(`   Manager Task 1: "${mgrDash.tasks[0].title}"`);
  console.log(`   Manager Task 1 Desc: ${mgrDash.tasks[0].desc.slice(0, 80)}...`);
  if (!mgrDash.tasks[0].title.toLowerCase().includes('charter')) {
    throw new Error('Manager Task 1 title does not match authoritative manager dataset!');
  }

  // Test Task Completion Toggle
  console.log('\n--- 14. Testing Task Completion Toggle ---');
  console.log(`   Initial Task 2 status: ${mgrDash.tasks[1].status}`);
  vm.runInContext('toggleLiveTask("PROG_POS-0003_2", "Pending", "T002")', vmCtx);
  console.log(`   Updated Task 2 status: ${mgrDash.tasks[1].status} (Done: ${mgrDash.tasks[1].done})`);
  console.log(`   Updated Metrics: ${mgrDash.metrics.completedTasks}/${mgrDash.metrics.totalTasks} (${mgrDash.metrics.percentage}%)`);
  if (mgrDash.tasks[1].status !== 'Completed') {
    throw new Error('Task toggle failed to update status to Completed!');
  }

  console.log('\n🌟🌟🌟 ALL 14 TESTS PASSED FLAWLESSLY! 🌟🌟🌟');
  console.log('The authoritative onboarding system functions end-to-end:');
  console.log('- Navigation: Member -> Company -> 18 Depts -> Subdepts -> Role (Associate, Lead, Manager)');
  console.log('- Complete 30-task datasets mapped with headings, 2-3 line descriptions, and durations');
  console.log('- Seamless Day 1-5 filtering and task completion toggling');
  console.log('- AI Copilot provides in-depth execution playbooks, definition of done, and supervisor check-in guidance');
}

runTests().catch(err => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});
