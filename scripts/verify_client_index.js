const fs = require('fs');
const html = fs.readFileSync('./client/index.html', 'utf8');

console.log('1. Contains org_structure_data.js:', html.includes('org_structure_data.js'));
console.log('2. Contains step-departments:', html.includes('id="step-departments"'));
console.log('3. Contains step-subdepartments:', html.includes('id="step-subdepartments"'));
console.log('4. Contains step-roles:', html.includes('id="step-roles"'));
console.log('5. Contains selectDepartment:', html.includes('function selectDepartment('));
console.log('6. Contains selectTeam:', html.includes('function selectTeam('));
console.log('7. Contains selectRoleLevel:', html.includes('function selectRoleLevel('));
console.log('client/index.html total lines:', html.split('\n').length);
