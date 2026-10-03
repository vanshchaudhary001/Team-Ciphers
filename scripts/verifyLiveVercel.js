async function testLive() {
  const res = await fetch('https://start-smart-maze.vercel.app');
  const html = await res.text();
  console.log('Status:', res.status);
  console.log('HTML Length:', html.length);
  console.log('1. Has Section 1 (Contacts Directory):', html.includes('id="section-contacts-directory"'));
  console.log('2. Has Contact Dropdown Select:', html.includes('id="contact-directory-select"'));
  console.log('3. Has Section 2 (Checklist):', html.includes('id="section-tasks-checklist"'));
  console.log('4. Section 1 is positioned before Section 2:', html.indexOf('id="section-contacts-directory"') < html.indexOf('id="section-tasks-checklist"'));
  console.log('5. HR Portal Cohort Roster active tab:', html.includes('id="hr-tab-btn-roster"') && html.includes('id="hr-pane-roster"'));
  console.log('6. Has HR Candidate Banner:', html.includes('id="hr-cand-name"') && html.includes('id="hr-cand-prog-bar"'));
  console.log('7. Has Unified Bidirectional Task Sync:', html.includes('toggleManualTask') && html.includes('toggleTaskStatusByHR') && html.includes('removeTaskByHR') && html.includes('handleAddNewTaskByHR'));
}
testLive().catch(console.error);
