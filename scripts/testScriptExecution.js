const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('client/index.html', 'utf8');

// Extract script
const scriptMatch = html.match(/<script(?![^>]*src=)[\s\S]*?<\/script>/gi)[0];
const code = scriptMatch.replace(/<script[^>]*>|<\/script>/gi, '');

const createElementMock = (tag) => ({
  tagName: tag || 'div',
  style: {},
  classList: {
    add: () => {},
    remove: () => {},
    contains: () => false,
    toggle: () => {}
  },
  appendChild: () => {},
  innerHTML: '',
  textContent: '',
  querySelector: () => createElementMock('span'),
  querySelectorAll: () => [createElementMock('span')],
  dataset: { company: 'microsoft', category: 'tech', day: '1' },
  setAttribute: () => {},
  getAttribute: () => '',
  addEventListener: () => {},
  focus: () => {},
  value: ''
});

const mockDocument = {
  getElementById: (id) => createElementMock('div'),
  querySelectorAll: (sel) => [createElementMock('div'), createElementMock('div')],
  querySelector: (sel) => createElementMock('div'),
  createElement: createElementMock
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
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
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
  fetch: () => Promise.resolve({ json: () => Promise.resolve([]) })
};

// Run in vm
const vmCtx = vm.createContext(context);
try {
  vm.runInContext(code, vmCtx);
  console.log('1. Script executed cleanly in VM context!');
  
  // Test goToStep
  console.log('2. Testing goToStep("step-companies")...');
  vm.runInContext('goToStep("step-companies")', vmCtx);
  
  console.log('3. Testing selectCompany("microsoft")...');
  vm.runInContext('selectCompany("microsoft")', vmCtx);

  console.log('4. Testing goToStep("step-signin")...');
  vm.runInContext('goToStep("step-signin")', vmCtx);
  
  console.log('5. Testing fillPersona("aarav.sharma@demo-company.com")...');
  vm.runInContext('fillPersona("aarav.sharma@demo-company.com", "demo123")', vmCtx);

  console.log('6. Testing handleMemberSignIn()...');
  vm.runInContext('handleMemberSignIn()', vmCtx);
  
  console.log('7. Testing filterByDay("Day 1")...');
  vm.runInContext('filterByDay("Day 1")', vmCtx);

  console.log('8. Testing fillPersona("hr@demo-company.com")...');
  vm.runInContext('fillPersona("hr@demo-company.com", "demo123")', vmCtx);

  console.log('9. Testing handleMemberSignIn() as HR...');
  vm.runInContext('handleMemberSignIn()', vmCtx);
  
  console.log('10. Testing renderLiveHRPortal()...');
  vm.runInContext('renderLiveHRPortal()', vmCtx);
  
  console.log('11. Testing renderHRTaskInventory()...');
  vm.runInContext('renderHRTaskInventory()', vmCtx);

  console.log('12. Testing removeTaskByHR("T001")...');
  vm.runInContext('removeTaskByHR("T001")', vmCtx);

  console.log('\nSUCCESS: ALL END-TO-END FLOW TESTS PASSED WITH ZERO ERRORS!');
} catch (err) {
  console.error('VM Execution Error:', err);
  process.exit(1);
}
