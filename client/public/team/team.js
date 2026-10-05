/*
 * Team layer for the Associate, Lead and Manager portals.
 *
 *   1. Roster        who works with whom, built from the authoritative org data for the signed-in team
 *                    (one person per position: Associate, Lead, Manager).
 *   2. Task plans    Leads and Managers review and change the onboarding plan of the people they manage
 *                    ("Add task for employee", edit, archive, reorder, history). Plans are stored per
 *                    employee and applied to that employee's own checklist when they sign in.
 *   3. Messages      two-way Team Messages between people connected through the hierarchy.
 *
 * Plain script loaded after the app script, so it shares the app's globals (currentLiveDashboard,
 * currentSelectedTeam, escapeHtml, showNotification, goToStep, fetchAuthoritativeTasksForPosition, ...).
 * Data lives in localStorage, so every account signed in on this browser shares it, and other open tabs
 * update live through the "storage" event.
 */

const TEAM_KEYS = {
  plans: 'startsmart_team_plans_v1',
  messages: 'startsmart_team_messages_v1',
  status: 'startsmart_task_status_v3',
};
const TEAM_PERSONA = { Associate: 'Aarav Sharma', Lead: 'Priya Nair', Manager: 'Rahul Kapoor' };
const TEAM_EXTRA_MANAGERS = ['Meera Iyer', 'Kabir Rao'];
// Who can message whom, and whose plan each level can manage.
const TEAM_CAN_MESSAGE = { Associate: ['Lead', 'Manager'], Lead: ['Associate', 'Manager'], Manager: ['Lead', 'Associate'] };
const TEAM_CAN_MANAGE = { Lead: ['Associate'], Manager: ['Lead', 'Associate'] };

function teamRead(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
}
function teamWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage full or blocked */ }
}
const teamEsc = (s) => (typeof escapeHtml === 'function' ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s));
const teamText = (s) => teamEsc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const teamInitials = (name) => String(name || '?').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const teamNotify = (msg) => { if (typeof showNotification === 'function') showNotification(msg); };
const TEAM_ICON = {
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  chat: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12.5a7.5 7.5 0 0 1-10.9 6.7L4 20.5l1.4-4.6A7.5 7.5 0 1 1 20 12.5z"/></svg>',
  up: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  down: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  send: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12h14M13 6l6 6-6 6"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  search: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>',
};

// ==========================================================================
// 1. Roster
// ==========================================================================
function teamDomain() {
  try { const c = companiesDatabase[currentSelectedCompany] || companiesDatabase.microsoft; return (c && c.domain) || 'microsoft.in'; } catch (e) { return 'microsoft.in'; }
}
function teamCurrentTeam() {
  try { return currentSelectedTeam || null; } catch (e) { return null; }
}
// The signed-in Associate / Lead / Manager (HR and buddy accounts are not part of a team roster).
function teamMe() {
  const emp = (window.currentLiveDashboard && window.currentLiveDashboard.employee) || null;
  if (!emp || !emp.positionId || !TEAM_CAN_MESSAGE[emp.roleLevel]) return null;
  return {
    id: emp.employeeId, posId: emp.positionId, name: emp.name, roleLevel: emp.roleLevel,
    title: emp.fullTitle || emp.role, email: emp.email, initials: teamInitials(emp.name),
    team: emp.team, department: emp.department,
  };
}
function teamRoster() {
  const team = teamCurrentTeam();
  const me = teamMe();
  if (!team || !Array.isArray(team.positions)) return me ? [me] : [];
  let dept = '';
  try { dept = (currentSelectedDept && currentSelectedDept.name) || ''; } catch (e) { /* not selected */ }
  let managers = 0;
  return team.positions.map((p) => {
    const level = p.roleLevel || 'Associate';
    let name = TEAM_PERSONA[level] || 'Team member';
    if (level === 'Manager' && managers++ > 0) name = TEAM_EXTRA_MANAGERS[(managers - 2) % TEAM_EXTRA_MANAGERS.length];
    const person = {
      id: 'EMP-' + p.id, posId: p.id, position: p, name, roleLevel: level,
      title: p.fullTitle || `${level} - ${p.title}`,
      email: `${name.split(' ')[0].toLowerCase()}.${p.title.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}@${teamDomain()}`,
      initials: teamInitials(name), team: team.name, department: dept,
    };
    if (me && me.id === person.id) { person.name = me.name; person.initials = me.initials; person.email = me.email || person.email; }
    return person;
  });
}
const teamPerson = (id) => teamRoster().find((p) => p.id === id) || null;
function teamContacts() {
  const me = teamMe();
  if (!me) return [];
  const allowed = TEAM_CAN_MESSAGE[me.roleLevel] || [];
  return teamRoster().filter((p) => p.id !== me.id && allowed.includes(p.roleLevel));
}
function teamReports() {
  const me = teamMe();
  if (!me) return [];
  const allowed = TEAM_CAN_MANAGE[me.roleLevel] || [];
  const order = { Lead: 0, Associate: 1 };
  return teamRoster().filter((p) => p.id !== me.id && allowed.includes(p.roleLevel)).sort((a, b) => order[a.roleLevel] - order[b.roleLevel]);
}
// How a contact relates to the signed-in person ("Your lead", "Your direct report", ...).
function teamRelation(person) {
  const me = teamMe();
  if (!me || !person) return '';
  if (person.roleLevel === 'Manager') return 'Your manager';
  if (person.roleLevel === 'Lead') return me.roleLevel === 'Associate' ? 'Your lead' : 'Lead in your team';
  return me.roleLevel === 'Lead' ? 'Your direct report' : 'Associate in your team';
}
function teamReportsTo(person) {
  const roster = teamRoster();
  const lead = roster.find((p) => p.roleLevel === 'Lead');
  const mgr = roster.find((p) => p.roleLevel === 'Manager');
  if (person.roleLevel === 'Associate') return [lead, mgr].filter(Boolean);
  if (person.roleLevel === 'Lead') return [mgr].filter(Boolean);
  return [];
}

// Compatibility helpers used by the existing workspace bar.
function isCurrentUserManager() { const me = teamMe(); return !!me && me.roleLevel === 'Manager'; }
function isCurrentUserDataLead() { const me = teamMe(); return !!me && me.roleLevel === 'Lead'; }
function canCurrentSessionManageTasks() { return isCurrentUserManager() || isCurrentUserDataLead(); }

// ==========================================================================
// 2. Task plans
// ==========================================================================
const teamDayFor = (n) => (n <= 6 ? 'Day 1' : n <= 12 ? 'Day 2' : n <= 18 ? 'Day 3' : n <= 24 ? 'Day 4' : 'Day 5');
const teamPlans = () => teamRead(TEAM_KEYS.plans, {});
function teamSavePlan(empId, tasks) {
  const plans = teamPlans();
  plans[empId] = { tasks: tasks.map(({ status, ...rest }) => rest), updatedAt: Date.now() };
  teamWrite(TEAM_KEYS.plans, plans);
}
function teamStatusOf(empId, task) {
  const s = teamRead(TEAM_KEYS.status, {})[`${empId}_${task.taskId}`];
  return s || (task.num === 1 ? 'Completed' : 'Pending'); // task 1 is unlocked at first sign-in
}
function teamMe4History() {
  const me = teamMe();
  return { modifiedByName: me ? me.name : 'Manager', modifiedByRole: me ? me.roleLevel.toUpperCase() : 'MANAGER' };
}

// The plan for one employee: their saved plan, or their authoritative 30 tasks the first time.
async function teamLoadPlan(person) {
  const saved = teamPlans()[person.id];
  let tasks = saved && Array.isArray(saved.tasks) && saved.tasks.length ? saved.tasks.map((t) => ({ ...t })) : null;
  if (!tasks) {
    let raw = [];
    try {
      const data = await fetchAuthoritativeTasksForPosition(person.posId, person.position);
      raw = (data && data.tasks) || [];
    } catch (e) { raw = []; }
    if (!raw.length) {
      raw = Array.from({ length: 30 }, (_, i) => ({
        num: i + 1, title: i === 0 ? 'Secure account & workspace setup' : `${person.team} milestone ${i + 1}`,
        desc: `Onboarding activity for ${person.title} in ${person.team}.`,
      }));
    }
    tasks = raw.map((t, i) => {
      const num = t.num || i + 1;
      const fields = {
        title: t.title,
        description: t.desc || t.description || '',
        day: t.day || teamDayFor(num),
        priority: t.priority || (num <= 6 ? 'High' : num <= 20 ? 'Medium' : 'Standard'),
        category: t.category || person.team,
        estimatedDuration: t.duration || '45 mins',
      };
      return {
        id: `${person.id}_${t.taskId || 'T' + String(num).padStart(3, '0')}`,
        taskId: t.taskId || 'T' + String(num).padStart(3, '0'),
        num, ...fields, original: { ...fields },
        managementStatus: 'ACTIVE', originType: 'DEFAULT', version: 1, orderIndex: num,
        history: [{ modifiedByName: 'Onboarding template', modifiedByRole: 'SYSTEM', action: 'TASK_CREATED', createdAt: '2026-10-04T09:00:00.000Z', summary: 'Assigned from the authoritative onboarding template' }],
      };
    });
  }
  tasks.forEach((t) => { t.status = teamStatusOf(person.id, t); });
  return tasks;
}

// Applied to an employee's own checklist at sign-in: their Lead/Manager's changes and saved statuses.
function teamApplyPlanToDashboard(dash) {
  const emp = dash && dash.employee;
  if (!emp || !emp.employeeId) return dash;
  const plan = teamPlans()[emp.employeeId];
  let tasks = (dash.tasks || []).slice();
  if (plan && Array.isArray(plan.tasks)) {
    const byId = new Map(plan.tasks.map((p) => [String(p.taskId), p]));
    tasks = tasks
      .filter((t) => { const p = byId.get(String(t.taskId)); return !p || p.managementStatus !== 'ARCHIVED'; })
      .map((t) => {
        const p = byId.get(String(t.taskId));
        if (!p || p.originType === 'DEFAULT') return t;
        return { ...t, taskName: p.title, title: p.title, description: p.description, desc: p.description, day: p.day, priority: p.priority, duration: p.estimatedDuration, category: p.category };
      });
    plan.tasks.filter((p) => p.originType === 'CUSTOM' && p.managementStatus !== 'ARCHIVED').forEach((p) => {
      tasks.push({
        taskId: p.taskId, id: p.id, progressId: `PROG_${emp.employeeId}_${p.taskId}`,
        taskName: p.title, title: p.title, description: p.description, desc: p.description,
        day: p.day, priority: p.priority, duration: p.estimatedDuration, category: p.category,
        department: emp.department, subDepartment: emp.subDepartment, status: 'Pending', done: false,
        isMandatory: p.required !== false, assignedByName: p.assignedByName, assignedByRole: p.assignedByRole,
        objective: p.description || p.title,
        chatbotExecution: [
          `Read the brief from ${p.assignedByName} (${p.assignedByRole}): ${p.description || p.title}.`,
          `If anything is unclear, ask ${p.assignedByName} in Messages before you start.`,
          'Complete the work and share the result with them.',
          'Mark the task as done on your checklist.',
        ],
        definitionOfDone: `${p.assignedByName} has what they asked for and the task is marked done.`,
      });
    });
    const order = new Map(plan.tasks.map((p) => [String(p.taskId), p.orderIndex]));
    const base = new Map(tasks.map((t, i) => [String(t.taskId), i + 1]));
    tasks.sort((a, b) => (order.get(String(a.taskId)) ?? base.get(String(a.taskId))) - (order.get(String(b.taskId)) ?? base.get(String(b.taskId))));
  }
  const statuses = teamRead(TEAM_KEYS.status, {});
  tasks.forEach((t) => {
    const s = statuses[`${emp.employeeId}_${t.taskId}`];
    if (s) { t.status = s; t.done = s === 'Completed'; }
  });
  const done = tasks.filter((t) => t.status === 'Completed' || t.done).length;
  dash.tasks = tasks;
  dash.metrics = { ...(dash.metrics || {}), totalTasks: tasks.length, completedTasks: done, pendingTasks: tasks.length - done, percentage: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
  return dash;
}

// ---------- Team task management screen ----------
let currentMgmtSubordinates = [];
let currentActiveSubordinate = null;
let currentSubordinateTasks = [];
let currentSubordinateDayFilter = 'all';
let currentSubordinateRoleFilter = 'ALL';
let currentSubordinateSearchQuery = '';
let teamProgressCache = {};

function switchJoinerWorkspaceTab(tab) {
  if (tab === 'management') { openTaskManagement(); return; }
  if (tab === 'messages') { openTeamMessages(); return; }
  goToStep('step-joiner-chatbot');
}

async function openTaskManagement() {
  if (!canCurrentSessionManageTasks()) {
    teamNotify('Team task management is available to Leads and Managers.');
    return;
  }
  const isMgr = isCurrentUserManager();
  const badge = document.getElementById('mgmt-authority-badge');
  const scope = document.getElementById('mgmt-authority-scope-text');
  if (badge) badge.textContent = isMgr ? 'Manager workspace' : 'Lead workspace';
  if (scope) scope.textContent = isMgr ? 'Leads and associates in your team' : 'Your direct reports';
  const leadPill = document.getElementById('sub-filter-lead');
  if (leadPill) leadPill.hidden = !isMgr;
  goToStep('step-task-management');
  await loadSubordinatesList();
}

async function loadSubordinatesList() {
  currentMgmtSubordinates = teamReports();
  // Live progress for every report (statuses are shared with their own checklist).
  teamProgressCache = {};
  await Promise.all(currentMgmtSubordinates.map(async (p) => {
    const tasks = (await teamLoadPlan(p)).filter((t) => t.managementStatus !== 'ARCHIVED');
    const done = tasks.filter((t) => t.status === 'Completed').length;
    teamProgressCache[p.id] = { done, total: tasks.length, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0, custom: tasks.filter((t) => t.originType === 'CUSTOM').length };
  }));
  renderTeamStats();
  applySubordinateFilters();
}

function renderTeamStats() {
  const el = document.getElementById('tm-stats');
  if (!el) return;
  const people = currentMgmtSubordinates;
  const vals = people.map((p) => teamProgressCache[p.id] || { pct: 0, custom: 0 });
  const avg = vals.length ? Math.round(vals.reduce((a, v) => a + v.pct, 0) / vals.length) : 0;
  const custom = vals.reduce((a, v) => a + (v.custom || 0), 0);
  el.innerHTML = `
    <div><dt>${isCurrentUserManager() ? 'People you manage' : 'Direct reports'}</dt><dd>${people.length}</dd></div>
    <div><dt>Average progress</dt><dd>${avg}%</dd></div>
    <div><dt>Added tasks</dt><dd>${custom}</dd></div>`;
}

function applySubordinateFilters() {
  let list = currentMgmtSubordinates;
  if (currentSubordinateRoleFilter === 'LEAD') list = list.filter((s) => s.roleLevel === 'Lead');
  else if (currentSubordinateRoleFilter === 'ASSOCIATE') list = list.filter((s) => s.roleLevel === 'Associate');
  if (currentSubordinateSearchQuery) {
    const q = currentSubordinateSearchQuery.toLowerCase();
    list = list.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.title.toLowerCase().includes(q));
  }
  const setCount = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
  setCount('count-sub-all', currentMgmtSubordinates.length);
  setCount('count-sub-leads', currentMgmtSubordinates.filter((s) => s.roleLevel === 'Lead').length);
  setCount('count-sub-assocs', currentMgmtSubordinates.filter((s) => s.roleLevel === 'Associate').length);

  const wrap = document.getElementById('tm-people');
  if (wrap) {
    wrap.innerHTML = list.length ? list.map((p) => {
      const pr = teamProgressCache[p.id] || { pct: 0, done: 0, total: 0 };
      const sel = currentActiveSubordinate && currentActiveSubordinate.id === p.id;
      return `
        <button type="button" class="tm-person-tile${sel ? ' is-selected' : ''}" role="option" aria-selected="${sel}" onclick="selectSubordinateById('${p.id}')">
          <span class="tm-avatar">${teamEsc(p.initials)}</span>
          <span class="tm-tile-text">
            <span class="tm-tile-name">${teamEsc(p.name)}</span>
            <span class="tm-tile-role">${teamEsc(p.title)}</span>
            <span class="tm-tile-progress"><span class="tm-bar"><span style="width: ${pr.pct}%"></span></span><span>${pr.pct}%</span></span>
          </span>
        </button>`;
    }).join('') : `<p class="tm-empty">${currentMgmtSubordinates.length ? 'No one matches your search.' : 'No one reports to you in this team yet.'}</p>`;
  }

  if (list.length) {
    const keep = currentActiveSubordinate && list.find((s) => s.id === currentActiveSubordinate.id);
    selectSubordinate(keep || list[0]);
  } else {
    currentActiveSubordinate = null;
    renderSubordinateDetailBanner();
    renderSubordinateTasksList([]);
  }
}

function filterMgmtSubordinatesByRole(role) {
  currentSubordinateRoleFilter = role;
  const map = { ALL: 'sub-filter-all', LEAD: 'sub-filter-lead', ASSOCIATE: 'sub-filter-assoc' };
  Object.values(map).forEach((id) => { const b = document.getElementById(id); if (b) b.classList.toggle('active', id === map[role]); });
  applySubordinateFilters();
}
function onSubordinateSearchInput() {
  const input = document.getElementById('mgmt-subordinate-search');
  currentSubordinateSearchQuery = input ? input.value.trim() : '';
  applySubordinateFilters();
}
function selectSubordinateById(id) {
  const p = currentMgmtSubordinates.find((s) => s.id === id);
  if (!p) return Promise.resolve();
  document.querySelectorAll('.tm-person-tile').forEach((b) => {
    const on = b.getAttribute('onclick').includes(`'${id}'`);
    b.classList.toggle('is-selected', on);
    b.setAttribute('aria-selected', String(on));
  });
  return selectSubordinate(p);
}
async function selectSubordinate(person) {
  currentActiveSubordinate = person;
  renderSubordinateDetailBanner();
  await loadSubordinateTasks(person);
}

function refreshActiveProgress() {
  const p = currentActiveSubordinate;
  if (!p) return;
  const active = currentSubordinateTasks.filter((t) => t.managementStatus !== 'ARCHIVED');
  const done = active.filter((t) => t.status === 'Completed').length;
  teamProgressCache[p.id] = { done, total: active.length, pct: active.length ? Math.round((done / active.length) * 100) : 0, custom: active.filter((t) => t.originType === 'CUSTOM').length };
  renderSubordinateDetailBanner();
  renderTeamStats();
  const tile = [...document.querySelectorAll('.tm-person-tile')].find((b) => b.getAttribute('onclick').includes(`'${p.id}'`));
  if (tile) {
    const pct = teamProgressCache[p.id].pct;
    tile.querySelector('.tm-bar > span').style.width = pct + '%';
    tile.querySelector('.tm-tile-progress > span:last-child').textContent = pct + '%';
  }
}

function renderSubordinateDetailBanner() {
  const card = document.getElementById('mgmt-active-subordinate-card');
  if (!card) return;
  const p = currentActiveSubordinate;
  if (!p) { card.innerHTML = '<p class="tm-empty">Select a person to see their plan.</p>'; return; }
  const pr = teamProgressCache[p.id] || { pct: 0, done: 0, total: 0 };
  const reportsTo = teamReportsTo(p).map((r) => `${teamEsc(r.name)} (${r.roleLevel})`).join(' · ');
  const first = teamEsc(p.name.split(' ')[0]);
  card.innerHTML = `
    <div class="tm-person-main">
      <span class="tm-avatar is-lg">${teamEsc(p.initials)}</span>
      <div class="tm-person-text">
        <div class="tm-person-name"><h2>${teamEsc(p.name)}</h2><span class="tm-role">${teamEsc(p.roleLevel)}</span></div>
        <p class="tm-person-meta">${teamEsc(p.title)} · ${teamEsc(p.team)} · ${teamEsc(p.id)}</p>
        ${reportsTo ? `<p class="tm-person-meta">Reports to ${reportsTo}</p>` : ''}
      </div>
    </div>
    <div class="tm-person-progress">
      <span class="tm-eyebrow">Onboarding progress</span>
      <div class="tm-progress-row"><strong>${pr.pct}%</strong><span>${pr.done} of ${pr.total} tasks done</span></div>
      <span class="tm-bar is-lg"><span style="width: ${pr.pct}%"></span></span>
    </div>
    <div class="tm-person-actions">
      <button type="button" class="tm-btn is-primary" onclick="openAddTaskModal('${p.id}')">${TEAM_ICON.plus}<span>Add task for ${first}</span></button>
      <button type="button" class="tm-btn" onclick="openTeamMessages('${p.id}')">${TEAM_ICON.chat}<span>Message ${first}</span></button>
    </div>`;
}

async function loadSubordinateTasks(person) {
  const tasks = await teamLoadPlan(person);
  if (!currentActiveSubordinate || currentActiveSubordinate.id !== person.id) return; // a newer selection won
  currentSubordinateTasks = tasks;
  refreshActiveProgress();
  updateSubordinateDayCounts();
  filterMgmtTasksByDay(currentSubordinateDayFilter);
}

function updateSubordinateDayCounts() {
  const active = currentSubordinateTasks.filter((t) => t.managementStatus !== 'ARCHIVED');
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('mgmt-count-all', active.length);
  ['1', '2', '3', '4', '5'].forEach((d) => set('mgmt-count-d' + d, active.filter((t) => t.day === 'Day ' + d).length));
  set('mgmt-count-archived', currentSubordinateTasks.length - active.length);
}

function filterMgmtTasksByDay(day) {
  currentSubordinateDayFilter = day;
  ['all', 'day1', 'day2', 'day3', 'day4', 'day5', 'archived'].forEach((k) => {
    const b = document.getElementById('mgmt-day-pill-' + k);
    if (b) b.classList.remove('active');
  });
  const activeId = day === 'all' ? 'mgmt-day-pill-all' : day === 'archived' ? 'mgmt-day-pill-archived' : 'mgmt-day-pill-' + day.toLowerCase().replace(' ', '');
  const btn = document.getElementById(activeId);
  if (btn) btn.classList.add('active');
  let list = currentSubordinateTasks.filter((t) => (day === 'archived' ? t.managementStatus === 'ARCHIVED' : t.managementStatus !== 'ARCHIVED'));
  if (day !== 'all' && day !== 'archived') list = list.filter((t) => t.day === day);
  list.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  renderSubordinateTasksList(list);
}

function renderSubordinateTasksList(tasks) {
  const box = document.getElementById('mgmt-tasks-container');
  if (!box) return;
  if (!tasks.length) {
    box.innerHTML = `
      <div class="tm-empty-card">
        <p class="tm-empty-title">No tasks here yet</p>
        <p>${currentActiveSubordinate ? `Add a task to ${teamEsc(currentActiveSubordinate.name.split(' ')[0])}'s plan, or pick another day.` : 'Select a person first.'}</p>
        ${currentActiveSubordinate ? `<button type="button" class="tm-btn is-primary" onclick="openAddTaskModal('${currentActiveSubordinate.id}')">${TEAM_ICON.plus}<span>Add task</span></button>` : ''}
      </div>`;
    return;
  }
  box.innerHTML = tasks.map((t) => {
    const done = t.status === 'Completed';
    const archived = t.managementStatus === 'ARCHIVED';
    const origin = archived ? ['Archived', 'is-archived'] : t.originType === 'CUSTOM' ? ['Added task', 'is-custom'] : t.originType === 'MODIFIED' ? ['Edited', 'is-modified'] : null;
    const pr = String(t.priority || 'Standard');
    const by = t.originType === 'CUSTOM' && t.assignedByName
      ? `<p class="tm-task-by">Added by ${teamEsc(t.assignedByName)} (${teamEsc(t.assignedByRole || '')})${t.createdAt ? ' · ' + teamEsc(teamFormatDate(t.createdAt)) : ''}</p>` : '';
    return `
      <article class="tm-task${done ? ' is-done' : ''}${archived ? ' is-archived' : ''}" id="tm-task-${teamEsc(t.id)}">
        <span class="tm-task-status" role="img" aria-label="${done ? 'Completed' : 'Pending'}">${done ? '✓' : ''}</span>
        <div class="tm-task-body">
          <div class="tm-task-meta">
            <span class="tm-tag">${teamEsc(t.day || 'Day 1')}</span>
            <span class="tm-tag is-${teamEsc(pr.toLowerCase())}">${teamEsc(pr)} priority</span>
            ${origin ? `<span class="tm-tag ${origin[1]}">${origin[0]}</span>` : ''}
            <span class="tm-meta-text">${teamEsc(t.estimatedDuration || '45 mins')} · ${teamEsc(t.category || 'General')}</span>
            <span class="tm-meta-text ${done ? 'is-done' : ''}">${done ? 'Completed' : 'Pending'}</span>
          </div>
          <h3 class="tm-task-title">${teamEsc(t.title || t.taskName)}</h3>
          ${t.description ? `<p class="tm-task-desc">${teamText(t.description)}</p>` : ''}
          ${t.resourceLinks ? `<p class="tm-task-desc"><a href="${teamEsc(t.resourceLinks)}" target="_blank" rel="noopener">${teamEsc(t.resourceLinks)}</a></p>` : ''}
          ${by}
        </div>
        <div class="tm-task-actions">
          ${archived ? `
            <button type="button" class="tm-btn is-sm" onclick="restoreArchivedTask('${t.id}')">Restore</button>` : `
            <button type="button" class="tm-icon-btn" onclick="moveTaskOrder('${t.id}', 'up')" aria-label="Move task up" title="Move up">${TEAM_ICON.up}</button>
            <button type="button" class="tm-icon-btn" onclick="moveTaskOrder('${t.id}', 'down')" aria-label="Move task down" title="Move down">${TEAM_ICON.down}</button>
            <button type="button" class="tm-btn is-sm" onclick="openEditTaskModal('${t.id}')">Edit</button>
            <button type="button" class="tm-btn is-sm is-danger" onclick="promptArchiveTask('${t.id}')">Archive</button>`}
          ${t.originType === 'MODIFIED' && !archived ? `<button type="button" class="tm-btn is-sm" onclick="resetTaskToDefault('${t.id}')">Reset</button>` : ''}
          <button type="button" class="tm-btn is-sm is-ghost" onclick="openTaskHistoryModal('${t.id}')">History</button>
        </div>
      </article>`;
  }).join('');
}

function teamPersist() {
  if (!currentActiveSubordinate) return;
  teamSavePlan(currentActiveSubordinate.id, currentSubordinateTasks);
  refreshActiveProgress();
  updateSubordinateDayCounts();
  filterMgmtTasksByDay(currentSubordinateDayFilter);
}
function teamLog(task, action, summary) {
  task.history = task.history || [];
  task.history.unshift({ ...teamMe4History(), action, createdAt: new Date().toISOString(), summary });
  task.version = (task.version || 1) + 1;
}

// ---------- Add task for employee ----------
function openAddTaskModal(personId) {
  const reports = currentMgmtSubordinates.length ? currentMgmtSubordinates : teamReports();
  if (!reports.length) { teamNotify('There is no one in your team to assign a task to yet.'); return; }
  const select = document.getElementById('add-task-assignee');
  const target = personId || (currentActiveSubordinate && currentActiveSubordinate.id) || reports[0].id;
  if (select) {
    select.innerHTML = reports.map((p) => `<option value="${p.id}"${p.id === target ? ' selected' : ''}>${teamEsc(p.name)} · ${teamEsc(p.title)}</option>`).join('');
    select.onchange = syncAddTaskTarget;
  }
  syncAddTaskTarget();
  const modal = document.getElementById('modal-mgmt-add-task');
  if (modal) modal.style.display = 'flex';
  setTimeout(() => { const f = document.getElementById('add-task-title'); if (f) f.focus(); }, 50);
}
function syncAddTaskTarget() {
  const select = document.getElementById('add-task-assignee');
  const p = select && teamPerson(select.value);
  const name = document.getElementById('modal-add-target-name');
  const notify = document.getElementById('add-task-notify-label');
  if (p && name) name.textContent = p.name;
  if (p && notify) notify.textContent = `Let ${p.name.split(' ')[0]} know in Messages`;
}
function closeAddTaskModal() {
  const modal = document.getElementById('modal-mgmt-add-task');
  if (modal) modal.style.display = 'none';
}
async function submitAddTask(e) {
  e.preventDefault();
  const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const assignee = teamPerson(val('add-task-assignee'));
  const title = val('add-task-title');
  if (!assignee || !title) return;
  const me = teamMe();
  const day = val('add-task-day') || 'Day 1';
  const task = {
    id: `${assignee.id}_CT-${Date.now().toString(36).toUpperCase()}`,
    taskId: 'CT-' + Date.now().toString(36).toUpperCase(),
    title, description: val('add-task-desc'), day,
    priority: val('add-task-priority') || 'Medium',
    estimatedDuration: val('add-task-duration') || '45 mins',
    category: val('add-task-category') || 'General',
    resourceLinks: val('add-task-resource') || null,
    required: !!(document.getElementById('add-task-required') || {}).checked,
    managementStatus: 'ACTIVE', originType: 'CUSTOM', isCustom: true, version: 1,
    assignedByName: me ? me.name : 'Your manager', assignedByRole: me ? me.roleLevel : 'Manager',
    createdAt: new Date().toISOString(),
    history: [],
  };
  teamLog(task, 'TASK_CREATED', `Added for ${assignee.name} by ${task.assignedByName} (${task.assignedByRole})`);
  task.version = 1;

  // Write into the assignee's own plan (not just the one on screen).
  const plan = await teamLoadPlan(assignee);
  task.orderIndex = plan.reduce((m, t) => Math.max(m, t.orderIndex || 0), 0) + 1;
  plan.push(task);
  teamSavePlan(assignee.id, plan);

  const notifyBox = document.getElementById('add-task-notify');
  if (!notifyBox || notifyBox.checked) {
    teamSendMessage(assignee.id, `I've added a task to your ${day} plan: "${title}".${task.description ? ' ' + task.description : ''}`, { kind: 'task' });
  }

  closeAddTaskModal();
  const form = document.getElementById('form-mgmt-add-task');
  if (form) form.reset();
  teamNotify(`Task added to ${assignee.name}'s ${day} plan.`);

  // Show it: switch to that person and day, then highlight the new task.
  currentSubordinateDayFilter = day;
  if (currentMgmtSubordinates.find((s) => s.id === assignee.id)) {
    await selectSubordinateById(assignee.id);
    const el = document.getElementById('tm-task-' + task.id);
    if (el) { el.classList.add('is-new'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }
}

// ---------- Edit / archive / restore / reset / reorder / history ----------
let currentEditingTaskId = null;
function openEditTaskModal(taskId) {
  const t = currentSubordinateTasks.find((x) => x.id === taskId);
  if (!t) return;
  currentEditingTaskId = taskId;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('edit-task-id', taskId);
  set('edit-task-version', t.version || 1);
  set('edit-task-title', t.title || '');
  set('edit-task-desc', t.description || '');
  set('edit-task-day', t.day || 'Day 1');
  set('edit-task-priority', t.priority || 'Medium');
  set('edit-task-duration', t.estimatedDuration || '45 mins');
  set('edit-task-category', t.category || '');
  set('edit-task-resource', t.resourceLinks || '');
  const modal = document.getElementById('modal-mgmt-edit-task');
  if (modal) modal.style.display = 'flex';
}
function closeEditTaskModal() {
  const modal = document.getElementById('modal-mgmt-edit-task');
  if (modal) modal.style.display = 'none';
  currentEditingTaskId = null;
}
function submitEditTask(e) {
  e.preventDefault();
  const t = currentSubordinateTasks.find((x) => x.id === document.getElementById('edit-task-id').value);
  if (!t) return;
  const val = (id) => document.getElementById(id).value.trim();
  Object.assign(t, {
    title: val('edit-task-title'), description: val('edit-task-desc'), day: document.getElementById('edit-task-day').value,
    priority: document.getElementById('edit-task-priority').value, estimatedDuration: val('edit-task-duration'),
    category: val('edit-task-category'), resourceLinks: val('edit-task-resource') || null,
  });
  if (t.originType !== 'CUSTOM') t.originType = 'MODIFIED';
  teamLog(t, 'TASK_UPDATED', `Edited by ${teamMe4History().modifiedByName}`);
  closeEditTaskModal();
  teamPersist();
  teamNotify('Task updated.');
}
let pendingArchiveTaskId = null;
function promptArchiveTask(taskId) {
  const t = currentSubordinateTasks.find((x) => x.id === taskId);
  if (!t) return;
  pendingArchiveTaskId = taskId;
  const title = document.getElementById('archive-task-title-display');
  const sub = document.getElementById('archive-task-sub-display');
  if (title) title.textContent = t.title;
  if (sub) sub.textContent = `Assigned to ${currentActiveSubordinate ? currentActiveSubordinate.name : 'this employee'}`;
  const btn = document.getElementById('btn-confirm-archive-task');
  if (btn) btn.onclick = () => confirmArchiveTask(taskId);
  const modal = document.getElementById('modal-mgmt-archive-confirm');
  if (modal) modal.style.display = 'flex';
}
function closeArchiveModal() {
  const modal = document.getElementById('modal-mgmt-archive-confirm');
  if (modal) modal.style.display = 'none';
  pendingArchiveTaskId = null;
}
function confirmArchiveTask(taskId) {
  const t = currentSubordinateTasks.find((x) => x.id === taskId);
  if (!t) return;
  t.managementStatus = 'ARCHIVED';
  teamLog(t, 'TASK_ARCHIVED', `Archived by ${teamMe4History().modifiedByName}`);
  closeArchiveModal();
  teamPersist();
  teamNotify('Task archived. You can restore it from the Archived filter.');
}
function restoreArchivedTask(taskId) {
  const t = currentSubordinateTasks.find((x) => x.id === taskId);
  if (!t) return;
  t.managementStatus = 'ACTIVE';
  teamLog(t, 'TASK_RESTORED', `Restored by ${teamMe4History().modifiedByName}`);
  teamPersist();
  teamNotify('Task restored.');
}
function resetTaskToDefault(taskId) {
  const t = currentSubordinateTasks.find((x) => x.id === taskId);
  if (!t || !t.original) return;
  Object.assign(t, t.original);
  t.originType = 'DEFAULT';
  teamLog(t, 'DEFAULT_RESTORED', 'Reset to the original onboarding template');
  teamPersist();
  teamNotify('Task reset to the original template.');
}
function moveTaskOrder(taskId, direction) {
  const list = currentSubordinateTasks.filter((t) => t.managementStatus !== 'ARCHIVED').sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  const i = list.findIndex((t) => t.id === taskId);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i].orderIndex, list[j].orderIndex] = [list[j].orderIndex, list[i].orderIndex];
  teamPersist();
  const el = document.getElementById('tm-task-' + taskId);
  if (el) el.scrollIntoView({ block: 'nearest' });
}
function openTaskHistoryModal(taskId) {
  const t = currentSubordinateTasks.find((x) => x.id === taskId);
  if (!t) return;
  const sub = document.getElementById('history-task-subtitle');
  const box = document.getElementById('history-timeline-container');
  if (sub) sub.textContent = `"${t.title}" · ${currentActiveSubordinate ? currentActiveSubordinate.name : ''}`;
  const roleName = (r) => ({ SYSTEM: 'System', LEAD: 'Lead', MANAGER: 'Manager' }[r] || r || '');
  if (box) {
    box.innerHTML = (t.history || []).map((h) => `
      <div class="tm-history-item">
        <div class="tm-history-head"><strong>${teamEsc(h.modifiedByName || 'System')}</strong><span class="tm-tag">${teamEsc(roleName(h.modifiedByRole))}</span><time>${teamEsc(teamFormatDate(h.createdAt))}</time></div>
        <p>${teamEsc(h.summary || h.action || 'Updated')}</p>
      </div>`).join('') || '<p class="tm-empty">No changes recorded yet.</p>';
  }
  const modal = document.getElementById('modal-mgmt-history');
  if (modal) modal.style.display = 'flex';
}
function closeHistoryModal() {
  const modal = document.getElementById('modal-mgmt-history');
  if (modal) modal.style.display = 'none';
}

// ==========================================================================
// 3. Team Messages
// ==========================================================================
// { threads: { [threadId]: { id, members: [idA, idB], messages: [{ id, from, fromName, fromRole, text, at, kind }] } },
//   reads: { [personId]: { [threadId]: lastReadAt } }, seeded: { [teamKey]: true } }
const teamMsgStore = () => teamRead(TEAM_KEYS.messages, { threads: {}, reads: {}, seeded: {} });
const teamThreadId = (a, b) => [a, b].sort().join('__');
let teamMsgActive = null; // contact id of the open conversation

function teamFormatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function teamFormatTime(ts) {
  const d = new Date(ts), now = new Date();
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return time;
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function teamDayLabel(ts) {
  const d = new Date(ts), now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

// A short welcome from the people above you, the first time a team's messages are opened.
function teamSeedWelcome() {
  const team = teamCurrentTeam();
  const roster = teamRoster();
  if (!team || roster.length < 2) return;
  const store = teamMsgStore();
  const key = roster.map((p) => p.id).join('|');
  if (store.seeded[key]) return;
  const lead = roster.find((p) => p.roleLevel === 'Lead');
  const mgr = roster.find((p) => p.roleLevel === 'Manager');
  const assoc = roster.find((p) => p.roleLevel === 'Associate');
  const at = Date.now() - 1000 * 60 * 47;
  const add = (from, to, text, offset) => {
    if (!from || !to) return;
    const id = teamThreadId(from.id, to.id);
    const th = store.threads[id] || (store.threads[id] = { id, members: [from.id, to.id], messages: [] });
    th.messages.push({ id: 'm' + (at + offset), from: from.id, fromName: from.name, fromRole: from.roleLevel, text, at: at + offset });
  };
  if (assoc && (lead || mgr)) add(lead || mgr, assoc, `Welcome to ${team.name}, ${assoc.name.split(' ')[0]}! Message me here any time this week, especially if something on your checklist is unclear.`, 0);
  if (assoc && mgr && lead) add(mgr, assoc, `Good to have you on the team. Let's do a short check-in on Day 1 at 4:30 PM.`, 60000);
  if (lead && mgr) add(mgr, lead, `${assoc ? assoc.name.split(' ')[0] + ' starts this week. ' : ''}Please keep an eye on their Day 1 plan and add anything specific to our team.`, 120000);
  store.seeded[key] = true;
  teamWrite(TEAM_KEYS.messages, store);
}

function teamSendMessage(toId, text, extra = {}) {
  const me = teamMe();
  const clean = String(text || '').trim();
  if (!me || !clean) return null;
  const allowed = teamContacts().some((c) => c.id === toId);
  if (!allowed) { teamNotify('You can only message people connected to you in your team.'); return null; }
  const store = teamMsgStore();
  const id = teamThreadId(me.id, toId);
  const th = store.threads[id] || (store.threads[id] = { id, members: [me.id, toId], messages: [] });
  const msg = { id: 'm' + Date.now() + Math.random().toString(36).slice(2, 6), from: me.id, fromName: me.name, fromRole: me.roleLevel, text: clean.slice(0, 4000), at: Date.now(), ...extra };
  th.messages.push(msg);
  store.reads[me.id] = { ...(store.reads[me.id] || {}), [id]: msg.at };
  teamWrite(TEAM_KEYS.messages, store);
  teamRenderMessages();
  return msg;
}
function teamUnread(store, meId, threadId) {
  const th = store.threads[threadId];
  if (!th) return 0;
  const last = (store.reads[meId] || {})[threadId] || 0;
  return th.messages.filter((m) => m.from !== meId && m.at > last).length;
}
function teamTotalUnread() {
  const me = teamMe();
  if (!me) return 0;
  const store = teamMsgStore();
  return teamContacts().reduce((n, c) => n + teamUnread(store, me.id, teamThreadId(me.id, c.id)), 0);
}
function teamMarkRead(contactId) {
  const me = teamMe();
  if (!me || !contactId) return;
  const store = teamMsgStore();
  const id = teamThreadId(me.id, contactId);
  const th = store.threads[id];
  const lastAt = th && th.messages.length ? th.messages[th.messages.length - 1].at : Date.now();
  if (((store.reads[me.id] || {})[id] || 0) >= lastAt) return;
  store.reads[me.id] = { ...(store.reads[me.id] || {}), [id]: lastAt };
  teamWrite(TEAM_KEYS.messages, store);
}

function teamMessagesMarkup() {
  return `
    <div id="tmsg" class="tmsg" hidden>
      <div class="tmsg-scrim" data-tmsg-close></div>
      <section class="tmsg-panel" role="dialog" aria-modal="true" aria-labelledby="tmsg-title">
        <header class="tmsg-head">
          <div>
            <p class="tmsg-eyebrow">Your team</p>
            <h2 id="tmsg-title" class="tmsg-title">Messages</h2>
          </div>
          <button type="button" class="tmsg-icon-btn" data-tmsg-close aria-label="Close messages">${TEAM_ICON.close}</button>
        </header>
        <div class="tmsg-body">
          <nav class="tmsg-list" aria-label="Conversations"><ul id="tmsg-threads"></ul></nav>
          <div class="tmsg-thread" id="tmsg-thread"></div>
        </div>
      </section>
    </div>`;
}

function teamRenderMessages() {
  teamRenderBadges();
  const root = document.getElementById('tmsg');
  if (!root || root.hidden) return;
  const me = teamMe();
  const list = document.getElementById('tmsg-threads');
  const pane = document.getElementById('tmsg-thread');
  if (!me) { list.innerHTML = ''; pane.innerHTML = '<p class="tmsg-empty">Sign in to see your team messages.</p>'; return; }
  const store = teamMsgStore();
  const contacts = teamContacts().map((c) => {
    const th = store.threads[teamThreadId(me.id, c.id)];
    const last = th && th.messages.length ? th.messages[th.messages.length - 1] : null;
    return { c, last, unread: teamUnread(store, me.id, teamThreadId(me.id, c.id)) };
  }).sort((a, b) => (b.last ? b.last.at : 0) - (a.last ? a.last.at : 0));

  if (teamMsgActive && !contacts.some((x) => x.c.id === teamMsgActive)) teamMsgActive = null;
  root.classList.toggle('has-active', !!teamMsgActive);

  list.innerHTML = contacts.length ? contacts.map(({ c, last, unread }) => `
    <li>
      <button type="button" class="tmsg-row${c.id === teamMsgActive ? ' is-active' : ''}${unread ? ' is-unread' : ''}" onclick="openTeamMessages('${c.id}')" aria-current="${c.id === teamMsgActive}">
        <span class="tm-avatar">${teamEsc(c.initials)}</span>
        <span class="tmsg-row-text">
          <span class="tmsg-row-top"><span class="tmsg-row-name">${teamEsc(c.name)}</span>${last ? `<time>${teamEsc(teamFormatTime(last.at))}</time>` : ''}</span>
          <span class="tmsg-row-role">${teamEsc(teamRelation(c))} · ${teamEsc(c.title)}</span>
          <span class="tmsg-row-last">${last ? (last.from === me.id ? 'You: ' : '') + teamEsc(last.text) : 'No messages yet'}</span>
        </span>
        ${unread ? `<span class="tmsg-unread" aria-label="${unread} unread">${unread}</span>` : ''}
      </button>
    </li>`).join('') : '<li class="tmsg-empty">No one in your team to message yet.</li>';

  const active = teamMsgActive && contacts.find((x) => x.c.id === teamMsgActive);
  if (!active) {
    pane.innerHTML = `<div class="tmsg-placeholder">${TEAM_ICON.chat}<p>Choose a person to start a conversation.</p><span>You can message ${teamEsc(me.roleLevel === 'Associate' ? 'your lead and manager' : me.roleLevel === 'Lead' ? 'your associates and your manager' : 'the leads and associates in your team')}.</span></div>`;
    return;
  }
  teamMarkRead(active.c.id);
  const th = teamMsgStore().threads[teamThreadId(me.id, active.c.id)];
  let lastDay = '';
  const items = (th ? th.messages : []).map((m) => {
    const day = teamDayLabel(m.at);
    const sep = day !== lastDay ? `<li class="tmsg-day"><span>${teamEsc(day)}</span></li>` : '';
    lastDay = day;
    const mine = m.from === me.id;
    return `${sep}
      <li class="tmsg-msg${mine ? ' is-mine' : ''}${m.kind === 'task' ? ' is-task' : ''}">
        <div class="tmsg-bubble">${m.kind === 'task' ? '<span class="tmsg-kind">Task update</span>' : ''}${teamEsc(m.text).replace(/\n/g, '<br>')}</div>
        <span class="tmsg-meta">${mine ? 'You' : teamEsc(m.fromName)} · <time datetime="${new Date(m.at).toISOString()}">${teamEsc(new Date(m.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))}</time></span>
      </li>`;
  }).join('');
  const draft = (document.getElementById('tmsg-input') || {}).value || '';
  pane.innerHTML = `
    <header class="tmsg-thread-head">
      <button type="button" class="tmsg-icon-btn tmsg-back" onclick="teamMsgBack()" aria-label="Back to conversations">${TEAM_ICON.back}</button>
      <span class="tm-avatar">${teamEsc(active.c.initials)}</span>
      <div><p class="tmsg-thread-name">${teamEsc(active.c.name)}</p><p class="tmsg-thread-role">${teamEsc(teamRelation(active.c))} · ${teamEsc(active.c.title)}</p></div>
    </header>
    <ol class="tmsg-messages" id="tmsg-messages" aria-live="polite">${items || '<li class="tmsg-empty">No messages yet. Say hello.</li>'}</ol>
    <form class="tmsg-composer" onsubmit="teamMsgSubmit(event)">
      <label class="visually-hidden" for="tmsg-input">Message ${teamEsc(active.c.name)}</label>
      <textarea id="tmsg-input" rows="1" placeholder="Message ${teamEsc(active.c.name.split(' ')[0])}…" onkeydown="teamMsgKey(event)" oninput="teamMsgGrow(this)"></textarea>
      <button type="submit" class="tmsg-send" aria-label="Send message">${TEAM_ICON.send}</button>
    </form>
    <p class="tmsg-hint">Enter to send · Shift + Enter for a new line</p>`;
  const input = document.getElementById('tmsg-input');
  if (input) { input.value = draft; teamMsgGrow(input); }
  const scroller = document.getElementById('tmsg-messages');
  if (scroller) scroller.scrollTop = scroller.scrollHeight;
}

function openTeamMessages(contactId) {
  const root = document.getElementById('tmsg');
  if (!root) return;
  if (!teamMe()) { teamNotify('Sign in as an Associate, Lead or Manager to use Messages.'); return; }
  teamSeedWelcome();
  const wasOpen = !root.hidden;
  if (contactId) teamMsgActive = contactId;
  else if (!wasOpen && window.innerWidth > 760) {
    const me = teamMe(), store = teamMsgStore();
    const first = teamContacts().map((c) => ({ c, u: teamUnread(store, me.id, teamThreadId(me.id, c.id)) })).sort((a, b) => b.u - a.u)[0];
    teamMsgActive = first ? first.c.id : null;
  }
  root.hidden = false;
  document.documentElement.classList.add('tmsg-open');
  if (!wasOpen) teamMsgLastFocus = document.activeElement;
  teamRenderMessages();
  setTimeout(() => {
    const i = document.getElementById('tmsg-input');
    if (i && contactId) i.focus();
    else { const b = root.querySelector('.tmsg-row.is-active, .tmsg-row'); if (b) b.focus(); }
  }, 30);
}
let teamMsgLastFocus = null;
function closeTeamMessages() {
  const root = document.getElementById('tmsg');
  if (!root || root.hidden) return;
  root.hidden = true;
  document.documentElement.classList.remove('tmsg-open');
  if (teamMsgLastFocus && teamMsgLastFocus.focus) teamMsgLastFocus.focus();
}
function teamMsgBack() { teamMsgActive = null; teamRenderMessages(); }
function teamMsgSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('tmsg-input');
  if (!input || !teamMsgActive) return;
  const text = input.value;
  if (!text.trim()) return;
  input.value = '';
  teamSendMessage(teamMsgActive, text);
  const i = document.getElementById('tmsg-input');
  if (i) i.focus();
}
function teamMsgKey(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); e.target.form.requestSubmit(); }
}
function teamMsgGrow(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px'; }

// Header + mobile-menu entry points with an unread badge (only while an Associate/Lead/Manager is signed in).
function teamRenderBadges() {
  const me = teamMe();
  document.documentElement.classList.toggle('ss-team-session', !!me);
  const n = me ? teamTotalUnread() : 0;
  document.querySelectorAll('[data-team-unread]').forEach((el) => {
    el.textContent = n > 9 ? '9+' : String(n);
    el.hidden = !n;
  });
  document.querySelectorAll('[data-team-messages]').forEach((el) => {
    el.setAttribute('aria-label', n ? `Messages, ${n} unread` : 'Messages');
  });
}

function teamOnSignIn() {
  teamMsgActive = null;
  teamSeedWelcome();
  teamRenderBadges();
  const n = teamTotalUnread();
  if (n) setTimeout(() => teamNotify(`You have ${n} unread message${n > 1 ? 's' : ''} in Messages.`), 1400);
}

(function initTeamLayer() {
  document.body.insertAdjacentHTML('beforeend', teamMessagesMarkup());
  const root = document.getElementById('tmsg');
  root.addEventListener('click', (e) => { if (e.target.closest('[data-tmsg-close]')) closeTeamMessages(); });
  document.addEventListener('keydown', (e) => {
    if (root.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeTeamMessages(); return; }
    if (e.key === 'Tab') { // keep focus inside the dialog
      const f = [...root.querySelectorAll('button, textarea, [href]')].filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  // Live updates from other tabs (e.g. the Manager replying in another window).
  window.addEventListener('storage', (e) => {
    if (e.key === TEAM_KEYS.messages) {
      const me = teamMe();
      const before = teamRenderBadges.lastTotal || 0;
      teamRenderMessages();
      const now = teamTotalUnread();
      if (me && now > before) {
        const store = teamMsgStore();
        const latest = Object.values(store.threads).filter((t) => t.members.includes(me.id)).flatMap((t) => t.messages).filter((m) => m.from !== me.id).sort((a, b) => b.at - a.at)[0];
        if (latest) teamNotify(`New message from ${latest.fromName}`);
      }
      teamRenderBadges.lastTotal = now;
    }
    if ((e.key === TEAM_KEYS.plans || e.key === TEAM_KEYS.status) && currentActiveSubordinate) {
      const step = document.getElementById('step-task-management');
      if (step && step.style.display !== 'none') loadSubordinatesList();
    }
  });
  setInterval(() => { teamRenderBadges.lastTotal = teamTotalUnread(); }, 4000);
  teamRenderBadges();
})();
