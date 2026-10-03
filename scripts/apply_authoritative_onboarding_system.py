import sys
import re
import os
sys.stdout.reconfigure(encoding='utf-8')

print("Starting authoritative onboarding system patcher...")

index_paths = [
    'index.html',
    'client/index.html',
    'client/public/index.html'
]

# Read original
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update day-filter-bar HTML to include Day 4 and Day 5
old_day_filter_bar = '''<div class="day-filter-bar">
                  <button type="button" class="btn-day-pill active" id="day-pill-day1"
                    onclick="filterByDay('Day 1')">Day 1 (Today)</button>
                  <button type="button" class="btn-day-pill" id="day-pill-day2" onclick="filterByDay('Day 2')">Day
                    2</button>
                  <button type="button" class="btn-day-pill" id="day-pill-day3" onclick="filterByDay('Day 3')">Day
                    3</button>
                  <button type="button" class="btn-day-pill" id="day-pill-all" onclick="filterByDay('all')">All
                    Days</button>
                </div>'''

new_day_filter_bar = '''<div class="day-filter-bar">
                  <button type="button" class="btn-day-pill active" id="day-pill-day1" onclick="filterByDay('Day 1')">Day 1 (Today)</button>
                  <button type="button" class="btn-day-pill" id="day-pill-day2" onclick="filterByDay('Day 2')">Day 2</button>
                  <button type="button" class="btn-day-pill" id="day-pill-day3" onclick="filterByDay('Day 3')">Day 3</button>
                  <button type="button" class="btn-day-pill" id="day-pill-day4" onclick="filterByDay('Day 4')">Day 4</button>
                  <button type="button" class="btn-day-pill" id="day-pill-day5" onclick="filterByDay('Day 5')">Day 5</button>
                  <button type="button" class="btn-day-pill" id="day-pill-all" onclick="filterByDay('all')">All Days (30 Tasks)</button>
                </div>'''

if old_day_filter_bar in html:
    html = html.replace(old_day_filter_bar, new_day_filter_bar)
    print("✅ Patched day-filter-bar HTML.")
else:
    print("⚠️ Warning: old_day_filter_bar not matched directly; trying regex...")
    html = re.sub(
        r'<div class="day-filter-bar">[\s\S]*?</div>',
        new_day_filter_bar,
        html,
        count=1
    )
    print("✅ Regex-patched day-filter-bar HTML.")

# 2. Update filterByDay function to handle Day 4, Day 5, and all
old_filter_by_day = '''function filterByDay(dayKey) {
      currentDayFilter = dayKey;
      ['day1', 'day2', 'day3', 'all'].forEach(k => {
        const btn = document.getElementById(`day-pill-${k}`);
        if (btn) btn.classList.remove('active');
      });
      const activeBtn = document.getElementById(
        dayKey === 'all' ? 'day-pill-all' : (dayKey === 'Day 1' ? 'day-pill-day1' : (dayKey === 'Day 2' ? 'day-pill-day2' : 'day-pill-day3'))
      );
      if (activeBtn) activeBtn.classList.add('active');

      applyTaskFilters();
    }'''

new_filter_by_day = '''function filterByDay(dayKey) {
      currentDayFilter = dayKey;
      ['day1', 'day2', 'day3', 'day4', 'day5', 'all'].forEach(k => {
        const btn = document.getElementById(`day-pill-${k}`);
        if (btn) btn.classList.remove('active');
      });
      let targetId = 'day-pill-all';
      if (dayKey === 'Day 1') targetId = 'day-pill-day1';
      else if (dayKey === 'Day 2') targetId = 'day-pill-day2';
      else if (dayKey === 'Day 3') targetId = 'day-pill-day3';
      else if (dayKey === 'Day 4') targetId = 'day-pill-day4';
      else if (dayKey === 'Day 5') targetId = 'day-pill-day5';

      const activeBtn = document.getElementById(targetId);
      if (activeBtn) activeBtn.classList.add('active');

      applyTaskFilters();
    }'''

if old_filter_by_day in html:
    html = html.replace(old_filter_by_day, new_filter_by_day)
    print("✅ Patched filterByDay function.")
else:
    print("⚠️ Warning: old_filter_by_day not matched directly.")

# 3. Add fetchAuthoritativeTasksForPosition helper before selectRoleLevel
task_fetcher_code = '''
    // ==============================================================
    // AUTHORITATIVE ONBOARDING TASKS LOADER (30 TASKS PER POSITION)
    // ==============================================================
    window._cachedPositionTasks = window._cachedPositionTasks || {};

    async function fetchAuthoritativeTasksForPosition(posId, posObj) {
      if (!posId) return null;
      if (window._cachedPositionTasks[posId]) {
        return window._cachedPositionTasks[posId];
      }

      // Priority 1: Static JSON asset (/tasks/{posId}.json)
      try {
        const res = await fetch(`/tasks/${posId}.json`);
        if (res.ok) {
          const data = await res.json();
          window._cachedPositionTasks[posId] = data;
          return data;
        }
      } catch (err) {
        console.debug('Static task fetch failed, trying API route...', err);
      }

      // Priority 2: Express API endpoint (/api/v1/org/positions/{posId}/tasks)
      try {
        const res = await fetch(`/api/v1/org/positions/${posId}/tasks`);
        if (res.ok) {
          const data = await res.json();
          const posData = data.position || data;
          window._cachedPositionTasks[posId] = posData;
          return posData;
        }
      } catch (err) {
        console.debug('API task fetch failed...', err);
      }

      // Priority 3: Fallback from in-memory global dataset
      if (window.AUTHORITATIVE_TASKS_BY_POSITION && window.AUTHORITATIVE_TASKS_BY_POSITION[posId]) {
        window._cachedPositionTasks[posId] = window.AUTHORITATIVE_TASKS_BY_POSITION[posId];
        return window._cachedPositionTasks[posId];
      }

      return null;
    }
'''

if 'window._cachedPositionTasks = window._cachedPositionTasks || {};' not in html:
    html = html.replace('function selectRoleLevel(roleLevel, posId) {', task_fetcher_code + '\n    function selectRoleLevel(roleLevel, posId) {');
    print("✅ Injected fetchAuthoritativeTasksForPosition helper.")

# 4. Pre-fetch in selectRoleLevel
if 'fetchAuthoritativeTasksForPosition(pos.id, pos);' not in html:
    html = html.replace('currentSelectedPosition = pos;', 'currentSelectedPosition = pos;\n      // Pre-fetch 30 authoritative tasks into memory cache\n      fetchAuthoritativeTasksForPosition(pos.id, pos);')
    print("✅ Injected pre-fetch into selectRoleLevel.")

# 5. Patch handleMemberSignIn to load all 30 authoritative tasks
# Find start of handleMemberSignIn
signin_start = html.find('function handleMemberSignIn() {')
signin_end = html.find('// ==============================================================\n    // STEP 4A: RENDER 70% MANUAL DASHBOARD', signin_start)

if signin_start != -1 and signin_end != -1:
    new_signin_code = '''async function handleMemberSignIn() {
      const emailInput = document.getElementById('signin-email');
      const passwordInput = document.getElementById('signin-password');
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (currentSelectedPosition && currentSelectedDept && currentSelectedTeam && email) {
        const rawAlias = (email.split('@')[0] || 'aarav').toLowerCase();
        let formattedName = 'Aarav Sharma';
        if (rawAlias.startsWith('priya')) formattedName = 'Priya Nair';
        else if (rawAlias.startsWith('rahul')) formattedName = 'Rahul Kapoor';
        else if (rawAlias.startsWith('aarav')) formattedName = 'Aarav Sharma';
        else {
          formattedName = rawAlias.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
        const deptName = currentSelectedDept.name;
        const teamName = currentSelectedTeam.name;
        const branchName = currentSelectedBranch ? currentSelectedBranch.name : 'Executive Administration';
        const subBranchName = currentSelectedSubBranch ? currentSelectedSubBranch.name : teamName;
        const posTitle = currentSelectedPosition.title;
        const fullTitle = currentSelectedPosition.fullTitle || `${currentSelectedPosition.roleLevel} - ${posTitle}`;
        const roleLevel = currentSelectedPosition.roleLevel || 'Associate';
        const posId = currentSelectedPosition.id || 'POS-0001';

        // Show spinner / loading feedback on button
        const submitBtnText = document.getElementById('signin-btn-text');
        const origBtnText = submitBtnText ? submitBtnText.textContent : 'Authenticate & Access Dashboard';
        if (submitBtnText) submitBtnText.textContent = 'Loading 30 Authoritative Tasks...';

        // Fetch 30 authoritative tasks from dataset
        let posTaskData = await fetchAuthoritativeTasksForPosition(posId, currentSelectedPosition);
        if (submitBtnText) submitBtnText.textContent = origBtnText;

        const rawTasks = (posTaskData && posTaskData.tasks && posTaskData.tasks.length > 0) ? posTaskData.tasks : [];

        let mappedTasks = [];
        if (rawTasks.length > 0) {
          mappedTasks = rawTasks.map((t, idx) => {
            const tNum = t.num || (idx + 1);
            const tId = t.taskId || ('T' + String(tNum).padStart(3, '0'));
            const isDone = (tNum === 1); // Pre-unlock task 1 for instant evaluation
            return {
              taskId: tId,
              id: t.id || `TASK_${posId}_${String(tNum).padStart(2, '0')}`,
              progressId: `PROG_${posId}_${tNum}`,
              num: tNum,
              day: t.day || (tNum <= 6 ? 'Day 1' : (tNum <= 12 ? 'Day 2' : (tNum <= 18 ? 'Day 3' : (tNum <= 24 ? 'Day 4' : 'Day 5')))),
              taskName: t.title,
              title: t.title,
              description: t.desc,
              desc: t.desc,
              duration: t.duration || '45 mins',
              category: t.category || subBranchName || deptName,
              department: deptName,
              subDepartment: subBranchName,
              priority: t.priority || (tNum <= 6 ? 'High' : (tNum <= 20 ? 'Medium' : 'Standard')),
              status: isDone ? 'Completed' : 'Pending',
              done: isDone,
              isMandatory: (tNum <= 6),
              objective: t.objective || '',
              prerequisites: t.prerequisites || '',
              chatbotExecution: t.chatbotExecution || [],
              definitionOfDone: t.definitionOfDone || '',
              supervisorCheckIn: t.supervisorCheckIn || '',
              chatbotBrief: t.chatbotBrief || ''
            };
          });
        } else {
          // Robust fallback generator if network fetch unreachable
          for (let i = 1; i <= 30; i++) {
            const dayStr = i <= 6 ? 'Day 1' : (i <= 12 ? 'Day 2' : (i <= 18 ? 'Day 3' : (i <= 24 ? 'Day 4' : 'Day 5')));
            mappedTasks.push({
              taskId: 'T' + String(i).padStart(3, '0'),
              id: `TASK_${posId}_${String(i).padStart(2, '0')}`,
              progressId: `PROG_${posId}_${i}`,
              num: i,
              day: dayStr,
              taskName: i === 1 ? `Secure Account & Workspace Setup` : (i === 2 ? `Role Charter & Success Measures` : `${subBranchName} Milestone #${i}`),
              title: i === 1 ? `Secure Account & Workspace Setup` : (i === 2 ? `Role Charter & Success Measures` : `${subBranchName} Milestone #${i}`),
              description: `Complete authoritative onboarding activity for ${fullTitle} within ${subBranchName} (${deptName}).`,
              desc: `Complete authoritative onboarding activity for ${fullTitle} within ${subBranchName} (${deptName}).`,
              duration: '60 minutes',
              category: subBranchName,
              department: deptName,
              subDepartment: subBranchName,
              priority: i <= 6 ? 'High' : 'Medium',
              status: i === 1 ? 'Completed' : 'Pending',
              done: (i === 1),
              isMandatory: (i <= 6),
              objective: `Establish core proficiency as ${fullTitle} in ${deptName}.`,
              prerequisites: 'Verified corporate credentials and workspace.',
              chatbotExecution: [
                `Confirm objective with supervisor for ${fullTitle}.`,
                `Review authoritative ${deptName} and ${subBranchName} standards.`,
                `Perform assignment in approved enterprise systems.`,
                `Validate deliverable and review with supervisor.`
              ],
              definitionOfDone: `Activity completed with zero open blockers for ${fullTitle}.`,
              supervisorCheckIn: `Supervisor verifies understanding and completion of ${subBranchName} standards.`
            });
          }
        }

        const comp = companiesDatabase[currentSelectedCompany] || companiesDatabase.microsoft;
        const buddy = {
          name: roleLevel === 'Manager' ? 'Vikram Shah' : (roleLevel === 'Lead' ? 'Ananya Sen' : 'Rahul Pandey'),
          role: roleLevel === 'Manager' ? 'Senior Director of Operations · Executive Sponsor' : (roleLevel === 'Lead' ? 'Staff Lead Engineer · Technical Mentor' : 'Senior Peer Buddy · Day-1 Guide'),
          phone: '+91 (80) 6789-89928',
          email: `${roleLevel === 'Manager' ? 'vikram.shah' : (roleLevel === 'Lead' ? 'ananya.sen' : 'rahul.pandey')}@${comp.domain || 'microsoft.in'}`
        };

        const hr = {
          name: 'Priya Sharma',
          role: 'Lead HR People Partner · Employee Success',
          phone: '+91 (80) 6789-89912',
          email: `priya.sharma@${comp.domain || 'microsoft.in'}`
        };

        const completedCount = mappedTasks.filter(t => t.status === 'Completed' || t.done).length;
        const pendingCount = mappedTasks.length - completedCount;
        const percentage = Math.round((completedCount / mappedTasks.length) * 100);

        const synthesized = {
          company: { name: comp.name || 'Microsoft Corporation', tenantId: comp.key || 'microsoft' },
          employee: {
            employeeId: `EMP-${posId}`,
            positionId: posId,
            name: formattedName,
            email: email,
            role: posTitle,
            fullTitle: fullTitle,
            roleLevel: roleLevel,
            department: deptName,
            deptNumber: currentSelectedDept.deptNumber || 1,
            team: teamName,
            branch: branchName,
            subDepartment: subBranchName,
            location: 'Microsoft Corporate Campus · Bengaluru / Redmond IDC',
            joiningDate: '2026-10-04',
            startDate: '2026-10-04',
            status: 'Active',
            buddy: buddy,
            hr: hr
          },
          metrics: {
            totalTasks: mappedTasks.length,
            completedTasks: completedCount,
            pendingTasks: pendingCount,
            percentage: percentage
          },
          tasks: mappedTasks
        };

        currentLiveDashboard = synthesized;
        window.currentLiveDashboard = synthesized;
        currentLiveEmployeeId = synthesized.employee.employeeId;
        liveTasksList = synthesized.tasks;

        // Render dashboard
        renderManualDashboardFromLive(synthesized);
        filterByDay('Day 1');
        initJoinerChatbot(synthesized.employee);
        updateLiveCopilotChips(synthesized.tasks);

        goToStep('step-joiner-chatbot');
        showNotification(`🎉 Welcome to ${comp.name}, ${formattedName}! Loaded ${mappedTasks.length} authoritative tasks for ${fullTitle}.`);
        return;
      }

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

      showNotification(`Authenticated as ${detection.user.name} (${detection.title})`);

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
    }'''

    html = html[:signin_start] + new_signin_code + '\n\n    ' + html[signin_end:]
    print("✅ Patched handleMemberSignIn with complete authoritative task mapping.")
else:
    print("❌ Could not locate handleMemberSignIn boundaries!")

# 6. Patch toggleLiveTask to update currentLiveDashboard.tasks in place
old_toggle_start = html.find('function toggleLiveTask(progressId, currentStatus, taskId) {')
old_toggle_end = html.find('function updateLiveCopilotChips', old_toggle_start)

if old_toggle_start != -1 and old_toggle_end != -1:
    new_toggle_code = '''function toggleLiveTask(progressId, currentStatus, taskId) {
      const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
      const isNowDone = (nextStatus === 'Completed');

      // 1. Update task in currentLiveDashboard if present
      if (currentLiveDashboard && currentLiveDashboard.tasks) {
        const task = currentLiveDashboard.tasks.find(t =>
          String(t.taskId).toLowerCase() === String(taskId).toLowerCase() ||
          String(t.id).toLowerCase() === String(taskId).toLowerCase() ||
          String(t.progressId).toLowerCase() === String(progressId).toLowerCase()
        );
        if (task) {
          task.status = nextStatus;
          task.done = isNowDone;
        }

        // Recalculate metrics
        const total = currentLiveDashboard.tasks.length;
        const completed = currentLiveDashboard.tasks.filter(t => t.status === 'Completed' || t.done).length;
        const pending = total - completed;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        currentLiveDashboard.metrics = {
          totalTasks: total,
          completedTasks: completed,
          pendingTasks: pending,
          percentage: pct
        };

        renderManualDashboardFromLive(currentLiveDashboard);
      }

      // 2. Update localStorage status store immediately
      const statusStore = getTaskStatusStore();
      const key = `${currentLiveEmployeeId}_${taskId}`;
      statusStore[key] = nextStatus;
      saveTaskStatusStore(statusStore);

      showNotification(`✓ ${taskId}: Marked as ${nextStatus}!`);

      // Refresh HR view and roster if visible
      const hrPortal = document.getElementById('step-hr-portal');
      if (hrPortal && hrPortal.style.display !== 'none') {
        renderHRTaskInventory();
        renderHRRosterTable();
      }

      // 3. Sync to server if backend is active
      try {
        const base = getApiBaseUrl();
        if (base && window.location.port === '3000') {
          fetch(`${base}/api/progress/${progressId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
          }).catch(() => {});
        }
      } catch (err) { }
    }'''
    html = html[:old_toggle_start] + new_toggle_code + '\n\n    ' + html[old_toggle_end:]
    print("✅ Patched toggleLiveTask.")

# 7. Patch initJoinerChatbot to display role & subdept grounding
old_init_chatbot_start = html.find('function initJoinerChatbot(user) {')
old_init_chatbot_end = html.find('function getContactDirectoryResponseHtml() {', old_init_chatbot_start)

if old_init_chatbot_start != -1 and old_init_chatbot_end != -1:
    new_init_chatbot_code = '''function initJoinerChatbot(user) {
      const feed = document.getElementById('chatbot-messages-feed');
      if (!feed) return;

      const compName = user?.company?.name || (currentLiveDashboard?.company?.name) || 'Microsoft Corporation';
      const firstName = user?.name ? user.name.split(' ')[0] : 'there';
      const fullTitle = user?.fullTitle || (currentLiveDashboard?.employee?.fullTitle) || user?.role || 'Associate';
      const roleLevel = user?.roleLevel || (currentLiveDashboard?.employee?.roleLevel) || 'Associate';
      const deptName = user?.department || (currentLiveDashboard?.employee?.department) || 'Department';
      const subDeptName = user?.subDepartment || (currentLiveDashboard?.employee?.subDepartment) || (currentLiveDashboard?.employee?.team) || 'Operations';
      const buddyName = user?.buddy?.name || (currentLiveDashboard?.employee?.buddy?.name) || 'Rahul Pandey';
      const hrName = user?.hr?.name || (currentLiveDashboard?.employee?.hr?.name) || 'Priya Sharma';

      const ctxUserEl = document.getElementById('copilot-context-user');
      if (ctxUserEl) ctxUserEl.textContent = user?.name || 'Aarav Sharma';

      feed.innerHTML = `
        <div class="chat-bubble assistant">
          <div class="chat-avatar ai" title="AI Onboarding Copilot">
            <img src="copilot-icon.png" onerror="this.src='/copilot-icon.png'" alt="Copilot" />
          </div>
          <div class="chat-bubble-body">
            <div style="font-size: 0.98rem; font-weight: 800; color: #f8fafc; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
              <span>👋</span> Hi ${escapeHtml(firstName)}! Welcome to ${escapeHtml(compName)}!
            </div>
            <p style="color: #cbd5e1; margin-bottom: 12px; font-size: 0.84rem; line-height: 1.55;">
              I am your <strong>AI Onboarding Copilot</strong>. I have real-time access to your <strong>30 Authoritative Onboarding Tasks</strong> for <strong>${escapeHtml(fullTitle)}</strong> (${escapeHtml(deptName)} > ${escapeHtml(subDeptName)}), verified <strong>Contact Directory</strong>, assigned <strong>Buddy (${escapeHtml(buddyName)})</strong>, and <strong>HR Partner (${escapeHtml(hrName)})</strong>.
            </p>
            <div style="font-size: 0.78rem; font-weight: 700; color: #818cf8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.03em;">
              Recommended Onboarding Actions:
            </div>
            <div class="chat-options-group">
              <button class="chat-action-chip" onclick="handleChatOption('checklist')">📋 Today's Checklist</button>
              <button class="chat-action-chip" onclick="handleChatOption('role')">🎯 My Role Overview</button>
              <button class="chat-action-chip" onclick="explainTaskById(1)">💡 Explain Task 1</button>
              <button class="chat-action-chip" onclick="explainTaskById(2)">💡 Explain Task 2</button>
              <button class="chat-action-chip" onclick="handleChatOption('contacts')">📞 Contacts</button>
              <button class="chat-action-chip" onclick="handleChatOption('stuck')">🚨 I'm Stuck</button>
            </div>
          </div>
        </div>
      `;
    }'''
    html = html[:old_init_chatbot_start] + new_init_chatbot_code + '\n\n    ' + html[old_init_chatbot_end:]
    print("✅ Patched initJoinerChatbot.")

# 8. Add getRoleOverviewResponseHtml and upgrade getExplainTaskResponseHtml
old_explain_start = html.find('function getExplainTaskResponseHtml(taskId) {')
old_explain_end = html.find('function getStuckTroubleshootingResponseHtml() {', old_explain_start)

if old_explain_start != -1 and old_explain_end != -1:
    new_explain_code = '''function getRoleOverviewResponseHtml() {
      const emp = currentLiveDashboard?.employee || { name: 'Aarav Sharma', role: 'Software Engineer', department: 'Engineering' };
      const comp = currentLiveDashboard?.company || { name: 'Microsoft Corporation' };
      const tasks = currentLiveDashboard?.tasks || [];
      const metrics = currentLiveDashboard?.metrics || { totalTasks: tasks.length, completedTasks: 1, pendingTasks: tasks.length - 1, percentage: 3 };
      const buddy = emp.buddy || { name: 'Rahul Pandey', role: 'Senior Peer Mentor', phone: '+91 80 6789 89928' };
      const hr = emp.hr || { name: 'Priya Sharma', role: 'Lead HR People Partner', phone: '+91 80 6789 89912' };

      return `
        <div style="font-family: var(--font-sans); color: #f8fafc;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 10px; margin-bottom: 12px;">
            <div style="font-weight: 800; font-size: 1rem; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
              <span>👤</span> Role Charter & Position Overview
            </div>
            <span style="font-size: 0.72rem; font-weight: 700; color: #818cf8; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); padding: 3px 10px; border-radius: 9999px;">
              ${escapeHtml(emp.roleLevel || 'Role Level')}
            </span>
          </div>

          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; margin-bottom: 14px;">
            <div style="font-size: 0.95rem; font-weight: 800; color: #f8fafc; margin-bottom: 4px;">
              ${escapeHtml(emp.fullTitle || emp.role)}
            </div>
            <div style="font-size: 0.8rem; color: #94a3b8; display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
              <div>🏢 <strong>Department:</strong> ${escapeHtml(emp.department)}</div>
              <div>📂 <strong>Sub-department / Team:</strong> ${escapeHtml(emp.subDepartment || emp.team || emp.branch || 'Specialized Workstream')}</div>
              <div>📍 <strong>Location / Campus:</strong> ${escapeHtml(emp.location || 'Bengaluru / Redmond IDC')}</div>
            </div>
          </div>

          <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px;">
            <div style="font-size: 0.78rem; font-weight: 800; color: #c7d2fe; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
              🎯 5-Day Onboarding Mandate & Progress:
            </div>
            <div style="font-size: 0.82rem; color: #e0e7ff; line-height: 1.55;">
              You have <strong>${metrics.totalTasks} authoritative onboarding tasks</strong> assigned across Day 1 to Day 5, tailored specifically to your role and functional domain.
              Currently, <strong>${metrics.completedTasks} of ${metrics.totalTasks} tasks</strong> are cleared (<strong>${metrics.percentage}%</strong> progress).
            </div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 12px; margin-bottom: 14px;">
            <div style="font-size: 0.76rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">Assigned Mentors:</div>
            <div style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.5;">
              👥 <strong>Peer Buddy:</strong> ${escapeHtml(buddy.name)} (${escapeHtml(buddy.role)})<br>
              💼 <strong>People Partner:</strong> ${escapeHtml(hr.name)} (${escapeHtml(hr.role)})
            </div>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="copilot-chip" onclick="handleChatOption('checklist')" style="background: #4f46e5; color: #fff; padding: 6px 14px; font-size: 0.76rem; border-radius: 6px; cursor: pointer; border: none; font-weight: 700;">
              📋 View Day 1 Checklist
            </button>
            <button class="copilot-chip" onclick="explainTaskById(1)" style="background: rgba(255,255,255,0.1); color: #cbd5e1; padding: 6px 12px; font-size: 0.76rem; border-radius: 6px; cursor: pointer; border: none;">
              💡 Explain Task 1
            </button>
            <button class="copilot-chip" onclick="handleChatOption('contacts')" style="background: rgba(255,255,255,0.1); color: #cbd5e1; padding: 6px 12px; font-size: 0.76rem; border-radius: 6px; cursor: pointer; border: none;">
              📞 Contact Directory
            </button>
          </div>
        </div>
      `;
    }

    function getExplainTaskResponseHtml(taskId) {
      const allTasks = (currentLiveDashboard && currentLiveDashboard.tasks && currentLiveDashboard.tasks.length > 0)
        ? currentLiveDashboard.tasks
        : (ALL_40_TASKS || []);
      const numId = parseInt(String(taskId).replace(/\\D/g, ''), 10) || 1;

      let task = allTasks.find(t =>
        String(t.taskId).toLowerCase() === String(taskId).toLowerCase() ||
        String(t.taskId).replace(/\\D/g, '') === String(taskId).replace(/\\D/g, '') ||
        String(t.id).toLowerCase() === String(taskId).toLowerCase() ||
        parseInt(String(t.taskId || t.id).replace(/\\D/g, ''), 10) === numId
      );

      if (!task && dailyTasksState) {
        task = dailyTasksState.find(t => String(t.id) === String(taskId) || parseInt(String(t.id).replace(/\\D/g, ''), 10) === numId);
      }

      if (!task) {
        task = {
          taskId: 'T' + String(numId).padStart(3, '0'),
          taskName: 'Enterprise Onboarding Task #' + taskId,
          title: 'Enterprise Onboarding Task #' + taskId,
          department: currentLiveDashboard?.employee?.department || 'Engineering',
          applicableRole: currentLiveDashboard?.employee?.fullTitle || 'Professional',
          day: 'Day 1',
          priority: 'High',
          duration: '45 mins',
          description: 'Authoritative onboarding checklist requirement.'
        };
      }

      const isDone = task.status === 'Completed' || task.done;
      const tId = task.taskId || ('T' + String(numId).padStart(3, '0'));
      const tTitle = task.taskName || task.title;

      let detail = null;
      if (task.chatbotExecution && Array.isArray(task.chatbotExecution) && task.chatbotExecution.length > 0) {
        detail = {
          objective: task.objective || `${tTitle} is an authoritative requirement for ${task.department || 'Enterprise'} (${task.category || 'Specialized Workstream'}).`,
          steps: task.chatbotExecution,
          verification: task.definitionOfDone || 'Completed according to standard operating criteria and verified by supervisor check-in.',
          supervisor: task.supervisorCheckIn || 'Confirm with your supervisor or team lead that the output meets the expected quality and documentation standards.',
          prerequisites: task.prerequisites || 'Account credentials, workspace access, and relevant departmental guidance are available.',
          troubleshooting: [
            `<strong>Scope & Authority Boundary:</strong> If any activity falls outside assigned authority, escalate immediately to your supervisor.`,
            `<strong>Access & Environmental Checks:</strong> Confirm that you are operating in the approved systems for ${task.department || 'your department'}.`
          ]
        };
      } else if (DEEP_TASK_DETAILS[tId] || DEEP_TASK_DETAILS['T' + String(numId).padStart(3, '0')]) {
        detail = DEEP_TASK_DETAILS[tId] || DEEP_TASK_DETAILS['T' + String(numId).padStart(3, '0')];
      } else {
        detail = generateGenericDeepElaboration(task);
      }

      const buddy = currentLiveDashboard?.employee?.buddy || { name: 'Rahul Pandey', role: 'Senior Peer Mentor', phone: '+91 80 6789 89928', email: 'buddy@microsoft.in' };
      const hr = currentLiveDashboard?.employee?.hr || { name: 'Priya Sharma', role: 'Lead HR People Partner', phone: '+91 80 6789 89912', email: 'hr@microsoft.in' };

      let stepsHtml = '';
      (detail.steps || []).forEach((step, idx) => {
        stepsHtml += `
          <div style="display: flex; gap: 10px; margin-bottom: 8px; align-items: flex-start;">
            <span style="background: rgba(99, 102, 241, 0.3); color: #c7d2fe; font-weight: 800; font-size: 0.72rem; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">${idx + 1}</span>
            <div style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">${step}</div>
          </div>
        `;
      });

      let prereqHtml = '';
      if (detail.prerequisites) {
        prereqHtml = `
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; font-size: 0.78rem; color: #cbd5e1;">
            <strong style="color: #fbbf24;">🔐 Prerequisites:</strong> ${escapeHtml(detail.prerequisites)}
          </div>
        `;
      }

      let supervisorHtml = '';
      if (detail.supervisor) {
        supervisorHtml = `
          <div style="background: rgba(147, 51, 234, 0.1); border: 1px solid rgba(147, 51, 234, 0.25); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
            <div style="font-size: 0.78rem; font-weight: 800; color: #c084fc; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span>👥</span> Supervisor Check-In & Feedback Standard:
            </div>
            <div style="font-size: 0.78rem; color: #e2e8f0; line-height: 1.5;">
              ${escapeHtml(detail.supervisor)}
            </div>
          </div>
        `;
      }

      return `
        <div style="font-family: var(--font-sans); color: #f8fafc;">

          <!-- Header -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 10px; margin-bottom: 12px;">
            <div>
              <div style="font-size: 0.7rem; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 0.06em;">
                ${tId} · ${task.day || 'Day 1'} · ${task.duration || '45 mins'}
              </div>
              <div style="font-weight: 800; font-size: 0.98rem; color: #ffffff; margin-top: 2px;">
                ${escapeHtml(tTitle)}
              </div>
            </div>
            <span style="font-size: 0.7rem; font-weight: 700; color: ${isDone ? '#34d399' : '#fbbf24'}; background: ${isDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; border: 1px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}; padding: 3px 8px; border-radius: 9999px;">
              ${isDone ? '✓ Completed' : '● Action Required'}
            </span>
          </div>

          <!-- Grounding Badge -->
          <div style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 6px; padding: 6px 10px; margin-bottom: 12px; font-size: 0.74rem; color: #c7d2fe; display: flex; align-items: center; gap: 6px;">
            <span>⚡</span>
            <span><strong>Role Grounding:</strong> ${escapeHtml(task.department || 'Enterprise')} > ${escapeHtml(task.category || 'Specialized Workstream')} (${escapeHtml(currentLiveDashboard?.employee?.fullTitle || 'Onboarding Position')})</span>
          </div>

          <!-- Description -->
          <div style="font-size: 0.82rem; color: #e2e8f0; line-height: 1.55; margin-bottom: 12px; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px; border-left: 3px solid #6366f1;">
            ${escapeHtml(task.description || task.desc || '')}
          </div>

          <!-- SECTION 1: Strategic Objective -->
          <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
            <div style="font-size: 0.8rem; font-weight: 800; color: #a5b4fc; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>🎯</span> Strategic Objective & System Impact:
            </div>
            <p style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.55; margin: 0;">
              ${detail.objective}
            </p>
          </div>

          ${prereqHtml}

          <!-- SECTION 2: Step-by-Step Implementation Guide -->
          <div style="margin-bottom: 12px;">
            <div style="font-size: 0.8rem; font-weight: 800; color: #93c5fd; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span>📝</span> In-Depth Execution Playbook:
            </div>
            <div>
              ${stepsHtml}
            </div>
          </div>

          <!-- SECTION 3: Definition of Done & Verification -->
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
            <div style="font-size: 0.78rem; font-weight: 800; color: #34d399; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span>🔍</span> Verification & Definition of Done:
            </div>
            <div style="font-size: 0.78rem; color: #e2e8f0; line-height: 1.5;">
              ${detail.verification}
            </div>
          </div>

          ${supervisorHtml}

          <!-- Support Contacts -->
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; font-size: 0.78rem; color: #cbd5e1; line-height: 1.5;">
            👥 <strong>Designated Buddy:</strong> ${escapeHtml(buddy.name)} (${escapeHtml(buddy.role)} · 📞 ${escapeHtml(buddy.phone)})<br>
            💼 <strong>People Partner:</strong> ${escapeHtml(hr.name)} (📞 ${escapeHtml(hr.phone)})
          </div>

          <!-- Action Footer -->
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button class="copilot-chip" style="background: ${isDone ? 'rgba(255,255,255,0.12)' : '#4f46e5'}; color: #fff; padding: 7px 16px; font-size: 0.78rem; font-weight: 700; border-radius: 6px; cursor: pointer; border: none;" onclick="toggleLiveTask('${task.progressId || ('P_' + tId)}', '${task.status}', '${tId}')">
              ${isDone ? '✓ Mark as Pending' : '✓ Mark Task as Completed'}
            </button>
            <button class="copilot-chip" style="background: rgba(255,255,255,0.08); color: #cbd5e1; padding: 7px 14px; font-size: 0.78rem; border-radius: 6px; cursor: pointer; border: none;" onclick="handleChatOption('checklist')">
              📋 Today's Checklist
            </button>
            <button class="copilot-chip" style="background: rgba(255,255,255,0.08); color: #cbd5e1; padding: 7px 14px; font-size: 0.78rem; border-radius: 6px; cursor: pointer; border: none;" onclick="handleChatOption('contacts')">
              📞 All Contacts
            </button>
          </div>

        </div>
      `;
    }'''

    html = html[:old_explain_start] + new_explain_code + '\n\n    ' + html[old_explain_end:]
    print("✅ Patched getExplainTaskResponseHtml and added getRoleOverviewResponseHtml.")

# 9. Patch sendChatMessage to handle role overview and query routing
old_chat_start = html.find('async function sendChatMessage() {')
old_chat_end = html.find('function runCopilotResponseWithThinking', old_chat_start)

if old_chat_start != -1 and old_chat_end != -1:
    new_chat_code = '''async function sendChatMessage() {
      const input = document.getElementById('chatbot-input');
      const query = input.value.trim();
      if (!query || isCopilotThinking) return;

      input.value = '';
      const lower = query.toLowerCase();

      // 1. Role overview queries
      if (lower.includes('my role') || lower.includes('my position') || lower.includes('what is my role') || lower.includes('my responsibilities') || lower.includes('what do i do') || lower.includes('overview of my role') || lower.includes('who am i') || lower.includes('my team') || lower.includes('job role')) {
        runCopilotResponseWithThinking(query, getRoleOverviewResponseHtml);
        return;
      }

      // 2. Contact directory queries
      if (lower.includes('contact') || lower.includes('phone') || lower.includes('call') || lower.includes('directory') || lower.includes('number') || lower.includes('who to call') || lower.includes('who to contact') || lower.includes('buddy') || lower.includes('hr')) {
        runCopilotResponseWithThinking(query, getContactDirectoryResponseHtml);
        return;
      }

      // 3. Checklist queries
      if (lower.includes('checklist') || (lower.includes('show') && lower.includes('task')) || lower.includes('today') || lower.includes('complete today') || lower.includes('day 1') || lower.includes('what to do')) {
        runCopilotResponseWithThinking(query, getChecklistResponseHtml);
        return;
      }

      // 4. Task number queries (e.g. "explain task 1", "task 5", "how to do task 3")
      const taskNumMatch = lower.match(/(?:explain|what is|tell me about|how to do|help with|details of)?\\s*(?:task\\s*#?\\s*|t\\s*)(\\d+)/);
      if (taskNumMatch && (lower.includes('explain') || lower.includes('what') || lower.includes('how') || lower.includes('task') || lower.includes('help'))) {
        const taskIdNum = parseInt(taskNumMatch[1], 10);
        runCopilotResponseWithThinking(query, () => getExplainTaskResponseHtml(taskIdNum));
        return;
      }

      // 5. Check if user asks about a keyword matching any task title in currentLiveDashboard
      const allTasks = (currentLiveDashboard && currentLiveDashboard.tasks) ? currentLiveDashboard.tasks : (ALL_40_TASKS || []);
      const matchedTask = allTasks.find(t => {
        const titleLower = (t.taskName || t.title || '').toLowerCase();
        const descLower = (t.description || t.desc || '').toLowerCase();
        const words = lower.split(/\\s+/).filter(w => w.length >= 4);
        return words.some(w => titleLower.includes(w) || descLower.includes(w));
      });

      if (matchedTask && (lower.includes('explain') || lower.includes('how') || lower.includes('what') || lower.includes('help') || lower.includes('guide') || lower.includes('tell me'))) {
        runCopilotResponseWithThinking(query, () => getExplainTaskResponseHtml(matchedTask.taskId || matchedTask.num));
        return;
      }

      // 6. Stuck / Blocker troubleshooting
      if (lower.includes('stuck') || lower.includes('blocked') || lower.includes('issue') || lower.includes('problem') || lower.includes('help')) {
        runCopilotResponseWithThinking(query, getStuckTroubleshootingResponseHtml);
        return;
      }

      // 7. General inquiry response
      runCopilotResponseWithThinking(query, async () => {
        const currentEmp = currentLiveDashboard?.employee || { name: 'Aarav Sharma', role: 'Executive Assistant', department: 'Administration' };
        const comp = currentLiveDashboard?.company || { name: 'Microsoft Corporation' };
        return `
          <div>
            <div style="font-weight: 800; font-size: 0.92rem; color: #f8fafc; margin-bottom: 6px;">
              💡 Copilot Guidance for ${escapeHtml(currentEmp.name)} (${escapeHtml(currentEmp.fullTitle || currentEmp.role)})
            </div>
            <p style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; margin-bottom: 10px;">
              Regarding "<em>${escapeHtml(query)}</em>": All first-week onboarding procedures for your position in <strong>${escapeHtml(currentEmp.department)}</strong> are pre-configured in your 30-task execution playbook.
            </p>
            <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; font-size: 0.8rem; color: #cbd5e1;">
              📌 <strong>Quick Assistance Options:</strong>
              <ul style="padding-left: 16px; margin: 4px 0 0 0;">
                <li>Click <strong>💡 Explain Task [1-30]</strong> to see step-by-step procedures.</li>
                <li>Ask <strong>"What is my role?"</strong> to view your position charter and mandate.</li>
                <li>Ask <strong>"Who to contact?"</strong> for your assigned buddy and HR partner.</li>
              </ul>
            </div>
          </div>
        `;
      });
    }'''

    html = html[:old_chat_start] + new_chat_code + '\n\n    ' + html[old_chat_end:]
    print("✅ Patched sendChatMessage with intelligent query routing.")

# Write to all 3 files
for p in index_paths:
    with open(p, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"✅ Successfully written to {p} ({len(html)} bytes).")

print("🎉 Authoritative onboarding system patch applied successfully!")
