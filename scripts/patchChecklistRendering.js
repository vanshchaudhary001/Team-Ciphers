const fs = require('fs');
const path = require('path');

const datasetsJson = fs.readFileSync(path.join(__dirname, '..', 'data', 'datasets.json'), 'utf8');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Inject EMBEDDED_DATASETS before initDatasetLayer
  const datasetStoreCode = `
    // Embedded 5 Structured Datasets (Employees, Tasks, Progress, Resources, Contacts)
    window.__START_SMART_DATASETS__ = ${datasetsJson.trim()};

    function getSynthesizedDashboardForEmployee(empId) {
      const store = window.__START_SMART_DATASETS__;
      if (!store) return null;
      const emp = store.employees.find(e => e.employeeId === empId || e.email === empId) || store.employees.find(e => e.name.toLowerCase().includes('diya')) || store.employees[0];
      if (!emp) return null;

      const manager = store.contacts.find(c => c.contactId === emp.managerId) || null;
      const buddy = store.contacts.find(c => c.contactId === emp.buddyId) || {
        name: 'Dhruv Agarwal',
        role: 'Onboarding Buddy',
        phone: '+91 80 6789 89928',
        email: 'buddy@demo-company.com'
      };

      const empProgress = store.progress.filter(p => p.employeeId === emp.employeeId);
      let assignedTasks = [];

      if (empProgress.length > 0) {
        assignedTasks = empProgress.map(p => {
          const taskDef = store.tasks.find(t => t.taskId === p.taskId) || {
            taskId: p.taskId,
            taskName: \`Onboarding Task \${p.taskId}\`,
            department: emp.department,
            day: 'Day 1',
            priority: 'High',
            isMandatory: true,
            resourceId: null
          };
          const resource = taskDef.resourceId ? store.resources.find(r => r.resourceId === taskDef.resourceId) : null;
          return {
            taskId: taskDef.taskId,
            taskName: taskDef.taskName,
            department: taskDef.department || emp.department,
            day: taskDef.day || 'Day 1',
            priority: taskDef.priority || 'High',
            isMandatory: taskDef.isMandatory !== false,
            status: p.status || 'Pending',
            progressId: p.progressId,
            resource
          };
        });
      } else {
        const relevant = store.tasks.filter(t =>
          t.applicableRole === 'All' ||
          t.applicableRole === emp.role ||
          t.department === emp.department
        );
        assignedTasks = relevant.map((t, idx) => {
          const resource = t.resourceId ? store.resources.find(r => r.resourceId === t.resourceId) : null;
          return {
            taskId: t.taskId,
            taskName: t.taskName,
            department: t.department,
            day: t.day,
            priority: t.priority,
            isMandatory: t.isMandatory !== false,
            status: idx < 2 ? 'Completed' : 'Pending',
            progressId: \`P_SYN_\${emp.employeeId}_\${t.taskId}\`,
            resource
          };
        });
      }

      const totalTasks = assignedTasks.length;
      const completedTasks = assignedTasks.filter(t => t.status === 'Completed').length;
      const pendingTasks = totalTasks - completedTasks;
      const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        employee: {
          ...emp,
          manager,
          buddy
        },
        metrics: {
          totalTasks,
          completedTasks,
          pendingTasks,
          percentage
        },
        tasks: assignedTasks
      };
    }
  `;

  // Insert datasetStoreCode right before let currentLiveEmployeeId = 'E001';
  if (!content.includes('window.__START_SMART_DATASETS__')) {
    content = content.replace("let currentLiveEmployeeId = 'E001';", datasetStoreCode + "\n    let currentLiveEmployeeId = 'E001';");
  }

  // 2. Enhance initDatasetLayer to use embedded store if fetch fails
  const oldInitDataset = `    async function initDatasetLayer() {
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
    }`;

  const newInitDataset = `    async function initDatasetLayer() {
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
        console.warn('Dataset layer live API bypassed, using embedded datasets store:', err);
      }

      // Offline / Vercel fallback: if datasets were not loaded from server, load from embedded store
      if ((!allEmployeesDataset || allEmployeesDataset.length === 0) && window.__START_SMART_DATASETS__) {
        allEmployeesDataset = window.__START_SMART_DATASETS__.employees || [];
      }
      if ((!allContactsDataset || allContactsDataset.length === 0) && window.__START_SMART_DATASETS__) {
        allContactsDataset = window.__START_SMART_DATASETS__.contacts || [];
        populateContactDropdownOptions(allContactsDataset);
      }
    }`;

  if (content.includes(oldInitDataset)) {
    content = content.replace(oldInitDataset, newInitDataset);
  }

  // 3. Enhance loadLiveEmployeeDashboard to use getSynthesizedDashboardForEmployee if server returns error or is unreachable
  const oldLoadLive = `    async function loadLiveEmployeeDashboard(empId) {
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
    }`;

  const newLoadLive = `    async function loadLiveEmployeeDashboard(empId) {
      currentLiveEmployeeId = empId || currentLiveEmployeeId || 'E001';
      try {
        const base = getApiBaseUrl();
        let loadedData = null;
        try {
          const res = await fetch(\`\${base}/api/employees/\${currentLiveEmployeeId}/dashboard\`);
          if (res.ok) {
            loadedData = await res.json();
          }
        } catch (fetchErr) {
          console.debug('Live API fetch unavailable, falling back to embedded dataset store:', fetchErr);
        }

        if (loadedData && loadedData.tasks && loadedData.tasks.length > 0) {
          currentLiveDashboard = loadedData;
          liveTasksList = loadedData.tasks || [];
          renderManualDashboardFromLive(loadedData);
          return;
        }

        // Offline / Vercel fallback: synthesize complete dashboard with tasks from embedded dataset
        const synthData = getSynthesizedDashboardForEmployee(currentLiveEmployeeId);
        if (synthData && synthData.tasks && synthData.tasks.length > 0) {
          currentLiveDashboard = synthData;
          liveTasksList = synthData.tasks || [];
          renderManualDashboardFromLive(synthData);
          return;
        }

        renderManualDashboard(currentAuthenticatedUser);
      } catch (err) {
        console.error('Failed to load employee dashboard:', err);
        renderManualDashboard(currentAuthenticatedUser);
      }
    }`;

  if (content.includes(oldLoadLive)) {
    content = content.replace(oldLoadLive, newLoadLive);
  }

  // 4. Fix renderManualDashboard(user) to ALWAYS render #manual-checklist-container
  const oldRenderManual = `    function renderManualDashboard(user) {
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
    }`;

  const newRenderManual = `    function renderManualDashboard(user) {
      if (currentLiveDashboard) {
        renderManualDashboardFromLive(currentLiveDashboard);
        return;
      }
      if (!user) user = { name: 'Aarav Sharma', title: 'Software Engineer', email: 'aarav.sharma@demo-company.com' };

      const nameEl = document.getElementById('manual-user-name');
      const roleEl = document.getElementById('manual-user-role');
      const emailEl = document.getElementById('manual-user-email');
      const copilotUserEl = document.getElementById('copilot-context-user');

      if (nameEl) nameEl.textContent = user.name;
      if (roleEl) roleEl.textContent = user.title || 'Software Engineer';
      if (emailEl) emailEl.textContent = user.email || 'aarav.sharma@demo-company.com';
      if (copilotUserEl) copilotUserEl.textContent = user.name;

      const totalCount = dailyTasksState.length;
      const completedCount = dailyTasksState.filter(t => t.done).length;
      const pendingCount = totalCount - completedCount;
      const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      const pctEl = document.getElementById('manual-progress-pct');
      const statEl = document.getElementById('manual-tasks-stat');
      const barEl = document.getElementById('manual-linear-bar');
      const circleEl = document.getElementById('manual-progress-circle');

      if (pctEl) pctEl.textContent = \`\${pct}%\`;
      if (statEl) statEl.textContent = \`\${completedCount} of \${totalCount} Tasks Cleared (\${pct}%)\`;
      if (barEl) barEl.style.width = \`\${pct}%\`;

      const circumference = 238.76;
      const offset = circumference - (pct / 100) * circumference;
      if (circleEl) circleEl.style.strokeDashoffset = offset;

      const countAll = document.getElementById('count-all-tasks');
      const countPending = document.getElementById('count-pending-tasks');
      const countDone = document.getElementById('count-done-tasks');

      if (countAll) countAll.textContent = totalCount;
      if (countPending) countPending.textContent = pendingCount;
      if (countDone) countDone.textContent = completedCount;

      // Populate #manual-checklist-container with full task cards
      const container = document.getElementById('manual-checklist-container');
      if (container) {
        container.innerHTML = '';
        if (dailyTasksState.length === 0) {
          container.innerHTML = \`
            <div style="padding: 24px; text-align: center; color: var(--color-slate-500); background: var(--color-slate-50); border-radius: var(--radius-md);">
              No onboarding tasks assigned for this role.
            </div>
          \`;
        } else {
          dailyTasksState.forEach(task => {
            const isDone = !!task.done;
            const card = document.createElement('div');
            card.className = \`manual-task-card \${isDone ? 'is-done' : ''}\`;
            card.id = \`manual-task-card-\${task.id}\`;
            card.dataset.status = isDone ? 'done' : 'pending';

            const priorityColor = task.priority === 'High' ? '#dc2626' : (task.priority === 'Medium' ? '#2563eb' : '#64748b');
            const priorityBg = task.priority === 'High' ? '#fee2e2' : (task.priority === 'Medium' ? '#dbeafe' : '#f1f5f9');

            card.innerHTML = \`
              <button class="manual-task-check-btn" onclick="toggleManualTask(\${task.id})" title="\${isDone ? 'Mark as Pending' : 'Mark as Complete'}">
                \${isDone ? '✓' : ''}
              </button>
              <div class="manual-task-info">
                <div class="manual-task-badges" style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                  <span class="manual-task-tag \${task.tagClass || 'tag-engineering'}" style="background: #e0e7ff; color: #3730a3; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">\${task.tag || 'General'}</span>
                  <span style="background: #f1f5f9; color: #334155; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">⏱️ \${task.duration || '30 mins'}</span>
                  <span style="background: \${priorityBg}; color: \${priorityColor}; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">\${task.priority || 'Medium'} Priority</span>
                  <span style="font-size: 0.72rem; font-weight: 700; color: \${isDone ? '#059669' : '#d97706'};">
                    \${isDone ? '● Completed' : '● Action Required'}
                  </span>
                </div>
                <div class="manual-task-title" style="font-size: 1rem; font-weight: 800; margin-top: 6px; color: var(--color-slate-900);">\${task.title}</div>
                <div class="manual-task-desc" style="font-size: 0.82rem; color: var(--color-slate-600); margin-top: 4px;">
                  \${task.desc || ''}
                </div>
              </div>
              <div class="manual-task-actions">
                <button class="btn-task-toggle \${isDone ? 'done-state' : 'pending-state'}" onclick="toggleManualTask(\${task.id})">
                  \${isDone ? '✓ Completed' : 'Mark Complete'}
                </button>
                <button class="btn-task-explain" onclick="askCopilotToExplainTask(\${task.id})" title="Ask AI Copilot for step-by-step guidance">
                  <span>💡 Ask AI Copilot</span>
                </button>
              </div>
            \`;
            container.appendChild(card);
          });
        }
      }

      filterManualTasks(currentTaskFilter || 'all');
      updateCopilotChips();
    }`;

  if (content.includes(oldRenderManual)) {
    content = content.replace(oldRenderManual, newRenderManual);
  }

  // 5. Enhance toggleLiveTask to update in-memory / local state on offline or Vercel
  const oldToggleLive = `    async function toggleLiveTask(progressId, currentStatus, taskId) {
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
    }`;

  const newToggleLive = `    async function toggleLiveTask(progressId, currentStatus, taskId) {
      const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';

      // Reactively update local dashboard model immediately
      if (currentLiveDashboard && currentLiveDashboard.tasks) {
        const target = currentLiveDashboard.tasks.find(t => t.progressId === progressId || t.taskId === taskId);
        if (target) {
          target.status = nextStatus;
          const total = currentLiveDashboard.tasks.length;
          const completed = currentLiveDashboard.tasks.filter(t => t.status === 'Completed').length;
          currentLiveDashboard.metrics = {
            totalTasks: total,
            completedTasks: completed,
            pendingTasks: total - completed,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
          };
        }
      }

      // Update in embedded progress dataset
      if (window.__START_SMART_DATASETS__ && window.__START_SMART_DATASETS__.progress) {
        const prog = window.__START_SMART_DATASETS__.progress.find(p => p.progressId === progressId);
        if (prog) {
          prog.status = nextStatus;
        } else if (currentLiveEmployeeId) {
          window.__START_SMART_DATASETS__.progress.push({
            progressId,
            employeeId: currentLiveEmployeeId,
            taskId,
            status: nextStatus,
            assignedDate: '2026-09-30'
          });
        }
      }

      // Attempt live server PATCH in background
      try {
        const base = getApiBaseUrl();
        fetch(\`\${base}/api/progress/\${progressId}\`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        }).catch(() => {});
      } catch (e) {}

      showNotification(\`✓ \${taskId}: Status updated to \${nextStatus}!\`);

      if (currentLiveDashboard) {
        renderManualDashboardFromLive(currentLiveDashboard);
      } else {
        renderManualDashboard(currentAuthenticatedUser);
      }
    }`;

  if (content.includes(oldToggleLive)) {
    content = content.replace(oldToggleLive, newToggleLive);
  }

  // 6. Ensure filterManualTasks is called at the end of renderManualDashboardFromLive
  if (content.includes("updateLiveCopilotChips(tasks);") && !content.includes("filterManualTasks(currentTaskFilter || 'all');\n      updateLiveCopilotChips(tasks);")) {
    content = content.replace("updateLiveCopilotChips(tasks);", "filterManualTasks(currentTaskFilter || 'all');\n      updateLiveCopilotChips(tasks);");
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully patched: ${filePath}`);
}

['client/index.html', 'index.html', 'client/public/index.html'].forEach(f => {
  const p = path.join(__dirname, '..', f);
  if (fs.existsSync(p)) {
    patchFile(p);
  }
});
