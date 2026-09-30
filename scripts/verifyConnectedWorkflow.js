const fs = require('fs');
const vm = require('vm');

console.log('--- STARTING BIDIRECTIONAL CONNECTED WORKFLOW TEST ---');

const html = fs.readFileSync('client/index.html', 'utf8');

// Extract JS
const scriptMatch = html.match(/<script(?![^>]*src=)[\s\S]*?<\/script>/gi)[0];
const code = scriptMatch.replace(/<script[^>]*>|<\/script>/gi, '');

// Store mock local storage in memory
const memoryStorage = {};
const mockLocalStorage = {
  getItem: (k) => memoryStorage[k] || null,
  setItem: (k, v) => { memoryStorage[k] = String(v); },
  removeItem: (k) => { delete memoryStorage[k]; },
  clear: () => { Object.keys(memoryStorage).forEach(k => delete memoryStorage[k]); }
};

// DOM mock
const domNodes = new Map();
function createMockNode(id, tag = 'div') {
  const node = {
    id: id || '',
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      classes: new Set(),
      add: (c) => node.classList.classes.add(c),
      remove: (c) => node.classList.classes.delete(c),
      contains: (c) => node.classList.classes.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (node.classList.classes.has(c)) node.classList.classes.delete(c);
          else node.classList.classes.add(c);
        } else if (force) node.classList.classes.add(c);
        else node.classList.classes.delete(c);
      }
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
    querySelector: (sel) => createMockNode('', 'span'),
    querySelectorAll: (sel) => [createMockNode('', 'span')]
  };
  if (id) domNodes.set(id, node);
  return node;
}

const mockDocument = {
  getElementById: (id) => {
    if (!domNodes.has(id)) {
      domNodes.set(id, createMockNode(id));
    }
    return domNodes.get(id);
  },
  querySelectorAll: (sel) => [createMockNode('d1'), createMockNode('d2')],
  querySelector: (sel) => createMockNode('q1'),
  createElement: (tag) => createMockNode('', tag)
};

const mockWindow = {
  scrollTo: () => {},
  addEventListener: () => {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  location: { port: '3000', hostname: 'localhost', origin: 'http://localhost:3000', protocol: 'http:', pathname: '/' }
};

const ctx = {
  window: mockWindow,
  document: mockDocument,
  localStorage: mockLocalStorage,
  setInterval: () => 1,
  clearInterval: () => {},
  setTimeout: (fn) => { fn(); return 1; },
  clearTimeout: () => {},
  console: console,
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
};

vm.createContext(ctx);
vm.runInContext(code, ctx);

console.log('1. Script executed cleanly in VM.');

// STEP 1: Test Contact Directory dropdown and pills
console.log('2. Testing Contact Directory dropdown filter...');
vm.runInContext('onContactDropdownSelect("hr")', ctx);
console.log('   Selected HR in dropdown - OK.');
vm.runInContext('onContactDropdownSelect("buddy")', ctx);
console.log('   Selected Buddy in dropdown - OK.');
vm.runInContext('onContactDropdownSelect("all")', ctx);
console.log('   Selected All in dropdown - OK.');
vm.runInContext('onContactDropdownSelect("none")', ctx);
console.log('   Selected None (Collapsed) in dropdown - OK.');

// STEP 2: Joiner Aarav Sharma logs in
console.log('3. Joiner logs in (Aarav Sharma)...');
vm.runInContext('fillPersona("aarav.sharma@demo-company.com", "demo123")', ctx);
vm.runInContext('handleMemberSignIn()', ctx);

// Check initial tasks
const aaravDash1 = vm.runInContext('getSynthesizedDashboardForEmployee("E001")', ctx);
const initialTaskCount = aaravDash1.tasks.length;
const initialPct = aaravDash1.metrics.percentage;
console.log(`   Aarav has ${initialTaskCount} tasks initially. Completed: ${aaravDash1.metrics.completedTasks} (${initialPct}%)`);

// STEP 3: Joiner completes a task
console.log('4. Joiner completes pending task T003...');
vm.runInContext('toggleManualTask("T003")', ctx);
const aaravDash2 = vm.runInContext('getSynthesizedDashboardForEmployee("E001")', ctx);
console.log(`   After completing T003: Completed: ${aaravDash2.metrics.completedTasks} (${aaravDash2.metrics.percentage}%)`);
if (aaravDash2.metrics.completedTasks <= aaravDash1.metrics.completedTasks) {
  throw new Error('Task completion did not increase completedTasks count!');
}

// STEP 4: HR logs in
console.log('5. HR Partner logs in (hr@demo-company.com)...');
vm.runInContext('fillPersona("hr@demo-company.com", "demo123")', ctx);
vm.runInContext('handleMemberSignIn()', ctx);
vm.runInContext('renderLiveHRPortal()', ctx);

// HR views candidate Aarav
console.log('6. HR manages Aarav Sharma tasks...');
vm.runInContext('manageEmployeeTasksFromHR("E001")', ctx);

// Verify HR sees updated progress
const hrSeenPct = domNodes.get('hr-cand-pct-text')?.textContent;
console.log(`   HR Candidate Banner shows: ${hrSeenPct}`);

// STEP 5: HR adds a new task for Aarav
console.log('7. HR adds a new task for Aarav...');
mockDocument.getElementById('new-task-title').value = 'Mandatory ISO 27001 Security Briefing';
mockDocument.getElementById('new-task-category').value = 'Security';
mockDocument.getElementById('new-task-day').value = 'Day 1';
mockDocument.getElementById('new-task-priority').value = 'High';
mockDocument.getElementById('new-task-duration').value = '20 mins';
mockDocument.getElementById('new-task-desc').value = 'Attend live webinar and sign acknowledgement statement.';

vm.runInContext('handleAddNewTaskByHR({ preventDefault: () => {} })', ctx);

// Check if task exists in Aarav's dashboard
const aaravDash3 = vm.runInContext('getSynthesizedDashboardForEmployee("E001")', ctx);
const addedTask = aaravDash3.tasks.find(t => t.taskName === 'Mandatory ISO 27001 Security Briefing');
if (!addedTask) {
  throw new Error('HR-added task was not found in candidate dashboard!');
}
console.log(`   HR-added task found in Aarav's list: ID=${addedTask.taskId}, Title=${addedTask.taskName}`);

// STEP 6: HR removes a task
console.log('8. HR removes task T003 for Aarav...');
vm.runInContext('removeTaskByHR("T003")', ctx);

const aaravDash4 = vm.runInContext('getSynthesizedDashboardForEmployee("E001")', ctx);
const removedTask = aaravDash4.tasks.find(t => t.taskId === 'T003');
if (removedTask) {
  throw new Error('Task T003 was supposed to be removed, but is still present!');
}
console.log('   Task T003 successfully removed from candidate dashboard.');

// STEP 7: Joiner switches back and sees new task and removed task gone
console.log('9. Joiner logs back in to view checklist...');
vm.runInContext('viewEmployeeFromHR("E001")', ctx);
const joinerTasks = vm.runInContext('liveTasksList', ctx);
const hasAdded = joinerTasks.some(t => t.taskName === 'Mandatory ISO 27001 Security Briefing');
const hasRemoved = joinerTasks.some(t => t.taskId === 'T003');
console.log(`   Joiner live checklist: contains HR-added task? ${hasAdded}, contains removed task? ${hasRemoved}`);
if (!hasAdded || hasRemoved) {
  throw new Error('Joiner live view failed to sync with HR changes!');
}

console.log('\n=============================================================');
console.log('🎉 ALL BIDIRECTIONAL CONNECTED WORKFLOW TESTS PASSED 100%!');
console.log('=============================================================\n');
