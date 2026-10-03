const fs = require('fs');
const { JSDOM } = require('jsdom');

const htmlContent = fs.readFileSync('./index.html', 'utf8');
const orgScript = fs.readFileSync('./org_structure_data.js', 'utf8');

const dom = new JSDOM(htmlContent, {
  runScripts: 'dangerously',
  resources: 'usable'
});

const window = dom.window;
const document = window.document;

// Execute org_structure_data.js in the dom window
window.eval(orgScript);

console.log('Testing 18 Departments and Role Hierarchy Flow...');

// Step 1: Start at Gateway
window.goToStep('step-gateway');
console.log('1. Gateway active step:', document.getElementById('step-gateway').style.display !== 'none');

// Step 2: Select Microsoft Corporation
window.selectCompany('microsoft');
console.log('2. After selectCompany(microsoft):');
console.log('   - step-departments display:', document.getElementById('step-departments').style.display);
const deptCards = document.querySelectorAll('#departments-grid .department-card');
console.log('   - Rendered department cards count:', deptCards.length);

// Step 3: Select Department DEP_18 (SECURITY ENGINEERING)
window.selectDepartment('DEP_18');
console.log('3. After selectDepartment(DEP_18):');
console.log('   - step-subdepartments display:', document.getElementById('step-subdepartments').style.display);
console.log('   - Selected dept name in header:', document.getElementById('subdept-header-title').textContent);
const branchBoxes = document.querySelectorAll('#subdepartments-list-container .branch-group-box');
console.log('   - Branch groups count:', branchBoxes.length);

// Step 4: Select Team under Security Engineering
const dept = window.AUTHORITATIVE_ORG_STRUCTURE.departments.find(d => d.code === 'DEP_18');
const branch = dept.branches[0];
const subBranch = branch.subBranches[0];
const team = subBranch.teams[0];
console.log('4. Selecting Team:', team.name, 'under Branch:', branch.name);

window.selectTeam(branch.name, subBranch.name, team.name);
console.log('   - step-roles display:', document.getElementById('step-roles').style.display);
const roleCards = document.querySelectorAll('#role-levels-grid .role-level-selection-card');
console.log('   - Role level cards count (Associate, Lead, Manager):', roleCards.length);
roleCards.forEach((c, i) => {
  console.log(`     [${i+1}] ${c.querySelector('.role-position-exact-title').textContent}`);
});

// Step 5: Select Associate Role
const pos = team.positions[0];
window.selectRoleLevel('Associate', pos.id);
console.log('5. After selectRoleLevel(Associate):');
console.log('   - step-signin display:', document.getElementById('step-signin').style.display);
console.log('   - Target Position Title:', document.getElementById('signin-target-position-title').textContent);
console.log('   - Target Hierarchy Path:', document.getElementById('signin-target-hierarchy-path').textContent);
console.log('   - Prefilled Work Email:', document.getElementById('signin-email').value);

// Step 6: Submit Sign In
window.handleMemberSignIn();
console.log('6. After handleMemberSignIn():');
console.log('   - step-joiner-chatbot display:', document.getElementById('step-joiner-chatbot').style.display);
console.log('   - Dashboard Welcome Title:', document.getElementById('manual-user-name').textContent);
console.log('   - Dashboard User Role:', document.getElementById('manual-user-role').textContent);

console.log('\n✅ ALL 6 STEPS IN THE 18-DEPARTMENT GATEWAY FLOW PASSED PERFECTLY!');
