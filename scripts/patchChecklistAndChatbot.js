const fs = require('fs');
const path = require('path');

const files = [
  path.resolve(__dirname, '../client/index.html'),
  path.resolve(__dirname, '../index.html'),
  path.resolve(__dirname, '../client/public/index.html')
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  console.log(`Patching logic in: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Patch loadLiveEmployeeDashboard to prioritize instantaneous synthesis
  const oldLoadDashboardRegex = /async function loadLiveEmployeeDashboard\s*\(empId\)\s*\{[\s\S]*?renderManualDashboard\(currentAuthenticatedUser\);\s*\}\s*\}/;
  const newLoadDashboardCode = `async function loadLiveEmployeeDashboard(empId) {
      currentLiveEmployeeId = empId || currentLiveEmployeeId || 'E001';

      // 1. Synthesize immediately from datasets for 0ms instantaneous rendering on Vercel & Local
      const synthesized = getSynthesizedDashboardForEmployee(currentLiveEmployeeId);
      if (synthesized) {
        currentLiveDashboard = synthesized;
        liveTasksList = synthesized.tasks || [];
        renderManualDashboardFromLive(synthesized);
      }

      // 2. Fetch live data from backend server if running locally
      try {
        const base = getApiBaseUrl();
        if (base && window.location.port === '3000') {
          const res = await fetch(\`\${base}/api/employees/\${currentLiveEmployeeId}/dashboard\`);
          if (res.ok) {
            const data = await res.json();
            currentLiveDashboard = data;
            liveTasksList = data.tasks || [];
            renderManualDashboardFromLive(data);
          }
        }
      } catch (err) {
        console.debug('Using synthesized client dataset:', err);
      }
    }`;

  if (oldLoadDashboardRegex.test(content)) {
    content = content.replace(oldLoadDashboardRegex, newLoadDashboardCode);
    console.log('  Patched loadLiveEmployeeDashboard');
  }

  // 2. Ensure card.dataset.day is set in renderManualDashboardFromLive
  content = content.replace(
    "card.dataset.status = isDone ? 'done' : 'pending';",
    "card.dataset.status = isDone ? 'done' : 'pending';\n            card.dataset.day = t.day || 'Day 1';"
  );

  // 3. Make toggleLiveTask update localStorage store directly so changes persist without server
  const oldToggleLiveTaskRegex = /async function toggleLiveTask\s*\([\s\S]*?showNotification\('⚠️ Server network error updating task\.'\);\s*\}\s*\}/;
  const newToggleLiveTaskCode = `async function toggleLiveTask(progressId, currentStatus, taskId) {
      const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';

      // 1. Update localStorage status store immediately
      const statusStore = getTaskStatusStore();
      const key = \`\${currentLiveEmployeeId}_\${taskId}\`;
      statusStore[key] = nextStatus;
      saveTaskStatusStore(statusStore);

      showNotification(\`✓ \${taskId}: Marked as \${nextStatus}!\`);

      // 2. Reload employee dashboard
      await loadLiveEmployeeDashboard(currentLiveEmployeeId);

      // 3. Sync to server if backend is active
      try {
        const base = getApiBaseUrl();
        if (base && window.location.port === '3000') {
          await fetch(\`\${base}/api/progress/\${progressId}\`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
          });
        }
      } catch (err) {}
    }`;

  if (oldToggleLiveTaskRegex.test(content)) {
    content = content.replace(oldToggleLiveTaskRegex, newToggleLiveTaskCode);
    console.log('  Patched toggleLiveTask');
  }

  // 4. Update getExplainTaskResponseHtml to return a clean, brief explanation ONLY IF requested
  const oldExplainRegex = /function getExplainTaskResponseHtml\s*\(taskId\)\s*\{[\s\S]*?return `[\s\S]*?📞 Contact Directory[\s\S]*?<\/div>\s*`;\s*\}/;
  const newExplainCode = `function getExplainTaskResponseHtml(taskId) {
      const allTasks = (currentLiveDashboard && currentLiveDashboard.tasks) ? currentLiveDashboard.tasks : (ALL_40_TASKS || []);
      const numId = parseInt(String(taskId).replace(/\\D/g, ''), 10) || 1;

      let task = allTasks.find(t => 
        String(t.taskId).toLowerCase() === String(taskId).toLowerCase() ||
        String(t.taskId).replace(/\\D/g, '') === String(taskId).replace(/\\D/g, '') ||
        parseInt(String(t.taskId).replace(/\\D/g, ''), 10) === numId
      );

      if (!task && dailyTasksState) {
        task = dailyTasksState.find(t => String(t.id) === String(taskId) || parseInt(String(t.id).replace(/\\D/g, ''), 10) === numId);
      }

      if (!task) {
        task = {
          taskId: 'T00' + numId,
          taskName: 'Onboarding Task ' + taskId,
          department: 'General',
          day: 'Day 1',
          priority: 'High',
          duration: '20 mins',
          description: 'Standard enterprise onboarding checklist requirement.'
        };
      }

      const tTitle = task.taskName || task.title;
      const isDone = task.status === 'Completed' || task.done;
      const helperName = (task.assignedBy === 'IT') ? 'Rahul Mehta (IT Support)' :
                         (task.assignedBy === 'HR') ? 'Priya Nair (HR Operations)' :
                         (task.assignedBy === 'Security') ? 'Karan Patel (Security Lead)' :
                         'Dhruv Agarwal (Senior Buddy)';

      return \`
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 10px; padding: 14px; margin-top: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <span style="font-size: 0.72rem; font-weight: 800; background: rgba(99, 102, 241, 0.25); color: #c7d2fe; padding: 2px 8px; border-radius: 4px;">
              \${escapeHtml(task.taskId || 'Task')} · \${escapeHtml(task.day || 'Day 1')}
            </span>
            <span style="font-size: 0.72rem; font-weight: 700; color: \${isDone ? '#34d399' : '#f87171'};">
              \${isDone ? '✓ Completed' : '● Action Required'}
            </span>
          </div>

          <div style="font-size: 0.98rem; font-weight: 800; color: #ffffff; margin-bottom: 6px; line-height: 1.35;">
            \${escapeHtml(tTitle)}
          </div>

          <div style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; margin-bottom: 10px; background: rgba(30, 41, 59, 0.6); padding: 8px 10px; border-radius: 6px;">
            📌 <strong>Brief Explanation:</strong> \${escapeHtml(task.description || (tTitle + ' - Complete this prerequisite to unlock your team tools.'))}
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.75rem; color: #94a3b8; margin-bottom: 10px;">
            <span>⏱️ <strong>Est:</strong> \${escapeHtml(task.duration || '20m')}</span>
            <span>🏷️ <strong>Track:</strong> \${escapeHtml(task.department || 'All')}</span>
            <span>👤 <strong>Helper:</strong> \${escapeHtml(helperName)}</span>
          </div>

          \${task.resource ? \`
            <div style="margin-bottom: 10px; font-size: 0.76rem; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); padding: 6px 10px; border-radius: 6px;">
              📄 <strong>Official Resource:</strong> <a href="\${escapeHtml(task.resource.link || '#')}" target="_blank" style="color: #34d399; font-weight: 700; text-decoration: underline;">\${escapeHtml(task.resource.resourceName || 'Setup Guide')}</a>
            </div>
          \` : ''}

          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button class="copilot-chip" style="background: \${isDone ? 'rgba(255,255,255,0.1)' : '#4f46e5'}; color: #fff; padding: 5px 12px; font-size: 0.75rem; font-weight: 700; border-radius: 6px; cursor: pointer;" onclick="toggleLiveTask('\${task.progressId || ('P_' + task.taskId)}', '\${task.status}', '\${task.taskId}')">
              \${isDone ? '✓ Mark as Pending' : '✓ Mark as Completed'}
            </button>
            <button class="copilot-chip" style="background: rgba(255,255,255,0.08); color: #cbd5e1; padding: 5px 10px; font-size: 0.75rem; border-radius: 6px; cursor: pointer;" onclick="handleChatOption('contacts')">
              📞 Call Helper
            </button>
          </div>
        </div>
      \`;
    }`;

  if (oldExplainRegex.test(content)) {
    content = content.replace(oldExplainRegex, newExplainCode);
    console.log('  Patched getExplainTaskResponseHtml with brief explanation format');
  }

  // 5. Enhance sendChatMessage natural language matching for ANY task
  const oldSendChatRegex = /async function sendChatMessage\s*\(\)\s*\{[\s\S]*?if\s*\(lower\.includes\('task 1'\)[\s\S]*?runCopilotResponseWithThinking\(query,\s*async\s*\(\)\s*=>\s*\{/;
  const newSendChatHeader = `async function sendChatMessage() {
      const input = document.getElementById('chatbot-input');
      const query = input.value.trim();
      if (!query || isCopilotThinking) return;

      input.value = '';
      const lower = query.toLowerCase();

      // Route natural language queries intelligently with 3.5s thinking delay
      if (lower.includes('contact') || lower.includes('phone') || lower.includes('call') || lower.includes('directory') || lower.includes('number') || lower.includes('who to call') || lower.includes('who to contact')) {
        runCopilotResponseWithThinking(query, getContactDirectoryResponseHtml);
        return;
      }

      if (lower.includes('checklist') || (lower.includes('show') && lower.includes('task')) || lower.includes('today') || lower.includes('complete today') || lower.includes('day 1 tasks') || lower.includes('what to do')) {
        runCopilotResponseWithThinking(query, getChecklistResponseHtml);
        return;
      }

      // Check if user specifically asks to explain a task: e.g. "explain task 1", "explain T014", "how to do task 3", "what is task 2"
      const taskNumMatch = lower.match(/(?:explain|what is|tell me about|how to do|help with|details of)?\\s*(?:task\\s*#?\\s*|t\\s*)(\\d+)/);
      if (taskNumMatch && (lower.includes('explain') || lower.includes('what') || lower.includes('how') || lower.includes('task') || lower.includes('help'))) {
        const taskIdNum = parseInt(taskNumMatch[1], 10);
        runCopilotResponseWithThinking(query, () => getExplainTaskResponseHtml(taskIdNum));
        return;
      }

      // Check by task name keywords if user asks to explain a topic
      const allTasks = (currentLiveDashboard && currentLiveDashboard.tasks) ? currentLiveDashboard.tasks : (ALL_40_TASKS || []);
      const matchedTask = allTasks.find(t => {
        const nameLower = (t.taskName || t.title || '').toLowerCase();
        if (lower.includes('sso') || lower.includes('account')) return t.taskId === 'T001';
        if (lower.includes('mfa') || lower.includes('authenticator')) return t.taskId === 'T002';
        if (lower.includes('handbook')) return t.taskId === 'T004';
        if (lower.includes('security training') || lower.includes('cyber')) return t.taskId === 'T005';
        if (lower.includes('github') || lower.includes('repo')) return nameLower.includes('github') || t.taskId === 'T014';
        if (lower.includes('ide') || lower.includes('editor')) return nameLower.includes('ide') || t.taskId === 'T015';
        if (lower.includes('docker') || lower.includes('container')) return nameLower.includes('docker') || t.taskId === 'T017';
        return false;
      });

      if (matchedTask && (lower.includes('explain') || lower.includes('how') || lower.includes('what') || lower.includes('help') || lower.includes('guide'))) {
        runCopilotResponseWithThinking(query, () => getExplainTaskResponseHtml(matchedTask.taskId));
        return;
      }

      if (lower.includes('stuck') || lower.includes('blocked') || lower.includes('issue') || lower.includes('problem')) {
        runCopilotResponseWithThinking(query, getStuckTroubleshootingResponseHtml);
        return;
      }

      // General query with fallback
      runCopilotResponseWithThinking(query, async () => {`;

  if (oldSendChatRegex.test(content)) {
    content = content.replace(oldSendChatRegex, newSendChatHeader);
    console.log('  Patched sendChatMessage task routing');
  }

  // 6. Ensure renderManualDashboard also populates container if standalone
  const oldRenderManualRegex = /function renderManualDashboard\(user\) \{[\s\S]*?document\.getElementById\('count-done-tasks'\)\.textContent = completedCount;\s*\}/;
  const newRenderManualCode = `function renderManualDashboard(user) {
      if (currentLiveDashboard) {
        renderManualDashboardFromLive(currentLiveDashboard);
        return;
      }
      const synthesized = getSynthesizedDashboardForEmployee(currentLiveEmployeeId || user?.employeeId || 'E001');
      if (synthesized) {
        currentLiveDashboard = synthesized;
        renderManualDashboardFromLive(synthesized);
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

      // Populate cards if not already present
      const container = document.getElementById('manual-checklist-container');
      if (container && container.children.length === 0) {
        dailyTasksState.forEach(t => {
          const card = document.createElement('div');
          card.className = \`manual-task-card \${t.done ? 'is-done' : ''}\`;
          card.id = \`manual-task-card-\${t.id}\`;
          card.dataset.status = t.done ? 'done' : 'pending';
          card.dataset.day = 'Day 1';
          card.innerHTML = \`
            <button class="manual-task-check-btn" onclick="toggleManualTask(\${t.id})">
              \${t.done ? '✓' : ''}
            </button>
            <div class="manual-task-info">
              <div class="manual-task-badges">
                <span class="manual-task-tag tag-engineering">\${t.tag || 'Engineering'}</span>
                <span style="font-size: 0.72rem; font-weight: 700; color: \${t.done ? '#059669' : '#d97706'};">
                  \${t.done ? '● Completed' : '● Action Required'}
                </span>
              </div>
              <div class="manual-task-title">\${t.title}</div>
              <div class="manual-task-desc">\${t.desc}</div>
            </div>
            <div class="manual-task-actions">
              <button class="btn-task-toggle \${t.done ? 'done-state' : 'pending-state'}" onclick="toggleManualTask(\${t.id})">
                \${t.done ? '✓ Completed' : 'Mark Complete'}
              </button>
              <button class="btn-task-explain" onclick="askCopilotToExplainTask('\${t.id}')">
                <span>💡 Ask AI Copilot</span>
              </button>
            </div>
          \`;
          container.appendChild(card);
        });
      }
    }`;

  if (oldRenderManualRegex.test(content)) {
    content = content.replace(oldRenderManualRegex, newRenderManualCode);
    console.log('  Patched renderManualDashboard fail-safe');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  Updated ${filePath}`);
});

console.log('Patch complete.');
