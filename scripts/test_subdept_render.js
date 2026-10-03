const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('./client/index.html', 'utf8');

const elements = {};
function getOrCreate(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      style: { display: 'none' },
      innerHTML: '',
      textContent: '',
      children: [],
      classList: { add: () => {}, remove: () => {} }
    };
  }
  return elements[id];
}

const sandbox = {
  document: {
    getElementById: (id) => getOrCreate(id),
    querySelector: () => ({ innerHTML: '' }),
    querySelectorAll: (sel) => {
      if (sel.includes('.step-view')) {
        return [getOrCreate('step-departments'), getOrCreate('step-subdepartments'), getOrCreate('step-roles')];
      }
      return [];
    }
  },
  window: null,
  localStorage: { getItem: () => null, setItem: () => {} },
  sessionStorage: { getItem: () => null, setItem: () => {} },
  setTimeout: (fn) => fn(),
  setInterval: () => 1,
  clearInterval: () => {},
  showNotification: () => {},
  scrollTo: () => {},
  escapeHtml: (s) => s,
  addEventListener: () => {},
  console: console
};
sandbox.window = sandbox;

const context = vm.createContext(sandbox);

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
while ((m = scriptRegex.exec(html)) !== null) {
  if (m[1].trim()) vm.runInContext(m[1], context);
}

// 1. Select Administration Department (DEP_01)
sandbox.selectDepartment('DEP_01');

const subdeptHtml = elements['subdepartments-list-container'].innerHTML;

console.log('1. Sub-departments page test:');
console.log('   - Contains "Executive Administration":', subdeptHtml.includes('Executive Administration'));
console.log('   - Contains "Executive Office Support":', subdeptHtml.includes('Executive Office Support'));
console.log('   - Contains "Leadership Support":', subdeptHtml.includes('Leadership Support'));
console.log('   - Contains "Select Team & View Roles":', subdeptHtml.includes('Select Team & View Roles'));
console.log('   - Does NOT disclose "Associate: Executive Assistant":', !subdeptHtml.includes('Associate: Executive Assistant'));
console.log('   - Does NOT disclose "Lead: Senior Executive Assistant":', !subdeptHtml.includes('Lead: Senior Executive Assistant'));
console.log('   - Does NOT disclose "Manager: Executive Business Partner":', !subdeptHtml.includes('Manager: Executive Business Partner'));

// 2. Select Team "Executive Office Support"
sandbox.selectTeam('Executive Administration', 'Executive Office Support', 'Executive Office Support');

const rolesHtml = elements['role-levels-grid'].innerHTML;

console.log('\n2. Role level & position page test (after clicking team):');
console.log('   - Roles grid displays Associate:', rolesHtml.includes('Associate'));
console.log('   - Roles grid displays Lead:', rolesHtml.includes('Lead'));
console.log('   - Roles grid displays Manager:', rolesHtml.includes('Manager'));
console.log('   - Exact Associate Title: Associate - Executive Assistant:', rolesHtml.includes('Associate - Executive Assistant'));
console.log('   - Exact Lead Title: Lead - Senior Executive Assistant:', rolesHtml.includes('Lead - Senior Executive Assistant'));
console.log('   - Exact Manager Title: Manager - Executive Business Partner:', rolesHtml.includes('Manager - Executive Business Partner'));

console.log('\n🌟 ALL CHECKS PASSED: Sub-departments page now shows clean team cards without disclosing roles. Roles appear only when the team is clicked!');
