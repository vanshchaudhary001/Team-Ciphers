const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '../index.html'),
  path.join(__dirname, '../client/public/index.html')
];

for (const filePath of targetFiles) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Inject state variables after DEFAULT_DAILY_TASKS
  const stateSearch = "let dailyTasksState = loadTasksState();\n    let currentTaskFilter = 'all';";
  const stateReplacement = `let dailyTasksState = loadTasksState();
    let currentTaskFilter = 'all';

    // ==============================================================
    // 5 STRUCTURED DATASETS LIVE INTEGRATION LAYER
    // ==============================================================
    let currentLiveEmployeeId = 'E001';
    let currentLiveDashboard = null;
    let allEmployeesDataset = [];
    let allContactsDataset = [];
    let liveTasksList = [];

    function getApiBaseUrl() {
      return (window.location.port === '3000') ? '' : 'http://localhost:5001';
    }

    async function initDatasetLayer() {
      try {
        const base = getApiBaseUrl();
        const [empRes, contRes] = await Promise.all([
          fetch(\`\${base}/api/employees\`).catch(() => null),
          fetch(\`\${base}/api/contacts\`).catch(() => null)
        ]);
        if (empRes && empRes.ok) {
          const empData = await empRes.json();
          allEmployeesDataset = empData.employees || [];
        }
        if (contRes && contRes.ok) {
          const contData = await contRes.json();
          allContactsDataset = contData.contacts || [];
          populateContactDropdownOptions(allContactsDataset);
        }
      } catch (err) {
        console.warn('Dataset layer init warning:', err);
      }
    }

    function populateContactDropdownOptions(contacts) {
      const select = document.getElementById('contact-directory-select');
      if (!select || !contacts || contacts.length === 0) return;
      let optionsHtml = \`
        <option value="none">-- Click dropdown to select contact --</option>
        <option value="hr">👤 Priya Nair (Lead HR Manager · C003)</option>
        <option value="buddy">🤝 Dhruv Agarwal (Onboarding Buddy · C019)</option>
        <option value="it">🛠️ Rahul Mehta (IT Helpdesk · C001)</option>
        <option value="all">👥 Show All Key Direct Contacts</option>
      \`;
      contacts.forEach(c => {
        if (!['C001', 'C003', 'C019'].includes(c.contactId)) {
          optionsHtml += \`<option value="\${c.contactId}">📞 \${c.name} (\${c.role} · \${c.team})</option>\`;
        }
      });
      select.innerHTML = optionsHtml;
    }`;

  if (content.includes(stateSearch)) {
    content = content.replace(stateSearch, stateReplacement);
    console.log(`Injected state variables into ${path.basename(filePath)}`);
  }

  // 2. Replace detectRoleFromEmail, handleEmailInput, handleMemberSignIn
  const roleDetectionStart = "    // Step 3 Real-time Role Detection Logic\n    function detectRoleFromEmail(email) {";
  const roleDetectionEnd = "    // Step 4A Submit Action: Route based on automatically detected role\n    function handleMemberSignIn() {";
  
  // Let's find handleMemberSignIn block
  const signInRegex = /function handleMemberSignIn\(\)\s*\{[\s\S]*?renderManualDashboard\(detection\.user\);[\s\S]*?goToStep\('step-admin-portal'\);\s*\}\s*\}/;

  const newRoleDetectionAndSignIn = `// Step 3 Real-time Role Detection Logic
    function detectRoleFromEmail(email) {
      const em = email.toLowerCase().trim();

      // Check live dataset employees first
      const datasetEmp = allEmployeesDataset.find(e => 
        e.email.toLowerCase() === em || 
        e.employeeId.toLowerCase() === em ||
        (em.includes('aarav') && e.employeeId === 'E001') ||
        (em.includes('diya') && e.employeeId === 'E002') ||
        (em.includes('rohan.kapoor') && e.employeeId === 'E003') ||
        (em.includes('ananya') && e.employeeId === 'E004') ||
        (em.includes('meera') && e.employeeId === 'E006')
      );
      if (datasetEmp) {
        return {
          role: 'joiner',
          user: datasetEmp,
          employeeId: datasetEmp.employeeId,
          title: datasetEmp.role,
          desc: \`Identified: \${datasetEmp.name} (\${datasetEmp.role}) · \${datasetEmp.department} (\${datasetEmp.employeeId})\`
        };
      }

      // Check HR from dataset or contacts
      if (em === 'hr@demo-company.com' || em.includes('priya.nair') || em.includes('c003')) {
        return {
          role: 'hr',
          user: { name: 'Priya Nair', title: 'HR Manager', email: 'hr@demo-company.com' },
          employeeId: 'C003',
          title: 'HR Partner',
          desc: 'Identified: Priya Nair (HR Manager · C003) · People Operations'
        };
      }

      // Check Buddy from dataset or contacts
      if (em === 'buddy@demo-company.com' || em.includes('dhruv.agarwal') || em.includes('c019')) {
        return {
          role: 'buddy',
          user: { name: 'Dhruv Agarwal', title: 'Onboarding Buddy', email: 'buddy@demo-company.com' },
          employeeId: 'C019',
          title: 'Onboarding Buddy',
          desc: 'Identified: Dhruv Agarwal (Onboarding Buddy · C019) · Assigned Mentor'
        };
      }

      // Fallback to Microsoft directory
      const newJoiner = microsoftDirectory.newJoiners.find(u => u.email.toLowerCase() === em);
      if (newJoiner) {
        return { role: 'joiner', user: newJoiner, employeeId: 'E001', title: 'New Joiner', desc: \`Identified: \${newJoiner.name} (\${newJoiner.title}) · Class of 2026\` };
      }

      const hrMember = microsoftDirectory.hr.find(u => u.email.toLowerCase() === em);
      if (hrMember) {
        return { role: 'hr', user: hrMember, employeeId: 'C003', title: 'HR Partner', desc: \`Identified: \${hrMember.name} (\${hrMember.title}) · People Operations\` };
      }

      const buddyMember = microsoftDirectory.previousMembers.find(u => u.email.toLowerCase() === em);
      if (buddyMember) {
        return { role: 'buddy', user: buddyMember, employeeId: 'C019', title: 'Previous Member & Buddy Mentor', desc: \`Identified: \${buddyMember.name} (Class of \${buddyMember.batch}) · Assigned Mentor\` };
      }

      const adminMember = microsoftDirectory.admin.find(u => u.email.toLowerCase() === em);
      if (adminMember || em.includes('admin')) {
        return { role: 'admin', user: adminMember || { name: 'Systems Admin', email: em }, title: 'Systems Administrator', desc: \`Identified: Systems Administrator · Tenant Security & Azure AD\` };
      }

      // Generic heuristic
      if (em.includes('hr')) {
        return { role: 'hr', user: { name: 'People Partner', email: em, title: 'HR Partner' }, employeeId: 'C003', title: 'HR Partner', desc: 'Identified: People Operations Partner' };
      }
      if (em.includes('buddy') || em.includes('mentor')) {
        return { role: 'buddy', user: { name: 'Senior Mentor', email: em, title: 'Buddy Mentor' }, employeeId: 'C019', title: 'Previous Member & Buddy', desc: 'Identified: Peer Mentor' };
      }

      return { role: 'joiner', user: { name: em.split('@')[0].replace('.', ' '), email: em, title: 'New Joiner' }, employeeId: 'E001', title: 'New Joiner', desc: 'Identified: New Joiner · Day 1 Onboarding Track' };
    }

    function handleEmailInput(email) {
      const em = (email || '').toLowerCase().trim();
      const badge = document.getElementById('signin-detected-badge');
      const title = document.getElementById('detected-role-title');
      const desc = document.getElementById('detected-role-desc');
      const btnText = document.getElementById('signin-btn-text');

      if (!em) {
        if (badge) badge.className = 'role-detect-badge prompt';
        const span = badge ? badge.querySelector('span') : null;
        if (span) span.textContent = 'help';
        if (title) title.textContent = 'Enter Corporate Credentials';
        if (desc) desc.textContent = 'Type your work email above to automatically detect your role.';
        if (btnText) btnText.textContent = 'Sign In to Workspace';
        return;
      }

      const detection = detectRoleFromEmail(email);
      detectedRoleKey = detection.role;
      currentAuthenticatedUser = detection.user;

      if (badge) badge.className = \`role-detect-badge \${detection.role}\`;

      if (detection.role === 'joiner') {
        if (badge && badge.querySelector('span')) badge.querySelector('span').textContent = '🟢';
        if (title) title.textContent = \`Detected Role: \${detection.title}\`;
        if (desc) desc.textContent = \`\${detection.desc} · Routes to 70/30 Onboarding Workspace & AI Copilot\`;
        if (btnText) btnText.textContent = 'Sign In to Workspace & AI Copilot →';
      } else if (detection.role === 'hr') {
        if (badge && badge.querySelector('span')) badge.querySelector('span').textContent = '🔵';
        if (title) title.textContent = \`Detected Role: \${detection.title}\`;
        if (desc) desc.textContent = \`\${detection.desc} · Routes to HR Command & Task Management\`;
        if (btnText) btnText.textContent = 'Sign In to HR Command →';
      } else if (detection.role === 'buddy') {
        if (badge && badge.querySelector('span')) badge.querySelector('span').textContent = '🟣';
        if (title) title.textContent = \`Detected Role: \${detection.title}\`;
        if (desc) desc.textContent = \`\${detection.desc} · Routes to Buddy Mentorship Portal\`;
        if (btnText) btnText.textContent = 'Sign In to Buddy Dashboard →';
      } else if (detection.role === 'admin') {
        if (badge && badge.querySelector('span')) badge.querySelector('span').textContent = '🔴';
        if (title) title.textContent = \`Detected Role: \${detection.title}\`;
        if (desc) desc.textContent = \`\${detection.desc} · Routes to Systems Administration\`;
        if (btnText) btnText.textContent = 'Sign In to Admin Portal →';
      }
    }

    // Step 3 Submit Action: Route based on automatically detected role
    async function handleMemberSignIn() {
      const emailInput = document.getElementById('signin-email');
      const passwordInput = document.getElementById('signin-password');
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (!email) {
        showNotification('⚠️ Please enter your corporate work email.');
        if (emailInput) emailInput.focus();
        return;
      }
      if (!password) {
        showNotification('⚠️ Please enter your password to authenticate.');
        if (passwordInput) passwordInput.focus();
        return;
      }

      const detection = detectRoleFromEmail(email);
      currentAuthenticatedUser = detection.user;
      detectedRoleKey = detection.role;

      showNotification(\`Authenticated as \${detection.user.name} (\${detection.title})\`);

      if (detection.role === 'joiner') {
        currentLiveEmployeeId = detection.employeeId || 'E001';
        await loadLiveEmployeeDashboard(currentLiveEmployeeId);
        initJoinerChatbot(currentLiveDashboard?.employee || detection.user);
        goToStep('step-joiner-chatbot');
      } else if (detection.role === 'hr') {
        await renderLiveHRPortal(detection.user);
        goToStep('step-hr-portal');
      } else if (detection.role === 'buddy') {
        renderBuddyPortal(detection.user);
        goToStep('step-buddy-portal');
      } else if (detection.role === 'admin') {
        goToStep('step-admin-portal');
      }
    }`;

  const oldDetectStart = content.indexOf('    // Step 3 Real-time Role Detection Logic');
  const oldSignInEnd = content.indexOf('    // ==============================================================\n    // STEP 4A: RENDER 70% MANUAL DASHBOARD');
  
  if (oldDetectStart !== -1 && oldSignInEnd !== -1) {
    content = content.slice(0, oldDetectStart) + newRoleDetectionAndSignIn + '\n\n' + content.slice(oldSignInEnd);
    console.log(`Replaced role detection & signin in ${path.basename(filePath)}`);
  }

  // 3. Replace renderManualDashboard with live dashboard loader & renderer
  const dashboardStart = content.indexOf('    // ==============================================================\n    // STEP 4A: RENDER 70% MANUAL DASHBOARD');
  const dashboardEnd = content.indexOf('    // ==============================================================\n    // CONTACTS DROPDOWN CONTROLLER');

  const newDashboardBlock = `// ==============================================================
    // STEP 4A: RENDER 70% MANUAL DASHBOARD (HERO, CONTACTS, TASKS, BREAKDOWNS)
    // ==============================================================
    async function loadLiveEmployeeDashboard(empId) {
      currentLiveEmployeeId = empId || currentLiveEmployeeId || 'E001';
      try {
        const base = getApiBaseUrl();
        const res = await fetch(\`\${base}/api/employees/\${currentLiveEmployeeId}/dashboard\`);
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        const data = await res.json();
        currentLiveDashboard = data;
        liveTasksList = data.tasks || [];
        renderManualDashboardFromLive(data);
      } catch (err) {
        console.error('Failed to load live employee dashboard:', err);
        renderManualDashboard(currentAuthenticatedUser);
      }
    }

    function renderManualDashboard(user) {
      if (currentLiveDashboard) {
        renderManualDashboardFromLive(currentLiveDashboard);
        return;
      }
      if (!user) user = { name: 'Aarav Sharma', title: 'Software Engineer', email: 'aarav.sharma@demo-company.com' };

      document.getElementById('manual-user-name').textContent = user.name;
      document.getElementById('manual-user-role').textContent = user.title || 'Software Engineer';
      document.getElementById('manual-user-email').textContent = user.email || 'aarav.sharma@demo-company.com';
      document.getElementById('copilot-context-user').textContent = user.name;

      const totalCount = dailyTasksState.length;
      const completedCount = dailyTasksState.filter(t => t.done).length;
      const pendingCount = totalCount - completedCount;
      const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      document.getElementById('manual-progress-pct').textContent = \`\${pct}%\`;
      document.getElementById('manual-tasks-stat').textContent = \`\${completedCount} of \${totalCount} Tasks Cleared (\${pct}%)\`;
      document.getElementById('manual-linear-bar').style.width = \`\${pct}%\`;

      const circumference = 238.76;
      const offset = circumference - (pct / 100) * circumference;
      const circleEl = document.getElementById('manual-progress-circle');
      if (circleEl) circleEl.style.strokeDashoffset = offset;

      document.getElementById('count-all-tasks').textContent = totalCount;
      document.getElementById('count-pending-tasks').textContent = pendingCount;
      document.getElementById('count-done-tasks').textContent = completedCount;
    }

    function renderManualDashboardFromLive(data) {
      if (!data || !data.employee) return;
      const emp = data.employee;
      const metrics = data.metrics || { totalTasks: data.tasks.length, completedTasks: 0, pendingTasks: data.tasks.length, percentage: 0 };
      const tasks = data.tasks || [];

      // Hero Header
      const nameEl = document.getElementById('manual-user-name');
      const roleEl = document.getElementById('manual-user-role');
      const emailEl = document.getElementById('manual-user-email');
      const campusEl = document.getElementById('manual-user-campus');
      const copilotUserEl = document.getElementById('copilot-context-user');

      if (nameEl) nameEl.textContent = emp.name;
      if (roleEl) roleEl.textContent = \`\${emp.role} (\${emp.employeeId})\`;
      if (emailEl) emailEl.textContent = emp.email;
      if (campusEl) campusEl.textContent = \`\${emp.department} Department · \${emp.location} Office · Joined: \${emp.joiningDate}\`;
      if (copilotUserEl) copilotUserEl.textContent = emp.name;

      // Telemetry
      const pct = metrics.percentage;
      const pctEl = document.getElementById('manual-progress-pct');
      const statEl = document.getElementById('manual-tasks-stat');
      const barEl = document.getElementById('manual-linear-bar');
      const circleEl = document.getElementById('manual-progress-circle');

      if (pctEl) pctEl.textContent = \`\${pct}%\`;
      if (statEl) statEl.textContent = \`\${metrics.completedTasks} of \${metrics.totalTasks} Tasks Cleared (\${pct}%)\`;
      if (barEl) barEl.style.width = \`\${pct}%\`;

      const circumference = 238.76;
      const offset = circumference - (pct / 100) * circumference;
      if (circleEl) circleEl.style.strokeDashoffset = offset;

      // Filter Counts
      const countAll = document.getElementById('count-all-tasks');
      const countPending = document.getElementById('count-pending-tasks');
      const countDone = document.getElementById('count-done-tasks');

      if (countAll) countAll.textContent = metrics.totalTasks;
      if (countPending) countPending.textContent = metrics.pendingTasks;
      if (countDone) countDone.textContent = metrics.completedTasks;

      // Render Checklist
      const container = document.getElementById('manual-checklist-container');
      if (container) {
        container.innerHTML = '';
        if (tasks.length === 0) {
          container.innerHTML = \`
            <div style="padding: 24px; text-align: center; color: var(--color-slate-500); background: var(--color-slate-50); border-radius: var(--radius-md);">
              No onboarding tasks assigned for this role.
            </div>
          \`;
        } else {
          tasks.forEach(t => {
            const isDone = t.status === 'Completed';
            const card = document.createElement('div');
            card.className = \`manual-task-card \${isDone ? 'is-done' : ''}\`;
            card.id = \`manual-task-card-\${t.taskId}\`;
            card.dataset.status = isDone ? 'done' : 'pending';

            const priorityColor = t.priority === 'High' ? '#dc2626' : (t.priority === 'Medium' ? '#2563eb' : '#64748b');
            const priorityBg = t.priority === 'High' ? '#fee2e2' : (t.priority === 'Medium' ? '#dbeafe' : '#f1f5f9');
            
            let resourceHtml = '';
            if (t.resource) {
              resourceHtml = \`
                <div style="margin-top: 8px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 4px 10px; border-radius: 6px; color: #166534;">
                  <span style="font-size: 14px;">📄</span>
                  <a href="\${t.resource.link}" target="_blank" style="color: #15803d; text-decoration: underline; font-weight: 700;">\${t.resource.resourceName}</a>
                  <span style="color: #65a30d; font-size: 0.72rem;">(\${t.resource.resourceType || t.resource.category})</span>
                </div>
              \`;
            }

            const mandatoryHtml = t.isMandatory ? \`
              <span style="font-size: 0.7rem; font-weight: 800; color: #b91c1c; background: #fee2e2; padding: 2px 7px; border-radius: 4px; text-transform: uppercase;">
                ★ Mandatory
              </span>
            \` : '';

            card.innerHTML = \`
              <button class="manual-task-check-btn" onclick="toggleLiveTask('\${t.progressId}', '\${t.status}', '\${t.taskId}')" title="\${isDone ? 'Mark as Pending' : 'Mark as Complete'}">
                \${isDone ? '✓' : ''}
              </button>
              <div class="manual-task-info">
                <div class="manual-task-badges" style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                  <span class="manual-task-tag tag-engineering" style="background: #e0e7ff; color: #3730a3; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">\${t.department || 'General'}</span>
                  <span style="background: #f1f5f9; color: #334155; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">📅 \${t.day}</span>
                  <span style="background: \${priorityBg}; color: \${priorityColor}; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">\${t.priority} Priority</span>
                  \${mandatoryHtml}
                  <span style="font-size: 0.72rem; font-weight: 700; color: \${isDone ? '#059669' : '#d97706'};">
                    \${isDone ? '● Completed' : '● Action Required'}
                  </span>
                </div>
                <div class="manual-task-title" style="font-size: 1rem; font-weight: 800; margin-top: 6px; color: var(--color-slate-900);">\${t.taskName}</div>
                <div class="manual-task-desc" style="font-size: 0.82rem; color: var(--color-slate-600); margin-top: 4px;">
                  \${t.description || (t.taskName + ' - Scheduled for ' + t.day + ' under ' + t.department + ' onboarding track.')}
                </div>
                \${resourceHtml}
              </div>
              <div class="manual-task-actions">
                <button class="btn-task-toggle \${isDone ? 'done-state' : 'pending-state'}" onclick="toggleLiveTask('\${t.progressId}', '\${t.status}', '\${t.taskId}')">
                  \${isDone ? '✓ Completed' : 'Mark Complete'}
                </button>
                <button class="btn-task-explain" onclick="askCopilotToExplainTask('\${t.taskId}')" title="Ask AI Copilot for step-by-step guidance">
                  <span>💡 Ask AI Copilot</span>
                </button>
              </div>
            \`;
            container.appendChild(card);
          });
        }
      }

      // Update Key Contact Cards
      updateLiveContactCards(emp);

      // Update Copilot Quick Chips
      updateLiveCopilotChips(tasks);
    }

    function updateLiveContactCards(emp) {
      // HR Partner (Priya Nair - C003)
      const hrCard = document.getElementById('contact-card-hr');
      if (hrCard) {
        const nameEl = hrCard.querySelector('.contact-name');
        const titleEl = hrCard.querySelector('.contact-title');
        const phoneEl = hrCard.querySelector('.phone-display-btn strong');
        if (nameEl) nameEl.textContent = 'Priya Nair';
        if (titleEl) titleEl.textContent = 'HR Manager · HR policies, benefits & queries (C003)';
        if (phoneEl) phoneEl.textContent = '+91 80 6789 89912';
      }

      // Buddy Mentor (Dhruv Agarwal - C019 or assigned buddy)
      const buddy = emp.buddy || { name: 'Dhruv Agarwal', role: 'Onboarding Buddy', phone: '+91 80 6789 89928', email: 'buddy@demo-company.com' };
      const buddyCard = document.getElementById('contact-card-buddy');
      if (buddyCard) {
        const nameEl = buddyCard.querySelector('.contact-name');
        const titleEl = buddyCard.querySelector('.contact-title');
        const phoneEl = buddyCard.querySelector('.phone-display-btn strong');
        if (nameEl) nameEl.textContent = buddy.name;
        if (titleEl) titleEl.textContent = \`\${buddy.role} · First-week guidance\`;
        if (phoneEl) phoneEl.textContent = buddy.phone;
      }

      // IT Helpdesk (Rahul Mehta - C001)
      const itCard = document.getElementById('contact-card-it');
      if (itCard) {
        const nameEl = itCard.querySelector('.contact-name');
        const titleEl = itCard.querySelector('.contact-title');
        const phoneEl = itCard.querySelector('.phone-display-btn strong');
        if (nameEl) nameEl.textContent = 'Rahul Mehta';
        if (titleEl) titleEl.textContent = 'IT Helpdesk · Laptop, account & software issues (C001)';
        if (phoneEl) phoneEl.textContent = '+91 80 6789 89910';
      }
    }

    async function toggleLiveTask(progressId, currentStatus, taskId) {
      const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
      try {
        const base = getApiBaseUrl();
        const res = await fetch(\`\${base}/api/progress/\${progressId}\`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });
        if (res.ok) {
          showNotification(\`✓ \${taskId}: Status updated to \${nextStatus}!\`);
          await loadLiveEmployeeDashboard(currentLiveEmployeeId);
        } else {
          showNotification(\`⚠️ Failed to update task status: \${res.statusText}\`);
        }
      } catch (err) {
        console.error('Error toggling live task:', err);
        showNotification('⚠️ Server network error updating task.');
      }
    }

    function updateLiveCopilotChips(tasks) {
      const container = document.getElementById('copilot-chips-container');
      if (!container) return;

      let chipsHtml = \`
        <button class="copilot-chip" onclick="handleChatOption('contacts')">📞 Contacts</button>
        <button class="copilot-chip" onclick="handleChatOption('checklist')">📋 Day 1 Tasks</button>
      \`;

      (tasks || []).slice(0, 5).forEach(task => {
        const shortTitle = (task.taskName || task.title).split(' ').slice(0, 3).join(' ');
        chipsHtml += \`<button class="copilot-chip" onclick="askCopilotToExplainTask('\${task.taskId || task.id}')">💡 \${task.taskId || 'T'}: \${shortTitle}</button>\`;
      });

      chipsHtml += \`<button class="copilot-chip" onclick="handleChatOption('stuck')">🚨 I'm Stuck</button>\`;
      container.innerHTML = chipsHtml;
    }`;

  if (dashboardStart !== -1 && dashboardEnd !== -1) {
    content = content.slice(0, dashboardStart) + newDashboardBlock + '\n\n' + content.slice(dashboardEnd);
    console.log(`Replaced renderManualDashboard in ${path.basename(filePath)}`);
  }

  // 4. Update explainTaskById and sendChatMessage
  const chatStart = content.indexOf('    // Explain Task in Chat Feed\n    function explainTaskById(taskId) {');
  const chatEnd = content.indexOf('    // ==============================================================\n    // STEP 4B: HR COHORT PORTAL & FRESHER TASK MANAGEMENT');

  const newChatBlock = `// Explain Task in Chat Feed
    function askCopilotToExplainTask(taskId) {
      explainTaskById(taskId);
      const panel = document.querySelector('.joiner-chat-panel');
      if (panel) {
        panel.style.boxShadow = '0 0 35px rgba(99, 102, 241, 0.6)';
        setTimeout(() => { panel.style.boxShadow = ''; }, 1200);
      }
    }

    function explainTaskById(taskId) {
      let task = null;
      if (currentLiveDashboard && currentLiveDashboard.tasks) {
        task = currentLiveDashboard.tasks.find(t => String(t.taskId) === String(taskId) || String(t.id) === String(taskId));
      }
      if (!task) {
        task = dailyTasksState.find(t => String(t.id) === String(taskId)) || dailyTasksState[0] || { taskName: 'Task #' + taskId, day: 'Day 1', priority: 'High' };
      }

      const tName = task.taskName || task.title;
      appendChatBubble('user', \`Can you explain Task \${task.taskId || task.id}: "\${tName}"?\`);

      let resourceNote = '';
      if (task.resource) {
        resourceNote = \`
          <div style="margin-top: 8px; font-size: 0.78rem; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); padding: 8px 12px; border-radius: 6px;">
            📄 <strong>Linked Resource:</strong> <a href="\${task.resource.link}" target="_blank" style="color: #34d399; font-weight: 700; text-decoration: underline;">\${task.resource.resourceName}</a><br>
            <span style="font-size: 0.72rem; color: #cbd5e1;">\${task.resource.description || 'Access documentation directly at ' + task.resource.link}</span>
          </div>
        \`;
      }

      const explainHtml = \`
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 0.72rem; font-weight: 800; background: rgba(99, 102, 241, 0.2); color: #c7d2fe; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
              \${task.department || 'Task'} Guidance · \${task.day || 'Day 1'}
            </span>
            <span style="font-size: 0.75rem; color: #94a3b8; font-family: var(--font-mono);">\${task.priority || 'High'} Priority</span>
          </div>

          <h4 style="font-size: 1.02rem; font-weight: 800; color: #f8fafc; margin-bottom: 8px;">
            \${tName}
          </h4>

          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; font-size: 0.82rem; color: #e2e8f0;">
            🎯 <strong>Objective:</strong> Complete statutory requirements and setup for \${task.department || 'your role'}.
          </div>

          \${resourceNote}

          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button class="copilot-chip" style="background: #4f46e5; color: #fff; padding: 6px 14px;" onclick="toggleLiveTask('\${task.progressId || ('P_' + task.taskId)}', '\${task.status || 'Pending'}', '\${task.taskId || task.id}')">
              \${task.status === 'Completed' ? '✓ Task is Completed' : '✓ Mark as Completed'}
            </button>
            <button class="copilot-chip" style="background: rgba(255,255,255,0.1); color: #cbd5e1;" onclick="handleChatOption('contacts')">
              📞 Contact Helper
            </button>
          </div>
        </div>
      \`;

      setTimeout(() => {
        appendChatBubble('assistant', explainHtml);
      }, 250);
    }

    // Handle Quick Options in Chat
    function handleChatOption(optionKey) {
      if (optionKey === 'contacts') {
        appendChatBubble('user', 'Show me all my team and HR contact numbers.');
        const contactsHtml = \`
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #f8fafc; margin-bottom: 8px;">
              📞 Direct Team & Support Contact Numbers
            </div>
            <div style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.55; display: flex; flex-direction: column; gap: 8px;">
              <div style="background: rgba(37, 99, 235, 0.15); border: 1px solid rgba(37, 99, 235, 0.35); padding: 8px 12px; border-radius: 8px;">
                <strong>HR Partner: Priya Nair (HR Manager · C003)</strong><br>
                📞 Direct Phone: <a href="tel:+9180678989912" style="color: #60a5fa; font-weight: 700;">+91 80 6789 89912</a><br>
                📧 hr@demo-company.com · Escalation: Meera Rao (Operations Manager)
              </div>
              <div style="background: rgba(147, 51, 234, 0.15); border: 1px solid rgba(147, 51, 234, 0.35); padding: 8px 12px; border-radius: 8px;">
                <strong>Onboarding Buddy: Dhruv Agarwal (C019)</strong><br>
                📞 Buddy Phone: <a href="tel:+9180678989928" style="color: #c084fc; font-weight: 700;">+91 80 6789 89928</a><br>
                📧 buddy@demo-company.com · Availability: Mon-Fri, 10AM-6PM
              </div>
              <div style="background: rgba(5, 150, 105, 0.15); border: 1px solid rgba(5, 150, 105, 0.35); padding: 8px 12px; border-radius: 8px;">
                <strong>IT Helpdesk Hotline: Rahul Mehta (C001)</strong><br>
                📞 Direct Phone: <a href="tel:+9180678989910" style="color: #34d399; font-weight: 700;">+91 80 6789 89910</a><br>
                📧 it@demo-company.com · Escalates to Vikram Shah (IT Manager)
              </div>
            </div>
          </div>
        \`;
        setTimeout(() => appendChatBubble('assistant', contactsHtml), 250);

      } else if (optionKey === 'checklist') {
        appendChatBubble('user', "Show my Today's Work and Day 1 checklist.");
        const tasks = currentLiveDashboard?.tasks || [];
        const day1Tasks = tasks.filter(t => t.day === 'Day 1');
        const doneCount = day1Tasks.filter(t => t.status === 'Completed').length;
        const total = day1Tasks.length;
        const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

        let listHtml = \`
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-weight: 800; color: #f8fafc;">Day 1 Checklist (\${doneCount}/\${total} Done · \${pct}%)</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.82rem;">
        \`;

        day1Tasks.forEach(t => {
          const isDone = t.status === 'Completed';
          listHtml += \`
            <div style="background: rgba(255,255,255,0.06); padding: 8px 10px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span style="color: \${isDone ? '#94a3b8' : '#f8fafc'}; text-decoration: \${isDone ? 'line-through' : 'none'};">
                \${isDone ? '✅' : '⬜'} \${t.taskName || t.title}
              </span>
              <button class="copilot-chip" style="padding: 2px 8px; font-size: 0.7rem;" onclick="askCopilotToExplainTask('\${t.taskId || t.id}')">Explain</button>
            </div>
          \`;
        });

        listHtml += \`</div></div>\`;
        setTimeout(() => appendChatBubble('assistant', listHtml), 250);

      } else if (optionKey === 'stuck') {
        appendChatBubble('user', "I'm stuck on one of my setup tasks. What should I do?");
        const stuckHtml = \`
          <div>
            <div style="font-weight: 800; color: #f87171; margin-bottom: 6px;">
              🚨 Onboarding Dependency Troubleshooting
            </div>
            <p style="font-size: 0.82rem; color: #cbd5e1; margin-bottom: 8px;">
              If your <strong>Corporate Account, MFA or IT Access</strong> is blocked:
            </p>
            <ul style="font-size: 0.8rem; color: #e2e8f0; padding-left: 18px; margin-bottom: 10px;">
              <li>Call IT Helpdesk Lead Rahul Mehta directly at <strong>+91 80 6789 89910</strong>.</li>
              <li>You can proceed with offline reading tasks like the Employee Handbook (/resources/employee-handbook).</li>
              <li>Your buddy Dhruv Agarwal will verify your access during your 1:1 briefing.</li>
            </ul>
          </div>
        \`;
        setTimeout(() => appendChatBubble('assistant', stuckHtml), 250);
      }
    }

    // Send Free-Form Chat Message to NVIDIA NIM / Grounded Dataset
    async function sendChatMessage() {
      const input = document.getElementById('chatbot-input');
      const query = input.value.trim();
      if (!query) return;

      appendChatBubble('user', query);
      input.value = '';

      const sendBtn = document.getElementById('chatbot-send-btn');
      if (sendBtn) sendBtn.disabled = true;

      const lower = query.toLowerCase();
      const currentEmp = currentLiveDashboard?.employee || { name: 'Aarav Sharma', role: 'Software Engineer', buddy: { name: 'Dhruv Agarwal', phone: '+91 80 6789 89928', email: 'buddy@demo-company.com' } };
      const tasks = currentLiveDashboard?.tasks || [];
      const metrics = currentLiveDashboard?.metrics || { percentage: 10, completedTasks: 2, totalTasks: 20 };

      // 1. "What do I need to complete today?"
      if (lower.includes('today') || lower.includes('complete today') || lower.includes('day 1 tasks') || lower.includes('my tasks')) {
        const day1Tasks = tasks.filter(t => t.day === 'Day 1');
        const pendingDay1 = day1Tasks.filter(t => t.status !== 'Completed');
        let answerHtml = \`
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #f8fafc; margin-bottom: 6px;">
              📋 Today's Priority Action Items (\${pendingDay1.length} pending of \${day1Tasks.length} Day 1 tasks):
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.82rem;">
        \`;
        day1Tasks.forEach(t => {
          const isDone = t.status === 'Completed';
          answerHtml += \`
            <div style="background: rgba(255,255,255,0.07); padding: 8px 10px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span style="color: \${isDone ? '#94a3b8' : '#f8fafc'}; text-decoration: \${isDone ? 'line-through' : 'none'};">
                \${isDone ? '✅' : '⬜'} <strong>\${t.taskId}</strong>: \${t.taskName} <span style="font-size: 0.72rem; color: \${t.priority==='High'?'#f87171':'#38bdf8'}; font-weight: 700;">(\${t.priority})</span>
              </span>
              <button class="copilot-chip" style="padding: 2px 8px; font-size: 0.7rem;" onclick="toggleLiveTask('\${t.progressId}', '\${t.status}', '\${t.taskId}')">
                \${isDone ? 'Reopen' : 'Complete'}
              </button>
            </div>
          \`;
        });
        answerHtml += \`</div></div>\`;
        setTimeout(() => {
          appendChatBubble('assistant', answerHtml);
          if (sendBtn) sendBtn.disabled = false;
        }, 250);
        return;
      }

      // 2. "Who is my onboarding buddy?"
      if (lower.includes('buddy') || lower.includes('onboarding buddy') || lower.includes('mentor')) {
        const buddy = currentEmp.buddy || { name: 'Dhruv Agarwal', phone: '+91 80 6789 89928', email: 'buddy@demo-company.com', role: 'Onboarding Buddy', availability: 'Mon-Fri, 10AM-6PM' };
        const buddyHtml = \`
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #c084fc; margin-bottom: 6px;">
              🤝 Your Assigned Onboarding Buddy
            </div>
            <div style="background: rgba(147, 51, 234, 0.15); border: 1px solid rgba(147, 51, 234, 0.35); padding: 10px 14px; border-radius: 8px; font-size: 0.84rem; line-height: 1.55;">
              <div style="font-size: 1rem; font-weight: 800; color: #f8fafc;">\${buddy.name}</div>
              <div style="color: #cbd5e1; font-size: 0.78rem;">Role: \${buddy.role || 'Onboarding Buddy'} (Employee Support)</div>
              <div style="margin-top: 6px;">
                📞 <strong>Direct Phone:</strong> <a href="tel:\${buddy.phone}" style="color: #c084fc; font-weight: 700;">\${buddy.phone}</a><br>
                📧 <strong>Email:</strong> <a href="mailto:\${buddy.email}" style="color: #e2e8f0;">\${buddy.email}</a><br>
                ⏱️ <strong>Availability:</strong> \${buddy.availability || 'Mon-Fri, 10AM-6PM'}<br>
                🎯 <strong>Purpose:</strong> General first-week guidance, culture orientation & buddy sync.
              </div>
            </div>
          </div>
        \`;
        setTimeout(() => {
          appendChatBubble('assistant', buddyHtml);
          if (sendBtn) sendBtn.disabled = false;
        }, 250);
        return;
      }

      // 3. "Who should I contact for laptop problems?"
      if (lower.includes('laptop') || lower.includes('hardware') || lower.includes('computer') || lower.includes('software issue') || lower.includes('it problem')) {
        const itHtml = \`
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #34d399; margin-bottom: 6px;">
              🛠️ IT Hardware & Laptop Support
            </div>
            <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); padding: 10px 14px; border-radius: 8px; font-size: 0.84rem; line-height: 1.55;">
              <div style="font-size: 1rem; font-weight: 800; color: #f8fafc;">Rahul Mehta (IT Helpdesk · C001)</div>
              <div style="color: #cbd5e1; font-size: 0.78rem;">Purpose: Laptop, account, hardware and software issues</div>
              <div style="margin-top: 6px;">
                📞 <strong>Direct Phone:</strong> <a href="tel:+9180678989910" style="color: #34d399; font-weight: 700;">+91 80 6789 89910</a><br>
                📧 <strong>Email:</strong> <a href="mailto:it@demo-company.com" style="color: #e2e8f0;">it@demo-company.com</a><br>
                ⏱️ <strong>Availability:</strong> Mon-Fri, 9AM-6PM<br>
                🚨 <strong>Escalation Line:</strong> Vikram Shah (IT Manager · C002, it.manager@demo-company.com)
              </div>
            </div>
          </div>
        \`;
        setTimeout(() => {
          appendChatBubble('assistant', itHtml);
          if (sendBtn) sendBtn.disabled = false;
        }, 250);
        return;
      }

      // 4. "Where can I find the GitHub access guide?"
      if (lower.includes('github') || lower.includes('github access')) {
        const ghHtml = \`
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #38bdf8; margin-bottom: 6px;">
              🐙 GitHub Access Guide & Repository Setup
            </div>
            <div style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); padding: 10px 14px; border-radius: 8px; font-size: 0.84rem; line-height: 1.55;">
              <div style="font-size: 0.95rem; font-weight: 800; color: #f8fafc;">Resource R005: GitHub Access Guide</div>
              <div style="color: #cbd5e1; font-size: 0.78rem;">Category: IT / Engineering · Applicable to Engineering & Data roles</div>
              <div style="margin-top: 6px;">
                🔗 <strong>Direct Resource Link:</strong> <a href="/resources/github-access" target="_blank" style="color: #38bdf8; text-decoration: underline; font-weight: 700;">/resources/github-access</a><br>
                📝 <strong>Description:</strong> Instructions for requesting, authenticating MFA, and joining company repositories.<br>
                ✅ <strong>Related Task:</strong> Task T014: Set up GitHub access (Day 1, High Priority).
              </div>
            </div>
          </div>
        \`;
        setTimeout(() => {
          appendChatBubble('assistant', ghHtml);
          if (sendBtn) sendBtn.disabled = false;
        }, 250);
        return;
      }

      // 5. "What tasks are mandatory?"
      if (lower.includes('mandatory') || lower.includes('required')) {
        const mandTasks = tasks.filter(t => t.isMandatory || t.priority === 'High');
        let mandHtml = \`
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #f87171; margin-bottom: 6px;">
              ★ Mandatory Compliance & Security Tasks (\${mandTasks.length} Tasks)
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.82rem;">
        \`;
        mandTasks.slice(0, 7).forEach(t => {
          const isDone = t.status === 'Completed';
          mandHtml += \`
            <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 6px 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
              <span>\${isDone ? '✅' : '🔴'} <strong>\${t.taskId}</strong>: \${t.taskName} (\${t.day})</span>
              <span style="font-size: 0.7rem; font-weight: 700; color: \${isDone ? '#10b981' : '#f87171'};">\${t.status}</span>
            </div>
          \`;
        });
        mandHtml += \`</div></div>\`;
        setTimeout(() => {
          appendChatBubble('assistant', mandHtml);
          if (sendBtn) sendBtn.disabled = false;
        }, 250);
        return;
      }

      // 6. "What is my current onboarding progress?"
      if (lower.includes('progress') || lower.includes('how far') || lower.includes('status')) {
        const progHtml = \`
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #f8fafc; margin-bottom: 6px;">
              📊 Live Onboarding Progress Telemetry
            </div>
            <div style="background: rgba(255,255,255,0.08); padding: 12px; border-radius: 8px; font-size: 0.84rem; line-height: 1.6;">
              <div>Employee: <strong>\${currentEmp.name}</strong> (\${currentEmp.role})</div>
              <div>Cleared Tasks: <strong>\${metrics.completedTasks} of \${metrics.totalTasks}</strong></div>
              <div>Remaining Tasks: <strong>\${metrics.pendingTasks}</strong></div>
              <div style="margin-top: 8px; font-size: 1.1rem; font-weight: 800; color: #34d399;">
                Overall Readiness: \${metrics.percentage}%
              </div>
            </div>
          </div>
        \`;
        setTimeout(() => {
          appendChatBubble('assistant', progHtml);
          if (sendBtn) sendBtn.disabled = false;
        }, 250);
        return;
      }

      // Backend NVIDIA Copilot API call with grounding
      try {
        const base = getApiBaseUrl();
        const res = await fetch(\`\${base}/api/v1/ai/nvidia-copilot\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            employeeId: currentLiveEmployeeId,
            role: currentEmp.role,
            buddyName: currentEmp.buddy?.name || 'Dhruv Agarwal',
            hrName: 'Priya Nair'
          })
        });
        if (res.ok) {
          const data = await res.json();
          appendChatBubble('assistant', data.data?.answer || data.answer);
        } else {
          throw new Error('Backend AI offline');
        }
      } catch (err) {
        appendChatBubble('assistant', \`I am here to guide your onboarding as a \${currentEmp.role}. You currently have \${metrics.pendingTasks} pending tasks. Reach out to buddy \${currentEmp.buddy?.name || 'Dhruv Agarwal'} or HR Partner Priya Nair (+91 80 6789 89912) anytime!\`);
      } finally {
        if (sendBtn) sendBtn.disabled = false;
      }
    }`;

  if (chatStart !== -1 && chatEnd !== -1) {
    content = content.slice(0, chatStart) + newChatBlock + '\n\n' + content.slice(chatEnd);
    console.log(`Replaced explainTaskById & sendChatMessage in ${path.basename(filePath)}`);
  }

  // 5. Update renderHRPortal and handleAddNewTaskByHR
  const hrStart = content.indexOf('    // ==============================================================\n    // STEP 4B: HR COHORT PORTAL & FRESHER TASK MANAGEMENT');
  const hrEnd = content.indexOf('    // Step 4C: Buddy / Mentor Portal');

  const newHRBlock = `// ==============================================================
    // STEP 4B: HR COHORT PORTAL & FRESHER TASK MANAGEMENT (ADD & REMOVE)
    // ==============================================================
    async function renderLiveHRPortal(hrUser) {
      if (hrUser && document.getElementById('hr-portal-name')) {
        document.getElementById('hr-portal-name').textContent = hrUser.name || 'Priya Nair';
      }
      const tbody = document.getElementById('hr-cohort-roster-body');
      if (!tbody) return;

      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Loading live employee dataset...</td></tr>';

      try {
        const base = getApiBaseUrl();
        const res = await fetch(\`\${base}/api/employees\`);
        const data = await res.json();
        const employees = data.employees || [];

        tbody.innerHTML = '';
        employees.forEach((emp, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = \`
            <td style="padding: 12px 14px; border-bottom: 1px solid var(--color-slate-100); font-weight: 700; color: var(--color-slate-900);">
              \${emp.name}
              <div style="font-size: 0.72rem; color: var(--color-slate-500); font-weight: 500;">\${emp.role} (\${emp.employeeId})</div>
            </td>
            <td style="padding: 12px 14px; border-bottom: 1px solid var(--color-slate-100); font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-primary);">
              \${emp.email}
            </td>
            <td style="padding: 12px 14px; border-bottom: 1px solid var(--color-slate-100); color: var(--color-slate-600);">
              \${emp.department} · \${emp.location}
            </td>
            <td style="padding: 12px 14px; border-bottom: 1px solid var(--color-slate-100);">
              <strong style="color: #6b21a8;">Dhruv Agarwal</strong>
              <div style="font-size: 0.72rem; color: var(--color-slate-500);">+91 80 6789 89928</div>
            </td>
            <td style="padding: 12px 14px; border-bottom: 1px solid var(--color-slate-100);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 60px; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
                  <div style="width: \${emp.percentage}%; height: 100%; background: #10b981;"></div>
                </div>
                <span style="font-size: 0.75rem; font-weight: 700; color: #0f172a;">\${emp.percentage}%</span>
              </div>
              <div style="font-size: 0.7rem; color: #64748b;">\${emp.completedTasks}/\${emp.totalTasks} cleared</div>
            </td>
            <td style="padding: 12px 14px; border-bottom: 1px solid var(--color-slate-100);">
              <button class="persona-pill-btn" style="padding: 4px 10px; font-size: 0.75rem;" onclick="viewEmployeeFromHR('\${emp.employeeId}')">
                View Workspace →
              </button>
            </td>
          \`;
          tbody.appendChild(tr);
        });
      } catch (err) {
        console.error('Error rendering HR portal:', err);
      }

      renderHRTaskInventory();
      renderHRInbox();
    }

    function renderHRPortal(hrUser) {
      renderLiveHRPortal(hrUser);
    }

    async function viewEmployeeFromHR(employeeId) {
      currentLiveEmployeeId = employeeId;
      await loadLiveEmployeeDashboard(employeeId);
      goToStep('step-joiner-chatbot');
      showNotification(\`Viewing live dashboard for employee \${employeeId}\`);
    }

    // Render HR Task Inventory Table with 1-Click Remove
    function renderHRTaskInventory() {
      const tbody = document.getElementById('hr-task-inventory-body');
      if (!tbody) return;

      tbody.innerHTML = '';
      const tasksToShow = (currentLiveDashboard && currentLiveDashboard.tasks) ? currentLiveDashboard.tasks : dailyTasksState;

      if (tasksToShow.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="6" style="text-align: center; padding: 24px; color: var(--color-slate-500);">
              No active tasks in fresher checklist. Use the form below to add onboarding tasks.
            </td>
          </tr>
        \`;
        return;
      }

      tasksToShow.forEach(task => {
        const tr = document.createElement('tr');
        const tId = task.taskId || task.id;
        const tTitle = task.taskName || task.title;
        const isDone = task.status === 'Completed' || task.done;
        tr.innerHTML = \`
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-slate-500);">#\${tId}</td>
          <td>
            <span class="manual-task-tag tag-engineering">\${task.department || task.tag || 'Task'}</span>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--color-slate-900);">\${tTitle}</div>
            <div style="font-size: 0.75rem; color: var(--color-slate-500); margin-top: 2px;">\${task.description || task.desc || ''}</div>
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-slate-600);">\${task.duration || '20m'}</td>
          <td>
            <span style="font-size: 0.75rem; font-weight: 700; color: \${isDone ? '#059669' : '#d97706'};">
              \${isDone ? '● Completed' : '● In Progress'}
            </span>
          </td>
          <td style="text-align: right;">
            <button class="btn-remove-task" onclick="removeTaskByHR('\${tId}')" title="Remove task from fresher onboarding">
              🗑️ Remove Task
            </button>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function removeTaskByHR(taskId) {
      showNotification(\`Task #\${taskId} removed by HR Operations.\`);
    }

    async function handleAddNewTaskByHR(event) {
      if (event) event.preventDefault();
      const titleInput = document.getElementById('new-task-title');
      const catInput = document.getElementById('new-task-category');
      const durationInput = document.getElementById('new-task-duration');
      const descInput = document.getElementById('new-task-desc');

      const title = titleInput.value.trim();
      const category = catInput.value;
      const duration = durationInput ? durationInput.value.trim() : '20 mins';
      const desc = descInput ? descInput.value.trim() : '';

      if (!title) return;

      const applicableRole = category === 'Engineering' ? 'Software Engineer' : (category === 'Design' ? 'UI/UX Designer' : (category === 'Data' ? 'Data Analyst' : 'All'));

      try {
        const base = getApiBaseUrl();
        const res = await fetch(\`\${base}/api/tasks\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskName: title,
            applicableRole,
            department: category,
            day: 'Day 1',
            priority: 'High',
            assignedBy: 'HR Operations',
            description: desc || \`HR assigned task for \${category}\`
          })
        });

        if (res.ok) {
          showNotification(\`➕ Task created: "\${title}" and assigned across cohort!\`);
          titleInput.value = '';
          if (descInput) descInput.value = '';
          await renderLiveHRPortal();
          if (currentLiveEmployeeId) {
            await loadLiveEmployeeDashboard(currentLiveEmployeeId);
          }
        }
      } catch (err) {
        showNotification('⚠️ Server network error adding task.');
      }
    }

    function applyTaskPreset(type) {
      if (type === 'cloud') {
        document.getElementById('new-task-title').value = 'Configure Azure CLI & Dev Subscription Sandbox';
        document.getElementById('new-task-category').value = 'Engineering';
        document.getElementById('new-task-duration').value = '30 mins';
        document.getElementById('new-task-desc').value = 'Run az login, configure your developer subscription sandbox ID, and deploy your first hello-world microservice to the staging cluster.';
      } else if (type === 'security') {
        document.getElementById('new-task-title').value = 'Complete Zero-Trust Security & Data Handling Module';
        document.getElementById('new-task-category').value = 'Security';
        document.getElementById('new-task-duration').value = '25 mins';
        document.getElementById('new-task-desc').value = 'Review the Microsoft Confidential Information handling policy and complete the 5-question security quiz on Microsoft Learning.';
      } else if (type === 'culture') {
        document.getElementById('new-task-title').value = 'Schedule Coffee Chats with 2 Cross-Functional Teammates';
        document.getElementById('new-task-category').value = 'Mentoring';
        document.getElementById('new-task-duration').value = '20 mins';
        document.getElementById('new-task-desc').value = 'Reach out via Teams chat to introduce yourself and schedule 15-minute coffee chats with peer software engineers in your squad.';
      }
    }

    function onHRFresherTargetChange() {
      const select = document.getElementById('hr-target-fresher-select');
      showNotification(\`Viewing & managing checklist for: \${select.options[select.selectedIndex].text}\`);
      renderHRTaskInventory();
    }`;

  if (hrStart !== -1 && hrEnd !== -1) {
    content = content.slice(0, hrStart) + newHRBlock + '\n\n' + content.slice(hrEnd);
    console.log(`Replaced renderHRPortal in ${path.basename(filePath)}`);
  }

  // 6. Hook initDatasetLayer on DOMContentLoaded
  if (!content.includes('initDatasetLayer();')) {
    content = content.replace(
      "loadInAppMessages();",
      "loadInAppMessages();\n      initDatasetLayer();"
    );
    console.log(`Hooked initDatasetLayer into ${path.basename(filePath)}`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully updated ${filePath}`);
}
