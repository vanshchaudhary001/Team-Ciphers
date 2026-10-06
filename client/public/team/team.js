/*
 * Team layer for the Associate, Lead & Manager and Supervisor portals.
 *
 *   1. Roles         three roles per team, built from the authoritative org positions:
 *                    Associate · Lead & Manager (lead and manager duties) · Supervisor (oversight).
 *   2. Task plans    Lead & Managers and Supervisors manage the plans of the people below them
 *                    ("Add task for employee", edit, archive, reorder, history).
 *   3. Reviews       completing a task needs proof (screenshot/document) and an approval:
 *                    Associate → Lead & Manager (or Supervisor) · Lead & Manager → Supervisor.
 *                    Only an approval writes "Completed" to the shared task status.
 *   4. Blocking      Lead & Managers can block Associates; Supervisors can block both.
 *   5. Messages      two-way Team Messages along the hierarchy, plus IT Support and HR.
 *
 * Plain script loaded after the app script, so it shares the app's globals (currentLiveDashboard,
 * currentSelectedTeam, companiesDatabase, escapeHtml, showNotification, goToStep, appendChatBubble, ...).
 * Shared state lives in localStorage (every account signed in on this browser sees it; other tabs update
 * live through the "storage" event). Proof files live in IndexedDB.
 */

const TEAM_KEYS = {
  plans: 'startsmart_team_plans_v1',
  messages: 'startsmart_team_messages_v1',
  status: 'startsmart_task_status_v4', // official status: "Completed" is only written by an approval
  reviews: 'startsmart_task_reviews_v1',
  blocks: 'startsmart_team_blocks_v1',
  seen: 'startsmart_team_seen_v1',
};
const TEAM_ROLES = {
  associate: { label: 'Associate', persona: 'Aarav Sharma', alias: 'aarav', css: 'associate' },
  leadmgr: { label: 'Lead & Manager', persona: 'Priya Nair', alias: 'priya', css: 'lead' },
  supervisor: { label: 'Supervisor', persona: 'Rahul Kapoor', alias: 'rahul', css: 'manager' },
};
const TEAM_CAN_MESSAGE = { associate: ['leadmgr', 'supervisor'], leadmgr: ['associate', 'supervisor'], supervisor: ['leadmgr', 'associate'] };
const TEAM_CAN_MANAGE = { leadmgr: ['associate'], supervisor: ['leadmgr', 'associate'] };   // plans, reviews and blocking
const TEAM_REVIEWERS = { associate: ['leadmgr', 'supervisor'], leadmgr: ['supervisor'] };    // who reviews whose tasks
const TEAM_MAX_FILE = 10 * 1024 * 1024;
const TEAM_MAX_FILES = 5;

function teamRead(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
}
function teamWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { teamNotify('Could not save: browser storage is full.'); return false; }
}
const teamEsc = (s) => (typeof escapeHtml === 'function' ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s));
const teamText = (s) => teamEsc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const teamInitials = (name) => String(name || '?').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const teamNotify = (msg) => { if (typeof showNotification === 'function') showNotification(msg); };
const teamFirst = (name) => String(name || '').split(' ')[0];
const teamIcon = (d, size = 16, sw = 1.7) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const TEAM_ICON = {
  plus: teamIcon('<path d="M12 5v14M5 12h14"/>'),
  chat: teamIcon('<path d="M20 12.5a7.5 7.5 0 0 1-10.9 6.7L4 20.5l1.4-4.6A7.5 7.5 0 1 1 20 12.5z"/>', 16, 1.6),
  up: teamIcon('<path d="M12 19V5M6 11l6-6 6 6"/>', 14, 1.8),
  down: teamIcon('<path d="M12 5v14M6 13l6 6 6-6"/>', 14, 1.8),
  send: teamIcon('<path d="M4.5 12h14M13 6l6 6-6 6"/>', 18),
  close: teamIcon('<path d="M6 6l12 12M18 6L6 18"/>', 18, 1.6),
  back: teamIcon('<path d="M19 12H5M11 6l-6 6 6 6"/>', 18, 1.6),
  upload: teamIcon('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>', 22, 1.5),
  file: teamIcon('<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4"/>', 20, 1.5),
  clock: teamIcon('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/>', 14, 2),
  lock: teamIcon('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>', 16, 1.6),
  check: teamIcon('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 16, 2),
};

// ==========================================================================
// 1. Roles and roster
// ==========================================================================
function teamRoleKey(level) {
  const l = String(level || '').toLowerCase();
  if (l.includes('supervisor')) return 'supervisor';
  if (l.includes('lead') || l.includes('manager')) return 'leadmgr';
  return 'associate';
}
const teamRoleLabel = (key) => (TEAM_ROLES[key] ? TEAM_ROLES[key].label : key);
function teamCompanyKey() { try { return currentSelectedCompany || 'microsoft'; } catch (e) { return 'microsoft'; } }
function teamCompany() { try { return companiesDatabase[teamCompanyKey()] || companiesDatabase.microsoft; } catch (e) { return null; } }
function teamDomain() { const c = teamCompany(); return c ? String(c.domain || '@microsoft.in').replace('@', '') : 'microsoft.in'; }
function teamCurrentTeam() { try { return currentSelectedTeam || null; } catch (e) { return null; } }
function teamDeptName() { try { return (currentSelectedDept && currentSelectedDept.name) || ''; } catch (e) { return ''; } }

// The three role slots of a team, mapped onto its real positions (their 30 authoritative tasks).
function teamSlots(team) {
  const ps = (team && team.positions) || [];
  if (!ps.length) return null;
  const assoc = ps.find((p) => p.roleLevel === 'Associate') || ps[0];
  const lead = ps.find((p) => p.roleLevel === 'Lead');
  const mgrs = ps.filter((p) => p.roleLevel === 'Manager');
  const lm = lead || mgrs[0] || assoc;
  const supPos = lead ? mgrs[0] : mgrs[1];
  const mk = (key, base, id, title) => ({
    key, id, taskPosId: base.id, roleKey: key, roleLevel: TEAM_ROLES[key].label,
    title: title || base.title, fullTitle: `${TEAM_ROLES[key].label} - ${title || base.title}`,
    roleTier: key === 'associate' ? 'ENTRY' : key === 'leadmgr' ? 'SENIOR' : 'LEADERSHIP', hierarchyPath: base.hierarchyPath, basePosition: base,
  });
  return {
    associate: mk('associate', assoc, assoc.id),
    leadmgr: mk('leadmgr', lm, lm.id),
    supervisor: supPos ? mk('supervisor', supPos, supPos.id) : mk('supervisor', mgrs[0] || lm, 'SUP-' + (mgrs[0] || lm).id, 'Team Supervisor'),
  };
}
function teamSlotPosition(team, key) { const s = teamSlots(team); return s ? s[key] || s.associate : null; }
// Which slot a sign-in email belongs to (aarav. → Associate, priya. → Lead & Manager, rahul. → Supervisor).
function teamSlotForEmail(team, email, fallbackPos) {
  const s = teamSlots(team);
  if (!s) return fallbackPos;
  const alias = String(email || '').toLowerCase().split('@')[0];
  if (alias.startsWith('priya')) return s.leadmgr;
  if (alias.startsWith('rahul')) return s.supervisor;
  if (alias.startsWith('aarav')) return s.associate;
  if (fallbackPos) return Object.values(s).find((x) => x.taskPosId === fallbackPos.id) || s.associate;
  return s.associate;
}

// Session kind: a team member (Associate / Lead & Manager / Supervisor) or the HR portal.
window.ssSessionKind = window.ssSessionKind || null;
function teamMe() {
  if (window.ssSessionKind === 'hr') {
    return { id: `SVC-HR-${teamCompanyKey()}`, name: (teamCompany()?.contacts?.hr?.person) || 'HR', roleKey: 'hr', roleLevel: 'HR', title: 'HR People Operations', initials: 'HR', service: 'hr' };
  }
  const emp = (window.currentLiveDashboard && window.currentLiveDashboard.employee) || null;
  if (!emp || !emp.positionId || window.ssSessionKind !== 'team') return null;
  const roleKey = teamRoleKey(emp.roleLevel);
  return { id: emp.employeeId, posId: emp.positionId, name: emp.name, roleKey, roleLevel: teamRoleLabel(roleKey), title: emp.fullTitle || emp.role, email: emp.email, initials: teamInitials(emp.name), team: emp.team, department: emp.department };
}
function teamRoster() {
  const team = teamCurrentTeam();
  const slots = teamSlots(team);
  const me = teamMe();
  if (!slots) return me && me.roleKey !== 'hr' ? [me] : [];
  return Object.values(slots).map((s) => {
    const name = TEAM_ROLES[s.key].persona;
    const p = {
      id: 'EMP-' + s.id, posId: s.id, taskPosId: s.taskPosId, position: s.basePosition, name, roleKey: s.key, roleLevel: s.roleLevel,
      title: s.fullTitle, email: `${TEAM_ROLES[s.key].alias}.${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}@${teamDomain()}`,
      initials: teamInitials(name), team: team.name, department: teamDeptName(),
    };
    if (me && me.id === p.id) { p.name = me.name; p.initials = me.initials; }
    return p;
  });
}
function teamServiceContacts() {
  const c = teamCompany();
  if (!c || !c.contacts) return [];
  return ['it', 'hr'].map((k) => {
    const x = c.contacts[k];
    return { id: x.messageId, name: x.team, roleKey: 'service', service: k, roleLevel: x.team, title: `${x.person} · ${x.role}`, initials: k === 'it' ? 'IT' : 'HR', phone: x.phone, hours: x.hours };
  });
}
const teamPerson = (id) => teamRoster().find((p) => p.id === id) || teamServiceContacts().find((p) => p.id === id) || teamPeopleDirectory()[id] || null;
function teamContacts() {
  const me = teamMe();
  if (!me) return [];
  if (me.roleKey === 'hr') {
    const store = teamMsgStore();
    return Object.values(store.threads).filter((t) => t.members.includes(me.id))
      .map((t) => t.members.find((m) => m !== me.id)).map((id) => teamPeopleDirectory()[id]).filter(Boolean);
  }
  const allowed = TEAM_CAN_MESSAGE[me.roleKey] || [];
  return [...teamRoster().filter((p) => p.id !== me.id && allowed.includes(p.roleKey)), ...teamServiceContacts()];
}
function teamReports() {
  const me = teamMe();
  if (!me) return [];
  const allowed = TEAM_CAN_MANAGE[me.roleKey] || [];
  const order = { leadmgr: 0, associate: 1 };
  return teamRoster().filter((p) => p.id !== me.id && allowed.includes(p.roleKey)).sort((a, b) => order[a.roleKey] - order[b.roleKey]);
}
const teamCanManage = (me, person) => !!me && !!person && (TEAM_CAN_MANAGE[me.roleKey] || []).includes(person.roleKey);
const teamCanReview = (me, roleKey) => !!me && (TEAM_REVIEWERS[roleKey] || []).includes(me.roleKey);
function teamReviewersFor(person) {
  const keys = TEAM_REVIEWERS[person.roleKey] || [];
  return teamRoster().filter((p) => keys.includes(p.roleKey) && p.id !== person.id);
}
// Text for the signed-in employee's own reviewer ("Priya Nair (Lead & Manager)").
function teamReviewerLabel() {
  const me = teamMe();
  if (!me) return 'your reviewer';
  const r = teamReviewersFor(me)[0];
  return r ? `${r.name} (${r.roleLevel})` : 'your reviewer';
}
function teamRelation(person) {
  const me = teamMe();
  if (!me || !person) return '';
  if (person.roleKey === 'service') return person.service === 'it' ? 'IT support' : 'HR';
  if (me.roleKey === 'hr') return person.roleLevel || '';
  if (person.roleKey === 'supervisor') return 'Your supervisor';
  if (person.roleKey === 'leadmgr') return me.roleKey === 'associate' ? 'Your Lead & Manager' : 'Lead & Manager in your team';
  return me.roleKey === 'leadmgr' ? 'Your associate' : 'Associate in your team';
}
function teamReportsTo(person) {
  const roster = teamRoster();
  const lm = roster.find((p) => p.roleKey === 'leadmgr');
  const sup = roster.find((p) => p.roleKey === 'supervisor');
  if (person.roleKey === 'associate') return [lm, sup].filter(Boolean);
  if (person.roleKey === 'leadmgr') return [sup].filter(Boolean);
  return [];
}
function isCurrentUserManager() { const me = teamMe(); return !!me && me.roleKey === 'supervisor'; }
function isCurrentUserDataLead() { const me = teamMe(); return !!me && me.roleKey === 'leadmgr'; }
function canCurrentSessionManageTasks() { return isCurrentUserManager() || isCurrentUserDataLead(); }

// ---------- Role selection (Associate · Lead & Manager · Supervisor) ----------
function renderRoleLevelSelection() {
  const team = teamCurrentTeam();
  const container = document.getElementById('role-levels-grid');
  const slots = teamSlots(team);
  if (!container || !slots) return;
  const meta = {
    associate: { tier: 'Entry – mid level (L1–L3)', icon: 'person', bullets: ['Completes onboarding tasks and submits proof for review', 'Paired with a senior buddy for Day 1', 'Tailored checklist and assistant prompts'] },
    leadmgr: { tier: 'Senior – lead & management (L4–M2)', icon: 'military_tech', bullets: ['Reviews associates\' proof and approves or rejects tasks', 'Assigns tasks and can block or unblock associates', 'Own tasks are reviewed by the Supervisor'] },
    supervisor: { tier: 'Leadership – supervisor (M3+)', icon: 'manage_accounts', bullets: ['Oversees associates and Lead & Managers', 'Reviews, approves and manages every team task', 'Full view of progress, reviews and access'] },
  };
  container.innerHTML = ['associate', 'leadmgr', 'supervisor'].map((k) => {
    const s = slots[k], m = meta[k];
    return `
      <div class="role-level-selection-card role-${TEAM_ROLES[k].css}" onclick="selectRoleLevel('${k}', '${s.id}')">
        <div>
          <div class="role-level-tier-badge"><span class="material-symbols-outlined" style="font-size: 15px;">${m.icon}</span><span>${m.tier}</span></div>
          <div class="role-position-exact-title">${teamEsc(s.fullTitle)}</div>
          <div class="role-position-path-tag">📍 <strong>ID:</strong> ${teamEsc(s.id)} · ${teamEsc(TEAM_ROLES[k].label)}</div>
          <ul class="role-position-bullets">${m.bullets.map((b) => `<li><span class="material-symbols-outlined" style="font-size: 16px; color: var(--success);">check_circle</span><span>${b}</span></li>`).join('')}</ul>
        </div>
        <button type="button" class="role-select-action-btn"><span>Select ${TEAM_ROLES[k].label.toLowerCase()}</span><span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span></button>
      </div>`;
  }).join('');
}

function selectRoleLevel(roleKey, posId) {
  const team = teamCurrentTeam();
  if (!team) return;
  const key = TEAM_ROLES[roleKey] ? roleKey : teamRoleKey(roleKey);
  const pos = teamSlotPosition(team, key);
  if (!pos) return;
  currentSelectedPosition = pos;
  fetchAuthoritativeTasksForPosition(pos.taskPosId, pos.basePosition);
  const comp = companiesDatabase[currentSelectedCompany] || companiesDatabase.microsoft;
  const domain = comp.domain ? comp.domain.replace('@', '') : 'microsoft.in';
  const alias = TEAM_ROLES[key].alias;
  const email = `${alias}.${pos.title.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}@${domain}`;
  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  const banner = document.getElementById('signin-target-position-banner');
  if (banner) banner.style.display = 'flex';
  set('signin-target-position-title', `🎯 Selected Position: ${pos.fullTitle}`);
  const branchName = currentSelectedBranch ? currentSelectedBranch.name : (currentSelectedDept ? currentSelectedDept.name : '');
  set('signin-target-hierarchy-path', `Hierarchy: ${comp.name} > ${currentSelectedDept.name} > ${branchName} > ${team.name} > ${pos.roleLevel}`);
  set('signin-breadcrumb-company', comp.name);
  set('signin-company-pill', comp.fullName);
  set('signin-company-title', comp.name);
  set('signin-tenant-badge-name', comp.fullName);
  set('signin-tenant-id', `Tenant ID: ${currentSelectedCompany}-corp-in-prod`);
  set('signin-sso-btn-text', `Continue with ${comp.name} SSO`);
  set('signin-btn-text', `Sign In as ${pos.roleLevel} (${pos.title})`);
  const logoBox = document.getElementById('tenant-logo-container');
  if (logoBox && typeof companyLogosSvg !== 'undefined') logoBox.innerHTML = companyLogosSvg[currentSelectedCompany] || companyLogosSvg.microsoft;
  const emailInput = document.getElementById('signin-email');
  const passwordInput = document.getElementById('signin-password');
  if (emailInput) { emailInput.value = email; emailInput.placeholder = email; }
  if (passwordInput) passwordInput.value = 'demo1234';
  const badge = document.getElementById('signin-detected-badge');
  if (badge) badge.className = 'role-detect-badge joiner';
  set('detected-role-title', `Detected role: ${pos.fullTitle}`);
  set('detected-role-desc', `Identified: ${TEAM_ROLES[key].persona} (${pos.fullTitle}) · ${currentSelectedDept.name} (${team.name}) · Routes to 70/30 Workspace`);
  renderDynamicSigninPersonas(pos, domain);
  teamNotify(`Selected: ${pos.fullTitle}`);
  goToStep('step-signin');
}

function renderDynamicSigninPersonas(selectedPos, domain) {
  const box = document.getElementById('microsoft-persona-section');
  const team = teamCurrentTeam();
  const slots = teamSlots(team);
  if (!box || !slots) return;
  box.style.display = 'block';
  const dots = { associate: '🟢', leadmgr: '🟣', supervisor: '🔵' };
  const pill = (k) => {
    const s = slots[k];
    const email = `${TEAM_ROLES[k].alias}.${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}@${domain}`;
    const on = selectedPos && selectedPos.roleKey === k;
    return `<button type="button" class="persona-pill-btn${on ? ' active' : ''}" onclick="applyPersonaCredential('${email}', 'demo1234', '${k}')">${dots[k]} ${TEAM_ROLES[k].persona} (${teamEsc(s.fullTitle)} · ${teamEsc(s.id)})</button>`;
  };
  box.innerHTML = `
    <div class="persona-section-label" style="font-weight: 500; color: var(--navy-900); margin-bottom: 8px;">⚡ 1-Click Credentials for ${teamEsc(team.name)} (${teamEsc(teamDeptName())}):</div>
    <div class="persona-quick-pills">
      ${['associate', 'leadmgr', 'supervisor'].map(pill).join('')}
      <button type="button" class="persona-pill-btn" onclick="applyPersonaCredential('hr@${domain}', 'demo1234', null, 'hr')">👤 Priya Sharma (HR People Partner · ${teamEsc(teamDeptName())})</button>
      <button type="button" class="persona-pill-btn" onclick="applyPersonaCredential('buddy@${domain}', 'demo1234', null, 'buddy')">🤝 Rahul Pandey (Assigned Senior Buddy Mentor)</button>
    </div>`;
}

function applyPersonaCredential(email, password, slotKey, roleOverride) {
  const emailInput = document.getElementById('signin-email');
  const passwordInput = document.getElementById('signin-password');
  if (emailInput) emailInput.value = email;
  if (passwordInput) passwordInput.value = password;
  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  const team = teamCurrentTeam();
  if (slotKey && team) {
    const pos = TEAM_ROLES[slotKey] ? teamSlotPosition(team, slotKey) : teamSlotForEmail(team, email);
    if (pos) {
      currentSelectedPosition = pos;
      set('signin-target-position-title', `🎯 Selected Position: ${pos.fullTitle}`);
      set('signin-btn-text', `Sign In as ${pos.roleLevel} (${pos.title})`);
    }
  }
  if (roleOverride === 'hr' || roleOverride === 'buddy') {
    const badge = document.getElementById('signin-detected-badge');
    if (badge) badge.className = 'role-detect-badge ' + roleOverride;
    set('detected-role-title', roleOverride === 'hr' ? 'Detected role: HR People Partner' : 'Detected role: Onboarding Buddy');
    set('detected-role-desc', roleOverride === 'hr' ? `HR Operations for ${teamDeptName() || 'the organisation'} · Routes to HR Command` : `Assigned peer mentor for ${team ? team.name : 'the team'} · Routes to Buddy Dashboard`);
    set('signin-btn-text', roleOverride === 'hr' ? 'Sign in to HR' : 'Sign in to buddy portal');
    return;
  }
  if (typeof handleEmailInput === 'function') handleEmailInput(email);
}

// ==========================================================================
// 2. Shared stores: status, reviews, blocks
// ==========================================================================
const teamStatuses = () => teamRead(TEAM_KEYS.status, {});
const teamReviews = () => teamRead(TEAM_KEYS.reviews, {});
const teamBlocks = () => teamRead(TEAM_KEYS.blocks, {});
const teamReviewOf = (empId, taskId) => ((teamReviews()[empId] || {})[taskId]) || null;
const teamIsBlocked = (empId) => !!(teamBlocks()[empId] && teamBlocks()[empId].blocked);
function teamSetStatus(empId, taskId, status) {
  const s = teamStatuses();
  s[`${empId}_${taskId}`] = status;
  teamWrite(TEAM_KEYS.status, s);
}
function teamSaveReview(rv) {
  const all = teamReviews();
  all[rv.empId] = all[rv.empId] || {};
  all[rv.empId][rv.taskId] = rv;
  return teamWrite(TEAM_KEYS.reviews, all);
}
// Pending Review / Rejected / Completed for one task, from the shared stores.
function teamTaskState(empId, task) {
  const official = teamStatuses()[`${empId}_${task.taskId}`];
  if (official === 'Completed') return 'Completed';
  const rv = teamReviewOf(empId, task.taskId);
  if (rv && rv.status === 'pending_review') return 'Pending Review';
  if (rv && rv.status === 'rejected') return 'Rejected';
  if (official) return official;
  return task.num === 1 && !task.isCustom && !task.assignedByName ? 'Completed' : 'Pending'; // account setup is verified by IT
}

// ---------- Proof files (IndexedDB) ----------
const ProofDB = {
  db: null, memory: new Map(),
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) { reject(new Error('no indexedDB')); return; }
      const req = indexedDB.open('startsmart-proofs', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('files', { keyPath: 'id' });
      req.onsuccess = () => { this.db = req.result; resolve(this.db); };
      req.onerror = () => reject(req.error);
    });
  },
  async put(rec) {
    try {
      const db = await this.open();
      await new Promise((res, rej) => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(rec); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    } catch (e) { this.memory.set(rec.id, rec); }
  },
  async get(id) {
    if (this.memory.has(id)) return this.memory.get(id);
    try {
      const db = await this.open();
      return await new Promise((res, rej) => { const r = db.transaction('files').objectStore('files').get(id); r.onsuccess = () => res(r.result || null); r.onerror = () => rej(r.error); });
    } catch (e) { return null; }
  },
};
const teamFmtSize = (b) => (b > 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
const teamIsImage = (type) => /^image\//.test(type || '');
const teamUrlCache = new Map();
async function teamProofUrl(id) {
  if (teamUrlCache.has(id)) return teamUrlCache.get(id);
  const rec = await ProofDB.get(id);
  if (!rec) return null;
  const url = URL.createObjectURL(rec.blob);
  teamUrlCache.set(id, url);
  return url;
}
// Fill <img data-proof-id> / [data-proof-href] placeholders once the blobs are loaded.
async function teamHydrateProofs(root) {
  for (const el of root.querySelectorAll('[data-proof-id]')) {
    const url = await teamProofUrl(el.dataset.proofId);
    if (url && el.tagName === 'IMG') el.src = url;
  }
}

// ==========================================================================
// 3. Task plans (management of the people below you)
// ==========================================================================
const teamDayFor = (n) => (n <= 6 ? 'Day 1' : n <= 12 ? 'Day 2' : n <= 18 ? 'Day 3' : n <= 24 ? 'Day 4' : 'Day 5');
const teamPlans = () => teamRead(TEAM_KEYS.plans, {});
function teamSavePlan(empId, tasks) {
  const plans = teamPlans();
  plans[empId] = { tasks: tasks.map(({ status, review, ...rest }) => rest), updatedAt: Date.now() };
  teamWrite(TEAM_KEYS.plans, plans);
}
function teamMe4History() {
  const me = teamMe();
  return { modifiedByName: me ? me.name : 'Manager', modifiedByRole: me ? me.roleLevel : 'Manager' };
}

async function teamLoadPlan(person) {
  const saved = teamPlans()[person.id];
  let tasks = saved && Array.isArray(saved.tasks) && saved.tasks.length ? saved.tasks.map((t) => ({ ...t })) : null;
  if (!tasks) {
    let raw = [];
    try {
      const data = await fetchAuthoritativeTasksForPosition(person.taskPosId || person.posId, person.position);
      raw = (data && data.tasks) || [];
    } catch (e) { raw = []; }
    if (!raw.length) {
      raw = Array.from({ length: 30 }, (_, i) => ({ num: i + 1, title: i === 0 ? 'Secure account & workspace setup' : `${person.team} milestone ${i + 1}`, desc: `Onboarding activity for ${person.title} in ${person.team}.` }));
    }
    tasks = raw.map((t, i) => {
      const num = t.num || i + 1;
      const fields = {
        title: t.title, description: t.desc || t.description || '', day: t.day || teamDayFor(num),
        priority: t.priority || (num <= 6 ? 'High' : num <= 20 ? 'Medium' : 'Standard'),
        category: t.category || person.team, estimatedDuration: t.duration || '45 mins',
      };
      const taskId = t.taskId || 'T' + String(num).padStart(3, '0');
      return {
        id: `${person.id}_${taskId}`, taskId, num, ...fields, original: { ...fields },
        managementStatus: 'ACTIVE', originType: 'DEFAULT', version: 1, orderIndex: num,
        history: [{ modifiedByName: 'Onboarding template', modifiedByRole: 'System', action: 'TASK_CREATED', createdAt: '2026-10-04T09:00:00.000Z', summary: 'Assigned from the authoritative onboarding template' }],
      };
    });
  }
  tasks.forEach((t) => { t.status = teamTaskState(person.id, t); t.review = teamReviewOf(person.id, t.taskId); });
  return tasks;
}

// Applied to an employee's own checklist (at sign-in and whenever shared data changes):
// their Lead & Manager / Supervisor's plan changes, official statuses and review states. Idempotent.
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
    plan.tasks.filter((p) => p.originType === 'CUSTOM' && p.managementStatus !== 'ARCHIVED' && !tasks.some((t) => String(t.taskId) === String(p.taskId))).forEach((p) => {
      tasks.push({
        taskId: p.taskId, id: p.id, progressId: `PROG_${emp.employeeId}_${p.taskId}`, isCustom: true,
        taskName: p.title, title: p.title, description: p.description, desc: p.description,
        day: p.day, priority: p.priority, duration: p.estimatedDuration, category: p.category,
        department: emp.department, subDepartment: emp.subDepartment, status: 'Pending', done: false,
        isMandatory: p.required !== false, assignedByName: p.assignedByName, assignedByRole: p.assignedByRole,
        objective: p.description || p.title,
        chatbotExecution: [
          `Read the brief from ${p.assignedByName} (${p.assignedByRole}): ${p.description || p.title}.`,
          `If anything is unclear, ask ${p.assignedByName} in Messages before you start.`,
          'Do the work and keep a screenshot or document that shows the result.',
          'Choose "Mark complete", upload your proof and submit it for review.',
        ],
        definitionOfDone: `${p.assignedByName} has what they asked for, and your proof is approved.`,
      });
    });
    const order = new Map(plan.tasks.map((p) => [String(p.taskId), p.orderIndex]));
    const base = new Map(tasks.map((t, i) => [String(t.taskId), i + 1]));
    tasks.sort((a, b) => (order.get(String(a.taskId)) ?? base.get(String(a.taskId))) - (order.get(String(b.taskId)) ?? base.get(String(b.taskId))));
  }
  tasks.forEach((t) => {
    t.status = teamTaskState(emp.employeeId, t);
    t.done = t.status === 'Completed';
    t.review = teamReviewOf(emp.employeeId, t.taskId);
    t.autoVerified = t.done && !t.review && !teamStatuses()[`${emp.employeeId}_${t.taskId}`];
  });
  const done = tasks.filter((t) => t.done).length;
  dash.tasks = tasks;
  dash.metrics = { ...(dash.metrics || {}), totalTasks: tasks.length, completedTasks: done, pendingTasks: tasks.length - done, percentage: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
  return dash;
}

// Re-apply shared data to the signed-in employee's checklist and redraw it.
function teamRefreshMyDashboard() {
  if (!window.currentLiveDashboard || !teamMe() || teamMe().roleKey === 'hr') return;
  teamApplyPlanToDashboard(window.currentLiveDashboard);
  if (typeof liveTasksList !== 'undefined') liveTasksList = window.currentLiveDashboard.tasks;
  if (typeof renderManualDashboardFromLive === 'function') renderManualDashboardFromLive(window.currentLiveDashboard);
  teamRenderBlockState();
}

// ---------- Completing a task: proof → review ----------
// Replaces the old one-click toggle. Supervisors (top of the hierarchy) complete their own tasks directly.
function toggleLiveTask(progressId, currentStatus, taskId) {
  const me = teamMe();
  if (!me || me.roleKey === 'hr') return setLiveTaskStatus(progressId, currentStatus, taskId);
  if (teamIsBlocked(me.id)) { teamNotify('Your access is blocked, so tasks can\'t be completed right now.'); teamRenderBlockState(); return; }
  if (me.roleKey === 'supervisor') return setLiveTaskStatus(progressId, currentStatus, taskId);
  const task = (window.currentLiveDashboard?.tasks || []).find((t) => String(t.taskId) === String(taskId));
  if (!task) return;
  openProofModal(task.taskId);
}

let proofDraft = { taskId: null, files: [] };
function openProofModal(taskId) {
  const me = teamMe();
  const task = (window.currentLiveDashboard?.tasks || []).find((t) => String(t.taskId) === String(taskId));
  if (!me || !task) return;
  const state = teamTaskState(me.id, task);
  const rv = teamReviewOf(me.id, task.taskId);
  proofDraft.files.forEach((f) => URL.revokeObjectURL(f.url));
  proofDraft = { taskId: task.taskId, files: [] };
  const title = document.getElementById('tproof-title');
  const sub = document.getElementById('tproof-sub');
  const body = document.getElementById('tproof-body');
  sub.textContent = task.taskName || task.title;
  if (state === 'Completed') {
    title.textContent = 'Task completed';
    body.innerHTML = `
      <div class="tproof-callout is-ok">${TEAM_ICON.check}<div><strong>Approved${rv && rv.reviewedBy ? ` by ${teamEsc(rv.reviewedBy.name)} (${teamEsc(rv.reviewedBy.roleLevel)})` : ''}</strong>
        <span>${rv && rv.reviewedAt ? teamEsc(teamFormatDate(rv.reviewedAt)) : 'Verified by IT during account setup'}</span></div></div>
      ${rv ? teamProofList(rv) : ''}
      <div class="tproof-foot"><button type="button" class="tm-btn" onclick="closeProofModal()">Close</button></div>`;
  } else if (state === 'Pending Review') {
    title.textContent = 'Waiting for review';
    body.innerHTML = `
      <div class="tproof-callout is-review">${TEAM_ICON.clock}<div><strong>Submitted ${teamEsc(teamFormatDate(rv.submittedAt))}</strong>
        <span>${teamEsc(teamReviewerLabel())} will review your proof. You'll get the result here and in Messages.</span></div></div>
      ${rv.note ? `<p class="tproof-note"><strong>Your note:</strong> ${teamEsc(rv.note)}</p>` : ''}
      ${teamProofList(rv)}
      <div class="tproof-foot">
        <button type="button" class="tm-btn is-ghost" onclick="teamWithdrawSubmission('${teamEsc(task.taskId)}')">Withdraw submission</button>
        <button type="button" class="tm-btn" onclick="closeProofModal()">Close</button>
      </div>`;
  } else {
    title.textContent = state === 'Rejected' ? 'Resubmit for review' : 'Submit for review';
    body.innerHTML = `
      ${state === 'Rejected' ? `<div class="tproof-callout is-rejected"><strong>Changes requested by ${teamEsc(rv.reviewedBy ? rv.reviewedBy.name : 'your reviewer')}</strong><span>${teamEsc(rv.feedback || '')}</span></div>` : ''}
      <p class="tproof-intro">Upload a screenshot or document that shows the task is done. ${teamEsc(teamReviewerLabel())} reviews it, and the task is marked completed once it's approved.</p>
      <label class="tproof-drop" id="tproof-drop">
        ${TEAM_ICON.upload}
        <span class="tproof-drop-title">Upload a screenshot or document</span>
        <span class="tproof-drop-sub">Drag files here or choose them · images, PDF, Word, Excel, PowerPoint, text · up to 10 MB each</span>
        <input type="file" id="tproof-input" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.zip" onchange="teamAddProofFiles(this.files); this.value='';">
      </label>
      <ul class="tproof-files" id="tproof-files"></ul>
      <div>
        <label class="tm-label" for="tproof-note">Note for your reviewer <span class="tproof-optional">(optional)</span></label>
        <textarea id="tproof-note" class="tm-input tproof-textarea" rows="3" placeholder="What did you do? Anything they should know?"></textarea>
      </div>
      <div class="tproof-foot">
        <button type="button" class="tm-btn" onclick="closeProofModal()">Cancel</button>
        <button type="button" class="tm-btn is-primary" id="tproof-submit" disabled onclick="teamSubmitProof()">Submit for review</button>
      </div>`;
    const drop = document.getElementById('tproof-drop');
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', (e) => teamAddProofFiles(e.dataTransfer.files));
  }
  const modal = document.getElementById('tproof');
  modal.hidden = false;
  teamHydrateProofs(body);
  setTimeout(() => { const f = body.querySelector('input[type=file], .tm-btn'); if (f) f.focus(); }, 40);
}
function closeProofModal() {
  const modal = document.getElementById('tproof');
  if (modal) modal.hidden = true;
  proofDraft.files.forEach((f) => URL.revokeObjectURL(f.url));
  proofDraft = { taskId: null, files: [] };
}
function teamAddProofFiles(fileList) {
  for (const f of Array.from(fileList || [])) {
    if (proofDraft.files.length >= TEAM_MAX_FILES) { teamNotify(`You can attach up to ${TEAM_MAX_FILES} files.`); break; }
    if (f.size > TEAM_MAX_FILE) { teamNotify(`${f.name} is larger than 10 MB.`); continue; }
    proofDraft.files.push({ file: f, url: URL.createObjectURL(f) });
  }
  teamRenderProofDraft();
}
function teamRemoveProofFile(i) {
  const [f] = proofDraft.files.splice(i, 1);
  if (f) URL.revokeObjectURL(f.url);
  teamRenderProofDraft();
}
function teamRenderProofDraft() {
  const list = document.getElementById('tproof-files');
  const submit = document.getElementById('tproof-submit');
  if (!list) return;
  list.innerHTML = proofDraft.files.map((f, i) => `
    <li class="tproof-file">
      ${teamIsImage(f.file.type) ? `<a href="${f.url}" target="_blank" rel="noopener" class="tproof-thumb"><img src="${f.url}" alt="Preview of ${teamEsc(f.file.name)}"></a>` : `<a href="${f.url}" target="_blank" rel="noopener" class="tproof-thumb is-doc">${TEAM_ICON.file}</a>`}
      <span class="tproof-file-text"><span class="tproof-file-name">${teamEsc(f.file.name)}</span><span class="tproof-file-meta">${teamEsc(teamFmtSize(f.file.size))} · <a href="${f.url}" target="_blank" rel="noopener">Preview</a></span></span>
      <button type="button" class="tm-icon-btn" onclick="teamRemoveProofFile(${i})" aria-label="Remove ${teamEsc(f.file.name)}">${teamIcon('<path d="M6 6l12 12M18 6L6 18"/>', 14, 1.8)}</button>
    </li>`).join('');
  if (submit) submit.disabled = !proofDraft.files.length;
}
function teamProofList(rv) {
  if (!rv || !rv.proofs || !rv.proofs.length) return '';
  return `<ul class="tproof-files is-readonly">${rv.proofs.map((p) => `
    <li class="tproof-file">
      ${teamIsImage(p.type) ? `<button type="button" class="tproof-thumb" onclick="teamOpenProof('${p.id}')"><img data-proof-id="${p.id}" alt="Proof: ${teamEsc(p.name)}"></button>` : `<button type="button" class="tproof-thumb is-doc" onclick="teamOpenProof('${p.id}')">${TEAM_ICON.file}</button>`}
      <span class="tproof-file-text"><span class="tproof-file-name">${teamEsc(p.name)}</span><span class="tproof-file-meta">${teamEsc(teamFmtSize(p.size))} · <button type="button" class="tproof-link" onclick="teamOpenProof('${p.id}')">Open</button></span></span>
    </li>`).join('')}</ul>`;
}
async function teamOpenProof(id) {
  const rec = await ProofDB.get(id);
  if (!rec) { teamNotify('This file is not available in this browser.'); return; }
  const url = await teamProofUrl(id);
  const v = document.getElementById('tproof-viewer');
  const box = v.querySelector('.tproof-viewer-body');
  v.querySelector('.tproof-viewer-name').textContent = rec.name;
  v.querySelector('.tproof-viewer-download').href = url;
  v.querySelector('.tproof-viewer-download').download = rec.name;
  if (teamIsImage(rec.type)) box.innerHTML = `<img src="${url}" alt="${teamEsc(rec.name)}">`;
  else if (rec.type === 'application/pdf') box.innerHTML = `<iframe src="${url}" title="${teamEsc(rec.name)}"></iframe>`;
  else if (/^text\//.test(rec.type)) box.innerHTML = `<pre>${teamEsc(await rec.blob.text())}</pre>`;
  else box.innerHTML = `<div class="tproof-viewer-doc">${TEAM_ICON.file}<p>${teamEsc(rec.name)}</p><span>${teamEsc(teamFmtSize(rec.size))} · download to open it</span></div>`;
  v.hidden = false;
}
function closeProofViewer() { const v = document.getElementById('tproof-viewer'); if (v) v.hidden = true; }

async function teamSubmitProof() {
  const me = teamMe();
  const task = (window.currentLiveDashboard?.tasks || []).find((t) => String(t.taskId) === String(proofDraft.taskId));
  if (!me || !task || !proofDraft.files.length) return;
  if (teamIsBlocked(me.id)) { teamNotify('Your access is blocked.'); return; }
  const btn = document.getElementById('tproof-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }
  const now = Date.now();
  const proofs = [];
  for (const [i, f] of proofDraft.files.entries()) {
    const id = `pf_${me.id}_${task.taskId}_${now}_${i}`;
    await ProofDB.put({ id, name: f.file.name, type: f.file.type || 'application/octet-stream', size: f.file.size, blob: f.file, at: now });
    proofs.push({ id, name: f.file.name, type: f.file.type || 'application/octet-stream', size: f.file.size });
  }
  const note = (document.getElementById('tproof-note') || {}).value?.trim() || '';
  const prev = teamReviewOf(me.id, task.taskId) || { history: [], attempts: 0 };
  const reviewers = teamReviewersFor(me);
  const rv = {
    ...prev, taskId: task.taskId, taskTitle: task.taskName || task.title, taskDay: task.day, empId: me.id, empName: me.name, empRoleKey: me.roleKey,
    status: 'pending_review', note, proofs, submittedAt: now, reviewedBy: null, reviewedAt: null, attempts: (prev.attempts || 0) + 1,
    reviewers: reviewers.map((r) => r.id), team: me.team, history: [...(prev.history || []), { action: 'submitted', by: me.name, at: now, note }],
  };
  if (!teamSaveReview(rv)) return;
  reviewers.forEach((r) => teamSendMessage(r.id, `Task submitted for review: "${rv.taskTitle}" (${proofs.length} file${proofs.length > 1 ? 's' : ''} attached).${note ? ' Note: ' + note : ''}`, { kind: 'review', empId: me.id, taskId: task.taskId }, true));
  closeProofModal();
  teamRefreshMyDashboard();
  teamNotify('Task submitted for review.');
  teamCopilotNote(`<div class="ca"><p class="ca-lead"><strong>Task submitted for review.</strong> "${teamEsc(rv.taskTitle)}" is with ${teamEsc(teamReviewerLabel())}. It will show as completed once they approve your proof.</p></div>`);
}
function teamWithdrawSubmission(taskId) {
  const me = teamMe();
  const rv = me && teamReviewOf(me.id, taskId);
  if (!rv || rv.status !== 'pending_review') return;
  rv.status = 'withdrawn';
  rv.history.push({ action: 'withdrawn', by: me.name, at: Date.now() });
  teamSaveReview(rv);
  closeProofModal();
  teamRefreshMyDashboard();
  teamNotify('Submission withdrawn. You can submit new proof any time.');
}

// ---------- Reviewing (Lead & Manager, Supervisor) ----------
function teamPendingReviewsForMe() {
  const me = teamMe();
  if (!me || me.roleKey === 'hr') return [];
  const ids = new Set(teamReports().map((p) => p.id));
  const all = teamReviews();
  return Object.keys(all).filter((empId) => ids.has(empId)).flatMap((empId) => Object.values(all[empId]))
    .filter((rv) => rv.status === 'pending_review' && teamCanReview(me, rv.empRoleKey)).sort((a, b) => a.submittedAt - b.submittedAt);
}
function teamRecentReviewsForMe() {
  const me = teamMe();
  if (!me) return [];
  const ids = new Set(teamReports().map((p) => p.id));
  const all = teamReviews();
  return Object.keys(all).filter((empId) => ids.has(empId)).flatMap((empId) => Object.values(all[empId]))
    .filter((rv) => rv.status === 'approved' || rv.status === 'rejected').sort((a, b) => b.reviewedAt - a.reviewedAt).slice(0, 12);
}

function openReviewModal(empId, taskId) {
  const me = teamMe();
  const rv = teamReviewOf(empId, taskId);
  if (!me || !rv) { teamNotify('This submission is no longer available.'); return; }
  const person = teamPerson(empId) || { name: rv.empName, roleLevel: teamRoleLabel(rv.empRoleKey) };
  const canAct = rv.status === 'pending_review' && teamCanReview(me, rv.empRoleKey) && !teamIsBlocked(me.id);
  document.getElementById('tproof-title').textContent = rv.status === 'pending_review' ? 'Review task' : 'Task review';
  document.getElementById('tproof-sub').textContent = `${person.name} · ${person.roleLevel || teamRoleLabel(rv.empRoleKey)}`;
  const past = (rv.history || []).filter((h) => h.action === 'rejected');
  const body = document.getElementById('tproof-body');
  body.innerHTML = `
    <div class="tproof-task">
      <p class="tm-eyebrow">${teamEsc(rv.taskDay || '')}${rv.attempts > 1 ? ` · Submission ${rv.attempts}` : ''}</p>
      <h4 class="tproof-task-title">${teamEsc(rv.taskTitle)}</h4>
      <p class="tproof-task-meta">Submitted ${teamEsc(teamFormatDate(rv.submittedAt))}</p>
      ${rv.note ? `<p class="tproof-note"><strong>${teamEsc(teamFirst(person.name))}'s note:</strong> ${teamEsc(rv.note)}</p>` : ''}
    </div>
    <p class="tm-label">Proof</p>
    ${teamProofList(rv)}
    ${past.length ? `<details class="tproof-history"><summary>Earlier feedback (${past.length})</summary><ul>${past.map((h) => `<li><strong>${teamEsc(h.by)}</strong> · ${teamEsc(teamFormatDate(h.at))}<br>${teamEsc(h.note || '')}</li>`).join('')}</ul></details>` : ''}
    ${rv.status === 'approved' ? `<div class="tproof-callout is-ok">${TEAM_ICON.check}<div><strong>Approved by ${teamEsc(rv.reviewedBy.name)}</strong><span>${teamEsc(teamFormatDate(rv.reviewedAt))}</span></div></div>` : ''}
    ${rv.status === 'rejected' ? `<div class="tproof-callout is-rejected"><strong>Changes requested by ${teamEsc(rv.reviewedBy.name)}</strong><span>${teamEsc(rv.feedback)}</span></div>` : ''}
    ${canAct ? `
      <div>
        <label class="tm-label" for="treview-feedback">Feedback <span class="tproof-optional">(required to reject)</span></label>
        <textarea id="treview-feedback" class="tm-input tproof-textarea" rows="3" placeholder="What needs to change? Be specific so ${teamEsc(teamFirst(person.name))} can fix it."></textarea>
      </div>
      <div class="tproof-foot">
        <button type="button" class="tm-btn is-danger" onclick="teamRejectTask('${teamEsc(empId)}', '${teamEsc(taskId)}')">Reject</button>
        <button type="button" class="tm-btn is-primary" onclick="teamApproveTask('${teamEsc(empId)}', '${teamEsc(taskId)}')">${TEAM_ICON.check}<span>Approve</span></button>
      </div>` : `<div class="tproof-foot"><button type="button" class="tm-btn" onclick="closeProofModal()">Close</button></div>`}`;
  document.getElementById('tproof').hidden = false;
  teamHydrateProofs(body);
}
function teamApproveTask(empId, taskId) {
  if (teamGuardBlocked()) return;
  const me = teamMe();
  const rv = teamReviewOf(empId, taskId);
  if (!me || !rv || rv.status !== 'pending_review' || !teamCanReview(me, rv.empRoleKey)) return;
  const now = Date.now();
  rv.status = 'approved';
  rv.reviewedBy = { id: me.id, name: me.name, roleLevel: me.roleLevel };
  rv.reviewedAt = now;
  rv.history.push({ action: 'approved', by: me.name, at: now });
  teamSaveReview(rv);
  teamSetStatus(empId, taskId, 'Completed');
  teamSendMessage(empId, `Task approved by ${me.roleLevel}: "${rv.taskTitle}". It's now marked as completed.`, { kind: 'approved', taskId }, true);
  closeProofModal();
  teamNotify(`Approved: ${rv.taskTitle}`);
  teamAfterReviewChange();
}
function teamRejectTask(empId, taskId) {
  if (teamGuardBlocked()) return;
  const me = teamMe();
  const rv = teamReviewOf(empId, taskId);
  const box = document.getElementById('treview-feedback');
  const feedback = box ? box.value.trim() : '';
  if (!feedback) { if (box) { box.focus(); box.classList.add('is-invalid'); } teamNotify('Add feedback so they know what to change.'); return; }
  if (!me || !rv || rv.status !== 'pending_review' || !teamCanReview(me, rv.empRoleKey)) return;
  const now = Date.now();
  rv.status = 'rejected';
  rv.feedback = feedback;
  rv.reviewedBy = { id: me.id, name: me.name, roleLevel: me.roleLevel };
  rv.reviewedAt = now;
  rv.history.push({ action: 'rejected', by: me.name, at: now, note: feedback });
  teamSaveReview(rv);
  teamSendMessage(empId, `Task requires changes: ${feedback} ("${rv.taskTitle}")`, { kind: 'rejected', taskId }, true);
  closeProofModal();
  teamNotify(`Sent back with feedback: ${rv.taskTitle}`);
  teamAfterReviewChange();
}
function teamAfterReviewChange() {
  const step = document.getElementById('step-task-management');
  if (step && step.style.display !== 'none') loadSubordinatesList();
  teamRenderReviewBadges();
}

// ---------- Blocking ----------
async function teamToggleBlock(empId) {
  if (teamGuardBlocked()) return;
  const me = teamMe();
  const person = teamPerson(empId);
  if (!me || !person || !teamCanManage(me, person)) { teamNotify('You can only block people you manage.'); return; }
  const blocked = teamIsBlocked(empId);
  const ok = await teamConfirm(blocked ? {
    title: `Unblock ${person.name}?`, body: `${teamFirst(person.name)} gets their access back. Their tasks and progress are unchanged.`, confirm: 'Unblock',
  } : {
    title: `Block ${person.name}?`, body: `${teamFirst(person.name)} won't be able to complete or submit tasks until you unblock them. Their tasks and progress stay saved.`,
    confirm: 'Block access', danger: true, input: { label: 'Reason (shared with them)', placeholder: 'e.g. Pending security review of your account' },
  });
  if (!ok) return;
  const all = teamBlocks();
  const now = Date.now();
  const rec = all[empId] || { history: [] };
  if (blocked) {
    Object.assign(rec, { blocked: false, unblockedBy: { id: me.id, name: me.name, roleLevel: me.roleLevel }, unblockedAt: now });
    rec.history.push({ action: 'unblocked', by: me.name, at: now });
  } else {
    Object.assign(rec, { blocked: true, by: { id: me.id, name: me.name, roleLevel: me.roleLevel }, at: now, reason: ok.value || '' });
    rec.history.push({ action: 'blocked', by: me.name, at: now, reason: ok.value || '' });
  }
  all[empId] = rec;
  teamWrite(TEAM_KEYS.blocks, all);
  teamSendMessage(empId, blocked ? 'Your access has been restored. You can continue your onboarding tasks.' : `Your access has been blocked by ${me.name} (${me.roleLevel}).${ok.value ? ' Reason: ' + ok.value : ''} Your tasks and progress are saved.`, { kind: blocked ? 'unblock' : 'block' }, true);
  teamNotify(blocked ? `${person.name} is unblocked.` : `${person.name} is blocked.`);
  renderSubordinateDetailBanner();
  applySubordinateFilters();
}
// Banner + disabled task actions for a blocked employee.
function teamRenderBlockState() {
  const me = teamMe();
  const rec = me && me.roleKey !== 'hr' ? teamBlocks()[me.id] : null;
  const blocked = !!(rec && rec.blocked);
  document.documentElement.classList.toggle('ss-blocked', blocked);
  let banner = document.getElementById('team-block-banner');
  if (!blocked) { if (banner) banner.remove(); return; }
  const anchor = document.getElementById('role-workspace-nav-bar');
  if (!anchor) return;
  if (!banner) { banner = document.createElement('div'); banner.id = 'team-block-banner'; banner.setAttribute('role', 'alert'); anchor.parentNode.insertBefore(banner, anchor); }
  banner.className = 'team-block-banner';
  banner.innerHTML = `
    <span class="team-block-icon">${TEAM_ICON.lock}</span>
    <div class="team-block-text">
      <strong>Your account is blocked</strong>
      <span>Blocked by ${teamEsc(rec.by.name)} (${teamEsc(rec.by.roleLevel)}) on ${teamEsc(teamFormatDate(rec.at))}.${rec.reason ? ' Reason: ' + teamEsc(rec.reason) + '.' : ''} You can't complete or submit tasks until access is restored. Your tasks and progress are saved.</span>
    </div>
    <button type="button" class="tm-btn is-sm" onclick="openTeamMessages('${teamEsc(rec.by.id)}')">Message ${teamEsc(teamFirst(rec.by.name))}</button>`;
}

// Small confirm dialog: resolves { value } or false.
function teamConfirm({ title, body, confirm, danger, input }) {
  return new Promise((resolve) => {
    const m = document.getElementById('tconfirm');
    m.querySelector('.tconfirm-title').textContent = title;
    m.querySelector('.tconfirm-body').textContent = body;
    const field = m.querySelector('.tconfirm-field');
    field.hidden = !input;
    if (input) { field.querySelector('label').textContent = input.label; const i = field.querySelector('input'); i.value = ''; i.placeholder = input.placeholder || ''; }
    const ok = m.querySelector('.tconfirm-ok');
    ok.textContent = confirm;
    ok.className = 'tm-btn ' + (danger ? 'is-danger-solid' : 'is-primary') + ' tconfirm-ok';
    const done = (v) => { m.hidden = true; ok.onclick = null; m.querySelector('.tconfirm-cancel').onclick = null; resolve(v); };
    ok.onclick = () => done({ value: input ? field.querySelector('input').value.trim() : '' });
    m.querySelector('.tconfirm-cancel').onclick = () => done(false);
    m.hidden = false;
    setTimeout(() => (input ? field.querySelector('input') : ok).focus(), 30);
  });
}

// ==========================================================================
// 4. Team task management screen
// ==========================================================================
let currentMgmtSubordinates = [];
let currentActiveSubordinate = null;
let currentSubordinateTasks = [];
let currentSubordinateDayFilter = 'all';
let currentSubordinateRoleFilter = 'ALL';
let currentSubordinateSearchQuery = '';
let teamProgressCache = {};
let teamReviewTab = 'pending';

function switchJoinerWorkspaceTab(tab) {
  if (tab === 'management') { openTaskManagement(); return; }
  if (tab === 'messages') { openTeamMessages(); return; }
  goToStep('step-joiner-chatbot');
}

async function openTaskManagement() {
  if (!canCurrentSessionManageTasks()) { teamNotify('Team task management is for Lead & Managers and Supervisors.'); return; }
  const sup = isCurrentUserManager();
  const set = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
  set('mgmt-authority-badge', sup ? 'Supervisor workspace' : 'Lead & Manager workspace');
  set('mgmt-authority-scope-text', sup ? 'Lead & Managers and associates in your team' : 'Your associates');
  const leadPill = document.getElementById('sub-filter-lead');
  if (leadPill) { leadPill.hidden = !sup; leadPill.firstChild.textContent = 'Lead & Managers '; }
  goToStep('step-task-management');
  await loadSubordinatesList();
}

async function loadSubordinatesList() {
  currentMgmtSubordinates = teamReports();
  teamProgressCache = {};
  await Promise.all(currentMgmtSubordinates.map(async (p) => {
    const tasks = (await teamLoadPlan(p)).filter((t) => t.managementStatus !== 'ARCHIVED');
    const done = tasks.filter((t) => t.status === 'Completed').length;
    teamProgressCache[p.id] = { done, total: tasks.length, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0, custom: tasks.filter((t) => t.originType === 'CUSTOM').length, review: tasks.filter((t) => t.status === 'Pending Review').length };
  }));
  renderTeamStats();
  teamRenderReviewsPanel();
  applySubordinateFilters();
}

function renderTeamStats() {
  const el = document.getElementById('tm-stats');
  if (!el) return;
  const vals = currentMgmtSubordinates.map((p) => teamProgressCache[p.id] || { pct: 0, custom: 0 });
  const avg = vals.length ? Math.round(vals.reduce((a, v) => a + v.pct, 0) / vals.length) : 0;
  el.innerHTML = `
    <div><dt>${isCurrentUserManager() ? 'People you oversee' : 'Your associates'}</dt><dd>${currentMgmtSubordinates.length}</dd></div>
    <div><dt>Waiting for your review</dt><dd>${teamPendingReviewsForMe().length}</dd></div>
    <div><dt>Average progress</dt><dd>${avg}%</dd></div>
    <div><dt>Added tasks</dt><dd>${vals.reduce((a, v) => a + (v.custom || 0), 0)}</dd></div>`;
}

function teamRenderReviewsPanel() {
  let panel = document.getElementById('tm-reviews');
  const hero = document.querySelector('#step-task-management .tm-hero');
  if (!panel && hero) { hero.insertAdjacentHTML('afterend', '<section id="tm-reviews" class="tm-panel tm-reviews" aria-labelledby="tm-reviews-title"></section>'); panel = document.getElementById('tm-reviews'); }
  if (!panel) return;
  const pending = teamPendingReviewsForMe();
  const recent = teamRecentReviewsForMe();
  const list = teamReviewTab === 'pending' ? pending : recent;
  panel.innerHTML = `
    <div class="tm-panel-head">
      <div>
        <h2 id="tm-reviews-title" class="tm-section-title">Task reviews</h2>
        <p class="tm-section-sub">Proof submitted by the people you manage. Approving marks the task completed on their checklist.</p>
      </div>
      <div class="tm-filters" role="group" aria-label="Review filter">
        <button type="button" class="persona-pill-btn${teamReviewTab === 'pending' ? ' active' : ''}" onclick="teamReviewTab='pending'; teamRenderReviewsPanel()">Pending review <span class="tm-count">${pending.length}</span></button>
        <button type="button" class="persona-pill-btn${teamReviewTab === 'recent' ? ' active' : ''}" onclick="teamReviewTab='recent'; teamRenderReviewsPanel()">Recently reviewed <span class="tm-count">${recent.length}</span></button>
      </div>
    </div>
    ${list.length ? `<ul class="tm-review-list">${list.map((rv) => {
      const p = teamPerson(rv.empId) || { name: rv.empName, initials: teamInitials(rv.empName) };
      const chip = rv.status === 'pending_review' ? '<span class="tm-tag is-review">Pending review</span>' : rv.status === 'approved' ? '<span class="tm-tag is-approved">Approved</span>' : '<span class="tm-tag is-rejected">Changes requested</span>';
      const img = (rv.proofs || []).find((x) => teamIsImage(x.type));
      return `
        <li class="tm-review-row">
          <span class="tm-avatar">${teamEsc(p.initials || teamInitials(p.name))}</span>
          <div class="tm-review-text">
            <p class="tm-review-title">${teamEsc(rv.taskTitle)}</p>
            <p class="tm-review-meta">${teamEsc(p.name)} · ${teamEsc(teamRoleLabel(rv.empRoleKey))} · ${rv.status === 'pending_review' ? 'submitted ' + teamEsc(teamFormatTime(rv.submittedAt)) : 'reviewed ' + teamEsc(teamFormatTime(rv.reviewedAt))} · ${(rv.proofs || []).length} file${(rv.proofs || []).length === 1 ? '' : 's'}</p>
            ${rv.note && rv.status === 'pending_review' ? `<p class="tm-review-note">"${teamEsc(rv.note)}"</p>` : ''}
          </div>
          ${img ? `<button type="button" class="tm-review-thumb" onclick="teamOpenProof('${img.id}')" aria-label="Open proof"><img data-proof-id="${img.id}" alt=""></button>` : ''}
          ${chip}
          <button type="button" class="tm-btn is-sm${rv.status === 'pending_review' ? ' is-primary' : ''}" onclick="openReviewModal('${teamEsc(rv.empId)}', '${teamEsc(rv.taskId)}')">${rv.status === 'pending_review' ? 'Review' : 'View'}</button>
        </li>`;
    }).join('')}</ul>` : `<p class="tm-empty">${teamReviewTab === 'pending' ? 'Nothing is waiting for your review.' : 'No reviews yet.'}</p>`}`;
  teamHydrateProofs(panel);
}

function applySubordinateFilters() {
  let list = currentMgmtSubordinates;
  if (currentSubordinateRoleFilter === 'LEAD') list = list.filter((s) => s.roleKey === 'leadmgr');
  else if (currentSubordinateRoleFilter === 'ASSOCIATE') list = list.filter((s) => s.roleKey === 'associate');
  if (currentSubordinateSearchQuery) {
    const q = currentSubordinateSearchQuery.toLowerCase();
    list = list.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.title.toLowerCase().includes(q));
  }
  const setCount = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
  setCount('count-sub-all', currentMgmtSubordinates.length);
  setCount('count-sub-leads', currentMgmtSubordinates.filter((s) => s.roleKey === 'leadmgr').length);
  setCount('count-sub-assocs', currentMgmtSubordinates.filter((s) => s.roleKey === 'associate').length);
  const wrap = document.getElementById('tm-people');
  if (wrap) {
    wrap.innerHTML = list.length ? list.map((p) => {
      const pr = teamProgressCache[p.id] || { pct: 0, review: 0 };
      const sel = currentActiveSubordinate && currentActiveSubordinate.id === p.id;
      const blocked = teamIsBlocked(p.id);
      return `
        <button type="button" class="tm-person-tile${sel ? ' is-selected' : ''}" role="option" aria-selected="${sel}" data-person="${p.id}" onclick="selectSubordinateById('${p.id}')">
          <span class="tm-avatar">${teamEsc(p.initials)}</span>
          <span class="tm-tile-text">
            <span class="tm-tile-name">${teamEsc(p.name)}${blocked ? ' <span class="tm-tag is-rejected">Blocked</span>' : ''}${pr.review ? ` <span class="tm-tag is-review">${pr.review} to review</span>` : ''}</span>
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
  document.querySelectorAll('.tm-person-tile').forEach((b) => { const on = b.dataset.person === id; b.classList.toggle('is-selected', on); b.setAttribute('aria-selected', String(on)); });
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
  teamProgressCache[p.id] = { done, total: active.length, pct: active.length ? Math.round((done / active.length) * 100) : 0, custom: active.filter((t) => t.originType === 'CUSTOM').length, review: active.filter((t) => t.status === 'Pending Review').length };
  renderSubordinateDetailBanner();
  renderTeamStats();
  const tile = document.querySelector(`.tm-person-tile[data-person="${p.id}"]`);
  if (tile) { tile.querySelector('.tm-bar > span').style.width = teamProgressCache[p.id].pct + '%'; tile.querySelector('.tm-tile-progress > span:last-child').textContent = teamProgressCache[p.id].pct + '%'; }
}
function renderSubordinateDetailBanner() {
  const card = document.getElementById('mgmt-active-subordinate-card');
  if (!card) return;
  const p = currentActiveSubordinate;
  if (!p) { card.innerHTML = '<p class="tm-empty">Select a person to see their plan.</p>'; return; }
  const pr = teamProgressCache[p.id] || { pct: 0, done: 0, total: 0 };
  const reportsTo = teamReportsTo(p).map((r) => `${teamEsc(r.name)} (${teamEsc(r.roleLevel)})`).join(' · ');
  const first = teamEsc(teamFirst(p.name));
  const block = teamBlocks()[p.id];
  const blocked = !!(block && block.blocked);
  card.classList.toggle('is-blocked', blocked);
  card.innerHTML = `
    <div class="tm-person-main">
      <span class="tm-avatar is-lg">${teamEsc(p.initials)}</span>
      <div class="tm-person-text">
        <div class="tm-person-name"><h2>${teamEsc(p.name)}</h2><span class="tm-role">${teamEsc(p.roleLevel)}</span>${blocked ? '<span class="tm-tag is-rejected">Blocked</span>' : ''}</div>
        <p class="tm-person-meta">${teamEsc(p.title)} · ${teamEsc(p.team)} · ${teamEsc(p.id)}</p>
        ${reportsTo ? `<p class="tm-person-meta">Reports to ${reportsTo}</p>` : ''}
        ${blocked ? `<p class="tm-person-meta is-blocked">Blocked by ${teamEsc(block.by.name)} · ${teamEsc(teamFormatDate(block.at))}${block.reason ? ' · ' + teamEsc(block.reason) : ''}</p>` : ''}
      </div>
    </div>
    <div class="tm-person-progress">
      <span class="tm-eyebrow">Onboarding progress</span>
      <div class="tm-progress-row"><strong>${pr.pct}%</strong><span>${pr.done} of ${pr.total} approved${pr.review ? ` · ${pr.review} in review` : ''}</span></div>
      <span class="tm-bar is-lg"><span style="width: ${pr.pct}%"></span></span>
    </div>
    <div class="tm-person-actions">
      <button type="button" class="tm-btn is-primary" onclick="openAddTaskModal('${p.id}')">${TEAM_ICON.plus}<span>Add task for ${first}</span></button>
      <button type="button" class="tm-btn" onclick="openTeamMessages('${p.id}')">${TEAM_ICON.chat}<span>Message ${first}</span></button>
      <button type="button" class="tm-btn ${blocked ? '' : 'is-danger'}" onclick="teamToggleBlock('${p.id}')">${TEAM_ICON.lock}<span>${blocked ? 'Unblock access' : 'Block access'}</span></button>
    </div>`;
}
async function loadSubordinateTasks(person) {
  const tasks = await teamLoadPlan(person);
  if (!currentActiveSubordinate || currentActiveSubordinate.id !== person.id) return;
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
  ['all', 'day1', 'day2', 'day3', 'day4', 'day5', 'archived'].forEach((k) => { const b = document.getElementById('mgmt-day-pill-' + k); if (b) b.classList.remove('active'); });
  const btn = document.getElementById(day === 'all' ? 'mgmt-day-pill-all' : day === 'archived' ? 'mgmt-day-pill-archived' : 'mgmt-day-pill-' + day.toLowerCase().replace(' ', ''));
  if (btn) btn.classList.add('active');
  let list = currentSubordinateTasks.filter((t) => (day === 'archived' ? t.managementStatus === 'ARCHIVED' : t.managementStatus !== 'ARCHIVED'));
  if (day !== 'all' && day !== 'archived') list = list.filter((t) => t.day === day);
  list.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  renderSubordinateTasksList(list);
}
function renderSubordinateTasksList(tasks) {
  const box = document.getElementById('mgmt-tasks-container');
  if (!box) return;
  const p = currentActiveSubordinate;
  if (!tasks.length) {
    box.innerHTML = `<div class="tm-empty-card"><p class="tm-empty-title">No tasks here yet</p><p>${p ? `Add a task to ${teamEsc(teamFirst(p.name))}'s plan, or pick another day.` : 'Select a person first.'}</p>${p ? `<button type="button" class="tm-btn is-primary" onclick="openAddTaskModal('${p.id}')">${TEAM_ICON.plus}<span>Add task</span></button>` : ''}</div>`;
    return;
  }
  box.innerHTML = tasks.map((t) => {
    const st = t.status;
    const done = st === 'Completed', review = st === 'Pending Review', rejected = st === 'Rejected';
    const archived = t.managementStatus === 'ARCHIVED';
    const origin = archived ? ['Archived', 'is-archived'] : t.originType === 'CUSTOM' ? ['Added task', 'is-custom'] : t.originType === 'MODIFIED' ? ['Edited', 'is-modified'] : null;
    const pr = String(t.priority || 'Standard');
    const by = t.originType === 'CUSTOM' && t.assignedByName ? `<p class="tm-task-by">Added by ${teamEsc(t.assignedByName)} (${teamEsc(t.assignedByRole || '')})${t.createdAt ? ' · ' + teamEsc(teamFormatDate(t.createdAt)) : ''}</p>` : '';
    const statusText = done ? 'Completed' : review ? 'Pending review' : rejected ? 'Changes requested' : 'Pending';
    return `
      <article class="tm-task${done ? ' is-done' : ''}${review ? ' is-review' : ''}${rejected ? ' is-rejected' : ''}${archived ? ' is-archived' : ''}" id="tm-task-${teamEsc(t.id)}">
        <span class="tm-task-status" role="img" aria-label="${statusText}">${done ? '✓' : review ? TEAM_ICON.clock : rejected ? '!' : ''}</span>
        <div class="tm-task-body">
          <div class="tm-task-meta">
            <span class="tm-tag">${teamEsc(t.day || 'Day 1')}</span>
            <span class="tm-tag is-${teamEsc(pr.toLowerCase())}">${teamEsc(pr)} priority</span>
            ${origin ? `<span class="tm-tag ${origin[1]}">${origin[0]}</span>` : ''}
            <span class="tm-meta-text">${teamEsc(t.estimatedDuration || '45 mins')} · ${teamEsc(t.category || 'General')}</span>
            <span class="tm-meta-text is-${done ? 'done' : review ? 'review' : rejected ? 'rejected' : 'pending'}">${statusText}</span>
          </div>
          <h3 class="tm-task-title">${teamEsc(t.title || t.taskName)}</h3>
          ${t.description ? `<p class="tm-task-desc">${teamText(t.description)}</p>` : ''}
          ${t.resourceLinks ? `<p class="tm-task-desc"><a href="${teamEsc(t.resourceLinks)}" target="_blank" rel="noopener">${teamEsc(t.resourceLinks)}</a></p>` : ''}
          ${rejected && t.review ? `<p class="tm-task-by is-rejected">Feedback sent: ${teamEsc(t.review.feedback)}</p>` : ''}
          ${done && t.review && t.review.reviewedBy ? `<p class="tm-task-by">Approved by ${teamEsc(t.review.reviewedBy.name)} · ${teamEsc(teamFormatDate(t.review.reviewedAt))}</p>` : ''}
          ${by}
        </div>
        <div class="tm-task-actions">
          ${review ? `<button type="button" class="tm-btn is-sm is-primary" onclick="openReviewModal('${teamEsc(p.id)}', '${teamEsc(t.taskId)}')">Review proof</button>` : ''}
          ${archived ? `<button type="button" class="tm-btn is-sm" onclick="restoreArchivedTask('${t.id}')">Restore</button>` : `
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
const teamGuardBlocked = () => { const me = teamMe(); if (me && teamIsBlocked(me.id)) { teamNotify('Your access is blocked.'); return true; } return false; };

// ---------- Add task for employee ----------
function openAddTaskModal(personId) {
  if (teamGuardBlocked()) return;
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
  if (p && notify) notify.textContent = `Let ${teamFirst(p.name)} know in Messages`;
}
function closeAddTaskModal() { const m = document.getElementById('modal-mgmt-add-task'); if (m) m.style.display = 'none'; }
async function submitAddTask(e) {
  e.preventDefault();
  const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const assignee = teamPerson(val('add-task-assignee'));
  const title = val('add-task-title');
  const me = teamMe();
  if (!assignee || !title || !teamCanManage(me, assignee)) return;
  const day = val('add-task-day') || 'Day 1';
  const stamp = Date.now().toString(36).toUpperCase();
  const task = {
    id: `${assignee.id}_CT-${stamp}`, taskId: 'CT-' + stamp, title, description: val('add-task-desc'), day,
    priority: val('add-task-priority') || 'Medium', estimatedDuration: val('add-task-duration') || '45 mins',
    category: val('add-task-category') || 'General', resourceLinks: val('add-task-resource') || null,
    required: !!(document.getElementById('add-task-required') || {}).checked,
    managementStatus: 'ACTIVE', originType: 'CUSTOM', isCustom: true, version: 1,
    assignedByName: me.name, assignedByRole: me.roleLevel, createdAt: new Date().toISOString(), history: [],
  };
  teamLog(task, 'TASK_CREATED', `Added for ${assignee.name} by ${me.name} (${me.roleLevel})`);
  task.version = 1;
  const plan = await teamLoadPlan(assignee);
  task.orderIndex = plan.reduce((m, t) => Math.max(m, t.orderIndex || 0), 0) + 1;
  plan.push(task);
  teamSavePlan(assignee.id, plan);
  const notifyBox = document.getElementById('add-task-notify');
  if (!notifyBox || notifyBox.checked) teamSendMessage(assignee.id, `I've added a task to your ${day} plan: "${title}".${task.description ? ' ' + task.description : ''}`, { kind: 'task' }, true);
  closeAddTaskModal();
  const form = document.getElementById('form-mgmt-add-task');
  if (form) form.reset();
  teamNotify(`Task added to ${assignee.name}'s ${day} plan.`);
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
  if (teamGuardBlocked()) return;
  const t = currentSubordinateTasks.find((x) => x.id === taskId);
  if (!t) return;
  currentEditingTaskId = taskId;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('edit-task-id', taskId); set('edit-task-version', t.version || 1); set('edit-task-title', t.title || '');
  set('edit-task-desc', t.description || ''); set('edit-task-day', t.day || 'Day 1'); set('edit-task-priority', t.priority || 'Medium');
  set('edit-task-duration', t.estimatedDuration || '45 mins'); set('edit-task-category', t.category || ''); set('edit-task-resource', t.resourceLinks || '');
  const modal = document.getElementById('modal-mgmt-edit-task');
  if (modal) modal.style.display = 'flex';
}
function closeEditTaskModal() { const m = document.getElementById('modal-mgmt-edit-task'); if (m) m.style.display = 'none'; currentEditingTaskId = null; }
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
  if (teamGuardBlocked()) return;
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
function closeArchiveModal() { const m = document.getElementById('modal-mgmt-archive-confirm'); if (m) m.style.display = 'none'; pendingArchiveTaskId = null; }
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
  const items = [...(t.history || []).map((h) => ({ who: h.modifiedByName, role: h.modifiedByRole, at: h.createdAt, text: h.summary || h.action }))];
  if (t.review) (t.review.history || []).forEach((h) => items.push({ who: h.by, role: '', at: new Date(h.at).toISOString(), text: { submitted: 'Submitted proof for review', approved: 'Approved the task', rejected: 'Requested changes: ' + (h.note || ''), withdrawn: 'Withdrew the submission' }[h.action] || h.action }));
  items.sort((a, b) => new Date(b.at) - new Date(a.at));
  if (box) box.innerHTML = items.map((h) => `
    <div class="tm-history-item">
      <div class="tm-history-head"><strong>${teamEsc(h.who || 'System')}</strong>${h.role ? `<span class="tm-tag">${teamEsc(h.role === 'SYSTEM' ? 'System' : h.role)}</span>` : ''}<time>${teamEsc(teamFormatDate(h.at))}</time></div>
      <p>${teamEsc(h.text || 'Updated')}</p>
    </div>`).join('') || '<p class="tm-empty">No changes recorded yet.</p>';
  const modal = document.getElementById('modal-mgmt-history');
  if (modal) modal.style.display = 'flex';
}
function closeHistoryModal() { const m = document.getElementById('modal-mgmt-history'); if (m) m.style.display = 'none'; }

// ==========================================================================
// 5. Team Messages
// ==========================================================================
// { threads: { [id]: { id, members: [a, b], messages: [{ id, from, fromName, fromRole, text, at, kind, ... }] } },
//   reads: { [personId]: { [threadId]: lastReadAt } }, people: { [id]: { name, roleLevel, title, initials } }, seeded: {} }
const teamMsgStore = () => { const s = teamRead(TEAM_KEYS.messages, {}); s.threads = s.threads || {}; s.reads = s.reads || {}; s.people = s.people || {}; s.seeded = s.seeded || {}; return s; };
const teamThreadId = (a, b) => [a, b].sort().join('__');
const teamPeopleDirectory = () => teamMsgStore().people;
let teamMsgActive = null;

function teamFormatDate(v) {
  const d = new Date(v);
  if (isNaN(d)) return '';
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function teamFormatTime(ts) {
  const d = new Date(ts), now = new Date();
  if (isNaN(d)) return '';
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
const teamPersonCard = (p) => ({ name: p.name, roleLevel: p.roleLevel, title: p.title, initials: p.initials || teamInitials(p.name), roleKey: p.roleKey, id: p.id, service: p.service });

function teamSeedWelcome() {
  const team = teamCurrentTeam();
  const roster = teamRoster();
  if (!team || roster.length < 2) return;
  const store = teamMsgStore();
  const key = roster.map((p) => p.id).join('|');
  if (store.seeded[key]) return;
  const lm = roster.find((p) => p.roleKey === 'leadmgr');
  const sup = roster.find((p) => p.roleKey === 'supervisor');
  const assoc = roster.find((p) => p.roleKey === 'associate');
  const at = Date.now() - 1000 * 60 * 47;
  const add = (from, to, text, offset) => {
    if (!from || !to || from.id === to.id) return;
    const id = teamThreadId(from.id, to.id);
    const th = store.threads[id] || (store.threads[id] = { id, members: [from.id, to.id], messages: [] });
    th.messages.push({ id: 'm' + (at + offset) + from.id, from: from.id, fromName: from.name, fromRole: from.roleLevel, text, at: at + offset });
    store.people[from.id] = teamPersonCard(from); store.people[to.id] = teamPersonCard(to);
  };
  if (assoc && lm) add(lm, assoc, `Welcome to ${team.name}, ${teamFirst(assoc.name)}! I'm your Lead & Manager. When you finish a task, upload your proof and I'll review it. Message me here any time.`, 0);
  if (assoc && sup) add(sup, assoc, 'Good to have you on the team. Let\'s do a short check-in on Day 1 at 4:30 PM.', 60000);
  if (lm && sup) add(sup, lm, `${assoc ? teamFirst(assoc.name) + ' starts this week. ' : ''}Please review their proof as it comes in, and send your own task proof to me for review.`, 120000);
  store.seeded[key] = true;
  teamWrite(TEAM_KEYS.messages, store);
}

// Sends a message from the signed-in person. `system` messages (reviews, approvals, blocks) skip the contact check.
function teamSendMessage(toId, text, extra = {}, system = false) {
  const me = teamMe();
  const clean = String(text || '').trim();
  if (!me || !clean) return null;
  const to = teamPerson(toId);
  if (!system && !teamContacts().some((c) => c.id === toId)) { teamNotify('You can only message people connected to you.'); return null; }
  const store = teamMsgStore();
  const id = teamThreadId(me.id, toId);
  const th = store.threads[id] || (store.threads[id] = { id, members: [me.id, toId], messages: [] });
  const msg = { id: 'm' + Date.now() + Math.random().toString(36).slice(2, 6), from: me.id, fromName: me.name, fromRole: me.roleLevel, text: clean.slice(0, 4000), at: Date.now(), ...extra };
  th.messages.push(msg);
  store.people[me.id] = teamPersonCard(me);
  if (to) store.people[toId] = teamPersonCard(to);
  store.reads[me.id] = { ...(store.reads[me.id] || {}), [id]: msg.at };
  teamWrite(TEAM_KEYS.messages, store);
  if (to && to.roleKey === 'service' && !system) setTimeout(() => teamServiceAck(to, me, id), 900);
  teamRenderMessages();
  return msg;
}
// IT / HR acknowledge new requests (IT opens a ticket); HR replies for real from the HR portal.
function teamServiceAck(svc, me, threadId) {
  const store = teamMsgStore();
  const th = store.threads[threadId];
  if (!th) return;
  const lastAck = [...th.messages].reverse().find((m) => m.from === svc.id);
  if (lastAck && Date.now() - lastAck.at < 10 * 60 * 1000) return;
  const c = teamCompany()?.contacts?.[svc.service];
  const text = svc.service === 'it'
    ? `Thanks, ${teamFirst(me.name)}. Your request is logged as ticket INC-${String(Date.now()).slice(-6)}. An engineer will reply here within 4 business hours. If you're completely blocked, call ${c ? c.phone : 'the IT hotline'}.`
    : `Thanks, ${teamFirst(me.name)}. HR has your message and will reply here within one business day. For anything urgent, call ${c ? c.phone : 'HR'}.`;
  th.messages.push({ id: 'm' + Date.now() + 'ack', from: svc.id, fromName: svc.name, fromRole: svc.roleLevel, text, at: Date.now(), kind: 'system' });
  teamWrite(TEAM_KEYS.messages, store);
  teamRenderMessages();
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
  return Object.values(store.threads).filter((t) => t.members.includes(me.id)).reduce((n, t) => n + teamUnread(store, me.id, t.id), 0);
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

function teamRenderMessages() {
  teamRenderBadges();
  const root = document.getElementById('tmsg');
  if (!root || root.hidden) return;
  const me = teamMe();
  const list = document.getElementById('tmsg-threads');
  const pane = document.getElementById('tmsg-thread');
  if (!me) { list.innerHTML = ''; pane.innerHTML = '<p class="tmsg-empty">Sign in to see your messages.</p>'; return; }
  if (teamMsgActive) teamMarkRead(teamMsgActive); // the open conversation is read, including replies that just arrived
  const store = teamMsgStore();
  const contacts = teamContacts().map((c) => {
    const th = store.threads[teamThreadId(me.id, c.id)];
    const last = th && th.messages.length ? th.messages[th.messages.length - 1] : null;
    return { c, last, unread: teamUnread(store, me.id, teamThreadId(me.id, c.id)) };
  }).sort((a, b) => (b.last ? b.last.at : 0) - (a.last ? a.last.at : 0) || (a.c.roleKey === 'service') - (b.c.roleKey === 'service'));
  if (teamMsgActive && !contacts.some((x) => x.c.id === teamMsgActive)) teamMsgActive = null;
  root.classList.toggle('has-active', !!teamMsgActive);
  list.innerHTML = contacts.length ? contacts.map(({ c, last, unread }) => `
    <li>
      <button type="button" class="tmsg-row${c.id === teamMsgActive ? ' is-active' : ''}${unread ? ' is-unread' : ''}" onclick="openTeamMessages('${c.id}')" aria-current="${c.id === teamMsgActive}">
        <span class="tm-avatar${c.roleKey === 'service' ? ' is-service' : ''}">${teamEsc(c.initials)}</span>
        <span class="tmsg-row-text">
          <span class="tmsg-row-top"><span class="tmsg-row-name">${teamEsc(c.name)}</span>${last ? `<time>${teamEsc(teamFormatTime(last.at))}</time>` : ''}</span>
          <span class="tmsg-row-role">${teamEsc(teamRelation(c))} · ${teamEsc(c.title)}</span>
          <span class="tmsg-row-last">${last ? (last.from === me.id ? 'You: ' : '') + teamEsc(last.text) : 'No messages yet'}</span>
        </span>
        ${unread ? `<span class="tmsg-unread" aria-label="${unread} unread">${unread}</span>` : ''}
      </button>
    </li>`).join('') : '<li class="tmsg-empty">No conversations yet.</li>';
  const active = teamMsgActive && contacts.find((x) => x.c.id === teamMsgActive);
  if (!active) {
    pane.innerHTML = `<div class="tmsg-placeholder">${TEAM_ICON.chat}<p>Choose a person to start a conversation.</p><span>${me.roleKey === 'hr' ? 'Employees who message HR appear here.' : 'You can message your team, IT Support and HR.'}</span></div>`;
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
    const kindLabel = { task: 'Task update', review: 'Submitted for review', approved: 'Approved', rejected: 'Changes requested', block: 'Access blocked', unblock: 'Access restored', system: 'Automatic reply' }[m.kind];
    let action = '';
    if (m.kind === 'review' && !mine && m.empId && teamCanReview(me, teamRoleKey(m.fromRole))) action = `<button type="button" class="tm-btn is-sm" onclick="openReviewModal('${teamEsc(m.empId)}', '${teamEsc(m.taskId)}')">Review proof</button>`;
    if (m.kind === 'rejected' && !mine && m.taskId && window.currentLiveDashboard?.tasks?.some((t) => String(t.taskId) === String(m.taskId))) action = `<button type="button" class="tm-btn is-sm" onclick="closeTeamMessages(); openProofModal('${teamEsc(m.taskId)}')">Resubmit proof</button>`;
    return `${sep}
      <li class="tmsg-msg${mine ? ' is-mine' : ''}${m.kind ? ' is-' + m.kind : ''}">
        <div class="tmsg-bubble">${kindLabel ? `<span class="tmsg-kind">${kindLabel}</span>` : ''}${teamEsc(m.text).replace(/\n/g, '<br>')}${action ? `<div class="tmsg-action">${action}</div>` : ''}</div>
        <span class="tmsg-meta">${mine ? 'You' : teamEsc(m.fromName)} · <time datetime="${new Date(m.at).toISOString()}">${teamEsc(new Date(m.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))}</time></span>
      </li>`;
  }).join('');
  const draft = (document.getElementById('tmsg-input') || {}).value || '';
  const phone = active.c.phone ? `<a class="tm-btn is-sm is-ghost tmsg-call" href="tel:${String(active.c.phone).replace(/[^\d+]/g, '')}">Call ${teamEsc(active.c.phone)}</a>` : '';
  pane.innerHTML = `
    <header class="tmsg-thread-head">
      <button type="button" class="tmsg-icon-btn tmsg-back" onclick="teamMsgBack()" aria-label="Back to conversations">${TEAM_ICON.back}</button>
      <span class="tm-avatar${active.c.roleKey === 'service' ? ' is-service' : ''}">${teamEsc(active.c.initials)}</span>
      <div class="tmsg-thread-who"><p class="tmsg-thread-name">${teamEsc(active.c.name)}</p><p class="tmsg-thread-role">${teamEsc(teamRelation(active.c))} · ${teamEsc(active.c.title)}${active.c.hours ? ' · ' + teamEsc(active.c.hours) : ''}</p></div>
      ${phone}
    </header>
    <ol class="tmsg-messages" id="tmsg-messages" aria-live="polite">${items || '<li class="tmsg-empty">No messages yet. Say hello.</li>'}</ol>
    <form class="tmsg-composer" onsubmit="teamMsgSubmit(event)">
      <label class="visually-hidden" for="tmsg-input">Message ${teamEsc(active.c.name)}</label>
      <textarea id="tmsg-input" rows="1" placeholder="Message ${teamEsc(active.c.roleKey === 'service' ? active.c.name : teamFirst(active.c.name))}…" onkeydown="teamMsgKey(event)" oninput="teamMsgGrow(this)"></textarea>
      <button type="submit" class="tmsg-send" aria-label="Send message">${TEAM_ICON.send}</button>
    </form>
    <p class="tmsg-hint">Enter to send · Shift + Enter for a new line</p>`;
  const input = document.getElementById('tmsg-input');
  if (input) { input.value = draft; teamMsgGrow(input); }
  const scroller = document.getElementById('tmsg-messages');
  if (scroller) scroller.scrollTop = scroller.scrollHeight;
}

let teamMsgLastFocus = null;
function openTeamMessages(contactId, draft) {
  const root = document.getElementById('tmsg');
  if (!root) return;
  if (!teamMe()) { teamNotify('Sign in to use Messages.'); return; }
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
    if (i && draft && !i.value) { i.value = draft; teamMsgGrow(i); }
    if (i && contactId) i.focus();
    else { const b = root.querySelector('.tmsg-row.is-active, .tmsg-row'); if (b) b.focus(); }
  }, 30);
}
function closeTeamMessages() {
  const root = document.getElementById('tmsg');
  if (!root || root.hidden) return;
  root.hidden = true;
  if (document.getElementById('cres')?.hidden !== false) document.documentElement.classList.remove('tmsg-open');
  if (teamMsgLastFocus && teamMsgLastFocus.focus) teamMsgLastFocus.focus();
}
function teamMsgBack() { teamMsgActive = null; teamRenderMessages(); }
function teamMsgSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('tmsg-input');
  if (!input || !teamMsgActive || !input.value.trim()) return;
  const text = input.value;
  input.value = '';
  teamSendMessage(teamMsgActive, text);
  const i = document.getElementById('tmsg-input');
  if (i) i.focus();
}
function teamMsgKey(e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); e.target.form.requestSubmit(); } }
function teamMsgGrow(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  el.style.overflowY = el.scrollHeight > 140 ? 'auto' : 'hidden';
}

function teamRenderBadges() {
  const me = teamMe();
  document.documentElement.classList.toggle('ss-team-session', !!me);
  const n = me ? teamTotalUnread() : 0;
  document.querySelectorAll('[data-team-unread]').forEach((el) => { el.textContent = n > 9 ? '9+' : String(n); el.hidden = !n; });
  document.querySelectorAll('[data-team-messages]').forEach((el) => el.setAttribute('aria-label', n ? `Messages, ${n} unread` : 'Messages'));
  teamRenderReviewBadges();
}
function teamRenderReviewBadges() {
  const n = teamPendingReviewsForMe().length;
  const btn = document.getElementById('tab-subordinate-management-btn');
  if (btn) {
    let b = btn.querySelector('[data-team-reviews]');
    if (!b) { b = document.createElement('span'); b.className = 'nav-badge'; b.setAttribute('data-team-reviews', ''); btn.appendChild(b); }
    b.textContent = String(n); b.hidden = !n;
    btn.setAttribute('aria-label', n ? `Team task management, ${n} waiting for review` : 'Team task management');
  }
}

// A note in the onboarding assistant's chat (the existing chatbot) for review events.
function teamCopilotNote(html) {
  if (typeof appendChatBubble === 'function' && document.getElementById('chatbot-messages-feed')) appendChatBubble('assistant', html);
}
// On sign-in and on live changes: tell the employee what happened to their submissions since they last looked.
function teamAnnounceReviewUpdates() {
  const me = teamMe();
  if (!me || me.roleKey === 'hr') return;
  const seen = teamRead(TEAM_KEYS.seen, {});
  const since = seen[me.id] || 0;
  const mine = Object.values(teamReviews()[me.id] || {}).filter((rv) => rv.reviewedAt && rv.reviewedAt > since);
  mine.forEach((rv) => teamCopilotNote(rv.status === 'approved'
    ? `<div class="ca"><p class="ca-lead"><strong>Task approved by ${teamEsc(rv.reviewedBy.roleLevel)}.</strong> "${teamEsc(rv.taskTitle)}" is now completed.</p></div>`
    : `<div class="ca"><p class="ca-lead"><strong>Task requires changes:</strong> ${teamEsc(rv.feedback)}</p><p class="ca-note">"${teamEsc(rv.taskTitle)}" · from ${teamEsc(rv.reviewedBy.name)}</p><div class="ca-actions"><button type="button" class="ca-btn is-primary" onclick="openProofModal('${teamEsc(rv.taskId)}')">Resubmit proof</button></div></div>`));
  const pending = teamPendingReviewsForMe();
  if (pending.length && !seen[me.id + ':reviews']) {
    teamCopilotNote(`<div class="ca"><p class="ca-lead"><strong>${pending.length} task${pending.length > 1 ? 's are' : ' is'} waiting for your review.</strong></p><div class="ca-actions"><button type="button" class="ca-btn is-primary" onclick="openTaskManagement()">Open reviews</button></div></div>`);
  }
  seen[me.id] = Date.now();
  seen[me.id + ':reviews'] = pending.length ? Date.now() : 0;
  teamWrite(TEAM_KEYS.seen, seen);
}

function teamOnSignIn(kind) {
  window.ssSessionKind = kind || 'team';
  teamMsgActive = null;
  teamSeedWelcome();
  teamRenderBadges();
  setTimeout(() => {
    teamRenderBlockState();
    teamAnnounceReviewUpdates();
    const n = teamTotalUnread();
    if (n) teamNotify(`You have ${n} unread message${n > 1 ? 's' : ''} in Messages.`);
  }, 1300);
}

(function initTeamLayer() {
  document.body.insertAdjacentHTML('beforeend', `
    <div id="tmsg" class="tmsg" hidden>
      <div class="tmsg-scrim" data-tmsg-close></div>
      <section class="tmsg-panel" role="dialog" aria-modal="true" aria-labelledby="tmsg-title">
        <header class="tmsg-head">
          <div><p class="tmsg-eyebrow">Your team</p><h2 id="tmsg-title" class="tmsg-title">Messages</h2></div>
          <button type="button" class="tmsg-icon-btn" data-tmsg-close aria-label="Close messages">${TEAM_ICON.close}</button>
        </header>
        <div class="tmsg-body">
          <nav class="tmsg-list" aria-label="Conversations"><ul id="tmsg-threads"></ul></nav>
          <div class="tmsg-thread" id="tmsg-thread"></div>
        </div>
      </section>
    </div>
    <div id="tproof" class="tproof" hidden>
      <div class="tproof-scrim" data-tproof-close></div>
      <section class="tproof-card" role="dialog" aria-modal="true" aria-labelledby="tproof-title">
        <div class="tm-modal-head">
          <div><h3 class="tm-modal-title" id="tproof-title">Submit for review</h3><p class="tm-modal-sub" id="tproof-sub"></p></div>
          <button type="button" class="tm-modal-close" data-tproof-close aria-label="Close">&times;</button>
        </div>
        <div class="tm-form tproof-body" id="tproof-body"></div>
      </section>
    </div>
    <div id="tproof-viewer" class="tproof tproof-viewer" hidden>
      <div class="tproof-scrim" data-viewer-close></div>
      <section class="tproof-viewer-card" role="dialog" aria-modal="true" aria-label="Proof preview">
        <div class="tproof-viewer-bar"><span class="tproof-viewer-name"></span><a class="tm-btn is-sm tproof-viewer-download" href="#">Download</a><button type="button" class="tmsg-icon-btn" data-viewer-close aria-label="Close preview">${TEAM_ICON.close}</button></div>
        <div class="tproof-viewer-body"></div>
      </section>
    </div>
    <div id="tconfirm" class="tproof" hidden>
      <div class="tproof-scrim"></div>
      <section class="tproof-card tconfirm-card" role="alertdialog" aria-modal="true" aria-labelledby="tconfirm-title">
        <div class="tm-form">
          <h3 class="tm-modal-title tconfirm-title" id="tconfirm-title"></h3>
          <p class="tconfirm-body"></p>
          <div class="tconfirm-field"><label class="tm-label" for="tconfirm-input"></label><input id="tconfirm-input" class="tm-input" type="text"></div>
          <div class="tproof-foot"><button type="button" class="tm-btn tconfirm-cancel">Cancel</button><button type="button" class="tm-btn is-primary tconfirm-ok">OK</button></div>
        </div>
      </section>
    </div>`);
  const root = document.getElementById('tmsg');
  root.addEventListener('click', (e) => { if (e.target.closest('[data-tmsg-close]')) closeTeamMessages(); });
  document.getElementById('tproof').addEventListener('click', (e) => { if (e.target.closest('[data-tproof-close]')) closeProofModal(); });
  document.getElementById('tproof-viewer').addEventListener('click', (e) => { if (e.target.closest('[data-viewer-close]')) closeProofViewer(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!document.getElementById('tproof-viewer').hidden) { e.preventDefault(); closeProofViewer(); return; }
      if (!document.getElementById('tconfirm').hidden) { e.preventDefault(); document.querySelector('#tconfirm .tconfirm-cancel').click(); return; }
      if (!document.getElementById('tproof').hidden) { e.preventDefault(); closeProofModal(); return; }
    }
    if (root.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeTeamMessages(); return; }
    if (e.key === 'Tab') {
      const f = [...root.querySelectorAll('button, textarea, [href]')].filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  // Live updates from other tabs: messages, reviews, approvals, blocks, plan changes.
  let lastUnread = 0;
  window.addEventListener('storage', (e) => {
    const me = teamMe();
    if (e.key === TEAM_KEYS.messages) {
      teamRenderMessages();
      const now = teamTotalUnread();
      if (me && now > lastUnread) {
        const store = teamMsgStore();
        const latest = Object.values(store.threads).filter((t) => t.members.includes(me.id)).flatMap((t) => t.messages).filter((m) => m.from !== me.id).sort((a, b) => b.at - a.at)[0];
        if (latest) teamNotify(`New message from ${latest.fromName}`);
      }
      lastUnread = now;
    }
    if ([TEAM_KEYS.reviews, TEAM_KEYS.status, TEAM_KEYS.plans, TEAM_KEYS.blocks].includes(e.key) && me) {
      const dash = document.getElementById('step-joiner-chatbot');
      if (dash && dash.style.display !== 'none') { teamRefreshMyDashboard(); if (e.key === TEAM_KEYS.reviews) teamAnnounceReviewUpdates(); }
      else teamRenderBlockState();
      const mgmt = document.getElementById('step-task-management');
      if (mgmt && mgmt.style.display !== 'none') loadSubordinatesList();
      teamRenderReviewBadges();
    }
  });
  setInterval(() => { lastUnread = teamTotalUnread(); }, 4000);
  teamRenderBadges();
})();
