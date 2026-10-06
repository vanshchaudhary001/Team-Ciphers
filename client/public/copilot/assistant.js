/*
 * Onboarding assistant: understand the question first, then answer it from the company's own data.
 *
 *   question → copilotClassify()  intent + topic (tool, policy, task, person)
 *            → retrieval           the selected company's procedures, contacts, Library, Policies, the
 *                                  employee's tasks, reviews and reporting line
 *            → answer              only what was asked (no checklist unless the question is about tasks)
 *            → actions             Message IT / HR / Lead & Manager, Call, open Library or Policies
 *
 * Questions no rule covers go to the NVIDIA NIM copilot on the server with the retrieved company
 * snippets as grounding; if that is unavailable or nothing relevant is found, the assistant says so and
 * offers the next step instead of guessing. Plain script, loaded after team.js and company-resources.js.
 */

// ---------------------------------------------------------------- context
function cpCtx() {
  const dash = window.currentLiveDashboard || {};
  const emp = dash.employee || {};
  const company = (typeof teamCompany === 'function' && teamCompany()) || {};
  const me = typeof teamMe === 'function' ? teamMe() : null;
  const roster = typeof teamRoster === 'function' ? teamRoster() : [];
  return {
    emp, company, me, tasks: dash.tasks || [], metrics: dash.metrics || {},
    first: String(emp.name || 'there').split(' ')[0],
    leadmgr: roster.find((p) => p.roleKey === 'leadmgr' && (!me || p.id !== me.id)) || null,
    supervisor: roster.find((p) => p.roleKey === 'supervisor' && (!me || p.id !== me.id)) || null,
    reviewers: me && typeof teamReviewersFor === 'function' ? teamReviewersFor(me) : [],
  };
}
const cpToday = () => 'Day 1'; // the dashboard's current onboarding day
const cpEsc = (s) => (typeof escapeHtml === 'function' ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s));
const cpArg = (s) => encodeURIComponent(String(s)).replace(/'/g, '%27');

// ---------------------------------------------------------------- language helpers
function cpNorm(q) {
  return ' ' + String(q || '').toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\bcan'?t\b/g, 'cannot').replace(/\bcan not\b/g, 'cannot').replace(/\bdon'?t\b/g, 'do not').replace(/\bdoesn'?t\b/g, 'does not')
    .replace(/\bdidn'?t\b/g, 'did not').replace(/\bisn'?t\b/g, 'is not').replace(/\bwon'?t\b/g, 'will not').replace(/\baren'?t\b/g, 'are not')
    .replace(/\bi'?m\b/g, 'i am').replace(/\bi'?ve\b/g, 'i have').replace(/\bwhat'?s\b/g, 'what is').replace(/\bwho'?s\b/g, 'who is').replace(/\bwhere'?s\b/g, 'where is')
    .replace(/\bpls\b|\bplz\b/g, 'please').replace(/\bacess\b|\baccesss\b|\baccsess\b/g, 'access').replace(/\bgithib\b|\bgithb\b|\bgit hub\b/g, 'github')
    .replace(/[^a-z0-9&+#\-/ ]/g, ' ').replace(/\s+/g, ' ') + ' ';
}
const cpHas = (s, re) => re.test(s);
const STOP = new Set('a an the i me my to of for in on at is are am be do does did can could would should will what where when who whom why how which this that it its and or but with from about please need want get have has any some there here you your we our us find show tell know'.split(' '));
const cpStem = (w) => w.replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, '');
const cpTokens = (s) => cpNorm(s).trim().split(' ').filter((w) => w.length > 1 && !STOP.has(w)).map(cpStem);

// ---------------------------------------------------------------- intents
const RX = {
  greeting: /^ (hi+|hello|hey|hiya|good (morning|afternoon|evening)|namaste|yo) /,
  thanks: / (thanks|thank you|thx|ty|appreciate it|great thanks|ok thanks|cool|perfect) /,
  problem: / (cannot|unable|not able|not working|does not work|do not work|did not work|do not have|no access|without access|denied|error|errors|failed|fail|fails|failing|locked|issue|issues|problem|problems|broken|stuck|404|403|401|permission|expired|still|lost|not loading|wont|will not|keeps|nothing happens|not showing|missing|blocked on|not connecting|cannot connect|disconnects|disconnecting|keeps dropping|slow|down|timeout|timed out|crash|crashes|crashing|forgot|forgotten|reset|wrong|invalid|not receiving|did not get|have not received|not getting) /,
  howto: / (how|get|getting|request|requesting|set up|setup|configure|install|enable|activate|steps|procedure|process|apply|start|begin|obtain|access) /,
  contact: / (who should i|who do i|who can i|who to|whom|contact|reach|call|talk to|speak to|escalate|help ?desk|support team|someone to help|get help|ask for help) /,
  where: / (where|which page|which portal|find|located|location of|link to|link for) /,
};
const POLICY_SYNONYMS = [
  ['leave', /\b(leave|leaves|holiday|holidays|vacation|pto|time off|day off|days off|sick day|sick leave|annual leave|casual leave)\b/],
  ['attendance', /\b(attendance|working hours|work hours|office hours|core hours|late|timing|timings|punctual)\b/],
  ['remote-work', /\b(remote|wfh|work from home|working from home|hybrid|work from anywhere|office days)\b/],
  ['conduct', /\b(code of conduct|conduct|ethics|ethical|gift|gifts|conflict of interest|trust code|business conduct)\b/],
  ['infosec', /\b(information security|security policy|security policies|security guideline|security guidelines|phishing|password policy|infosec|cyber ?security)\b/],
  ['privacy', /\b(privacy|personal data|gdpr|customer data|data protection)\b/],
  ['acceptable-use', /\b(acceptable use|personal use|internet use|social media|use of company)\b/],
  ['workplace', /\b(harassment|bullying|behaviou?r|discrimination|respect|inclusive|posh)\b/],
  ['confidentiality', /\b(confidential|confidentiality|nda|non disclosure|secret|unreleased)\b/],
  ['device', /\b(device policy|byod|usb|own device|personal device|laptop policy|encryption)\b/],
  ['compliance', /\b(compliance|mandatory training|bribery|anti bribery|regulation|regulations)\b/],
];
const LIBRARY_HINTS = /\b(form|forms|handbook|handbooks|document|documents|doc|docs|guide|guides|template|templates|library|resource|resources|benefit|benefits|insurance|payslip|expense|expenses|reimbursement|reimburse|travel|holiday calendar|org chart|onboarding documents?|checklist pdf|manual|file|files)\b/;
const OUT_OF_SCOPE = /\b(weather|joke|jokes|cricket|football|movie|movies|song|songs|recipe|cook|stock price|bitcoin|crypto|horoscope|news|celebrity|game score|write (me )?a poem|tell me a story)\b/;

function cpProcedureTopic(s, company) {
  const procs = company.procedures || {};
  const order = ['github', 'vpn', 'mfa', 'email', 'chat', 'tracker', 'laptop', 'wifi', 'payroll', 'badge', 'account'];
  for (const key of order) {
    const p = procs[key];
    if (p && p.keywords.some((k) => new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(s))) return key;
  }
  return null;
}
function cpPolicyTopic(s) {
  for (const [id, re] of POLICY_SYNONYMS) if (re.test(s)) return id;
  return null;
}
// `raw` keeps the original casing: "IT" (the team) vs "it" (the pronoun).
function cpPersonTopic(s, raw = '') {
  if (/\b(supervisor|skip level|skip-level)\b/.test(s)) return 'supervisor';
  if (/\b(manager|lead|reporting manager|boss|team lead|reporting lead|line manager)\b/.test(s)) return 'leadmgr';
  if (/\b(buddy|mentor)\b/.test(s)) return 'buddy';
  if (/\b(hr|human resources|people partner|people team)\b/.test(s)) return 'hr';
  if (/\bIT\b/.test(raw) || /\b(it support|it team|it department|it desk|it help|it problems?|it issues?|tech team|tech support|technical support|service desk|helpdesk|help desk)\b/.test(s)) return 'it';
  if (/\b(payroll|salary)\b/.test(s)) return 'payroll';
  if (/\b(security team|security)\b/.test(s)) return 'security';
  if (/\b(facilities|badge|parking|office access)\b/.test(s)) return 'facilities';
  return null;
}
function cpTaskRef(s, tasks) {
  const n = s.match(/\btask\s*(?:no\.?|number|#)?\s*(\d{1,2})\b/) || s.match(/\bt0*(\d{1,3})\b/);
  if (n) { const num = parseInt(n[1], 10); return tasks.find((t) => t.num === num || String(t.taskId).toUpperCase() === 'T' + String(num).padStart(3, '0')) || null; }
  const q = new Set(cpTokens(s));
  let best = null, bestScore = 0;
  tasks.forEach((t) => {
    const words = cpTokens(t.taskName || t.title || '');
    const score = words.filter((w) => q.has(w) && w.length > 3).length;
    if (score > bestScore) { best = t; bestScore = score; }
  });
  return bestScore >= 2 ? best : null;
}

// Returns { intent, topic, task }. Exposed for testing.
function copilotClassify(query) {
  const s = cpNorm(query);
  const c = cpCtx();
  const words = s.trim().split(' ').filter(Boolean);
  const tool = cpProcedureTopic(s, c.company);
  const policy = cpPolicyTopic(s);
  const person = cpPersonTopic(s, String(query || ''));
  const task = cpTaskRef(s, c.tasks);
  const r = (intent, extra = {}) => ({ intent, tool, policy, person, task, ...extra });

  if (!words.length) return r('greeting');
  if (RX.greeting.test(s) && words.length <= 4) return r('greeting');
  if (RX.thanks.test(s) && words.length <= 5) return r('thanks');
  if (OUT_OF_SCOPE.test(s) && !tool && !policy) return r('out_of_scope');

  // Reviews (for Lead & Managers and Supervisors)
  if (/\b(pending reviews?|reviews? (pending|waiting)|to review|review queue|need(s)? (my )?(review|approval)|waiting for (my )?(review|approval)|approve (tasks|submissions))\b/.test(s)) return r('reviews_queue');
  if (/\b(who (approves|reviews|will approve|will review|checks|verifies)|approver|reviewer|who has to approve|approved by whom)\b/.test(s)) return r('who_approves');
  if (/\b(upload|proof|screenshot|evidence|attach|attachment)\b/.test(s)) return r('upload_proof');
  if (/\b(rejected|changes requested|status of my (task|submission)s?|my submissions?|in review|under review)\b/.test(s)) return r('review_status');
  if (/\b(after i (complete|finish|submit)|what happens (next|after|once|when)|(completed|finished|submitted) (my|the|a|this) task|i (have )?(completed|finished|done) (my|the|a|this)? ?task|done with (my|the) task|mark(ed)? (it )?(as )?(complete|done))\b/.test(s)) return r('after_complete');
  if (/\b(am i blocked|my account (is )?blocked|account (is )?locked|why am i blocked|access (is )?blocked|cannot (complete|submit) (any )?tasks?)\b/.test(s) && !tool) return r('blocked_status');

  // Tools and access: procedure → troubleshooting → contact
  if (tool) {
    if (RX.contact.test(s)) return r('tool_contact');
    if (RX.problem.test(s)) return r('tool_problem');
    return r('tool_howto');
  }

  // People
  if (/\bwho (is|are) (my|our|the)\b/.test(s) && person) return r('who_is');
  if (/\b(my (manager|lead|supervisor|buddy|mentor|reporting manager|boss))\b/.test(s) && !RX.contact.test(s) && !/\b(message|chat|text)\b/.test(s)) return r('who_is');
  if (/\b(message|chat with|text|ping|write to|send (a )?message to)\b/.test(s) && person) return r('message_person');
  if (RX.contact.test(s) && person) return r('contact_for');

  // Policies and Library
  if (policy) return r('policy_detail');
  if (/\b(polic(y|ies)|rules|guidelines|allowed|permitted)\b/.test(s) && !LIBRARY_HINTS.test(s)) return r('policies_list');
  if (LIBRARY_HINTS.test(s)) return r('library_search');

  // Tasks (only when the question is about tasks)
  if (/\b(deadline|due|due date|by when|last date|time limit)\b/.test(s)) return r('task_deadline');
  if (task && /\b(how|explain|steps|help|guide|walk me|what (is|does)|start|do)\b/.test(s)) return r('task_howto');
  if (/\b(how (do|can|should) i (complete|finish|do|start) (this|my|the|a|next) task|how to complete (this|my|the) task|break (this |it |the task )?down|walk me through|help me (with|do|complete|finish) (this|my|the|next) task|steps for (this|my|the|next) task)\b/.test(s)) return r('task_howto');
  if (/\b(first week|this week|week plan|weekly plan|whole week|5 days?|five days|week ahead|onboarding plan)\b/.test(s)) return r('first_week');
  if (/\b(pending|remaining|left|incomplete|not done|unfinished|outstanding|todo|to do list|still to do)\b/.test(s) && /\b(task|tasks|work|items?|checklist|do)\b/.test(s)) return r('tasks_pending');
  if (/\b(today|todays|right now|this morning|now)\b/.test(s) && /\b(task|tasks|do|work|checklist|plan|agenda|focus|priority)\b/.test(s)) return r('tasks_today');
  if (/\b(what (is|are) my tasks?|my tasks?|task list|my checklist|what (should|do) i (do|work on)|what to do|assigned to me|next task|what next)\b/.test(s)) return r('tasks_today');
  if (/\b(progress|how much (have i|did i)|percentage|completed so far|how far|how many (tasks )?(done|completed))\b/.test(s)) return r('progress');
  if (/\b(my role|my position|my team|my department|job title|what do i do here|my responsibilities)\b/.test(s)) return r('role_info');
  if (person && (RX.contact.test(s) || /\b(help|issue|problem)\b/.test(s))) return r('contact_for');
  if (/\b(it problems?|it issues?|tech(nical)? (problems?|issues?)|computer problems?)\b/.test(s)) return r('contact_for', { person: 'it' });

  // "I don't know where to find something"
  if (/\b(do not know where|not sure where|cannot find|could not find|where (can|do|should) i (find|look|get)|where is|looking for|lost|confused|where to find|something)\b/.test(s)) return r('lost');
  return r('unknown');
}

// ---------------------------------------------------------------- answer building blocks
function cpActions(items) {
  return `<div class="ca-actions">${items.filter(Boolean).map((a) => a.href
    ? `<a class="ca-btn${a.primary ? ' is-primary' : ''}" href="${a.href}">${a.label}</a>`
    : `<button type="button" class="ca-btn${a.primary ? ' is-primary' : ''}" onclick="${a.onclick}">${a.label}</button>`).join('')}</div>`;
}
const cpMsgAction = (id, label, draft, primary) => id ? ({ label, primary, onclick: `openTeamMessages('${id}'${draft ? `, decodeURIComponent('${cpArg(draft)}')` : ''})` }) : null;
const cpCallAction = (phone) => phone ? ({ label: `Call ${cpEsc(phone)}`, href: 'tel:' + String(phone).replace(/[^\d+]/g, '') }) : null;
const cpLibraryAction = (focus, label = 'Open Library') => ({ label, onclick: `openCompanyResources('library'${focus ? `, '${focus}'` : ''})` });
const cpPolicyAction = (focus, label = 'Open Policies') => ({ label, onclick: `openCompanyResources('policies'${focus ? `, '${focus}'` : ''})` });
function cpContactCard(c, eyebrow) {
  return `
    <article class="ca-card ca-contact">
      <div class="ca-contact-top"><div><p class="ca-eyebrow">${cpEsc(eyebrow || c.team)}</p><p class="ca-contact-name">${cpEsc(c.person)}</p><p class="ca-muted">${cpEsc(c.role)}</p></div></div>
      ${caRows([['Phone', caTel(c.phone)], c.hotline && c.hotline !== c.phone ? ['Hotline', caTel(c.hotline)] : null, ['Email', caMail(c.email)], c.hours ? ['Hours', cpEsc(c.hours)] : null, c.channel ? ['Tickets', cpEsc(c.channel)] : null])}
      ${c.covers ? `<p class="ca-note">Helps with ${cpEsc(c.covers)}.</p>` : ''}
    </article>`;
}
function cpPersonCard(p, eyebrow, extra) {
  return `
    <article class="ca-card ca-contact">
      <div class="ca-contact-top"><div><p class="ca-eyebrow">${cpEsc(eyebrow)}</p><p class="ca-contact-name">${cpEsc(p.name)}</p><p class="ca-muted">${cpEsc(p.title || p.roleLevel)}</p></div></div>
      ${extra ? `<p class="ca-note">${extra}</p>` : ''}
    </article>`;
}
const cpCompanyName = (c) => c.company.name || 'your company';
function cpTaskList(tasks) { return `<ul class="ca-tasklist">${tasks.map((t, i) => caTaskRow(t, i)).join('')}</ul>`; }

// ---------------------------------------------------------------- answers
const CP_ANSWERS = {
  greeting(c) {
    return `<div class="ca"><p class="ca-lead">Hi ${cpEsc(c.first)}. What can I help you with?</p>
      ${cpActions([{ label: "Today's tasks", onclick: "askCopilotDirect('What do I need to do today?')" }, { label: 'GitHub access', onclick: "askCopilotDirect('How do I get GitHub access?')" }, { label: 'Leave policy', onclick: "askCopilotDirect('What is the leave policy?')" }, { label: 'Company forms', onclick: "askCopilotDirect('Where can I find the company forms?')" }])}</div>`;
  },
  thanks(c) { return `<div class="ca"><p class="ca-lead">You're welcome, ${cpEsc(c.first)}. Ask me anything else about your first week.</p></div>`; },
  out_of_scope() {
    return `<div class="ca"><p class="ca-lead">I can only help with work and onboarding at your company: tasks, tools and access, people, policies and company resources.</p>
      ${cpActions([cpLibraryAction(), cpPolicyAction()])}</div>`;
  },

  tool_howto(c, x) {
    const p = c.company.procedures[x.tool];
    const it = c.company.contacts[p.contact] || c.company.contacts.it;
    const lib = c.company.library.find((l) => l.procedure === x.tool);
    return `<div class="ca">
      ${caHead(cpEsc(p.title), { eyebrow: `${cpEsc(cpCompanyName(c))} · how to` })}
      <ol class="ca-steps">${p.steps.map((s) => `<li>${cpEsc(s)}</li>`).join('')}</ol>
      <p class="ca-label">If access is denied, check</p>
      <ul class="ca-list">${p.checks.slice(0, 3).map((s) => `<li>${cpEsc(s)}</li>`).join('')}</ul>
      <p class="ca-note">Still stuck? ${cpEsc(it.team)} (${cpEsc(it.person)}) can help: ${caTel(it.phone)}.</p>
      ${cpActions([cpMsgAction(it.messageId, `Message ${cpEsc(it.team)}`, `Hi, I need help getting ${p.tool} access.`, true), lib ? cpLibraryAction(lib.id, 'Open the guide') : null])}
    </div>`;
  },
  tool_problem(c, x) {
    const p = c.company.procedures[x.tool];
    const it = c.company.contacts[p.contact] || c.company.contacts.it;
    const lm = c.leadmgr;
    const draft = `Hi, I can't access ${p.tool}. I've checked my sign-in and access request but it's still not working. The error I see is: `;
    return `<div class="ca">
      ${caHead(`Can't access ${cpEsc(p.tool)}? Let's fix it`, { eyebrow: `${cpEsc(cpCompanyName(c))} IT help` })}
      <p class="ca-label">1. How access works</p>
      <ol class="ca-steps">${p.steps.map((s) => `<li>${cpEsc(s)}</li>`).join('')}</ol>
      <p class="ca-label">2. Check these first</p>
      <ul class="ca-list">${p.checks.map((s) => `<li>${cpEsc(s)}</li>`).join('')}</ul>
      <p class="ca-label">3. If it still doesn't work</p>
      <ul class="ca-list">${p.escalate.map((s) => `<li>${cpEsc(s)}</li>`).join('')}</ul>
      <p class="ca-label">4. Who to contact</p>
      ${cpContactCard(it)}
      ${lm && p.contact === 'it' ? `<p class="ca-note">Your Lead & Manager, ${cpEsc(lm.name)}, approves access requests. Tell them if this blocks a task.</p>` : ''}
      ${cpActions([cpMsgAction(it.messageId, `Message ${cpEsc(it.team)}`, draft, true), cpCallAction(it.phone), lm ? cpMsgAction(lm.id, `Message ${cpEsc(lm.name.split(' ')[0])}`, `Hi ${lm.name.split(' ')[0]}, I'm blocked on ${p.tool} access. I've raised it with IT.`) : null])}
    </div>`;
  },
  tool_contact(c, x) {
    const p = c.company.procedures[x.tool];
    const it = c.company.contacts[p.contact] || c.company.contacts.it;
    const lm = c.leadmgr;
    return `<div class="ca">
      ${caHead(`Who to contact about ${cpEsc(p.tool)}`, { eyebrow: 'Contacts' })}
      <p class="ca-lead">${cpEsc(it.team)} handles ${cpEsc(p.tool)} access problems. Message them here or call; include the exact error and a screenshot.</p>
      ${cpContactCard(it)}
      ${lm ? `<p class="ca-note">If IT can't fix it quickly and it blocks your work, tell your Lead & Manager, ${cpEsc(lm.name)}.</p>` : ''}
      ${cpActions([cpMsgAction(it.messageId, `Message ${cpEsc(it.team)}`, `Hi, ${p.tool} access still isn't working for me. The error is: `, true), cpCallAction(it.phone), lm ? cpMsgAction(lm.id, `Message ${cpEsc(lm.name.split(' ')[0])}`) : null])}
    </div>`;
  },

  contact_for(c, x) {
    const key = x.person;
    if (key === 'leadmgr' || key === 'supervisor' || key === 'buddy') return CP_ANSWERS.who_is(c, x);
    const ct = c.company.contacts[key] || c.company.contacts.it;
    return `<div class="ca">
      ${caHead(`Who to contact for ${cpEsc(ct.team)}`, { eyebrow: 'Contacts' })}
      ${cpContactCard(ct)}
      ${cpActions([ct.messageId ? cpMsgAction(ct.messageId, `Message ${cpEsc(ct.team)}`, '', true) : null, cpCallAction(ct.phone), { label: 'Email', href: 'mailto:' + ct.email }])}
    </div>`;
  },
  who_is(c, x) {
    const me = c.me;
    if (x.person === 'buddy') {
      const b = c.emp.buddy || {};
      return `<div class="ca">${caHead('Your onboarding buddy', { eyebrow: 'People' })}
        ${cpPersonCard({ name: b.name || 'Your buddy', title: b.role || 'Senior peer buddy' }, 'Buddy', 'Your buddy helps with day-to-day questions and team norms.')}
        ${caRows([b.phone ? ['Phone', caTel(b.phone)] : null, b.email ? ['Email', caMail(b.email)] : null])}</div>`;
    }
    if (x.person === 'hr' || x.person === 'it' || x.person === 'payroll' || x.person === 'security' || x.person === 'facilities') return CP_ANSWERS.contact_for(c, x);
    if (me && me.roleKey === 'supervisor') {
      return `<div class="ca"><p class="ca-lead">You're the Supervisor for ${cpEsc(c.emp.team || 'your team')}, so your tasks don't need approval. Your department leadership is your escalation point.</p>
        ${cpActions([cpMsgAction(c.company.contacts.hr.messageId, 'Message HR')])}</div>`;
    }
    const lm = c.leadmgr, sup = c.supervisor;
    const primary = me && me.roleKey === 'leadmgr' ? sup : (x.person === 'supervisor' ? sup : lm);
    if (!primary) return CP_ANSWERS.not_found(c, x);
    const second = primary === lm ? sup : null;
    return `<div class="ca">
      ${caHead(me && me.roleKey === 'leadmgr' ? 'Your supervisor' : primary === sup ? 'Your supervisor' : 'Your Lead & Manager', { eyebrow: 'Reporting line' })}
      ${cpPersonCard(primary, primary.roleLevel, primary === lm ? 'Assigns and reviews your tasks, and approves your access requests.' : 'Oversees the team and reviews Lead & Manager tasks.')}
      ${second ? `<p class="ca-note">Above them: ${cpEsc(second.name)}, ${cpEsc(second.roleLevel)}.</p>` : ''}
      ${cpActions([cpMsgAction(primary.id, `Message ${cpEsc(primary.name.split(' ')[0])}`, '', true), second ? cpMsgAction(second.id, `Message ${cpEsc(second.name.split(' ')[0])}`) : null])}
    </div>`;
  },
  message_person(c, x) {
    const target = x.person === 'supervisor' ? c.supervisor : x.person === 'leadmgr' ? c.leadmgr : x.person === 'hr' ? { id: c.company.contacts.hr.messageId, name: 'HR' } : x.person === 'it' ? { id: c.company.contacts.it.messageId, name: 'IT Support' } : null;
    if (!target) return CP_ANSWERS.who_is(c, x);
    setTimeout(() => openTeamMessages(target.id), 300);
    return `<div class="ca"><p class="ca-lead">Opening your conversation with ${cpEsc(target.name)}.</p>${cpActions([cpMsgAction(target.id, `Message ${cpEsc(target.name)}`, '', true)])}</div>`;
  },

  policy_detail(c, x) {
    const p = c.company.policies.find((y) => y.id === x.policy);
    if (!p) return CP_ANSWERS.policies_list(c, x);
    const ct = c.company.contacts[p.contact] || c.company.contacts.hr;
    const related = x.policy === 'infosec' ? c.company.policies.filter((y) => ['device', 'privacy', 'acceptable-use'].includes(y.id)) : [];
    return `<div class="ca">
      ${caHead(cpEsc(p.title), { eyebrow: `${cpEsc(cpCompanyName(c))} policy` })}
      <p class="ca-lead">${cpEsc(p.summary)}</p>
      <ul class="ca-list">${p.points.map((s) => `<li>${cpEsc(s)}</li>`).join('')}</ul>
      ${related.length ? `<p class="ca-note">Related: ${related.map((y) => cpEsc(y.title)).join(', ')}.</p>` : ''}
      <p class="ca-note">${cpEsc(p.owner)} · effective ${cpEsc(p.effective)} · ${cpEsc(p.appliesTo)}</p>
      ${cpActions([cpPolicyAction(p.id, 'Read in Policies'), cpMsgAction(ct.messageId, `Ask ${cpEsc(ct.team)}`)])}
    </div>`;
  },
  policies_list(c) {
    return `<div class="ca">
      ${caHead('Company policies', { eyebrow: cpEsc(cpCompanyName(c)), badge: `${c.company.policies.length} policies` })}
      <p class="ca-lead">All of ${cpEsc(cpCompanyName(c))}'s policies are in <strong>Policies</strong>, each with a short summary. The main ones:</p>
      <ul class="ca-list">${c.company.policies.slice(0, 6).map((p) => `<li><strong>${cpEsc(p.title)}</strong>: ${cpEsc(p.summary)}</li>`).join('')}</ul>
      ${cpActions([{ ...cpPolicyAction(), primary: true }, cpMsgAction(c.company.contacts.hr.messageId, 'Ask HR')])}
    </div>`;
  },
  library_search(c, x, query) {
    const s = cpNorm(query);
    const lib = c.company.library;
    let hits;
    let title = 'From the Library';
    if (/\bhandbooks?\b/.test(s)) { hits = lib.filter((l) => l.category === 'Employee handbooks'); title = 'Employee handbooks'; }
    else if (/\bforms?\b/.test(s)) { hits = lib.filter((l) => l.type === 'Form'); title = 'Company forms'; }
    else if (/\b(benefit|benefits|insurance)\b/.test(s)) { hits = lib.filter((l) => l.category === 'Benefits information'); title = 'Benefits information'; }
    else if (/\b(expense|expenses|reimburs|travel)\b/.test(s)) { hits = lib.filter((l) => /expense|travel/i.test(l.title)); title = 'Expenses and travel'; }
    else hits = cpSearch(c, query).filter((h) => h.kind === 'library').map((h) => h.item).slice(0, 5);
    if (!hits.length) return CP_ANSWERS.lost(c, x);
    return `<div class="ca">
      ${caHead(cpEsc(title), { eyebrow: `${cpEsc(cpCompanyName(c))} Library` })}
      <ul class="ca-list">${hits.slice(0, 6).map((l) => `<li><strong>${cpEsc(l.title)}</strong> (${cpEsc(l.type)}): ${cpEsc(l.summary)}${l.where ? ` Submit it in ${cpEsc(l.where)}.` : ''}</li>`).join('')}</ul>
      ${cpActions([{ ...cpLibraryAction(hits.length === 1 ? hits[0].id : null), primary: true }, cpMsgAction(c.company.contacts.hr.messageId, 'Ask HR')])}
    </div>`;
  },
  lost(c) {
    return `<div class="ca">
      ${caHead("Let's find it", { eyebrow: 'Help' })}
      <p class="ca-lead">Tell me what you're looking for, or start here:</p>
      <ul class="ca-list">
        <li><strong>Library</strong>: forms, handbooks, IT setup guides, benefits and useful links.</li>
        <li><strong>Policies</strong>: leave, remote work, security, conduct and more.</li>
        <li><strong>Messages</strong>: ask your Lead & Manager, IT Support or HR directly.</li>
      </ul>
      <p class="ca-note">You can also ask me things like "Where is the leave form?" or "How do I get VPN access?"</p>
      ${cpActions([cpLibraryAction(), cpPolicyAction(), c.leadmgr ? cpMsgAction(c.leadmgr.id, `Message ${cpEsc(c.leadmgr.name.split(' ')[0])}`) : null, cpMsgAction(c.company.contacts.hr.messageId, 'Message HR')])}
    </div>`;
  },

  tasks_today(c) {
    const day = cpToday();
    const list = c.tasks.filter((t) => t.day === day);
    if (!list.length) return CP_ANSWERS.tasks_pending(c);
    const done = list.filter((t) => t.status === 'Completed').length;
    const next = list.find((t) => t.status === 'Pending' || t.status === 'Rejected');
    return `<div class="ca" data-ca-view="checklist">
      ${caHead("Today's tasks", { eyebrow: day, badge: `${done} of ${list.length} done`, tone: done === list.length ? 'ok' : '' })}
      ${next ? `<p class="ca-lead">Start with <strong>${cpEsc(next.taskName)}</strong>.</p>` : '<p class="ca-lead">Everything for today is completed or in review.</p>'}
      ${cpTaskList(list)}
      <p class="ca-note">When you finish one, choose <strong>Complete</strong> and upload your proof for review.</p>
    </div>`;
  },
  tasks_pending(c) {
    const pending = c.tasks.filter((t) => t.status !== 'Completed');
    if (!pending.length) return `<div class="ca"><p class="ca-lead">You have no pending tasks. Everything is approved.</p></div>`;
    const review = pending.filter((t) => t.status === 'Pending Review').length;
    return `<div class="ca">
      ${caHead('Your pending tasks', { eyebrow: 'Tasks', badge: `${pending.length} pending` })}
      <p class="ca-lead">${pending.length - review} to do${review ? `, ${review} waiting for review` : ''}. The earliest ones first:</p>
      ${cpTaskList(pending.slice(0, 8))}
      ${pending.length > 8 ? `<p class="ca-note">And ${pending.length - 8} more across the week.</p>` : ''}
      ${cpActions([{ label: 'See all tasks', onclick: "filterByDay('all')" }])}
    </div>`;
  },
  first_week() { return getWeeklyPlanResponseHtml(); },
  progress() { return getOnboardingProgressResponseHtml(); },
  role_info() { return getRoleOverviewResponseHtml(); },
  task_howto(c, x) {
    const t = x.task || c.tasks.find((y) => y.status === 'Pending' || y.status === 'Rejected');
    if (!t) return CP_ANSWERS.tasks_pending(c);
    return getExplainTaskResponseHtml(t.taskId);
  },
  task_deadline(c, x) {
    const start = new Date(c.emp.startDate || c.emp.joiningDate || Date.now());
    const due = (t) => { const n = parseInt(String(t.day).replace(/\D/g, ''), 10) || 1; const d = new Date(start); d.setDate(start.getDate() + n - 1); return `end of ${t.day} (${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })})`; };
    if (x.task) {
      return `<div class="ca">${caHead(cpEsc(x.task.taskName), { eyebrow: 'Deadline' })}
        <p class="ca-lead">Due by <strong>${cpEsc(due(x.task))}</strong>. It takes about ${cpEsc(x.task.duration || '45 mins')}. Status: ${cpEsc(x.task.status)}.</p></div>`;
    }
    const next = c.tasks.filter((t) => t.status !== 'Completed').slice(0, 4);
    return `<div class="ca">${caHead('Upcoming deadlines', { eyebrow: 'Tasks' })}
      <p class="ca-lead">Each task is due by the end of its onboarding day.</p>
      ${caRows(next.map((t) => [cpEsc(t.day), `${cpEsc(t.taskName)}<br><span class="ca-muted">Due ${cpEsc(due(t))}</span>`]))}</div>`;
  },
  after_complete(c) {
    const me = c.me;
    if (me && me.roleKey === 'supervisor') return `<div class="ca"><p class="ca-lead">As Supervisor, your own tasks are marked completed straight away. Tasks from your Lead & Managers and associates come to you for review.</p>${cpActions([{ label: 'Open reviews', onclick: 'openTaskManagement()', primary: true }])}</div>`;
    const reviewer = c.reviewers[0];
    const inReview = c.tasks.filter((t) => t.status === 'Pending Review');
    return `<div class="ca">
      ${caHead('What happens after you complete a task', { eyebrow: 'Approval' })}
      <ol class="ca-steps">
        <li>Choose <strong>Complete</strong> on the task.</li>
        <li>Upload a screenshot or document as proof, check the preview, and submit.</li>
        <li>The task shows <strong>Pending review</strong> and goes to ${reviewer ? `<strong>${cpEsc(reviewer.name)}</strong> (${cpEsc(reviewer.roleLevel)})` : 'your reviewer'}.</li>
        <li>If it's approved, the task becomes <strong>Completed</strong>. If changes are needed, you'll see their feedback and can resubmit.</li>
      </ol>
      ${inReview.length ? `<p class="ca-note">In review now: ${inReview.map((t) => cpEsc(t.taskName)).join(', ')}.</p>` : ''}
      ${cpActions([reviewer ? cpMsgAction(reviewer.id, `Message ${cpEsc(reviewer.name.split(' ')[0])}`) : null])}
    </div>`;
  },
  upload_proof(c) {
    const me = c.me;
    const next = c.tasks.find((t) => t.status === 'Pending' || t.status === 'Rejected');
    if (me && me.roleKey === 'supervisor') return `<div class="ca"><p class="ca-lead">As Supervisor you don't need to upload proof for your own tasks. You can view the proof your team submits in Team task management.</p>${cpActions([{ label: 'Open reviews', onclick: 'openTaskManagement()', primary: true }])}</div>`;
    return `<div class="ca">
      ${caHead('Uploading proof', { eyebrow: 'Approval' })}
      <p class="ca-lead">On your checklist, choose <strong>Complete</strong> on the task. A panel opens where you can upload screenshots or documents (images, PDF, Word, Excel, PowerPoint; up to 10 MB each), preview them, add a note and submit for review.</p>
      ${cpActions([next ? { label: `Upload proof for "${cpEsc(next.taskName)}"`, onclick: `openProofModal('${cpEsc(next.taskId)}')`, primary: true } : null])}
    </div>`;
  },
  who_approves(c) {
    const me = c.me;
    if (me && me.roleKey === 'supervisor') return `<div class="ca"><p class="ca-lead">Your own tasks don't need approval. You approve tasks from your Lead & Managers and associates.</p>${cpActions([{ label: 'Open reviews', onclick: 'openTaskManagement()', primary: true }])}</div>`;
    const r = c.reviewers;
    if (!r.length) return CP_ANSWERS.not_found(c, {});
    return `<div class="ca">
      ${caHead('Who approves your tasks', { eyebrow: 'Approval' })}
      ${cpPersonCard(r[0], r[0].roleLevel, 'Reviews your proof and approves or requests changes.')}
      ${r[1] ? `<p class="ca-note">${cpEsc(r[1].name)} (${cpEsc(r[1].roleLevel)}) can also review your tasks.</p>` : ''}
      ${cpActions([cpMsgAction(r[0].id, `Message ${cpEsc(r[0].name.split(' ')[0])}`, '', true)])}
    </div>`;
  },
  review_status(c) {
    const mine = c.tasks.filter((t) => t.review && ['pending_review', 'rejected', 'approved'].includes(t.review.status));
    if (!mine.length) return `<div class="ca"><p class="ca-lead">You haven't submitted any tasks for review yet.</p>${cpActions([{ label: 'How approval works', onclick: "askCopilotDirect('What happens after I complete my task?')" }])}</div>`;
    const label = { pending_review: 'Pending review', rejected: 'Changes requested', approved: 'Approved' };
    return `<div class="ca">${caHead('Your submissions', { eyebrow: 'Approval' })}
      ${caRows(mine.map((t) => [label[t.review.status], `${cpEsc(t.taskName)}${t.review.status === 'rejected' ? `<br><span class="ca-muted">Feedback: ${cpEsc(t.review.feedback)}</span>` : ''}`]))}
      ${mine.some((t) => t.review.status === 'rejected') ? cpActions([{ label: 'Resubmit proof', onclick: `openProofModal('${cpEsc(mine.find((t) => t.review.status === 'rejected').taskId)}')`, primary: true }]) : ''}</div>`;
  },
  reviews_queue(c) {
    const me = c.me;
    if (!me || me.roleKey === 'associate') return CP_ANSWERS.review_status(c);
    const list = typeof teamPendingReviewsForMe === 'function' ? teamPendingReviewsForMe() : [];
    return `<div class="ca">
      ${caHead('Waiting for your review', { eyebrow: 'Reviews', badge: `${list.length}` })}
      ${list.length ? caRows(list.slice(0, 6).map((rv) => [cpEsc(rv.empName.split(' ')[0]), `${cpEsc(rv.taskTitle)}<br><span class="ca-muted">${(rv.proofs || []).length} file(s) · submitted ${cpEsc(teamFormatTime(rv.submittedAt))}</span>`])) : '<p class="ca-lead">Nothing is waiting for your review.</p>'}
      ${cpActions([{ label: 'Open reviews', onclick: 'openTaskManagement()', primary: true }])}
    </div>`;
  },
  blocked_status(c) {
    const me = c.me;
    const b = me && typeof teamBlocks === 'function' ? teamBlocks()[me.id] : null;
    if (!b || !b.blocked) return `<div class="ca"><p class="ca-lead">Your account is active. You can complete tasks and submit proof as normal.</p></div>`;
    return `<div class="ca">${caHead('Your access is blocked', { eyebrow: 'Account', badge: 'Blocked', tone: 'danger' })}
      <p class="ca-lead">${cpEsc(b.by.name)} (${cpEsc(b.by.roleLevel)}) blocked your access on ${cpEsc(teamFormatDate(b.at))}.${b.reason ? ' Reason: ' + cpEsc(b.reason) + '.' : ''} Your tasks and progress are saved; you can't complete or submit tasks until access is restored.</p>
      ${cpActions([cpMsgAction(b.by.id, `Message ${cpEsc(b.by.name.split(' ')[0])}`, '', true)])}</div>`;
  },

  retrieval(c, x, query, hits) {
    return `<div class="ca">
      ${caHead('Here\'s what I found', { eyebrow: `${cpEsc(cpCompanyName(c))} Library and Policies` })}
      <ul class="ca-list">${hits.map((h) => `<li><strong>${cpEsc(h.title)}</strong> (${h.kind === 'policy' ? 'Policy' : h.kind === 'procedure' ? 'IT guide' : cpEsc(h.item.type)}): ${cpEsc(h.summary)}</li>`).join('')}</ul>
      <p class="ca-note">If this isn't what you meant, try rephrasing or ask someone directly.</p>
      ${cpActions([hits[0].kind === 'policy' ? cpPolicyAction(hits[0].item.id) : cpLibraryAction(hits[0].kind === 'library' ? hits[0].item.id : null), c.leadmgr ? cpMsgAction(c.leadmgr.id, `Ask ${cpEsc(c.leadmgr.name.split(' ')[0])}`) : null])}
    </div>`;
  },
  not_found(c) {
    const lm = c.leadmgr;
    return `<div class="ca">
      <p class="ca-lead">I couldn't find that in ${cpEsc(cpCompanyName(c))}'s Library, Policies or your tasks, so I don't want to guess.</p>
      <p class="ca-label">Next steps</p>
      <ul class="ca-list">
        <li>Check the <strong>Library</strong> or <strong>Policies</strong>.</li>
        <li>Ask ${lm ? `your Lead & Manager, <strong>${cpEsc(lm.name)}</strong>` : 'your Lead & Manager'}, or HR / IT for anything about accounts, tools, pay or leave.</li>
      </ul>
      ${cpActions([cpLibraryAction(), cpPolicyAction(), lm ? cpMsgAction(lm.id, `Message ${cpEsc(lm.name.split(' ')[0])}`) : null, cpMsgAction(c.company.contacts.hr.messageId, 'Message HR'), cpMsgAction(c.company.contacts.it.messageId, 'Message IT')])}
    </div>`;
  },
};

// ---------------------------------------------------------------- retrieval over company data
function cpCorpus(c) {
  const out = [];
  (c.company.library || []).forEach((l) => out.push({ kind: 'library', title: l.title, summary: l.summary, item: l, text: [l.title, l.title, l.summary, l.category, (l.sections || []).join(' '), (l.fields || []).join(' ')].join(' ') }));
  (c.company.policies || []).forEach((p) => out.push({ kind: 'policy', title: p.title, summary: p.summary, item: p, text: [p.title, p.title, p.summary, p.points.join(' ')].join(' ') }));
  Object.values(c.company.procedures || {}).forEach((p) => out.push({ kind: 'procedure', title: p.title, summary: p.steps[0], item: p, text: [p.title, p.title, p.keywords.join(' '), p.steps.join(' ')].join(' ') }));
  return out;
}
function cpSearch(c, query) {
  const q = [...new Set(cpTokens(query))].filter((w) => w.length > 2);
  if (!q.length) return [];
  return cpCorpus(c).map((d) => {
    const toks = new Set(cpTokens(d.text));
    const title = new Set(cpTokens(d.title));
    const score = q.reduce((s, w) => s + (toks.has(w) ? 1 : 0) + (title.has(w) ? 1 : 0), 0);
    return { ...d, score };
  }).filter((d) => d.score >= 2).sort((a, b) => b.score - a.score).slice(0, 4);
}

// ---------------------------------------------------------------- conversation memory (task follow-ups)
// The chat remembers the task it last explained and the recent turns, so follow-ups such as
// "I didn't understand step 3", "explain the second step", "next step" or "explain it more simply"
// are answered about that task instead of falling through to "I couldn't find that".
const cpConv = { task: null, lastStep: null, history: [] };
window.cpConversation = cpConv;

function cpPlain(html) {
  const txt = String(html == null ? '' : html)
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, ' `$1` ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|li|div|h\d|article|header)>/gi, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\*\*(.+?)\*\*/g, '$1');
  return txt.replace(/\s+/g, ' ').replace(/(\.\s*){2,}/g, '. ').trim();
}

// Called by getExplainTaskResponseHtml() (index.html) every time a task is explained.
function cpSetCurrentTask(t) {
  if (!t || !t.taskId) return;
  const stepsHtml = Array.isArray(t.steps) ? t.steps : [];
  if (!cpConv.task || cpConv.task.taskId !== t.taskId) cpConv.lastStep = null;
  cpConv.task = {
    taskId: String(t.taskId),
    title: cpPlain(t.title),
    day: t.day || '',
    duration: t.duration || '',
    department: t.department || '',
    description: cpPlain(t.description),
    objective: cpPlain(t.objective),
    prerequisites: cpPlain(t.prerequisites),
    verification: cpPlain(t.verification),
    supervisor: cpPlain(t.supervisor),
    troubleshooting: (Array.isArray(t.troubleshooting) ? t.troubleshooting : []).map(cpPlain).filter(Boolean),
    stepsHtml,
    steps: stepsHtml.map(cpPlain),
  };
}
window.cpSetCurrentTask = cpSetCurrentTask;

// Called by runCopilotResponseWithThinking() (index.html) after every answer.
function cpRecordTurn(userText, answerHtml) {
  if (userText) cpConv.history.push({ role: 'user', content: String(userText).slice(0, 500) });
  let text;
  const t = cpConv.task;
  if (t && /data-ca-view="task"/.test(String(answerHtml || ''))) {
    text = `I explained the task "${t.title}". Its steps are: ` + t.steps.map((s, i) => `${i + 1}. ${s}`).join(' ');
  } else {
    text = cpPlain(answerHtml);
  }
  if (text) cpConv.history.push({ role: 'assistant', content: text.slice(0, 900) });
  if (cpConv.history.length > 12) cpConv.history.splice(0, cpConv.history.length - 12);
}
window.cpRecordTurn = cpRecordTurn;

// Loads a task into memory without showing its card (for "step 2 of task 5").
function cpLoadTask(taskId) {
  try { if (typeof getExplainTaskResponseHtml === 'function') getExplainTaskResponseHtml(taskId); } catch (e) { /* ignore */ }
  return cpConv.task && String(cpConv.task.taskId).replace(/\D/g, '').replace(/^0+/, '') === String(taskId).replace(/\D/g, '').replace(/^0+/, '') ? cpConv.task : null;
}

const CP_ORDINALS = {
  first: 1, one: 1, '1st': 1, second: 2, two: 2, '2nd': 2, third: 3, three: 3, '3rd': 3,
  fourth: 4, four: 4, '4th': 4, fifth: 5, five: 5, '5th': 5, sixth: 6, six: 6, '6th': 6,
  seventh: 7, seven: 7, '7th': 7, eighth: 8, eight: 8, '8th': 8, ninth: 9, nine: 9, '9th': 9,
  tenth: 10, ten: 10, '10th': 10,
};
const CP_NUMWORD = '(\\d{1,2}|' + Object.keys(CP_ORDINALS).join('|') + ')';
const cpToNum = (w) => (/^\d+$/.test(w) ? parseInt(w, 10) : CP_ORDINALS[w] || null);

// "step 3", "step no 3", "step-3", "3rd step", "third step", "step third", "point 2", "last step", "next step"...
function cpStepRef(s) {
  let m = s.match(new RegExp('\\b(?:step|point)s?[ -]?(?:no |number |# ?)?' + CP_NUMWORD + '\\b'))
    || s.match(new RegExp('\\b' + CP_NUMWORD + ' (?:step|point)\\b'));
  if (m) { const n = cpToNum(m[1]); if (n) return { kind: 'num', n }; }
  if (/\b(last|final) (step|point)\b/.test(s)) return { kind: 'last' };
  if (/\bnext (step|point)\b/.test(s)) return { kind: 'next' };
  if (/\b(previous|prev|earlier) (step|point)\b|\bstep before\b/.test(s)) return { kind: 'prev' };
  if (/\b(this|that|same) (step|point)\b/.test(s)) return { kind: 'same' };
  return null;
}

const CP_CONFUSED = /\b(did not (understand|get)|do not (understand|get)|not (able to |getting |understanding )?understand|cannot understand|could not understand|not clear|unclear|confus\w*|explain (it |this |that |the task |this task )?(again|more|better|simply|properly|in detail|in simple|in easy)|elaborate|more detail\w*|in detail|simpler|simple words|easy words|easy language|layman|what does (this|that|it) mean|meaning of (this|that)|give (me )?(an )?example|samajh|samjh|samjha|samjhao|samjhaao)\b/;

function cpStepCount(task) { return (task && task.steps && task.steps.length) || 0; }

function cpResolveStep(task, ref) {
  const n = cpStepCount(task);
  if (ref.kind === 'num') return ref.n;
  if (ref.kind === 'last') return n;
  if (ref.kind === 'next') return cpConv.lastStep ? cpConv.lastStep + 1 : 1;
  if (ref.kind === 'prev') return cpConv.lastStep ? cpConv.lastStep - 1 : 1;
  return cpConv.lastStep || 1;
}

const cpAsk = (label, q, primary) => ({ label, primary, onclick: `askCopilotDirect(decodeURIComponent('${cpArg(q)}'))` });

function cpStepNav(task, idx) {
  const n = cpStepCount(task);
  return cpActions([
    idx > 1 ? cpAsk(`← Step ${idx - 1}`, `Explain step ${idx - 1}`) : null,
    idx < n ? cpAsk(`Step ${idx + 1} →`, `Explain step ${idx + 1}`, true) : null,
    { label: 'Whole task', onclick: `askCopilotToExplainTask('${cpEsc(task.taskId)}')` },
  ]);
}

// Offline explanation of one step, used when the AI model is unavailable.
function cpStepFallback(c, task, idx) {
  const step = task.steps[idx - 1] || '';
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  // Break the step into clauses ("do A; then do B") or, for "Review A, B, C and D for X", into its items.
  let intro = '';
  let parts = step.split(/;\s+|\.\s+(?=[A-Z])|,?\s+and then\s+|,\s+then\s+/).map((x) => x.trim().replace(/[.]+$/, '')).filter((x) => x.length > 3);
  if (parts.length === 1 && (step.match(/,/g) || []).length >= 2) {
    const m = step.replace(/[.]+$/, '').match(/^(\S+)\s+(?:the\s+|your\s+|all\s+)?(.+?)(\s+(?:for|within|relevant to|in|across)\s+.+)?$/);
    const items = m ? m[2].split(/,\s*(?:and\s+|or\s+)?|\s+and\s+/).map((x) => x.trim()).filter((x) => x.length > 2) : [];
    if (m && items.length >= 3) { intro = `${cap(m[1])} each of these${m[3] ? ` (${m[3].trim()})` : ''}:`; parts = items; }
  }
  const prev = idx > 1 ? task.steps[idx - 2] : '';
  const next = idx < task.steps.length ? task.steps[idx] : '';
  const short = (x) => cpEsc(x.length > 110 ? x.slice(0, 107).replace(/\s+\S*$/, '') + '…' : x);
  const buddy = c.emp && c.emp.buddy && c.emp.buddy.name;
  const lead = c.leadmgr && c.leadmgr.name;
  return `
    ${parts.length >= 2 ? `<p class="ca-label">Do it in small parts</p>${intro ? `<p>${cpEsc(intro)}</p>` : ''}<ol class="ca-steps">${parts.map((p) => `<li>${cpEsc(cap(p))}</li>`).join('')}</ol>` : `<p>${cpEsc(step)}</p>`}
    ${prev || next ? `<p class="ca-label">Where this fits</p><ul class="ca-list">
      ${prev ? `<li><strong>Before this</strong> (step ${idx - 1}): ${short(prev)}</li>` : '<li>This is the <strong>first step</strong>, so you can start here.</li>'}
      ${next ? `<li><strong>After this</strong> (step ${idx + 1}): ${short(next)}</li>` : '<li>This is the <strong>last step</strong>. After it, check the result below.</li>'}
    </ul>` : ''}
    ${task.objective ? `<p class="ca-label">Why it matters</p><p>${short(task.objective)}</p>` : ''}
    ${!next && task.verification ? `<p class="ca-label">How you'll know it's done</p><p>${cpEsc(task.verification)}</p>` : ''}
    <p class="ca-label">Still not clear?</p>
    <p>Ask ${buddy ? `your buddy <strong>${cpEsc(buddy)}</strong>` : 'your buddy'}${lead ? ` or your lead <strong>${cpEsc(lead)}</strong>` : ' or your lead'} to show you this step. It usually takes them a few minutes.</p>`;
}

async function cpStepAnswer(c, task, idx, query, simpler) {
  const n = cpStepCount(task);
  if (!n) return cpTaskSimpler(c, task, query);
  if (idx < 1 || idx > n) {
    return `<div class="ca">
      ${caHead(`This task has ${n} step${n === 1 ? '' : 's'}`, { eyebrow: cpEsc(task.title) })}
      <p class="ca-lead">There's no step ${idx}. Pick the step you want me to explain:</p>
      <ol class="ca-steps">${task.steps.map((s, i) => `<li>${cpEsc(s.length > 120 ? s.slice(0, 117) + '…' : s)}</li>`).join('')}</ol>
      ${cpActions(task.steps.slice(0, 8).map((_, i) => cpAsk(`Step ${i + 1}`, `Explain step ${i + 1}`)))}
    </div>`;
  }
  cpConv.lastStep = idx;
  const model = await cpAskModel(c, query, 'task_step', [], { mode: simpler ? 'explain_step_simpler' : 'explain_step', focusStep: idx });
  const stepHtml = typeof caInline === 'function' ? caInline(task.stepsHtml[idx - 1] || cpEsc(task.steps[idx - 1])) : cpEsc(task.steps[idx - 1]);
  return `<div class="ca" data-ca-view="step">
    ${caHead(`Step ${idx} of ${n}`, { eyebrow: cpEsc(task.title), badge: simpler ? 'Simpler' : '' })}
    <article class="ca-card"><p class="ca-eyebrow">The step</p><p>${stepHtml}</p></article>
    <p class="ca-label">${simpler ? 'In simpler words' : 'What this means'}</p>
    ${model ? `<div class="ca-prose">${caMarkdown(model)}</div>` : cpStepFallback(c, task, idx)}
    ${cpStepNav(task, idx)}
  </div>`;
}

async function cpTaskSimpler(c, task, query) {
  const model = await cpAskModel(c, query, 'task_followup', [], { mode: 'explain_task_simple' });
  const n = cpStepCount(task);
  const body = model
    ? `<div class="ca-prose">${caMarkdown(model)}</div>`
    : `<p class="ca-lead">Here's the task in short. Tell me which step is unclear and I'll break it down.</p>
       ${task.objective ? `<p><strong>Goal:</strong> ${cpEsc(task.objective)}</p>` : ''}
       <ol class="ca-steps">${task.steps.map((s) => `<li>${cpEsc(s.split(/[.;]\s/)[0])}</li>`).join('')}</ol>`;
  return `<div class="ca" data-ca-view="task-simple">
    ${caHead("Let's go through it again", { eyebrow: cpEsc(task.title) })}
    ${body}
    ${n ? `<p class="ca-label">Which step should I explain?</p>${cpActions(task.steps.slice(0, 8).map((_, i) => cpAsk(`Step ${i + 1}`, `Explain step ${i + 1}`)))}` : ''}
  </div>`;
}

// Returns answer HTML for a follow-up about the current task, or null if the question isn't one.
async function cpTaskFollowUp(c, query, s, intent) {
  const ref = cpStepRef(s);
  const confused = CP_CONFUSED.test(s);
  if (!ref && !confused) return null;

  // "step 2 of task 5" → switch to that task first
  let task = cpConv.task;
  const named = /\btask\b|\bt0*\d/.test(s) ? cpTaskRef(s, c.tasks || []) : null;
  if (named && (!task || String(named.taskId) !== task.taskId)) task = cpLoadTask(named.taskId) || task;

  if (!task) {
    if (!ref) return null; // plain "I'm confused" with no task open → normal flow
    const pending = (c.tasks || []).filter((t) => t.status !== 'Completed').slice(0, 5);
    return `<div class="ca">
      ${caHead('Which task do you mean?', { eyebrow: 'Task steps' })}
      <p class="ca-lead">Open a task with <strong>Ask Copilot</strong> first, or ask like <em>"explain step 2 of task 4"</em>.</p>
      ${pending.length ? cpTaskList(pending) : ''}
    </div>`;
  }

  // A confused remark that clearly belongs to another topic (tool, policy, person) is not a task follow-up.
  if (!ref && !['unknown', 'lost', 'task_howto', 'greeting', 'thanks', 'out_of_scope'].includes(intent)) return null;

  if (ref) return cpStepAnswer(c, task, cpResolveStep(task, ref), query, confused);
  if (cpConv.lastStep) return cpStepAnswer(c, task, cpConv.lastStep, query, true);
  return cpTaskSimpler(c, task, query);
}

// The server-side NVIDIA NIM copilot, grounded with the retrieved snippets, the task the employee is on
// and the recent conversation. Resolves to null if unavailable.
async function cpAskModel(c, query, intent, hits, opts = {}) {
  try {
    if (typeof getApiBaseUrl !== 'function') return null;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), opts.mode ? 20000 : 15000);
    const t = cpConv.task;
    const res = await fetch(`${getApiBaseUrl()}/api/v1/ai/nvidia-copilot`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
      body: JSON.stringify({
        query, intent, company: cpCompanyName(c), role: c.emp.fullTitle || c.emp.role, employeeId: c.emp.employeeId,
        buddyName: c.emp.buddy && c.emp.buddy.name, hrName: c.emp.hr && c.emp.hr.name,
        retrieved: hits.map((h) => ({ source: h.kind, title: h.title, text: h.text.slice(0, 600) })),
        contacts: Object.values((c.company && c.company.contacts) || {}).map((x) => ({ team: x.team, person: x.person, phone: x.phone, email: x.email, covers: x.covers })),
        history: cpConv.history.slice(-6),
        mode: opts.mode, focusStep: opts.focusStep,
        taskContext: t ? {
          taskId: t.taskId, title: t.title, day: t.day, duration: t.duration, department: t.department,
          description: t.description.slice(0, 600), objective: t.objective.slice(0, 600), prerequisites: t.prerequisites.slice(0, 500),
          steps: t.steps.map((x) => x.slice(0, 500)), verification: t.verification.slice(0, 400), supervisor: t.supervisor.slice(0, 300),
          troubleshooting: t.troubleshooting.slice(0, 3).map((x) => x.slice(0, 300)),
        } : undefined,
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const ans = data && (data.data?.answer || data.answer);
    if (data && data.data && data.data.fallback) return null; // the model did not answer; use our own explanation
    return ans && !/onboarding scope guard/i.test(data.data?.model || '') ? ans : null;
  } catch (e) { return null; }
}

// Entry point used by the chat: returns the answer HTML.
async function copilotRespond(query) {
  const c = cpCtx();
  const s = cpNorm(query);
  let x = null;
  try { x = copilotClassify(query); } catch (e) { x = { intent: 'unknown' }; }
  // Follow-ups about the task that was just explained ("I didn't understand step 3", "next step", ...)
  if (x.intent !== 'out_of_scope') {
    const followUp = await cpTaskFollowUp(c, query, s, x.intent);
    if (followUp) return followUp;
  }
  if (!c.company || !c.company.procedures) return CP_ANSWERS.not_found(c, {});
  const fn = CP_ANSWERS[x.intent];
  if (fn && x.intent !== 'unknown') {
    try { return fn(c, x, query); } catch (e) { console.warn('[assistant]', x.intent, e); }
  }
  const hits = cpSearch(c, query);
  const model = await cpAskModel(c, query, x.intent, hits);
  if (model) {
    return `<div class="ca"><div class="ca-prose">${caMarkdown(model)}</div>
      ${cpActions([cpLibraryAction(), c.leadmgr ? cpMsgAction(c.leadmgr.id, `Message ${cpEsc(c.leadmgr.name.split(' ')[0])}`) : null])}</div>`;
  }
  if (hits.length) return CP_ANSWERS.retrieval(c, x, query, hits.slice(0, 3));
  return CP_ANSWERS.not_found(c, x);
}
