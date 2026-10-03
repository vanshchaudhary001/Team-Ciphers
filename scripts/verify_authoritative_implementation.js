const fs = require('fs');
const http = require('http');

console.log('========================================================');
console.log('AUTHORITATIVE DATASET & COPILOT VERIFICATION SUITE');
console.log('========================================================');

async function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function runVerification() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Verify Static JSON Files for Associate, Lead, and Manager
  console.log('\n--- 1. Testing Position Task Bundles (Port 3000) ---');
  
  // Associate: POS-0001 (Associate - Executive Assistant in Administration)
  const assocRes = await httpGet('http://localhost:3000/tasks/POS-0001.json');
  assert(assocRes.status === 200, 'Associate POS-0001.json returns 200 OK');
  assert(assocRes.body.roleLevel === 'Associate', 'POS-0001 roleLevel is Associate');
  assert(assocRes.body.tasks && assocRes.body.tasks.length === 30, 'POS-0001 has exactly 30 tasks');
  assert(assocRes.body.tasks[0].title.length > 0, `Task 1 Heading: "${assocRes.body.tasks[0].title}"`);
  assert(assocRes.body.tasks[0].desc.length > 30, `Task 1 Description (2-3 lines): "${assocRes.body.tasks[0].desc.slice(0, 90)}..."`);
  assert(assocRes.body.tasks[0].chatbotExecution.length >= 6, `Task 1 has ${assocRes.body.tasks[0].chatbotExecution.length} chatbot execution steps`);
  assert(assocRes.body.tasks[0].definitionOfDone.length > 10, 'Task 1 has Definition of Done');

  // Lead: POS-0018 (Lead - Senior BI Analyst in Analytics)
  const leadRes = await httpGet('http://localhost:3000/tasks/POS-0018.json');
  assert(leadRes.status === 200, 'Lead POS-0018.json returns 200 OK');
  assert(leadRes.body.roleLevel === 'Lead', 'POS-0018 roleLevel is Lead');
  assert(leadRes.body.tasks && leadRes.body.tasks.length === 30, 'POS-0018 has exactly 30 tasks');
  assert(leadRes.body.tasks[0].title.length > 0, `Task 1 Heading: "${leadRes.body.tasks[0].title}"`);
  assert(leadRes.body.tasks[0].chatbotExecution.length >= 6, `Task 1 has ${leadRes.body.tasks[0].chatbotExecution.length} chatbot execution steps`);

  // Manager: POS-0003 (Manager - Executive Business Partner in Administration)
  const mgrRes = await httpGet('http://localhost:3000/tasks/POS-0003.json');
  assert(mgrRes.status === 200, 'Manager POS-0003.json returns 200 OK');
  assert(mgrRes.body.roleLevel === 'Manager', 'POS-0003 roleLevel is Manager');
  assert(mgrRes.body.tasks && mgrRes.body.tasks.length === 30, 'POS-0003 has exactly 30 tasks');
  assert(mgrRes.body.tasks[0].title.length > 0, `Task 1 Heading: "${mgrRes.body.tasks[0].title}"`);
  assert(mgrRes.body.tasks[0].chatbotExecution.length >= 6, `Task 1 has ${mgrRes.body.tasks[0].chatbotExecution.length} chatbot execution steps`);

  // 2. Verify Backend API Endpoint
  console.log('\n--- 2. Testing Express Backend API Route ---');
  const apiRes = await httpGet('http://localhost:3000/api/v1/org/positions/POS-0001/tasks');
  assert(apiRes.status === 200, 'Backend API /api/v1/org/positions/POS-0001/tasks returns 200 OK');
  assert(apiRes.body.success === true, 'Backend API response has success=true');
  assert(apiRes.body.tasks.length === 30, 'Backend API returns all 30 authoritative tasks');

  // 3. Verify HTML & Chatbot Implementation
  console.log('\n--- 3. Testing Client Application & AI Copilot Training ---');
  const indexHtml = fs.readFileSync('client/index.html', 'utf8');

  assert(indexHtml.includes('getWhatIHaveToDoResponseHtml'), 'client/index.html contains getWhatIHaveToDoResponseHtml');
  assert(indexHtml.includes('getConfusionResolutionResponseHtml'), 'client/index.html contains getConfusionResolutionResponseHtml');
  assert(indexHtml.includes('what i have to do'), 'Chatbot natural language parser handles "what i have to do"');
  assert(indexHtml.includes('confus'), 'Chatbot natural language parser handles confusion');
  assert(indexHtml.includes('btn-task-explain'), 'Task cards render 💡 Ask AI Copilot button');
  assert(indexHtml.includes('Day 1 (Today)'), 'Checklist includes Day 1 filter pill');
  assert(indexHtml.includes('All Days (30 Tasks)'), 'Checklist includes All Days (30 Tasks) filter pill');

  // 4. Test Chatbot function execution in VM
  console.log('\n--- 4. Testing Chatbot Execution in VM Context ---');
  const vm = require('vm');
  const mockCtx = {
    currentLiveDashboard: {
      employee: {
        name: 'Aarav Sharma',
        role: 'Associate - Executive Assistant',
        fullTitle: 'Associate - Executive Assistant',
        department: 'ADMINISTRATION',
        subBranch: 'Executive Office Support',
        buddy: { name: 'Rahul Pandey', role: 'Senior Peer Mentor', phone: '+91 80 6789 89928', email: 'buddy@microsoft.in' },
        hr: { name: 'Priya Sharma', role: 'Lead HR People Partner', phone: '+91 80 6789 89912', email: 'hr@microsoft.in' }
      },
      tasks: assocRes.body.tasks
    },
    dailyTasksState: assocRes.body.tasks,
    escapeHtml: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    filterByDay: () => {},
    explainTaskById: () => {},
    handleChatOption: () => {}
  };

  const scriptMatch = indexHtml.match(/function getWhatIHaveToDoResponseHtml\(\)[\s\S]*?return html;\s*\}/);
  if (scriptMatch) {
    const whatToDoCode = scriptMatch[0];
    const vmInstance = vm.createContext(mockCtx);
    vm.runInContext(whatToDoCode, vmInstance);
    const outputHtml = vm.runInContext('getWhatIHaveToDoResponseHtml()', vmInstance);
    assert(outputHtml.includes('Your Day-1 Execution Blueprint'), 'getWhatIHaveToDoResponseHtml generates Day-1 Blueprint');
    assert(outputHtml.includes('30 authoritative tasks'), 'Chatbot explains 30 authoritative tasks');
    assert(outputHtml.includes('Immediate Next Action Item'), 'Chatbot identifies Immediate Next Action Item');
    assert(outputHtml.includes('Open Step-by-Step Playbook'), 'Chatbot offers Open Step-by-Step Playbook button');
  }

  const scriptMatch2 = indexHtml.match(/function getConfusionResolutionResponseHtml\(\)[\s\S]*?return `[\s\S]*?`;\s*\}/);
  if (scriptMatch2) {
    const confCode = scriptMatch2[0];
    const vmInstance = vm.createContext(mockCtx);
    vm.runInContext(confCode, vmInstance);
    const outputHtml = vm.runInContext('getConfusionResolutionResponseHtml()', vmInstance);
    assert(outputHtml.includes('Role Clarity & Confusion Resolution'), 'getConfusionResolutionResponseHtml generates Role Clarity');
    assert(outputHtml.includes('Assigned Buddy'), 'Chatbot presents Assigned Buddy in confusion resolution');
  }

  console.log('\n========================================================');
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
}

runVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
