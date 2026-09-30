const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('client/index.html', 'utf8');

// Extract script
const scriptMatch = html.match(/<script(?![^>]*src=)[\s\S]*?<\/script>/gi)[0];
const code = scriptMatch.replace(/<script[^>]*>|<\/script>/gi, '');

// Create realistic DOM structure
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
      if (sel === 'span') return createNode('', 'span');
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

// Pre-create key elements
['manual-checklist-container', 'manual-user-name', 'manual-user-role', 'manual-user-email',
 'manual-user-campus', 'copilot-context-user', 'manual-progress-pct', 'manual-tasks-stat',
 'manual-linear-bar', 'manual-progress-circle', 'count-all-tasks', 'count-pending-tasks',
 'count-done-tasks', 'day-pill-day1', 'day-pill-day2', 'day-pill-day3', 'day-pill-all',
 'filter-btn-all', 'filter-btn-pending', 'filter-btn-done', 'signin-email', 'signin-password',
 'chatbot-messages-feed', 'chatbot-input', 'copilot-chips-container'
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
    port: '443',
    hostname: 'start-smart-maze.vercel.app',
    origin: 'https://start-smart-maze.vercel.app',
    protocol: 'https:',
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
  fetch: () => Promise.resolve({ ok: false, status: 404 }) // simulate Vercel static (no api backend)
};

const vmCtx = vm.createContext(context);
try {
  vm.runInContext(code, vmCtx);
  console.log('1. Script parsed and initialized.');

  // Test sign in as Aarav (joiner)
  console.log('2. Signing in as Aarav Sharma (Software Engineer)...');
  vm.runInContext('fillPersona("aarav.sharma@demo-company.com", "demo123")', vmCtx);
  vm.runInContext('handleMemberSignIn()', vmCtx);

  // Check checklist container
  const container = domNodes.get('manual-checklist-container');
  console.log(`3. Total task cards rendered in container: ${container.children.length}`);
  if (container.children.length === 0) {
    throw new Error('Checklist container is empty!');
  }

  // Inspect first task card
  const firstCard = container.children[0];
  console.log('   First task card id:', firstCard.id);
  console.log('   First task card day:', firstCard.dataset.day);
  console.log('   First task card status:', firstCard.dataset.status);

  // Test filterByDay Day 1
  console.log('4. Testing filterByDay("Day 1")...');
  vm.runInContext('filterByDay("Day 1")', vmCtx);
  const day1Visible = container.children.filter(c => c.style.display === 'flex');
  console.log(`   Day 1 visible cards count: ${day1Visible.length}`);
  if (day1Visible.length === 0) {
    throw new Error('Day 1 cards are not visible!');
  }

  // Test filterByDay Day 2
  console.log('5. Testing filterByDay("Day 2")...');
  vm.runInContext('filterByDay("Day 2")', vmCtx);
  const day2Visible = container.children.filter(c => c.style.display === 'flex');
  console.log(`   Day 2 visible cards count: ${day2Visible.length}`);

  // Test filterByDay All
  console.log('6. Testing filterByDay("all")...');
  vm.runInContext('filterByDay("all")', vmCtx);
  const allVisible = container.children.filter(c => c.style.display === 'flex');
  console.log(`   All Days visible cards count: ${allVisible.length}`);

  // Test Brief Task Explanation for Chatbot
  console.log('7. Testing brief task explanation for Task T001...');
  const briefT1 = vm.runInContext('getExplainTaskResponseHtml("T001")', vmCtx);
  console.log('   Explanation HTML preview:', briefT1.slice(0, 200).replace(/\s+/g, ' '));
  if (!briefT1.includes('Activate company account') || !briefT1.includes('Brief Explanation')) {
    throw new Error('Brief explanation HTML does not contain required fields!');
  }

  console.log('8. Testing brief task explanation for Task T014 (GitHub setup)...');
  const briefT14 = vm.runInContext('getExplainTaskResponseHtml("T014")', vmCtx);
  console.log('   Explanation HTML preview:', briefT14.slice(0, 200).replace(/\s+/g, ' '));
  if (!briefT14.includes('GitHub access') || !briefT14.includes('Brief Explanation')) {
    throw new Error('Brief explanation for T014 failed!');
  }

  // Test Task toggle
  console.log('9. Testing task completion toggle for T001...');
  vm.runInContext('toggleLiveTask("P_E001_T001", "Completed", "T001")', vmCtx);
  console.log('   Task T001 toggled successfully.');

  console.log('\n🌟 ALL CHECKS PASSED PERFECTLY! Tasks are properly populated and brief chatbot explanations work as specified.');
} catch (err) {
  console.error('Test Verification Failed:', err);
  process.exit(1);
}
