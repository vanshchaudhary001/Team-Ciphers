const fs = require('fs');
const html = fs.readFileSync('./index.html', 'utf8');

console.log('1. Contains org_structure_data.js:', html.includes('org_structure_data.js'));
console.log('2. Contains step-departments:', html.includes('id="step-departments"'));
console.log('3. Contains step-subdepartments:', html.includes('id="step-subdepartments"'));
console.log('4. Contains step-roles:', html.includes('id="step-roles"'));
console.log('5. Contains selectCompany:', html.includes('function selectCompany(companyKey)'));
console.log('6. Contains selectDepartment:', html.includes('function selectDepartment(deptCode)'));
console.log('7. Contains selectTeam:', html.includes('function selectTeam('));
console.log('8. Contains selectRoleLevel:', html.includes('function selectRoleLevel('));

// Test org_structure_data.js execution
const vm = require('vm');
const orgScript = fs.readFileSync('./org_structure_data.js', 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(orgScript, context);
console.log('9. AUTHORITATIVE_ORG_STRUCTURE departments count:', context.window.AUTHORITATIVE_ORG_STRUCTURE.departments.length);
