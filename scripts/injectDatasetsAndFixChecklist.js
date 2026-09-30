const fs = require('fs');
const path = require('path');

// Read datasets.json
const datasetsPath = path.resolve(__dirname, '../client/public/datasets.json');
const datasets = JSON.parse(fs.readFileSync(datasetsPath, 'utf8'));

const files = [
  path.resolve(__dirname, '../client/index.html'),
  path.resolve(__dirname, '../index.html'),
  path.resolve(__dirname, '../client/public/index.html')
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  console.log(`Processing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Ensure Section 2 Header has Day Filter tabs
  const oldHeaderTarget = '<div class="section-card-header">';
  const newHeaderHtml = `<div class="section-card-header" style="display: flex; flex-direction: column; gap: 14px; align-items: stretch;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                <div>
                  <div class="section-badge">Action Required</div>
                  <h2 class="section-title">Today's Work & Onboarding Checklist</h2>
                  <p class="section-desc">Toggle tasks when completed. All changes synchronize in real-time with your AI Copilot and HR records. Need detailed step-by-step guidance? Ask your AI Copilot.</p>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-top: 1px solid var(--color-slate-100); padding-top: 12px;">
                <!-- Day Filter Tabs -->
                <div class="day-filter-bar">
                  <button type="button" class="btn-day-pill active" id="day-pill-day1" onclick="filterByDay('Day 1')">Day 1 (Today)</button>
                  <button type="button" class="btn-day-pill" id="day-pill-day2" onclick="filterByDay('Day 2')">Day 2</button>
                  <button type="button" class="btn-day-pill" id="day-pill-day3" onclick="filterByDay('Day 3')">Day 3</button>
                  <button type="button" class="btn-day-pill" id="day-pill-all" onclick="filterByDay('all')">All Days</button>
                </div>

                <!-- Status Filter Pills -->
                <div style="display: flex; gap: 6px;">
                  <button class="btn-filter-pill active" id="filter-btn-all" onclick="filterManualTasks('all')">All (<span id="count-all-tasks">0</span>)</button>
                  <button class="btn-filter-pill" id="filter-btn-pending" onclick="filterManualTasks('pending')">Pending (<span id="count-pending-tasks">0</span>)</button>
                  <button class="btn-filter-pill" id="filter-btn-done" onclick="filterManualTasks('done')">Done (<span id="count-done-tasks">0</span>)</button>
                </div>
              </div>
            </div>`;

  if (content.includes('id="count-all-tasks">5</span>')) {
    // Replace old section-card-header
    const headerStart = content.indexOf('<div class="section-card-header">');
    const headerEnd = content.indexOf('</div>\n\n            <!-- Interactive Task List Container -->', headerStart);
    if (headerStart !== -1 && headerEnd !== -1) {
      content = content.slice(0, headerStart) + newHeaderHtml + content.slice(headerEnd + 6);
      console.log('  Updated Section 2 Header with Day Filter Tabs');
    }
  }

  // 2. Embed window.__START_SMART_DATASETS__ at top of script
  const datasetJsonString = JSON.stringify(datasets).replace(/<\/script/gi, '<\\/script');
  const datasetInjection = `
    // 5 STRUCTURED DATASETS EMBEDDED DIRECTLY FOR OFFLINE & VERCEL RELIABILITY
    window.__START_SMART_DATASETS__ = ${datasetJsonString};
    let allEmployeesDataset = window.__START_SMART_DATASETS__.employees || [];
    let allContactsDataset = window.__START_SMART_DATASETS__.contacts || [];
`;

  if (!content.includes('window.__START_SMART_DATASETS__ =')) {
    content = content.replace(
      '// 5 STRUCTURED DATASETS LIVE INTEGRATION LAYER',
      '// 5 STRUCTURED DATASETS LIVE INTEGRATION LAYER\n' + datasetInjection
    );
    console.log('  Embedded window.__START_SMART_DATASETS__');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  Saved ${filePath}`);
});

console.log('Step 1 complete: Injected datasets and day filter headers.');
