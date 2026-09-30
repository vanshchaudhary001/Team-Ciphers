const fs = require('fs');
const path = require('path');

const tasksArrayContent = fs.readFileSync(path.join(__dirname, 'fullTasksArray.js'), 'utf8')
  .replace("console.log('Script loaded. Total tasks:', ALL_40_TASKS.length);", "")
  .trim();

function processHtml(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add CSS styles for day-filter-bar, btn-day-pill, and HR actions if not present
  if (!content.includes('.btn-day-pill')) {
    const extraCss = `
    /* Day Filter Pills & Badges */
    .day-filter-bar {
      display: inline-flex;
      gap: 4px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-slate-200);
    }
    .btn-day-pill {
      padding: 5px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
      font-weight: 700;
      border: 1px solid transparent;
      background: transparent;
      color: var(--color-slate-600);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .btn-day-pill:hover {
      color: var(--color-slate-900);
      background: rgba(255, 255, 255, 0.6);
    }
    .btn-day-pill.active {
      background: #ffffff;
      color: #2563eb;
      border-color: rgba(37, 99, 235, 0.25);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .manual-task-day-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }
    .btn-sm-action {
      padding: 5px 12px;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .btn-sm-toggle {
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      transition: all var(--transition-fast);
    }
    .btn-sm-toggle:hover {
      background: #dbeafe;
    }
    `;
    content = content.replace('</style>', `${extraCss}\n  </style>`);
  }

  // 2. Update SECTION 2: Daily Tasks & Work Checklist header to include Day Filter Pills
  const oldSection2Header = `<div class="section-card-header">
              <div>
                <div class="section-badge">Action Required</div>
                <h2 class="section-title">Today's Work / Day 1 Checklist</h2>
                <p class="section-desc">Toggle tasks when completed. All changes synchronize in real-time with your AI Copilot and HR records. Need detailed step-by-step guidance? Ask your AI Copilot.</p>
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <button class="btn-filter-pill active" id="filter-btn-all" onclick="filterManualTasks('all')">All Tasks (<span id="count-all-tasks">5</span>)</button>
                <button class="btn-filter-pill" id="filter-btn-pending" onclick="filterManualTasks('pending')">Pending (<span id="count-pending-tasks">3</span>)</button>
                <button class="btn-filter-pill" id="filter-btn-done" onclick="filterManualTasks('done')">Done (<span id="count-done-tasks">2</span>)</button>
              </div>
            </div>`;

  const newSection2Header = `<div class="section-card-header">
              <div>
                <div class="section-badge">Action Required</div>
                <h2 class="section-title">Today's Work / Day 1 Checklist</h2>
                <p class="section-desc">Role-aligned onboarding roadmap with verified corporate assets. All progress synchronizes in real-time with your AI Copilot and HR records.</p>
              </div>
              <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <!-- Day Navigation Pills -->
                <div class="day-filter-bar">
                  <button class="btn-day-pill active" id="day-pill-day1" onclick="filterByDay('Day 1')">📅 Day 1 (Today's Work)</button>
                  <button class="btn-day-pill" id="day-pill-day2" onclick="filterByDay('Day 2')">Day 2</button>
                  <button class="btn-day-pill" id="day-pill-day3" onclick="filterByDay('Day 3')">Day 3</button>
                  <button class="btn-day-pill" id="day-pill-all" onclick="filterByDay('all')">All Days</button>
                </div>
                <!-- Status Filter Pills -->
                <div style="display: flex; gap: 6px;">
                  <button class="btn-filter-pill active" id="filter-btn-all" onclick="filterManualTasks('all')">All (<span id="count-all-tasks">10</span>)</button>
                  <button class="btn-filter-pill" id="filter-btn-pending" onclick="filterManualTasks('pending')">Pending (<span id="count-pending-tasks">6</span>)</button>
                  <button class="btn-filter-pill" id="filter-btn-done" onclick="filterManualTasks('done')">Done (<span id="count-done-tasks">4</span>)</button>
                </div>
              </div>
            </div>`;

  if (content.includes(oldSection2Header)) {
    content = content.replace(oldSection2Header, newSection2Header);
  }

  // 3. Update TAB 4 in HR Portal with Candidate Progress Overview Banner & enhanced controls
  const oldTab4Header = `          <!-- Live Fresher Task Inventory Table -->
          <div style="overflow-x: auto;">
            <table class="hr-task-inventory-table">
              <thead>
                <tr>
                  <th style="width: 50px;">ID</th>
                  <th style="width: 120px;">Category</th>
                  <th>Task Title &amp; Short Instructions</th>
                  <th style="width: 100px;">Duration</th>
                  <th style="width: 110px;">Status</th>
                  <th style="width: 130px; text-align: right;">HR Action</th>
                </tr>
              </thead>
              <tbody id="hr-task-inventory-body">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>`;

  const newTab4Header = `          <!-- Candidate Progress & Profile Summary Banner -->
          <div id="hr-candidate-summary-banner" style="background: linear-gradient(135deg, #f8fafc, #eff6ff); border: 1px solid #bfdbfe; border-radius: var(--radius-lg); padding: 18px 22px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div id="hr-cand-avatar" style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff; font-weight: 800; font-size: 1.15rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
                DS
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span id="hr-cand-name" style="font-weight: 800; font-size: 1.15rem; color: var(--color-slate-900);">Diya Singh</span>
                  <span id="hr-cand-role-badge" style="background: #e0e7ff; color: #3730a3; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;">Data Analyst</span>
                  <span id="hr-cand-dept-badge" style="background: #ecfdf5; color: #065f46; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;">Data Dept · Delhi</span>
                </div>
                <div style="font-size: 0.78rem; color: var(--color-slate-500); margin-top: 3px;">
                  Assigned Buddy: <strong id="hr-cand-buddy" style="color: var(--color-slate-800);">Dhruv Agarwal</strong> · Reporting Manager: <strong id="hr-cand-manager" style="color: var(--color-slate-800);">Vikram Shah</strong>
                </div>
              </div>
            </div>

            <!-- Candidate Progress Ring & Bar -->
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="text-align: right;">
                <div id="hr-cand-pct-text" style="font-size: 1.25rem; font-weight: 800; color: #1e40af;">60% Cleared</div>
                <div id="hr-cand-stat-text" style="font-size: 0.75rem; color: var(--color-slate-500);">6 of 10 Tasks Completed</div>
              </div>
              <div style="width: 140px; height: 10px; background: #cbd5e1; border-radius: 999px; overflow: hidden;">
                <div id="hr-cand-prog-bar" style="height: 100%; width: 60%; background: linear-gradient(90deg, #2563eb, #10b981); border-radius: 999px; transition: width 0.4s ease;"></div>
              </div>
              <button class="btn-secondary" onclick="viewSelectedCandidatePortal()" style="font-size: 0.78rem; font-weight: 700; background: #ffffff; border-color: #93c5fd; color: #1e40af; padding: 7px 14px; border-radius: 8px;" title="Open Candidate Dashboard">
                👁️ Launch Joiner View
              </button>
            </div>
          </div>

          <!-- Live Fresher Task Inventory Table -->
          <div style="overflow-x: auto;">
            <table class="hr-task-inventory-table">
              <thead>
                <tr>
                  <th style="width: 75px;">Schedule</th>
                  <th style="width: 65px;">ID</th>
                  <th style="width: 110px;">Category</th>
                  <th>Task Title &amp; Detailed Instructions</th>
                  <th style="width: 90px;">Priority</th>
                  <th style="width: 110px;">Status</th>
                  <th style="width: 170px; text-align: right;">HR Actions</th>
                </tr>
              </thead>
              <tbody id="hr-task-inventory-body">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>`;

  if (content.includes(oldTab4Header)) {
    content = content.replace(oldTab4Header, newTab4Header);
  }

  // 4. Update Add Task Form with Day selection and presets
  const oldAddTaskBox = `          <!-- ADD NEW TASK TO FRESHER CHECKLIST FORM -->
          <div class="hr-add-task-box">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--color-slate-900);">
                ➕ Add Task for Joiner
              </h4>
              <span style="font-size: 0.74rem; color: #2563eb; font-weight: 700;">Instant Push to AI Copilot &amp; Portal</span>
            </div>

            <form id="hr-add-task-form" onsubmit="handleAddNewTaskByHR(event)">
              <div class="hr-form-grid">
                <div class="hr-form-group">
                  <label>Task Title *</label>
                  <input type="text" id="new-task-title" placeholder="e.g. Complete OWASP Top 10 Security Assessment" required>
                </div>

                <div class="hr-form-group">
                  <label>Category *</label>
                  <select id="new-task-category" required>
                    <option value="Security">Security</option>
                    <option value="Compliance">Compliance &amp; Legal</option>
                    <option value="Mentoring">Mentoring &amp; Culture</option>
                    <option value="Access">IT Access &amp; Tools</option>
                    <option value="Engineering" selected>Engineering &amp; Code</option>
                  </select>
                </div>

                <div class="hr-form-group">
                  <label>Estimated Time</label>
                  <input type="text" id="new-task-duration" placeholder="e.g. 25 mins" value="25 mins">
                </div>
              </div>

              <div class="hr-form-group" style="margin-bottom: 14px;">
                <label>Task Instructions &amp; Step-by-Step Guidance *</label>
                <textarea id="new-task-desc" placeholder="Detail the step-by-step instructions so the Fresher and AI Chatbot can explain it..." required></textarea>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div class="hr-presets-row">
                  <span style="font-size: 0.72rem; font-weight: 700; color: var(--color-slate-500);">QUICK PRESETS:</span>
                  <button type="button" class="hr-preset-btn" onclick="applyTaskPreset('cloud')">+ Azure Cloud Setup</button>
                  <button type="button" class="hr-preset-btn" onclick="applyTaskPreset('security')">+ Security Training</button>
                  <button type="button" class="hr-preset-btn" onclick="applyTaskPreset('culture')">+ Team 1:1 Intro</button>
                </div>

                <button type="submit" class="btn-add-task-submit">
                  <span>➕ Add Task to Fresher Checklist</span>
                </button>
              </div>
            </form>
          </div>`;

  const newAddTaskBox = `          <!-- ADD NEW TASK TO FRESHER CHECKLIST FORM -->
          <div class="hr-add-task-box">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <h4 id="hr-add-task-heading" style="font-size: 0.95rem; font-weight: 800; color: var(--color-slate-900);">
                ➕ Add Task for Joiner
              </h4>
              <span style="font-size: 0.74rem; color: #2563eb; font-weight: 700;">Instant Push to Candidate &amp; AI Copilot</span>
            </div>

            <form id="hr-add-task-form" onsubmit="handleAddNewTaskByHR(event)">
              <div class="hr-form-grid">
                <div class="hr-form-group">
                  <label>Task Title *</label>
                  <input type="text" id="new-task-title" placeholder="e.g. Complete OWASP Top 10 Security Assessment" required>
                </div>

                <div class="hr-form-group">
                  <label>Category / Track *</label>
                  <select id="new-task-category" required>
                    <option value="Engineering" selected>Engineering &amp; Code</option>
                    <option value="Data">Data &amp; Analytics</option>
                    <option value="Design">UI/UX Design</option>
                    <option value="Security">Security &amp; IT</option>
                    <option value="Compliance">Compliance &amp; Legal</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Mentoring">Mentoring &amp; Culture</option>
                  </select>
                </div>

                <div class="hr-form-group">
                  <label>Schedule Day *</label>
                  <select id="new-task-day" required>
                    <option value="Day 1" selected>Day 1 (Today's Work)</option>
                    <option value="Day 2">Day 2</option>
                    <option value="Day 3">Day 3</option>
                  </select>
                </div>

                <div class="hr-form-group">
                  <label>Priority *</label>
                  <select id="new-task-priority" required>
                    <option value="High" selected>High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>

                <div class="hr-form-group">
                  <label>Estimated Time</label>
                  <input type="text" id="new-task-duration" placeholder="e.g. 25 mins" value="25 mins">
                </div>
              </div>

              <div class="hr-form-group" style="margin-bottom: 14px;">
                <label>Task Instructions &amp; Step-by-Step Guidance *</label>
                <textarea id="new-task-desc" placeholder="Detail the step-by-step instructions so the Fresher and AI Chatbot can explain it..." required></textarea>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div class="hr-presets-row">
                  <span style="font-size: 0.72rem; font-weight: 700; color: var(--color-slate-500);">QUICK PRESETS:</span>
                  <button type="button" class="hr-preset-btn" onclick="applyTaskPreset('cloud')">+ Azure Cloud Setup</button>
                  <button type="button" class="hr-preset-btn" onclick="applyTaskPreset('security')">+ Security Training</button>
                  <button type="button" class="hr-preset-btn" onclick="applyTaskPreset('culture')">+ Team 1:1 Intro</button>
                  <button type="button" class="hr-preset-btn" onclick="applyTaskPreset('data')">+ Data Warehouse</button>
                  <button type="button" class="hr-preset-btn" onclick="applyTaskPreset('design')">+ Design System</button>
                </div>

                <button type="submit" class="btn-add-task-submit" id="btn-add-task-submit">
                  <span>➕ Add Task to Candidate Checklist</span>
                </button>
              </div>
            </form>
          </div>`;

  if (content.includes(oldAddTaskBox)) {
    content = content.replace(oldAddTaskBox, newAddTaskBox);
  }

  // 5. Inject comprehensive JavaScript engine
  const fullEngineScript = `
    // ==============================================================
    // 40-TASK ROLE-BASED ONBOARDING & HR SYNCHRONIZATION ENGINE
    // ==============================================================
    ${tasksArrayContent}

    let currentDayFilter = 'Day 1';
    let currentTaskFilter = 'all';

    function getCustomTasksStore() {
      try {
        const saved = localStorage.getItem('startsmart_custom_tasks_v3');
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }

    function saveCustomTasksStore(store) {
      try {
        localStorage.setItem('startsmart_custom_tasks_v3', JSON.stringify(store));
      } catch (e) {}
    }

    function getDeletedTasksStore() {
      try {
        const saved = localStorage.getItem('startsmart_deleted_tasks_v3');
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }

    function saveDeletedTasksStore(store) {
      try {
        localStorage.setItem('startsmart_deleted_tasks_v3', JSON.stringify(store));
      } catch (e) {}
    }

    function getTaskStatusStore() {
      try {
        const saved = localStorage.getItem('startsmart_task_status_v3');
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }

    function saveTaskStatusStore(store) {
      try {
        localStorage.setItem('startsmart_task_status_v3', JSON.stringify(store));
      } catch (e) {}
    }

    function getSynthesizedDashboardForEmployee(empId) {
      const store = window.__START_SMART_DATASETS__;
      if (!store) return null;

      const emps = store.employees || [];
      const emp = emps.find(e => e.employeeId === empId || e.email === empId) ||
                  emps.find(e => e.name.toLowerCase().includes('diya')) ||
                  emps[0];
      if (!emp) return null;

      const manager = store.contacts.find(c => c.contactId === emp.managerId) || {
        name: 'Vikram Shah',
        role: 'IT & Department Manager',
        phone: '+91 80 6789 89911',
        email: 'manager@demo-company.com'
      };

      const buddy = store.contacts.find(c => c.contactId === emp.buddyId) || {
        name: 'Dhruv Agarwal',
        role: 'Onboarding Buddy',
        phone: '+91 80 6789 89928',
        email: 'buddy@demo-company.com'
      };

      // 1. Base tasks for employee role & department
      const normalizedRole = emp.role.toLowerCase();
      const normalizedDept = emp.department.toLowerCase();

      const candidateBaseTasks = ALL_40_TASKS.filter(t => {
        if (t.applicableRole === 'All') return true;
        const taskRole = t.applicableRole.toLowerCase();
        const taskDept = t.department.toLowerCase();

        if (taskRole === normalizedRole) return true;
        if (taskDept === normalizedDept) return true;

        if (normalizedRole.includes('engineer') && taskRole === 'software engineer') return true;
        if (normalizedRole.includes('analyst') && taskRole === 'data analyst') return true;
        if (normalizedRole.includes('designer') && taskRole === 'ui/ux designer') return true;
        if (normalizedRole.includes('marketing') && taskRole === 'marketing executive') return true;
        if (normalizedRole.includes('hr') && taskRole === 'hr executive') return true;

        return false;
      });

      // 2. Custom tasks added by HR for this employee
      const customStore = getCustomTasksStore();
      const employeeCustomTasks = customStore[emp.employeeId] || [];

      // 3. Deleted tasks for this employee
      const deletedStore = getDeletedTasksStore();
      const employeeDeletedTaskIds = deletedStore[emp.employeeId] || [];

      // Combine base + custom, exclude deleted
      let allCombinedTasks = [...candidateBaseTasks, ...employeeCustomTasks].filter(
        t => !employeeDeletedTaskIds.includes(String(t.taskId))
      );

      // 4. Resolve status (from localStorage status store or progress dataset defaults)
      const statusStore = getTaskStatusStore();
      const progressStore = store.progress || [];

      const resolvedTasks = allCombinedTasks.map(t => {
        const key = \`\${emp.employeeId}_\${t.taskId}\`;
        let status = statusStore[key];

        if (!status) {
          const progRecord = progressStore.find(p => p.employeeId === emp.employeeId && p.taskId === t.taskId);
          if (progRecord) {
            status = progRecord.status;
          } else {
            // Default initial completed state for demo
            if (t.taskId === 'T001' || t.taskId === 'T002' || t.taskId === 'T004' || t.taskId === 'T005' || t.taskId === 'T006' || t.taskId === 'T008') {
              status = 'Completed';
            } else {
              status = 'Pending';
            }
          }
        }

        const resource = t.resourceId ? store.resources.find(r => r.resourceId === t.resourceId) : null;

        return {
          taskId: t.taskId,
          taskName: t.taskName,
          department: t.department || emp.department,
          day: t.day || 'Day 1',
          priority: t.priority || 'Medium',
          isMandatory: t.isMandatory !== false,
          duration: t.duration || '25 mins',
          description: t.desc || t.description || \`\${t.taskName} for \${emp.department} onboarding track.\`,
          status,
          progressId: \`P_\${emp.employeeId}_\${t.taskId}\`,
          resource
        };
      });

      // Day 1 tasks are prioritized as "Today's Work"
      const day1Tasks = resolvedTasks.filter(t => t.day === 'Day 1');
      const totalDay1 = day1Tasks.length;
      const completedDay1 = day1Tasks.filter(t => t.status === 'Completed').length;

      const totalAll = resolvedTasks.length;
      const completedAll = resolvedTasks.filter(t => t.status === 'Completed').length;
      const pendingAll = totalAll - completedAll;
      const percentage = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;
      const day1Percentage = totalDay1 > 0 ? Math.round((completedDay1 / totalDay1) * 100) : 0;

      return {
        employee: {
          ...emp,
          manager,
          buddy
        },
        metrics: {
          totalTasks: totalAll,
          completedTasks: completedAll,
          pendingTasks: pendingAll,
          percentage,
          day1Total: totalDay1,
          day1Completed: completedDay1,
          day1Percentage
        },
        tasks: resolvedTasks
      };
    }

    function filterByDay(dayKey) {
      currentDayFilter = dayKey;
      ['day1', 'day2', 'day3', 'all'].forEach(k => {
        const btn = document.getElementById(\`day-pill-\${k}\`);
        if (btn) btn.classList.remove('active');
      });
      const activeBtn = document.getElementById(
        dayKey === 'all' ? 'day-pill-all' : (dayKey === 'Day 1' ? 'day-pill-day1' : (dayKey === 'Day 2' ? 'day-pill-day2' : 'day-pill-day3'))
      );
      if (activeBtn) activeBtn.classList.add('active');

      applyTaskFilters();
    }

    function filterManualTasks(statusKey) {
      currentTaskFilter = statusKey;
      ['all', 'pending', 'done'].forEach(k => {
        const btn = document.getElementById(\`filter-btn-\${k}\`);
        if (btn) btn.classList.toggle('active', statusKey === k);
      });
      applyTaskFilters();
    }

    function applyTaskFilters() {
      const cards = document.querySelectorAll('#manual-checklist-container .manual-task-card');
      let visibleCount = 0;
      let pendingCount = 0;
      let doneCount = 0;

      cards.forEach(card => {
        const cardDay = card.dataset.day || 'Day 1';
        const cardStatus = card.dataset.status || 'pending';

        const matchesDay = (currentDayFilter === 'all' || cardDay === currentDayFilter);
        const matchesStatus = (currentTaskFilter === 'all' || cardStatus === currentTaskFilter);

        if (matchesDay) {
          if (cardStatus === 'done') doneCount++;
          else pendingCount++;
          visibleCount++;
        }

        if (matchesDay && matchesStatus) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });

      const countAll = document.getElementById('count-all-tasks');
      const countPending = document.getElementById('count-pending-tasks');
      const countDone = document.getElementById('count-done-tasks');
      if (countAll) countAll.textContent = visibleCount;
      if (countPending) countPending.textContent = pendingCount;
      if (countDone) countDone.textContent = doneCount;
    }

    // HR Portal: Single Joiner Task Management Engine
    function populateHRTargetDropdown() {
      const select = document.getElementById('hr-target-fresher-select');
      if (!select || !window.__START_SMART_DATASETS__) return;

      const emps = window.__START_SMART_DATASETS__.employees || [];
      let html = '';
      emps.forEach(emp => {
        const isSelected = (emp.employeeId === currentLiveEmployeeId) ? 'selected' : '';
        html += \`<option value="\${emp.employeeId}" \${isSelected}>\${emp.name} (\${emp.role} · \${emp.department} · \${emp.employeeId})</option>\`;
      });
      select.innerHTML = html;
    }

    function onHRFresherTargetChange() {
      const select = document.getElementById('hr-target-fresher-select');
      if (!select) return;
      currentLiveEmployeeId = select.value;
      const selectedName = select.options[select.selectedIndex]?.text || currentLiveEmployeeId;
      showNotification(\`Managing checklist for: \${selectedName}\`);
      renderHRTaskInventory();
    }

    function manageEmployeeTasksFromHR(employeeId) {
      currentLiveEmployeeId = employeeId;
      switchHRWorkspaceTab('taskmanager');
      const select = document.getElementById('hr-target-fresher-select');
      if (select) select.value = employeeId;
      renderHRTaskInventory();
      showNotification(\`Switched to task manager for candidate \${employeeId}\`);
    }

    function viewSelectedCandidatePortal() {
      if (currentLiveEmployeeId) {
        viewEmployeeFromHR(currentLiveEmployeeId);
      }
    }

    function renderHRTaskInventory() {
      const tbody = document.getElementById('hr-task-inventory-body');
      if (!tbody) return;

      populateHRTargetDropdown();

      const candidateData = getSynthesizedDashboardForEmployee(currentLiveEmployeeId);
      if (!candidateData) return;

      const emp = candidateData.employee;
      const metrics = candidateData.metrics;
      const tasks = candidateData.tasks;

      // Update Candidate Profile Banner
      const nameEl = document.getElementById('hr-cand-name');
      const avatarEl = document.getElementById('hr-cand-avatar');
      const roleBadge = document.getElementById('hr-cand-role-badge');
      const deptBadge = document.getElementById('hr-cand-dept-badge');
      const buddyEl = document.getElementById('hr-cand-buddy');
      const managerEl = document.getElementById('hr-cand-manager');
      const pctText = document.getElementById('hr-cand-pct-text');
      const statText = document.getElementById('hr-cand-stat-text');
      const progBar = document.getElementById('hr-cand-prog-bar');
      const addHeading = document.getElementById('hr-add-task-heading');

      if (nameEl) nameEl.textContent = emp.name;
      if (avatarEl) avatarEl.textContent = emp.name.split(' ').map(w => w[0]).join('');
      if (roleBadge) roleBadge.textContent = emp.role;
      if (deptBadge) deptBadge.textContent = \`\${emp.department} Dept · \${emp.location}\`;
      if (buddyEl) buddyEl.textContent = emp.buddy?.name || 'Dhruv Agarwal';
      if (managerEl) managerEl.textContent = emp.manager?.name || 'Vikram Shah';
      if (pctText) pctText.textContent = \`\${metrics.percentage}% Cleared\`;
      if (statText) statText.textContent = \`\${metrics.completedTasks} of \${metrics.totalTasks} Tasks Completed\`;
      if (progBar) progBar.style.width = \`\${metrics.percentage}%\`;
      if (addHeading) addHeading.textContent = \`➕ Add Custom Task for \${emp.name}\`;

      // Render Task Rows
      tbody.innerHTML = '';
      if (tasks.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="7" style="text-align: center; padding: 30px; color: var(--color-slate-500);">
              No active tasks for \${emp.name}. Use the form below to assign custom onboarding tasks.
            </td>
          </tr>
        \`;
        return;
      }

      tasks.forEach(t => {
        const isDone = t.status === 'Completed';
        const priorityColor = t.priority === 'High' ? '#dc2626' : (t.priority === 'Medium' ? '#2563eb' : '#64748b');
        const priorityBg = t.priority === 'High' ? '#fee2e2' : (t.priority === 'Medium' ? '#dbeafe' : '#f1f5f9');

        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td>
            <span class="manual-task-day-badge">📅 \${t.day}</span>
          </td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-slate-600); font-size: 0.8rem;">
            #\${t.taskId}
          </td>
          <td>
            <span class="manual-task-tag tag-engineering" style="font-size: 0.72rem;">\${t.department}</span>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--color-slate-900); font-size: 0.88rem;">\${t.taskName}</div>
            <div style="font-size: 0.76rem; color: var(--color-slate-500); margin-top: 2px;">\${t.description}</div>
          </td>
          <td>
            <span style="background: \${priorityBg}; color: \${priorityColor}; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;">
              \${t.priority}
            </span>
          </td>
          <td>
            <span style="font-size: 0.78rem; font-weight: 700; color: \${isDone ? '#059669' : '#d97706'}; display: inline-flex; align-items: center; gap: 4px;">
              \${isDone ? '✓ Completed' : '● Pending'}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn-sm-toggle" onclick="toggleTaskStatusByHR('\${t.taskId}')" style="margin-right: 6px;">
              \${isDone ? 'Mark Pending' : '✓ Complete'}
            </button>
            <button class="btn-remove-task" onclick="removeTaskByHR('\${t.taskId}')" title="Remove task from candidate checklist">
              🗑️ Remove
            </button>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function toggleTaskStatusByHR(taskId) {
      const candidateData = getSynthesizedDashboardForEmployee(currentLiveEmployeeId);
      if (!candidateData) return;

      const target = candidateData.tasks.find(t => t.taskId === taskId);
      const nextStatus = (target && target.status === 'Completed') ? 'Pending' : 'Completed';

      const statusStore = getTaskStatusStore();
      statusStore[\`\${currentLiveEmployeeId}_\${taskId}\`] = nextStatus;
      saveTaskStatusStore(statusStore);

      showNotification(\`✓ Task #\${taskId} updated to \${nextStatus} for \${candidateData.employee.name}!\`);
      renderHRTaskInventory();
      renderHRRosterTable();
    }

    function removeTaskByHR(taskId) {
      const candidateData = getSynthesizedDashboardForEmployee(currentLiveEmployeeId);
      if (!candidateData) return;

      const deletedStore = getDeletedTasksStore();
      if (!deletedStore[currentLiveEmployeeId]) deletedStore[currentLiveEmployeeId] = [];
      if (!deletedStore[currentLiveEmployeeId].includes(taskId)) {
        deletedStore[currentLiveEmployeeId].push(taskId);
      }
      saveDeletedTasksStore(deletedStore);

      showNotification(\`🗑️ Task #\${taskId} removed from \${candidateData.employee.name}'s checklist.\`);
      renderHRTaskInventory();
      renderHRRosterTable();
    }

    async function handleAddNewTaskByHR(event) {
      if (event) event.preventDefault();
      const titleInput = document.getElementById('new-task-title');
      const catInput = document.getElementById('new-task-category');
      const dayInput = document.getElementById('new-task-day');
      const priorityInput = document.getElementById('new-task-priority');
      const durationInput = document.getElementById('new-task-duration');
      const descInput = document.getElementById('new-task-desc');

      const title = titleInput ? titleInput.value.trim() : '';
      if (!title) return;

      const category = catInput ? catInput.value : 'Engineering';
      const day = dayInput ? dayInput.value : 'Day 1';
      const priority = priorityInput ? priorityInput.value : 'High';
      const duration = durationInput ? durationInput.value.trim() : '25 mins';
      const desc = descInput ? descInput.value.trim() : \`\${title} assigned by HR Operations.\`;

      const newTaskId = 'T_HR_' + Math.floor(100 + Math.random() * 900);

      const customStore = getCustomTasksStore();
      if (!customStore[currentLiveEmployeeId]) customStore[currentLiveEmployeeId] = [];
      customStore[currentLiveEmployeeId].push({
        taskId: newTaskId,
        taskName: title,
        applicableRole: 'All',
        department: category,
        day,
        priority,
        assignedBy: 'HR Operations',
        duration,
        desc,
        isMandatory: true
      });
      saveCustomTasksStore(customStore);

      const candidateData = getSynthesizedDashboardForEmployee(currentLiveEmployeeId);
      showNotification(\`➕ Task "\${title}" added to \${candidateData?.employee?.name || 'joiner'}'s \${day} checklist!\`);

      titleInput.value = '';
      if (descInput) descInput.value = '';

      renderHRTaskInventory();
      renderHRRosterTable();
    }

    function renderHRRosterTable() {
      const tbody = document.getElementById('hr-cohort-roster-body');
      if (!tbody || !window.__START_SMART_DATASETS__) return;

      const emps = window.__START_SMART_DATASETS__.employees || [];
      tbody.innerHTML = '';

      emps.forEach(emp => {
        const candidateData = getSynthesizedDashboardForEmployee(emp.employeeId);
        const metrics = candidateData?.metrics || { percentage: 0, completedTasks: 0, totalTasks: 10 };

        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td style="padding: 12px 14px; border-bottom: 1px solid var(--color-slate-100); font-weight: 700; color: var(--color-slate-900);">
            \${escapeHtml(emp.name)}
            <div style="font-size: 0.72rem; color: var(--color-slate-500); font-weight: 500;">\${escapeHtml(emp.role)} (\${escapeHtml(emp.employeeId)})</div>
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid var(--color-slate-100); font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-primary);">
            \${escapeHtml(emp.email)}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid var(--color-slate-100); color: var(--color-slate-600);">
            \${escapeHtml(emp.department)} · \${escapeHtml(emp.location)}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid var(--color-slate-100);">
            <strong style="color: #6b21a8;">\${escapeHtml(candidateData?.employee?.buddy?.name || 'Dhruv Agarwal')}</strong>
            <div style="font-size: 0.72rem; color: var(--color-slate-500);">\${escapeHtml(candidateData?.employee?.buddy?.phone || '+91 80 6789 89928')}</div>
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid var(--color-slate-100);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 70px; height: 7px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
                <div style="width: \${metrics.percentage}%; height: 100%; background: \${metrics.percentage === 100 ? '#10b981' : (metrics.percentage > 0 ? '#3b82f6' : '#94a3b8')};"></div>
              </div>
              <span style="font-size: 0.76rem; font-weight: 800; color: #0f172a;">\${metrics.percentage}%</span>
            </div>
            <div style="font-size: 0.7rem; color: #64748b;">\${metrics.completedTasks}/\${metrics.totalTasks} cleared</div>
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid var(--color-slate-100); white-space: nowrap;">
            <button class="btn-sm-action" style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; margin-right: 6px;" onclick="viewEmployeeFromHR('\${escapeHtml(emp.employeeId)}')">
              👁️ Joiner View
            </button>
            <button class="btn-sm-action" style="background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;" onclick="manageEmployeeTasksFromHR('\${escapeHtml(emp.employeeId)}')">
              ⚙️ Manage Tasks
            </button>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function applyTaskPreset(type) {
      const titleInput = document.getElementById('new-task-title');
      const catInput = document.getElementById('new-task-category');
      const dayInput = document.getElementById('new-task-day');
      const durInput = document.getElementById('new-task-duration');
      const descInput = document.getElementById('new-task-desc');

      if (type === 'cloud') {
        if (titleInput) titleInput.value = 'Configure Azure CLI & Dev Sandbox Environment';
        if (catInput) catInput.value = 'Engineering';
        if (dayInput) dayInput.value = 'Day 1';
        if (durInput) durInput.value = '30 mins';
        if (descInput) descInput.value = 'Run az login, configure your developer subscription sandbox ID, and verify deployment permissions to internal staging cluster.';
      } else if (type === 'security') {
        if (titleInput) titleInput.value = 'Complete OWASP & Data Protection Security Assessment';
        if (catInput) catInput.value = 'Security';
        if (dayInput) dayInput.value = 'Day 1';
        if (durInput) durInput.value = '25 mins';
        if (descInput) descInput.value = 'Review confidential information handling rules and complete the mandatory 5-question security compliance module.';
      } else if (type === 'culture') {
        if (titleInput) titleInput.value = '1:1 Technical Mentorship Kickoff with Assigned Buddy';
        if (catInput) catInput.value = 'Mentoring';
        if (dayInput) dayInput.value = 'Day 1';
        if (durInput) durInput.value = '45 mins';
        if (descInput) descInput.value = 'Meet your senior mentor for sprint cadence overview, code review SLAs, and repository tour.';
      } else if (type === 'data') {
        if (titleInput) titleInput.value = 'Configure BigQuery / Snowflake Read-Only Schemas';
        if (catInput) catInput.value = 'Data';
        if (dayInput) dayInput.value = 'Day 1';
        if (durInput) durInput.value = '25 mins';
        if (descInput) descInput.value = 'Request analytics role credentials and verify SQL query execution against staging data warehouse.';
      } else if (type === 'design') {
        if (titleInput) titleInput.value = 'Review Corporate Design System & Figma Token Libraries';
        if (catInput) catInput.value = 'Design';
        if (dayInput) dayInput.value = 'Day 2';
        if (durInput) durInput.value = '35 mins';
        if (descInput) descInput.value = 'Study typography tokens, elevation scales, grid systems, and component states in Figma library.';
      }
    }
  `;

  // Replace old synthesized dashboard and helper scripts with our complete engine
  const marker = "// Embedded 5 Structured Datasets (Employees, Tasks, Progress, Resources, Contacts)";
  if (content.includes(marker)) {
    const splitIndex = content.indexOf(marker);
    const beforeMarker = content.slice(0, splitIndex);
    const afterMarker = content.slice(splitIndex);

    // Find end of previous functions before let currentLiveEmployeeId = 'E001';
    const targetAnchor = "let currentLiveEmployeeId = 'E001';";
    const anchorIndex = afterMarker.indexOf(targetAnchor);

    if (anchorIndex !== -1) {
      const restOfCode = afterMarker.slice(anchorIndex + targetAnchor.length);
      content = beforeMarker + fullEngineScript + "\n    " + targetAnchor + restOfCode;
    }
  }

  // 6. Update renderManualDashboardFromLive to render Day badges, priority tags, and hook into filterByDay
  const oldRenderLiveSnippet = `tasks.forEach(t => {
            const isDone = t.status === 'Completed';
            const card = document.createElement('div');
            card.className = \`manual-task-card \${isDone ? 'is-done' : ''}\`;
            card.id = \`manual-task-card-\${t.taskId}\`;
            card.dataset.status = isDone ? 'done' : 'pending';`;

  const newRenderLiveSnippet = `tasks.forEach(t => {
            const isDone = t.status === 'Completed';
            const card = document.createElement('div');
            card.className = \`manual-task-card \${isDone ? 'is-done' : ''}\`;
            card.id = \`manual-task-card-\${t.taskId}\`;
            card.dataset.status = isDone ? 'done' : 'pending';
            card.dataset.day = t.day || 'Day 1';`;

  if (content.includes(oldRenderLiveSnippet)) {
    content = content.replace(oldRenderLiveSnippet, newRenderLiveSnippet);
  }

  // Ensure card badge in renderManualDashboardFromLive has Day badge
  const oldBadgesSnippet = `<span class="manual-task-tag tag-engineering" style="background: #e0e7ff; color: #3730a3; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">\${t.department || 'General'}</span>
                  <span style="background: #f1f5f9; color: #334155; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">📅 \${t.day}</span>`;

  const newBadgesSnippet = `<span class="manual-task-day-badge">📅 \${t.day}</span>
                  <span class="manual-task-tag tag-engineering" style="background: #e0e7ff; color: #3730a3; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">\${t.department || 'General'}</span>`;

  if (content.includes(oldBadgesSnippet)) {
    content = content.replace(oldBadgesSnippet, newBadgesSnippet);
  }

  // Ensure applyTaskFilters is called at end of renderManualDashboardFromLive
  if (content.includes("filterManualTasks(currentTaskFilter || 'all');\n      updateLiveCopilotChips(tasks);")) {
    content = content.replace("filterManualTasks(currentTaskFilter || 'all');\n      updateLiveCopilotChips(tasks);", "applyTaskFilters();\n      updateLiveCopilotChips(tasks);");
  }

  // Ensure renderHRRosterTable is called in renderLiveHRPortal
  if (content.includes("tbody.appendChild(tr);\n          });\n        } catch (err) {")) {
    // Already has roster logic
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully updated: ${filePath}`);
}

['client/index.html', 'index.html', 'client/public/index.html'].forEach(f => {
  const p = path.join(__dirname, '..', f);
  if (fs.existsSync(p)) {
    processHtml(p);
  }
});
