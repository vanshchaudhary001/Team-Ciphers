const fs = require('fs');
const path = require('path');

const files = [
  path.resolve(__dirname, '../client/index.html'),
  path.resolve(__dirname, '../index.html'),
  path.resolve(__dirname, '../client/public/index.html')
];

// 1. Build Section 1 (Contacts Directory) HTML
const section1Html = `          <!-- SECTION 1: Team Members & Key HR Contacts (Direct Access Directory) -->
          <div class="dashboard-section-card" id="section-contacts-directory">
            <div class="section-card-header">
              <div>
                <div class="section-badge">Direct Access Directory</div>
                <h2 class="section-title">Team Members &amp; Key HR Contacts</h2>
                <p class="section-desc">Reach out directly via in-app VoIP call, in-app messaging, direct phone lines, or Microsoft Teams.</p>
              </div>

              <!-- Interactive Contact Dropdown Filter -->
              <div class="contact-dropdown-selector-box">
                <label for="contact-directory-select" class="dropdown-label">
                  <span class="material-symbols-outlined" style="font-size: 16px; color: var(--stitch-primary);">badge</span>
                  <span>Select Contact to Display:</span>
                </label>
                <div class="select-wrapper-custom">
                  <select id="contact-directory-select" class="custom-contact-select" onchange="onContactDropdownSelect(this.value)">
                    <option value="none">-- Click dropdown to select contact --</option>
                    <option value="hr">👤 Priya Nair (Lead HR Manager · C003)</option>
                    <option value="buddy">🤝 Dhruv Agarwal (Onboarding Buddy · C019)</option>
                    <option value="it">🛠️ Rahul Mehta (IT Helpdesk · C001)</option>
                    <option value="all">👥 Show All Key Direct Contacts</option>
                  </select>
                  <span class="material-symbols-outlined select-chevron">expand_more</span>
                </div>
              </div>
              <div class="contacts-quick-pills">
                <button type="button" class="contact-pill-btn active" id="pill-none" onclick="setContactDropdownFilter('none')">📁 Collapsed</button>
                <button type="button" class="contact-pill-btn" id="pill-hr" onclick="setContactDropdownFilter('hr')">HR Partner</button>
                <button type="button" class="contact-pill-btn" id="pill-buddy" onclick="setContactDropdownFilter('buddy')">Buddy Mentor</button>
                <button type="button" class="contact-pill-btn" id="pill-it" onclick="setContactDropdownFilter('it')">IT Desk</button>
                <button type="button" class="contact-pill-btn" id="pill-all" onclick="setContactDropdownFilter('all')">View All (3)</button>
              </div>
            </div>

            <!-- Collapsed Placeholder (Shown when 'none' is selected) -->
            <div id="contacts-collapsed-placeholder" class="contacts-collapsed-placeholder" onclick="setContactDropdownFilter('all')">
              <div class="placeholder-icon-ring">
                <span class="material-symbols-outlined" style="font-size: 26px; color: var(--stitch-primary);">contact_phone</span>
              </div>
              <div class="placeholder-text-block">
                <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--color-slate-900); margin-bottom: 2px;">
                  Direct Contacts Directory Collapsed
                </h4>
                <p style="font-size: 0.8rem; color: var(--color-slate-500); margin: 0;">
                  Click the dropdown above or click here to view direct phone lines, initiate an in-app VoIP call, or send an in-app message.
                </p>
              </div>
              <button type="button" class="btn-open-dropdown" onclick="event.stopPropagation(); setContactDropdownFilter('all')">
                <span>View Contacts ▼</span>
              </button>
            </div>

            <!-- Contacts Cards Grid (Filtered dynamically by dropdown) -->
            <div class="contacts-grid-pro" id="contacts-grid-pro" style="display: none;">
              <!-- HR Partner Card -->
              <div class="contact-card-pro hr-glow" id="contact-card-hr">
                <div class="contact-card-top">
                  <div class="contact-avatar hr-avatar" id="contact-hr-avatar">PN</div>
                  <div class="contact-header-info">
                    <span class="contact-role-tag hr-tag">People Operations (HR)</span>
                    <h3 class="contact-name" id="contact-hr-name">Priya Nair</h3>
                    <span class="contact-title" id="contact-hr-title">Lead HR People Partner · Employee Success</span>
                  </div>
                </div>
                <div class="contact-phone-block">
                  <span class="phone-label">DIRECT PHONE LINE</span>
                  <a href="javascript:void(0)" onclick="openInAppCall('hr')" class="phone-display-btn">
                    <span class="phone-icon">📞</span>
                    <strong id="contact-hr-phone">+91 (80) 6789-89912</strong>
                  </a>
                </div>
                <div class="contact-details-list">
                  <div class="contact-detail-row">
                    <span class="detail-icon">📧</span>
                    <span id="contact-hr-email">hr@demo-company.com</span>
                  </div>
                  <div class="contact-detail-row">
                    <span class="detail-icon">🏢</span>
                    <span>Executive Tower, Level 4, People Ops</span>
                  </div>
                </div>
                <div class="contact-actions-row">
                  <button type="button" class="btn-contact-action btn-call" onclick="openInAppCall('hr')">
                    📞 Direct Call
                  </button>
                  <button type="button" class="btn-contact-action btn-inapp-msg" onclick="openInAppMessenger('hr')">
                    💬 In-App Message
                  </button>
                </div>
              </div>

              <!-- Buddy Mentor Card -->
              <div class="contact-card-pro buddy-glow" id="contact-card-buddy">
                <div class="contact-card-top">
                  <div class="contact-avatar buddy-avatar" id="contact-buddy-avatar">DA</div>
                  <div class="contact-header-info">
                    <span class="contact-role-tag buddy-tag">Assigned Buddy (Mentor)</span>
                    <h3 class="contact-name" id="contact-buddy-name">Dhruv Agarwal</h3>
                    <span class="contact-title" id="contact-buddy-title">Senior Software Engineer · Peer Mentor</span>
                  </div>
                </div>
                <div class="contact-phone-block">
                  <span class="phone-label">BUDDY DIRECT PHONE LINE</span>
                  <a href="javascript:void(0)" onclick="openInAppCall('buddy')" class="phone-display-btn buddy-phone">
                    <span class="phone-icon">📞</span>
                    <strong id="contact-buddy-phone">+91 (80) 6789-89928</strong>
                  </a>
                </div>
                <div class="contact-details-list">
                  <div class="contact-detail-row">
                    <span class="detail-icon">📧</span>
                    <span id="contact-buddy-email">buddy@demo-company.com</span>
                  </div>
                  <div class="contact-detail-row highlight-session">
                    <span class="detail-icon">📅</span>
                    <strong>1:1 Briefing Today: 2:00 PM IST (Teams Room)</strong>
                  </div>
                </div>
                <div class="contact-actions-row">
                  <button type="button" class="btn-contact-action btn-call-buddy" onclick="openInAppCall('buddy')">
                    📞 Direct Call
                  </button>
                  <button type="button" class="btn-contact-action btn-inapp-msg" onclick="openInAppMessenger('buddy')">
                    💬 In-App Message
                  </button>
                </div>
              </div>

              <!-- IT Helpdesk Card -->
              <div class="contact-card-pro it-glow" id="contact-card-it">
                <div class="contact-card-top">
                  <div class="contact-avatar it-avatar">RM</div>
                  <div class="contact-header-info">
                    <span class="contact-role-tag it-tag">IT Operations &amp; Security</span>
                    <h3 class="contact-name">Rahul Mehta</h3>
                    <span class="contact-title">Lead IT Architect · 24/7 Security &amp; Access</span>
                  </div>
                </div>
                <div class="contact-phone-block">
                  <span class="phone-label">TOLL-FREE IT HOTLINE</span>
                  <a href="javascript:void(0)" onclick="openInAppCall('it')" class="phone-display-btn it-phone">
                    <span class="phone-icon">📞</span>
                    <strong>+91 (80) 6789-89910</strong>
                  </a>
                </div>
                <div class="contact-details-list">
                  <div class="contact-detail-row">
                    <span class="detail-icon">📧</span>
                    <span>it@demo-company.com</span>
                  </div>
                  <div class="contact-detail-row">
                    <span class="detail-icon">⚡</span>
                    <span>Global SLA: &lt; 15 mins for New Joiners</span>
                  </div>
                </div>
                <div class="contact-actions-row">
                  <button type="button" class="btn-contact-action btn-call-it" onclick="openInAppCall('it')">
                    📞 Direct Call
                  </button>
                  <button type="button" class="btn-contact-action btn-inapp-msg" onclick="openInAppMessenger('it')">
                    💬 In-App Message
                  </button>
                </div>
              </div>
            </div>
          </div>`;

// 2. Build Section 2 (Checklist) HTML
const section2Html = `          <!-- SECTION 2: Daily Tasks & Work Checklist (Manual View) -->
          <div class="dashboard-section-card" id="section-tasks-checklist">
            <div class="section-card-header" style="display: flex; flex-direction: column; gap: 14px; align-items: stretch;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                <div>
                  <div class="section-badge">Action Required</div>
                  <h2 class="section-title">Today's Work &amp; Onboarding Checklist</h2>
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
            </div>

            <!-- Interactive Task List Container -->
            <div id="manual-checklist-container" class="manual-checklist-container">
              <!-- Dynamically populated from synthesized role-based tasks -->
            </div>
          </div>`;

// 3. Build Candidate Progress Banner for HR Single Joiner Task Manager
const hrCandidateBannerHtml = `          <!-- Active Candidate Live Progress & Telemetry Banner -->
          <div class="hr-candidate-profile-banner" style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 18px 22px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; color: #ffffff;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div id="hr-cand-avatar" style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5, #06b6d4); color: #fff; font-weight: 800; font-size: 1.15rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                AS
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <h3 id="hr-cand-name" style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin: 0;">Aarav Sharma</h3>
                  <span id="hr-cand-role-badge" style="background: rgba(99, 102, 241, 0.25); color: #c7d2fe; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px;">Software Engineer</span>
                  <span id="hr-cand-dept-badge" style="background: rgba(56, 189, 248, 0.2); color: #7dd3fc; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px;">Engineering · Bangalore</span>
                </div>
                <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 3px; display: flex; gap: 14px;">
                  <span>🤝 Buddy: <strong id="hr-cand-buddy" style="color: #cbd5e1;">Dhruv Agarwal</strong></span>
                  <span>💼 Manager: <strong id="hr-cand-manager" style="color: #cbd5e1;">Vikram Shah</strong></span>
                </div>
              </div>
            </div>

            <!-- Live Progress Bar -->
            <div style="min-width: 260px; flex-shrink: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; font-weight: 700; margin-bottom: 6px;">
                <span id="hr-cand-pct-text" style="color: #34d399;">45% Cleared</span>
                <span id="hr-cand-stat-text" style="color: #94a3b8;">9 of 20 Tasks Completed</span>
              </div>
              <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 999px; overflow: hidden;">
                <div id="hr-cand-prog-bar" style="width: 45%; height: 100%; background: linear-gradient(90deg, #10b981, #06b6d4); border-radius: 999px; transition: width 0.3s ease;"></div>
              </div>
            </div>
          </div>`;

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  console.log(`Updating ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace the merged section with both Section 1 and Section 2
  const joinerHeroEnd = content.indexOf('</div>\n          </div>\n\n          <!-- SECTION 1: Team Members');
  const joinerChatPanelStart = content.indexOf('<!-- ==========================================================\n             RIGHT 30%: AI ONBOARDING COPILOT CHATBOT');

  if (joinerHeroEnd !== -1 && joinerChatPanelStart !== -1) {
    const beforeHero = content.slice(0, joinerHeroEnd + 21);
    const afterSection2 = content.slice(joinerChatPanelStart);
    content = beforeHero + '\n' + section1Html + '\n\n' + section2Html + '\n\n        </div>\n\n        ' + afterSection2;
    console.log('  Restored Section 1 (Contacts) and Section 2 (Checklist)');
  }

  // 2. In HR Portal: Make Roster the default active tab
  // Make Tab 2 (Roster) active button and visible pane
  content = content.replace(
    '<button class="hr-tab-btn active" id="hr-tab-btn-checklists" onclick="switchHRWorkspaceTab(\'checklists\')">',
    '<button class="hr-tab-btn" id="hr-tab-btn-checklists" onclick="switchHRWorkspaceTab(\'checklists\')">'
  );
  content = content.replace(
    '<button class="hr-tab-btn" id="hr-tab-btn-roster" onclick="switchHRWorkspaceTab(\'roster\')">',
    '<button class="hr-tab-btn active" id="hr-tab-btn-roster" onclick="switchHRWorkspaceTab(\'roster\')">'
  );
  content = content.replace(
    '<div id="hr-pane-checklists" class="hr-workspace-pane">',
    '<div id="hr-pane-checklists" class="hr-workspace-pane" style="display: none;">'
  );
  content = content.replace(
    '<div id="hr-pane-roster" class="hr-workspace-pane" style="display: none;">',
    '<div id="hr-pane-roster" class="hr-workspace-pane">'
  );

  // 3. In #hr-pane-taskmanager: Insert Candidate Progress Banner and align table columns
  if (!content.includes('id="hr-cand-name"')) {
    content = content.replace(
      '<!-- Live Fresher Task Inventory Table -->',
      hrCandidateBannerHtml + '\n\n          <!-- Live Fresher Task Inventory Table -->'
    );
    console.log('  Inserted Candidate Progress Banner into HR Single Joiner Task Manager');
  }

  // Align table headers in #hr-pane-taskmanager
  const oldTheadRegex = /<table class="hr-task-inventory-table">[\s\S]*?<thead>[\s\S]*?<\/thead>/;
  const newThead = `<table class="hr-task-inventory-table">
              <thead>
                <tr>
                  <th style="width: 85px;">Day</th>
                  <th style="width: 65px;">ID</th>
                  <th style="width: 110px;">Track</th>
                  <th>Task Title &amp; Detailed Instructions</th>
                  <th style="width: 85px;">Priority</th>
                  <th style="width: 100px;">Status</th>
                  <th style="width: 170px; text-align: right;">HR Action</th>
                </tr>
              </thead>`;
  if (oldTheadRegex.test(content)) {
    content = content.replace(oldTheadRegex, newThead);
    console.log('  Aligned HR task inventory table headers');
  }

  // 4. Update renderLiveHRPortal to populate metrics, roster table, and task inventory from datasets
  const oldRenderLiveHRRegex = /async function renderLiveHRPortal\s*\(hrUser\)\s*\{[\s\S]*?renderHRInbox\(\);\s*\}/;
  const newRenderLiveHR = `async function renderLiveHRPortal(hrUser) {
      if (hrUser && document.getElementById('hr-portal-name')) {
        document.getElementById('hr-portal-name').textContent = hrUser.name || 'Priya Nair';
      }

      // 1. Calculate live telemetry from datasets and candidate dashboards
      const emps = (window.__START_SMART_DATASETS__ && window.__START_SMART_DATASETS__.employees) ? window.__START_SMART_DATASETS__.employees : [];
      let totalJoiners = emps.length;
      let activeCount = 0;
      let completedCount = 0;
      let pendingCount = 0;
      let overdueCount = 0;

      emps.forEach(emp => {
        const candidateData = getSynthesizedDashboardForEmployee(emp.employeeId);
        const pct = candidateData?.metrics?.percentage || 0;
        if (pct === 100) completedCount++;
        else if (pct > 0) activeCount++;
        else pendingCount++;
      });

      const elTotal = document.getElementById('hr-kpi-total-joiners');
      const elActive = document.getElementById('hr-kpi-active-joiners');
      const elCompleted = document.getElementById('hr-kpi-completed-joiners');
      const elPending = document.getElementById('hr-kpi-pending-joiners');
      const elOverdue = document.getElementById('hr-kpi-overdue-tasks');
      const badgeJoiners = document.getElementById('hr-badge-joiners-count');
      const badgeChecklists = document.getElementById('hr-badge-checklists-count');

      if (elTotal) elTotal.textContent = totalJoiners;
      if (elActive) elActive.textContent = activeCount;
      if (elCompleted) elCompleted.textContent = completedCount;
      if (elPending) elPending.textContent = pendingCount;
      if (elOverdue) elOverdue.textContent = overdueCount;
      if (badgeJoiners) badgeJoiners.textContent = totalJoiners;
      if (badgeChecklists) badgeChecklists.textContent = '40 Tasks Active';

      // 2. Render Cohort Roster Table with live progress
      renderHRRosterTable();

      // 3. Render Single Joiner Task Inventory
      renderHRTaskInventory();

      // 4. Default to Roster Tab
      switchHRWorkspaceTab('roster');
    }`;

  if (oldRenderLiveHRRegex.test(content)) {
    content = content.replace(oldRenderLiveHRRegex, newRenderLiveHR);
    console.log('  Updated renderLiveHRPortal with live telemetry and roster rendering');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Saved ${filePath}`);
});

console.log('Done restoring contacts and fixing HR portal.');
