// ==============================================================
// ROLE-BASED TASK MANAGEMENT & HIERARCHICAL TASK CONTROL ENGINE
// ==============================================================

let currentMgmtSubordinates = [];
let filteredMgmtSubordinates = [];
let currentActiveSubordinate = null;
let currentSubordinateTasks = [];
let currentSubordinateDayFilter = 'all';
let currentSubordinateRoleFilter = 'ALL';
let currentSubordinateSearchQuery = '';

// Check if current authenticated user has authority to manage tasks
function isCurrentUserManager() {
  if (!window.currentLiveDashboard?.employee) return false;
  const role = (window.currentLiveDashboard.employee.roleLevel || window.currentLiveDashboard.employee.role || '').toLowerCase();
  return role.includes('manager') || role === 'ceo' || role.includes('director') || role.includes('executive');
}

function isCurrentUserDataLead() {
  if (!window.currentLiveDashboard?.employee) return false;
  const role = (window.currentLiveDashboard.employee.roleLevel || window.currentLiveDashboard.employee.role || '').toLowerCase();
  return role.includes('lead') || role.includes('senior');
}

function canCurrentSessionManageTasks() {
  return isCurrentUserManager() || isCurrentUserDataLead();
}

// Switch between My Checklist and Subordinate Management inside Step 4A
function switchJoinerWorkspaceTab(tab) {
  const checklistBtn = document.getElementById('tab-my-checklist-btn');
  const mgmtBtn = document.getElementById('tab-subordinate-management-btn');
  const splitContainer = document.querySelector('.joiner-split-container');

  if (tab === 'management') {
    if (!canCurrentSessionManageTasks()) {
      showNotification('🚫 Access Restricted: Associates have execution-only access.');
      return;
    }
    openTaskManagement();
  } else {
    goToStep('step-joiner-chatbot');
    if (checklistBtn) checklistBtn.classList.add('active');
    if (mgmtBtn) mgmtBtn.classList.remove('active');
  }
}

// Open Task Management Control Center
async function openTaskManagement() {
  if (!canCurrentSessionManageTasks()) {
    showNotification('🚫 Access Restricted: Associates have execution-only access.');
    return;
  }

  const isMgr = isCurrentUserManager();
  const isLd = isCurrentUserDataLead();

  // Update Authority Badge
  const authBadge = document.getElementById('mgmt-authority-badge');
  const authScope = document.getElementById('mgmt-authority-scope-text');
  const subLeadFilterBtn = document.getElementById('sub-filter-lead');

  if (isMgr) {
    if (authBadge) {
      authBadge.textContent = 'MANAGER HIERARCHY ACTIVE';
      authBadge.style.background = '#0037b0';
    }
    if (authScope) {
      authScope.textContent = 'Authority Scope: Leads & Associates Across Department';
    }
    if (subLeadFilterBtn) subLeadFilterBtn.style.display = 'inline-block';
  } else if (isLd) {
    if (authBadge) {
      authBadge.textContent = 'LEAD HIERARCHY ACTIVE';
      authBadge.style.background = '#0d9488';
    }
    if (authScope) {
      authScope.textContent = 'Authority Scope: Assigned Associates (Direct Reports)';
    }
    // Lead CANNOT manage other leads (Section 9)
    if (subLeadFilterBtn) subLeadFilterBtn.style.display = 'none';
  }

  goToStep('step-task-management');
  await loadSubordinatesList();
}

// Load manageable subordinates from backend or authoritative dataset
async function loadSubordinatesList() {
  const isMgr = isCurrentUserManager();
  const currentUser = window.currentLiveDashboard?.employee || {};
  const currentDept = currentUser.department || 'Software Engineering';
  const currentTeam = currentUser.team || 'Web and Mobile Development';

  let subs = [];

  // Try live API first
  try {
    const token = localStorage.getItem('startsmart_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch('/api/v1/task-management/subordinates', { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.subordinates && data.subordinates.length > 0) {
        subs = data.subordinates;
      }
    }
  } catch (err) {
    console.debug('Live subordinates fetch error, using authoritative department roster:', err);
  }

  // Fallback to authoritative departmental subordinates
  if (subs.length === 0) {
    if (isMgr) {
      // Manager can see both Leads and Associates in team & department
      subs = [
        {
          id: 'sub-lead-01',
          employeeId: 'EMP-LED-001',
          name: 'Arjun Patel',
          role: 'Lead - Senior Software Engineer',
          roleLevel: 'Lead',
          department: currentDept,
          team: currentTeam,
          managerEmail: currentUser.email || 'manager@technova.demo',
          buddyEmail: 'admin@technova.demo',
          totalTasks: 30,
          completedTasks: 22,
          progress: 73
        },
        {
          id: 'sub-assoc-01',
          employeeId: 'EMP-ASC-001',
          name: 'Rahul Sharma',
          role: 'Associate - Software Engineer',
          roleLevel: 'Associate',
          department: currentDept,
          team: currentTeam,
          managerEmail: currentUser.email || 'manager@technova.demo',
          buddyEmail: 'arjun.patel@technova.demo',
          totalTasks: 30,
          completedTasks: 18,
          progress: 60
        },
        {
          id: 'sub-assoc-02',
          employeeId: 'EMP-ASC-002',
          name: 'Aman Patel',
          role: 'Associate - Frontend Developer',
          roleLevel: 'Associate',
          department: currentDept,
          team: currentTeam,
          managerEmail: currentUser.email || 'manager@technova.demo',
          buddyEmail: 'arjun.patel@technova.demo',
          totalTasks: 30,
          completedTasks: 12,
          progress: 40
        }
      ];
    } else {
      // Lead can ONLY see assigned Associates (Section 8 & 9)
      subs = [
        {
          id: 'sub-assoc-01',
          employeeId: 'EMP-ASC-001',
          name: 'Rahul Sharma',
          role: 'Associate - Software Engineer',
          roleLevel: 'Associate',
          department: currentDept,
          team: currentTeam,
          managerEmail: 'manager@technova.demo',
          buddyEmail: currentUser.email || 'lead@technova.demo',
          totalTasks: 30,
          completedTasks: 18,
          progress: 60
        },
        {
          id: 'sub-assoc-02',
          employeeId: 'EMP-ASC-002',
          name: 'Aman Patel',
          role: 'Associate - Frontend Developer',
          roleLevel: 'Associate',
          department: currentDept,
          team: currentTeam,
          managerEmail: 'manager@technova.demo',
          buddyEmail: currentUser.email || 'lead@technova.demo',
          totalTasks: 30,
          completedTasks: 12,
          progress: 40
        }
      ];
    }
  }

  currentMgmtSubordinates = subs;
  applySubordinateFilters();
}

function applySubordinateFilters() {
  let list = currentMgmtSubordinates;

  // Filter by role
  if (currentSubordinateRoleFilter === 'LEAD') {
    list = list.filter(s => s.roleLevel === 'Lead' || s.role.toLowerCase().includes('lead'));
  } else if (currentSubordinateRoleFilter === 'ASSOCIATE') {
    list = list.filter(s => s.roleLevel === 'Associate' || s.role.toLowerCase().includes('associate'));
  }

  // Filter by search query
  if (currentSubordinateSearchQuery) {
    const q = currentSubordinateSearchQuery.toLowerCase();
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.employeeId && s.employeeId.toLowerCase().includes(q)) ||
      s.role.toLowerCase().includes(q)
    );
  }

  filteredMgmtSubordinates = list;

  // Update counts
  const allCount = currentMgmtSubordinates.length;
  const leadCount = currentMgmtSubordinates.filter(s => s.roleLevel === 'Lead' || s.role.toLowerCase().includes('lead')).length;
  const assocCount = currentMgmtSubordinates.filter(s => s.roleLevel === 'Associate' || s.role.toLowerCase().includes('associate')).length;

  const countAllEl = document.getElementById('count-sub-all');
  const countLeadEl = document.getElementById('count-sub-leads');
  const countAssocEl = document.getElementById('count-sub-assocs');
  if (countAllEl) countAllEl.textContent = allCount;
  if (countLeadEl) countLeadEl.textContent = leadCount;
  if (countAssocEl) countAssocEl.textContent = assocCount;

  // Populate Select Dropdown
  const select = document.getElementById('mgmt-subordinate-select');
  if (select) {
    select.innerHTML = '';
    if (filteredMgmtSubordinates.length === 0) {
      select.innerHTML = '<option value="">No matching subordinates found</option>';
    } else {
      filteredMgmtSubordinates.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.roleLevel || 'Associate'} · ${s.progress}%)`;
        select.appendChild(opt);
      });
    }
  }

  // Auto-select first subordinate if none selected or previous selection gone
  if (filteredMgmtSubordinates.length > 0) {
    const prevId = currentActiveSubordinate ? currentActiveSubordinate.id : null;
    const matched = filteredMgmtSubordinates.find(s => s.id === prevId) || filteredMgmtSubordinates[0];
    selectSubordinate(matched);
  } else {
    currentActiveSubordinate = null;
    renderSubordinateDetailBanner();
    renderSubordinateTasksList([]);
  }
}

function filterMgmtSubordinatesByRole(role) {
  currentSubordinateRoleFilter = role;
  ['all', 'lead', 'assoc'].forEach(k => {
    const btn = document.getElementById(`sub-filter-${k}`);
    if (btn) btn.classList.remove('active');
  });

  if (role === 'ALL') {
    const b = document.getElementById('sub-filter-all');
    if (b) b.classList.add('active');
  } else if (role === 'LEAD') {
    const b = document.getElementById('sub-filter-lead');
    if (b) b.classList.add('active');
  } else if (role === 'ASSOCIATE') {
    const b = document.getElementById('sub-filter-assoc');
    if (b) b.classList.add('active');
  }

  applySubordinateFilters();
}

function onSubordinateSearchInput() {
  const input = document.getElementById('mgmt-subordinate-search');
  currentSubordinateSearchQuery = input ? input.value.trim() : '';
  applySubordinateFilters();
}

function onMgmtSubordinateSelectChange() {
  const select = document.getElementById('mgmt-subordinate-select');
  const selId = select ? select.value : '';
  const found = currentMgmtSubordinates.find(s => s.id === selId);
  if (found) selectSubordinate(found);
}

// Select and load tasks for subordinate
async function selectSubordinate(subordinate) {
  currentActiveSubordinate = subordinate;
  renderSubordinateDetailBanner();
  await loadSubordinateTasks(subordinate);
}

function renderSubordinateDetailBanner() {
  const card = document.getElementById('mgmt-active-subordinate-card');
  if (!card) return;

  if (!currentActiveSubordinate) {
    card.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--color-slate-500);">
        <p style="font-weight: 600;">No subordinate selected or available.</p>
      </div>
    `;
    return;
  }

  const s = currentActiveSubordinate;
  const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const avatar = document.getElementById('mgmt-sub-avatar');
  const nameEl = document.getElementById('mgmt-sub-name');
  const roleBadge = document.getElementById('mgmt-sub-role-badge');
  const deptEl = document.getElementById('mgmt-sub-dept');
  const empidEl = document.getElementById('mgmt-sub-empid');
  const mgrEl = document.getElementById('mgmt-sub-manager');
  const leadEl = document.getElementById('mgmt-sub-lead');
  const progressPctEl = document.getElementById('mgmt-sub-progress-pct');
  const completedCountEl = document.getElementById('mgmt-sub-completed-count');
  const totalCountEl = document.getElementById('mgmt-sub-total-count');
  const progressBarEl = document.getElementById('mgmt-sub-progress-bar');
  const modalTargetName = document.getElementById('modal-add-target-name');

  if (avatar) avatar.textContent = initials;
  if (nameEl) nameEl.textContent = s.name;
  if (roleBadge) {
    roleBadge.textContent = s.roleLevel || 'Associate';
    if (s.roleLevel === 'Lead') {
      roleBadge.style.background = '#ccfbf1';
      roleBadge.style.color = '#0f766e';
    } else {
      roleBadge.style.background = '#e0f2fe';
      roleBadge.style.color = '#0284c7';
    }
  }
  if (deptEl) deptEl.textContent = `${s.department} · ${s.team}`;
  if (empidEl) empidEl.textContent = s.employeeId || 'EMP-001';
  if (mgrEl) mgrEl.textContent = s.managerEmail ? s.managerEmail.split('@')[0] : 'Rohan Verma (Manager)';
  if (leadEl) leadEl.textContent = s.buddyEmail ? s.buddyEmail.split('@')[0] : 'Priya Lead';
  if (progressPctEl) progressPctEl.textContent = s.progress;
  if (completedCountEl) completedCountEl.textContent = s.completedTasks;
  if (totalCountEl) totalCountEl.textContent = s.totalTasks;
  if (progressBarEl) progressBarEl.style.width = `${s.progress}%`;
  if (modalTargetName) modalTargetName.textContent = s.name;
}

// Fetch tasks for the active subordinate
async function loadSubordinateTasks(subordinate) {
  let tasks = [];

  // Try live API
  try {
    const token = localStorage.getItem('startsmart_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`/api/v1/task-management/employees/${subordinate.id}/tasks`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.tasks && data.tasks.length > 0) {
        tasks = data.tasks;
      }
    }
  } catch (err) {
    console.debug('Error loading live subordinate tasks:', err);
  }

  // Fallback to authoritative 30-task template with individual custom state
  if (tasks.length === 0) {
    // Check if we already cached modified tasks in memory for this employee
    if (window._employeeTaskStore && window._employeeTaskStore[subordinate.id]) {
      tasks = window._employeeTaskStore[subordinate.id];
    } else {
      // Generate 30 authoritative tasks for the subordinate's role
      for (let i = 1; i <= 30; i++) {
        const dayStr = i <= 6 ? 'Day 1' : (i <= 12 ? 'Day 2' : (i <= 18 ? 'Day 3' : (i <= 24 ? 'Day 4' : 'Day 5')));
        const isDone = (i <= Math.round((subordinate.completedTasks || 18)));
        tasks.push({
          id: `TASK_${subordinate.id}_${i}`,
          taskId: `T${String(i).padStart(3, '0')}`,
          title: i === 1 ? 'Complete Enterprise Security & Compliance Orientation' : (i === 2 ? 'Meet Reporting Lead & Review Sprint Objectives' : `${subordinate.team} Core Playbook Milestone #${i}`),
          taskName: i === 1 ? 'Complete Enterprise Security & Compliance Orientation' : (i === 2 ? 'Meet Reporting Lead & Review Sprint Objectives' : `${subordinate.team} Core Playbook Milestone #${i}`),
          description: `Mandatory onboarding activity for ${subordinate.name} in ${subordinate.department} (${subordinate.team}).`,
          day: dayStr,
          priority: i <= 6 ? 'High' : (i <= 20 ? 'Medium' : 'Standard'),
          category: i % 2 === 0 ? 'Engineering' : 'Compliance',
          estimatedDuration: '45 mins',
          state: isDone ? 'DONE' : 'AVAILABLE',
          status: isDone ? 'Completed' : 'Pending',
          managementStatus: 'ACTIVE',
          originType: 'DEFAULT', // DEFAULT, CUSTOM, MODIFIED, ARCHIVED
          version: 1,
          orderIndex: i,
          history: [
            {
              modifiedByName: 'System Template',
              modifiedByRole: 'SYSTEM',
              action: 'TASK_CREATED',
              createdAt: '2026-10-04T00:00:00.000Z',
              summary: 'Initial assignment from authoritative onboarding template'
            }
          ]
        });
      }
      if (!window._employeeTaskStore) window._employeeTaskStore = {};
      window._employeeTaskStore[subordinate.id] = tasks;
    }
  }

  currentSubordinateTasks = tasks;
  updateSubordinateDayCounts();
  filterMgmtTasksByDay(currentSubordinateDayFilter);
}

function updateSubordinateDayCounts() {
  const activeTasks = currentSubordinateTasks.filter(t => t.managementStatus !== 'ARCHIVED');
  const archivedTasks = currentSubordinateTasks.filter(t => t.managementStatus === 'ARCHIVED');

  const d1 = activeTasks.filter(t => t.day === 'Day 1').length;
  const d2 = activeTasks.filter(t => t.day === 'Day 2').length;
  const d3 = activeTasks.filter(t => t.day === 'Day 3').length;
  const d4 = activeTasks.filter(t => t.day === 'Day 4').length;
  const d5 = activeTasks.filter(t => t.day === 'Day 5').length;

  const setT = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setT('mgmt-count-all', activeTasks.length);
  setT('mgmt-count-d1', d1);
  setT('mgmt-count-d2', d2);
  setT('mgmt-count-d3', d3);
  setT('mgmt-count-d4', d4);
  setT('mgmt-count-d5', d5);
  setT('mgmt-count-archived', archivedTasks.length);
}

function filterMgmtTasksByDay(day) {
  currentSubordinateDayFilter = day;

  ['all', 'day1', 'day2', 'day3', 'day4', 'day5', 'archived'].forEach(k => {
    const btn = document.getElementById(`mgmt-day-pill-${k}`);
    if (btn) btn.classList.remove('active');
  });

  const activeBtn = document.getElementById(day === 'all' ? 'mgmt-day-pill-all' : (day === 'archived' ? 'mgmt-day-pill-archived' : `mgmt-day-pill-${day.toLowerCase().replace(' ', '')}`));
  if (activeBtn) activeBtn.classList.add('active');

  let list = currentSubordinateTasks;
  if (day === 'archived') {
    list = list.filter(t => t.managementStatus === 'ARCHIVED');
  } else {
    list = list.filter(t => t.managementStatus !== 'ARCHIVED');
    if (day !== 'all') {
      list = list.filter(t => t.day === day);
    }
  }

  // Sort by orderIndex
  list.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

  renderSubordinateTasksList(list);
}

function renderSubordinateTasksList(tasks) {
  const container = document.getElementById('mgmt-tasks-container');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div style="background: #ffffff; border: 1px dashed var(--color-slate-300); border-radius: 12px; padding: 36px 20px; text-align: center; color: var(--color-slate-500);">
        <p style="font-size: 0.95rem; font-weight: 700; color: var(--color-slate-700); margin: 0 0 6px 0;">No tasks found for this filter.</p>
        <p style="font-size: 0.82rem; margin: 0 0 16px 0;">Use "+ Add Custom Task" to personalize this onboarding plan.</p>
        <button class="btn-primary" onclick="openAddTaskModal()" style="padding: 6px 14px; font-size: 0.82rem; background: #0037b0; color: #fff;">+ Add Task</button>
      </div>
    `;
    return;
  }

  container.innerHTML = tasks.map((t, idx) => {
    const isCompleted = t.state === 'DONE' || t.status === 'Completed';
    const isArchived = t.managementStatus === 'ARCHIVED';

    // Origin Badge
    let originBadge = '<span style="font-size: 0.7rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;">DEFAULT</span>';
    if (t.originType === 'CUSTOM' || t.isCustom) {
      originBadge = '<span style="font-size: 0.7rem; font-weight: 800; padding: 2px 7px; border-radius: 4px; background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;">CUSTOM</span>';
    } else if (t.originType === 'MODIFIED' || t.isModified) {
      originBadge = '<span style="font-size: 0.7rem; font-weight: 800; padding: 2px 7px; border-radius: 4px; background: #fef3c7; color: #92400e; border: 1px solid #fde68a;">MODIFIED</span>';
    }
    if (isArchived) {
      originBadge = '<span style="font-size: 0.7rem; font-weight: 800; padding: 2px 7px; border-radius: 4px; background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;">ARCHIVED</span>';
    }

    // Priority styling
    let priorityBadge = '<span style="font-size: 0.7rem; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 2px 7px; border-radius: 4px;">Standard</span>';
    if (t.priority === 'High') {
      priorityBadge = '<span style="font-size: 0.7rem; font-weight: 700; color: #be123c; background: #ffe4e6; padding: 2px 7px; border-radius: 4px;">High</span>';
    } else if (t.priority === 'Medium') {
      priorityBadge = '<span style="font-size: 0.7rem; font-weight: 700; color: #b45309; background: #fef3c7; padding: 2px 7px; border-radius: 4px;">Medium</span>';
    }

    return `
      <div class="manual-task-card" style="background: #ffffff; border: 1px solid ${isArchived ? '#fecaca' : 'var(--color-slate-200)'}; border-radius: 12px; padding: 18px 22px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; box-shadow: var(--shadow-xs); transition: all 0.2s ease;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
            ${originBadge}
            <span style="font-size: 0.74rem; font-weight: 700; color: var(--color-slate-500); background: var(--color-slate-100); padding: 2px 8px; border-radius: 4px;">${t.day || 'Day 1'}</span>
            ${priorityBadge}
            <span style="font-size: 0.72rem; color: var(--color-slate-400); font-weight: 600;">⏱ ${t.estimatedDuration || '45 mins'}</span>
            <span style="font-size: 0.72rem; color: var(--color-slate-400);">·</span>
            <span style="font-size: 0.72rem; color: var(--color-slate-500); font-weight: 600;">📂 ${t.category || 'General'}</span>
            ${isCompleted ? '<span style="font-size: 0.72rem; font-weight: 700; color: #059669; background: #ecfdf5; padding: 1px 6px; border-radius: 4px;">✓ Completed</span>' : '<span style="font-size: 0.72rem; font-weight: 700; color: #64748b; background: #f1f5f9; padding: 1px 6px; border-radius: 4px;">○ Pending</span>'}
          </div>

          <h3 style="font-size: 0.98rem; font-weight: 800; color: ${isArchived ? '#94a3b8' : 'var(--color-slate-900)'}; margin: 0 0 6px 0; text-decoration: ${isArchived ? 'line-through' : 'none'};">
            ${escapeHtml(t.title || t.taskName)}
          </h3>

          <p style="font-size: 0.83rem; color: var(--color-slate-600); margin: 0; line-height: 1.5; max-width: 900px;">
            ${escapeHtml(t.description || t.purpose || '')}
          </p>

          ${t.resourceLinks ? `
            <div style="margin-top: 8px; font-size: 0.75rem;">
              🔗 <a href="${escapeHtml(t.resourceLinks)}" target="_blank" style="color: #0284c7; text-decoration: underline;">${escapeHtml(t.resourceLinks)}</a>
            </div>
          ` : ''}
        </div>

        <!-- Management Actions Toolbar -->
        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0; flex-wrap: wrap;">
          <!-- Move Up / Down -->
          ${!isArchived ? `
            <button title="Move Task Up" class="persona-pill-btn" onclick="moveTaskOrder('${t.id}', 'up')" style="padding: 4px 8px; font-size: 0.75rem;">⬆</button>
            <button title="Move Task Down" class="persona-pill-btn" onclick="moveTaskOrder('${t.id}', 'down')" style="padding: 4px 8px; font-size: 0.75rem;">⬇</button>
            <button class="persona-pill-btn" onclick="openEditTaskModal('${t.id}')" style="padding: 4px 10px; font-size: 0.75rem; background: #f8fafc; font-weight: 600;">
              ✏️ Edit
            </button>
            <button class="persona-pill-btn" onclick="promptArchiveTask('${t.id}')" style="padding: 4px 10px; font-size: 0.75rem; color: #be123c; border-color: #fecdd3; background: #fff;">
              📦 Archive
            </button>
          ` : `
            <button class="persona-pill-btn" onclick="restoreArchivedTask('${t.id}')" style="padding: 4px 12px; font-size: 0.75rem; background: #ecfdf5; color: #047857; border-color: #a7f3d0; font-weight: 700;">
              🔄 Restore
            </button>
          `}

          ${t.isModified ? `
            <button title="Reset to Default Onboarding Plan" class="persona-pill-btn" onclick="resetTaskToDefault('${t.id}')" style="padding: 4px 8px; font-size: 0.72rem; color: #d97706; border-color: #fde68a;">
              ↩ Reset Default
            </button>
          ` : ''}

          <button class="persona-pill-btn" onclick="openTaskHistoryModal('${t.id}')" style="padding: 4px 8px; font-size: 0.75rem; color: var(--color-slate-600);" title="View Change Audit Log">
            📜 History
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Modal 1: Add Custom Task
function openAddTaskModal() {
  if (!currentActiveSubordinate) {
    showNotification('Please select a subordinate employee first.');
    return;
  }
  const modal = document.getElementById('modal-mgmt-add-task');
  const targetName = document.getElementById('modal-add-target-name');
  if (targetName) targetName.textContent = currentActiveSubordinate.name;
  if (modal) modal.style.display = 'flex';
}

function closeAddTaskModal() {
  const modal = document.getElementById('modal-mgmt-add-task');
  if (modal) modal.style.display = 'none';
}

async function submitAddTask(e) {
  e.preventDefault();
  if (!currentActiveSubordinate) return;

  const title = document.getElementById('add-task-title').value.trim();
  const desc = document.getElementById('add-task-desc').value.trim();
  const day = document.getElementById('add-task-day').value;
  const priority = document.getElementById('add-task-priority').value;
  const duration = document.getElementById('add-task-duration').value.trim();
  const category = document.getElementById('add-task-category').value.trim();
  const resource = document.getElementById('add-task-resource').value.trim();
  const required = document.getElementById('add-task-required').checked;

  if (!title) return;

  const taskData = {
    title,
    description: desc,
    day,
    priority,
    category: category || 'Engineering',
    estimatedDuration: duration || '45 mins',
    resourceLinks: resource || null,
    required,
  };

  // Try live API first
  let created = null;
  try {
    const token = localStorage.getItem('startsmart_token');
    const headers = token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' };
    const res = await fetch(`/api/v1/task-management/employees/${currentActiveSubordinate.id}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(taskData)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.task) {
        created = data.task;
      }
    }
  } catch (err) {
    console.debug('Live add task request error:', err);
  }

  // Fallback in-memory persistence
  if (!created) {
    const newIdx = currentSubordinateTasks.length + 1;
    created = {
      id: `TASK_${currentActiveSubordinate.id}_CUSTOM_${Date.now()}`,
      taskId: `T${String(newIdx).padStart(3, '0')}`,
      title,
      taskName: title,
      description: desc,
      day,
      priority,
      category,
      estimatedDuration: duration,
      resourceLinks: resource,
      state: 'AVAILABLE',
      status: 'Pending',
      managementStatus: 'ACTIVE',
      originType: 'CUSTOM',
      isCustom: true,
      version: 1,
      orderIndex: newIdx,
      history: [
        {
          modifiedByName: window.currentLiveDashboard?.employee?.name || 'Current Manager',
          modifiedByRole: isCurrentUserManager() ? 'MANAGER' : 'LEAD',
          action: 'TASK_CREATED',
          createdAt: new Date().toISOString(),
          summary: `Custom task added by ${isCurrentUserManager() ? 'Manager' : 'Lead'}`
        }
      ]
    };
  }

  currentSubordinateTasks.push(created);
  if (window._employeeTaskStore && window._employeeTaskStore[currentActiveSubordinate.id]) {
    window._employeeTaskStore[currentActiveSubordinate.id] = currentSubordinateTasks;
  }

  closeAddTaskModal();
  document.getElementById('form-mgmt-add-task').reset();
  updateSubordinateDayCounts();
  filterMgmtTasksByDay(currentSubordinateDayFilter);
  showNotification('✓ Task added successfully.');
}

// Modal 2: Edit Task
let currentEditingTaskId = null;

function openEditTaskModal(taskId) {
  const task = currentSubordinateTasks.find(t => t.id === taskId);
  if (!task) return;

  currentEditingTaskId = taskId;
  document.getElementById('edit-task-id').value = taskId;
  document.getElementById('edit-task-version').value = task.version || 1;
  document.getElementById('edit-task-title').value = task.title || task.taskName || '';
  document.getElementById('edit-task-desc').value = task.description || task.purpose || '';
  document.getElementById('edit-task-day').value = task.day || 'Day 1';
  document.getElementById('edit-task-priority').value = task.priority || 'Medium';
  document.getElementById('edit-task-duration').value = task.estimatedDuration || '45 mins';
  document.getElementById('edit-task-category').value = task.category || 'Engineering';
  document.getElementById('edit-task-resource').value = task.resourceLinks || '';

  const modal = document.getElementById('modal-mgmt-edit-task');
  if (modal) modal.style.display = 'flex';
}

function closeEditTaskModal() {
  const modal = document.getElementById('modal-mgmt-edit-task');
  if (modal) modal.style.display = 'none';
  currentEditingTaskId = null;
}

async function submitEditTask(e) {
  e.preventDefault();
  const taskId = document.getElementById('edit-task-id').value;
  const version = Number(document.getElementById('edit-task-version').value);
  const task = currentSubordinateTasks.find(t => t.id === taskId);
  if (!task) return;

  const updates = {
    title: document.getElementById('edit-task-title').value.trim(),
    description: document.getElementById('edit-task-desc').value.trim(),
    day: document.getElementById('edit-task-day').value,
    priority: document.getElementById('edit-task-priority').value,
    estimatedDuration: document.getElementById('edit-task-duration').value.trim(),
    category: document.getElementById('edit-task-category').value.trim(),
    resourceLinks: document.getElementById('edit-task-resource').value.trim(),
    expectedVersion: version,
  };

  // Try live API
  let updated = null;
  try {
    const token = localStorage.getItem('startsmart_token');
    const headers = token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' };
    const res = await fetch(`/api/v1/task-management/tasks/${taskId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates)
    });
    if (res.status === 409) {
      showNotification('⚠️ Conflict: This task was updated by another manager. Please review latest version.');
      return;
    }
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.task) {
        updated = data.task;
      }
    }
  } catch (err) {
    console.debug('Live task edit error:', err);
  }

  // Update in local task store
  task.title = updates.title;
  task.taskName = updates.title;
  task.description = updates.description;
  task.purpose = updates.description;
  task.day = updates.day;
  task.priority = updates.priority;
  task.estimatedDuration = updates.estimatedDuration;
  task.category = updates.category;
  task.resourceLinks = updates.resourceLinks;
  task.isModified = true;
  if (task.originType !== 'CUSTOM') task.originType = 'MODIFIED';
  task.version = (task.version || 1) + 1;

  if (!task.history) task.history = [];
  task.history.unshift({
    modifiedByName: window.currentLiveDashboard?.employee?.name || 'Manager',
    modifiedByRole: isCurrentUserManager() ? 'MANAGER' : 'LEAD',
    action: 'TASK_UPDATED',
    createdAt: new Date().toISOString(),
    summary: `Task updated by ${isCurrentUserManager() ? 'Manager' : 'Lead'}`
  });

  closeEditTaskModal();
  updateSubordinateDayCounts();
  filterMgmtTasksByDay(currentSubordinateDayFilter);
  showNotification('✓ Task updated successfully.');
}

// Modal 3: Archive Task (Safe)
let pendingArchiveTaskId = null;

function promptArchiveTask(taskId) {
  const task = currentSubordinateTasks.find(t => t.id === taskId);
  if (!task) return;

  pendingArchiveTaskId = taskId;
  const titleDisplay = document.getElementById('archive-task-title-display');
  const subDisplay = document.getElementById('archive-task-sub-display');
  if (titleDisplay) titleDisplay.textContent = task.title || task.taskName;
  if (subDisplay) subDisplay.textContent = `Assigned to: ${currentActiveSubordinate?.name || 'Employee'}`;

  const confirmBtn = document.getElementById('btn-confirm-archive-task');
  if (confirmBtn) {
    confirmBtn.onclick = () => confirmArchiveTask(taskId);
  }

  const modal = document.getElementById('modal-mgmt-archive-confirm');
  if (modal) modal.style.display = 'flex';
}

function closeArchiveModal() {
  const modal = document.getElementById('modal-mgmt-archive-confirm');
  if (modal) modal.style.display = 'none';
  pendingArchiveTaskId = null;
}

async function confirmArchiveTask(taskId) {
  const task = currentSubordinateTasks.find(t => t.id === taskId);
  if (!task) return;

  // Try live API
  try {
    const token = localStorage.getItem('startsmart_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    await fetch(`/api/v1/task-management/tasks/${taskId}/archive`, {
      method: 'POST',
      headers
    });
  } catch (err) {
    console.debug('Live archive call error:', err);
  }

  task.managementStatus = 'ARCHIVED';
  task.version = (task.version || 1) + 1;
  if (!task.history) task.history = [];
  task.history.unshift({
    modifiedByName: window.currentLiveDashboard?.employee?.name || 'Manager',
    modifiedByRole: isCurrentUserManager() ? 'MANAGER' : 'LEAD',
    action: 'TASK_ARCHIVED',
    createdAt: new Date().toISOString(),
    summary: `Archived from active plan by ${isCurrentUserManager() ? 'Manager' : 'Lead'}`
  });

  closeArchiveModal();
  updateSubordinateDayCounts();
  filterMgmtTasksByDay(currentSubordinateDayFilter);
  showNotification('✓ Task archived successfully.');
}

async function restoreArchivedTask(taskId) {
  const task = currentSubordinateTasks.find(t => t.id === taskId);
  if (!task) return;

  try {
    const token = localStorage.getItem('startsmart_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    await fetch(`/api/v1/task-management/tasks/${taskId}/restore`, {
      method: 'POST',
      headers
    });
  } catch (err) {
    console.debug('Live restore call error:', err);
  }

  task.managementStatus = 'ACTIVE';
  task.version = (task.version || 1) + 1;
  if (!task.history) task.history = [];
  task.history.unshift({
    modifiedByName: window.currentLiveDashboard?.employee?.name || 'Manager',
    modifiedByRole: isCurrentUserManager() ? 'MANAGER' : 'LEAD',
    action: 'TASK_RESTORED',
    createdAt: new Date().toISOString(),
    summary: `Restored to active plan by ${isCurrentUserManager() ? 'Manager' : 'Lead'}`
  });

  updateSubordinateDayCounts();
  filterMgmtTasksByDay(currentSubordinateDayFilter);
  showNotification('✓ Task restored successfully.');
}

async function resetTaskToDefault(taskId) {
  const task = currentSubordinateTasks.find(t => t.id === taskId);
  if (!task) return;

  try {
    const token = localStorage.getItem('startsmart_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    await fetch(`/api/v1/task-management/tasks/${taskId}/reset-default`, {
      method: 'POST',
      headers
    });
  } catch (err) {
    console.debug('Live reset-default call error:', err);
  }

  task.originType = 'DEFAULT';
  task.isModified = false;
  task.version = (task.version || 1) + 1;
  if (!task.history) task.history = [];
  task.history.unshift({
    modifiedByName: window.currentLiveDashboard?.employee?.name || 'Manager',
    modifiedByRole: isCurrentUserManager() ? 'MANAGER' : 'LEAD',
    action: 'DEFAULT_RESTORED',
    createdAt: new Date().toISOString(),
    summary: 'Restored back to default template configuration'
  });

  filterMgmtTasksByDay(currentSubordinateDayFilter);
  showNotification('✓ Task restored to default template.');
}

// Reordering Tasks
async function moveTaskOrder(taskId, direction) {
  const activeTasks = currentSubordinateTasks.filter(t => t.managementStatus !== 'ARCHIVED');
  const idx = activeTasks.findIndex(t => t.id === taskId);
  if (idx === -1) return;

  if (direction === 'up' && idx > 0) {
    const temp = activeTasks[idx].orderIndex;
    activeTasks[idx].orderIndex = activeTasks[idx - 1].orderIndex;
    activeTasks[idx - 1].orderIndex = temp;
  } else if (direction === 'down' && idx < activeTasks.length - 1) {
    const temp = activeTasks[idx].orderIndex;
    activeTasks[idx].orderIndex = activeTasks[idx + 1].orderIndex;
    activeTasks[idx + 1].orderIndex = temp;
  } else {
    return;
  }

  activeTasks.sort((a, b) => a.orderIndex - b.orderIndex);
  const orderedIds = activeTasks.map(t => t.id);

  try {
    const token = localStorage.getItem('startsmart_token');
    const headers = token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' };
    await fetch('/api/v1/task-management/tasks/reorder', {
      method: 'POST',
      headers,
      body: JSON.stringify({ orderedTaskIds: orderedIds })
    });
  } catch (err) {
    console.debug('Live reorder error:', err);
  }

  filterMgmtTasksByDay(currentSubordinateDayFilter);
  showNotification('✓ Tasks reordered successfully.');
}

// Modal 4: Audit History
async function openTaskHistoryModal(taskId) {
  const task = currentSubordinateTasks.find(t => t.id === taskId);
  if (!task) return;

  const modal = document.getElementById('modal-mgmt-history');
  const subtitle = document.getElementById('history-task-subtitle');
  const container = document.getElementById('history-timeline-container');
  if (subtitle) subtitle.textContent = `Showing audit history for "${task.title || task.taskName}"`;

  let historyList = task.history || [];

  // Try live API for full server audit trail
  try {
    const token = localStorage.getItem('startsmart_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`/api/v1/task-management/tasks/${taskId}/history`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.history && data.history.length > 0) {
        historyList = data.history;
      }
    }
  } catch (err) {
    console.debug('Error loading live history:', err);
  }

  if (container) {
    if (historyList.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--color-slate-500);">
          No audit entries recorded yet for this task.
        </div>
      `;
    } else {
      container.innerHTML = historyList.map(h => {
        const dateStr = h.createdAt ? new Date(h.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';
        return `
          <div style="background: var(--color-slate-50); border: 1px solid var(--color-slate-200); border-radius: 8px; padding: 12px 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 0.78rem; font-weight: 800; color: var(--color-slate-800);">
                ${escapeHtml(h.modifiedByName || 'System')} · <span style="color: #0284c7;">${escapeHtml(h.modifiedByRole || 'MANAGER')}</span>
              </span>
              <span style="font-size: 0.72rem; color: var(--color-slate-400);">${dateStr}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--color-slate-600); line-height: 1.45;">
              ${escapeHtml(h.summary || h.action || 'Task state updated')}
            </div>
            ${h.previousValue !== undefined && h.newValue !== undefined ? `
              <div style="font-size: 0.74rem; font-family: monospace; color: var(--color-slate-500); margin-top: 4px;">
                ${escapeHtml(String(h.previousValue))} → <strong>${escapeHtml(String(h.newValue))}</strong>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }
  }

  if (modal) modal.style.display = 'flex';
}

function closeHistoryModal() {
  const modal = document.getElementById('modal-mgmt-history');
  if (modal) modal.style.display = 'none';
}
