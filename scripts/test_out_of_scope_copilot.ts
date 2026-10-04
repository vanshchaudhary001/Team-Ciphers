async function runTests() {
  console.log('====================================================');
  console.log('  TESTING FIRST-WEEK MAZE OUT-OF-SCOPE COPILOT SYSTEM');
  console.log('====================================================\n');

  const base = 'http://localhost:5001';

  async function queryCopilot(query: string, employeeId = 'E001') {
    const res = await fetch(`${base}/api/v1/ai/nvidia-copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, employeeId })
    });
    const data = await res.json();
    return data.data?.answer || '';
  }

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, name: string) {
    if (cond) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  }

  // --- Group 1: Explicit Out-Of-Scope Examples from User Prompt ---
  console.log('--- Test Group 1: Out-of-Scope Examples ---');
  const oosExamples = [
    'What is the capital of France?',
    'Write me a Python program.',
    'What is the weather today?',
    'Tell me a joke.',
    'Who is Elon Musk?',
    'Explain quantum physics.',
    'What should I eat for dinner?',
    'Can you write a poem about summer?',
    'What is the meaning of life?'
  ];

  for (const q of oosExamples) {
    const ans = await queryCopilot(q);
    assert(
      ans.trim() === 'Sorry, I can only help with onboarding-related questions.',
      `Rejected out-of-scope: "${q}" -> "${ans}"`
    );
  }

  // --- Group 2: Ambiguous Questions ---
  console.log('\n--- Test Group 2: Ambiguous Questions Clarification ---');
  const ambExamples = [
    'Where is it?',
    'Tell me more',
    'What next?',
    'Status?'
  ];

  for (const q of ambExamples) {
    const ans = await queryCopilot(q);
    assert(
      ans.includes('clarify') || ans.includes('onboarding tasks'),
      `Handled ambiguous: "${q}" -> "${ans.slice(0, 70)}..."`
    );
  }

  // --- Group 3: In-Scope Onboarding Questions ---
  console.log('\n--- Test Group 3: In-Scope Onboarding Questions ---');
  const inScopeExamples = [
    { q: 'Who is my reporting manager?', expect: ['Rohan Verma', 'Manager'] },
    { q: 'What do I need to complete today?', expect: ['task', 'priority', 'profile', 'security'] },
    { q: 'What is my onboarding progress?', expect: ['progress', '%', 'tasks'] },
    { q: 'Who should I contact for IT help?', expect: ['Rahul Mehta', 'IT', 'helpdesk'] },
    { q: 'Where can I find my department resources?', expect: ['GitHub', 'resources', 'Engineering'] },
    { q: 'What should I complete on Day 1?', expect: ['Day 1', 'task', 'complete'] }
  ];

  for (const item of inScopeExamples) {
    const ans = await queryCopilot(item.q);
    const hasExpected = item.expect.some(e => ans.toLowerCase().includes(e.toLowerCase()));
    assert(
      hasExpected && !ans.includes('Sorry, I can only help with onboarding-related questions.'),
      `Answered in-scope: "${item.q}" -> "${ans.slice(0, 70).replace(/\n/g, ' ')}..."`
    );
  }

  console.log('\n====================================================');
  console.log(`  OUT-OF-SCOPE SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
