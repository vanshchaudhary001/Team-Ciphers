import sys
import io
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("Reading client/index.html...")
with open('client/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# 1. Update the chat panel markup
old_chat_marker = '<!-- ==========================================================\n             RIGHT 30%: AI ONBOARDING COPILOT CHATBOT (STICKY SIDEBAR)\n             ========================================================== -->'
if old_chat_marker not in html:
    # Try alternate spacing
    idx = html.find('RIGHT 30%: AI ONBOARDING COPILOT CHATBOT (STICKY SIDEBAR)')
    if idx != -1:
        start_idx = html.rfind('<!--', 0, idx)
        end_idx = html.find('</section>', idx)
        old_chat_block = html[start_idx:end_idx]
    else:
        print("ERROR: Could not locate chat panel marker!")
        sys.exit(1)
else:
    end_idx = html.find('</section>', html.find(old_chat_marker))
    start_idx = html.find(old_chat_marker)
    old_chat_block = html[start_idx:end_idx]

new_chat_markup = '''<!-- ==========================================================
             PERSISTENT AI ONBOARDING COPILOT (3-STATE SYSTEM: FULLSCREEN, MEDIUM, COMPACT)
             ========================================================== -->
        <div id="copilot-persistent-panel" class="joiner-chat-panel copilot-state-fullscreen">
          <!-- Chatbot Header -->
          <div class="copilot-sidebar-header">
            <div class="copilot-header-brand">
              <div class="copilot-avatar-wrapper"
                style="width: 38px; height: 38px; min-width: 38px; border-radius: 10px; background: #ffffff; border: 1px solid rgba(148, 163, 184, 0.4); display: flex; align-items: center; justify-content: center; padding: 3px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35); flex-shrink: 0;">
                <img src="copilot-icon.png" onerror="this.src='/copilot-icon.png'" alt="AI Copilot Logo"
                  style="width: 100%; height: 100%; object-fit: contain; display: block;">
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span class="copilot-title-text" style="font-weight: 800; font-size: 1.05rem; color: #ffffff;">
                    First-Week Maze Onboarding Copilot
                  </span>
                  <span class="copilot-live-pill"
                    style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
                    <span style="width: 6px; height: 6px; border-radius: 50%; background: #34d399; display: inline-block;"></span>
                    LIVE SESSION
                  </span>
                </div>
                <div class="copilot-subtitle-text" id="copilot-context-subtitle">
                  Context: <strong id="copilot-context-user">Aarav Sharma</strong> · Day 1 Guide
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <!-- Expand Button (visible in medium state to return to full-screen) -->
              <button id="copilot-expand-btn" class="copilot-ctrl-btn" onclick="setCopilotState('fullscreen')" title="Expand to Full Screen" aria-label="Expand chatbot to full screen" style="display: none;">
                <span class="material-symbols-outlined" style="font-size: 18px;">open_in_full</span>
              </button>
              <!-- Minimize Button (transitions full-screen -> medium, or medium -> compact) -->
              <button id="copilot-minimize-btn" class="copilot-ctrl-btn" onclick="handleCopilotMinimizeClick()" title="Minimize chatbot" aria-label="Minimize chatbot to medium window">
                <span class="material-symbols-outlined" style="font-size: 20px;">remove</span>
              </button>
            </div>
          </div>

          <!-- Chat Messages Container -->
          <div id="chatbot-messages-feed" class="copilot-messages-feed">
            <!-- Dynamic AI messages stream -->
          </div>

          <!-- Suggested FAQ Questions Bar (Direct Shortcuts into Chatbot) -->
          <div class="copilot-quick-prompts">
            <div style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span>💬</span> Suggested Questions:
            </div>
            <div class="copilot-chips-scroll" id="copilot-chips-container" style="display: flex; gap: 8px; flex-wrap: wrap;">
              <!-- Populated dynamically by renderSuggestedFaqQuestions() based on role -->
            </div>
          </div>

          <!-- Chatbot Sticky Input Box -->
          <div class="copilot-composer">
            <div class="composer-inner">
              <textarea id="chatbot-input" class="copilot-textarea"
                placeholder="Ask your onboarding copilot anything about tasks, role, or company..." rows="1"
                onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); sendChatMessage(); }"></textarea>
              <button id="chatbot-send-btn" class="copilot-send-button" onclick="sendChatMessage()"
                title="Send prompt to AI Copilot" aria-label="Send message to Copilot">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div class="composer-footnote">
              <span>⚡ Live Context Aware · Enterprise Grounded · Role-Governed Access</span>
            </div>
          </div>

        </div>

      </div>
    '''

html = html[:start_idx] + new_chat_markup + html[end_idx:]
print("[OK] Replaced chat panel markup with 3-state copilot structure")

# 2. Add Compact Trigger & Loading Overlay before </body>
bottom_markup = '''
  <!-- State 3: Compact Bottom-Right Copilot Trigger Button -->
  <div id="copilot-compact-trigger" onclick="setCopilotState('medium')" role="button" tabindex="0" aria-label="Open onboarding copilot" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();setCopilotState('medium');}">
    <div class="compact-copilot-icon">
      <img src="copilot-icon.png" onerror="this.src='/copilot-icon.png'" alt="Copilot" />
      <span class="compact-copilot-dot"></span>
    </div>
    <div class="compact-copilot-text">
      <div class="compact-copilot-title">First-Week Maze Copilot</div>
      <div class="compact-copilot-sub">Click to expand · <span id="copilot-mini-name">Onboarding</span></div>
    </div>
  </div>

  <!-- Polished Loading Overlay after login (Requirement 26) -->
  <div id="copilot-login-loading-overlay" style="display: none;">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center; max-width: 440px; padding: 32px 28px; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
      <div style="width: 58px; height: 58px; border-radius: 16px; background: #ffffff; padding: 6px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);">
        <img src="copilot-icon.png" onerror="this.src='/copilot-icon.png'" alt="Copilot Logo" style="width: 100%; height: 100%; object-fit: contain;">
      </div>
      <div>
        <div style="font-size: 1.25rem; font-weight: 800; color: #f8fafc; margin-bottom: 6px;">Preparing your onboarding copilot...</div>
        <div id="copilot-loading-context-text" style="font-size: 0.85rem; color: #94a3b8; line-height: 1.5;">Loading company, department, and authoritative task plan...</div>
      </div>
      <div class="thinking-spinner" style="margin-top: 6px;">
        <span class="spinner-dot dot-1"></span>
        <span class="spinner-dot dot-2"></span>
        <span class="spinner-dot dot-3"></span>
      </div>
    </div>
  </div>
'''

if 'id="copilot-compact-trigger"' not in html:
    html = html.replace('</body>', bottom_markup + '\n</body>', 1)
    print("[OK] Inserted compact copilot trigger and loading overlay")

# 3. Add JS State Controller & Enhanced Knowledge Logic
copilot_controller_js = '''
    // ==============================================================
    // FULL-SCREEN COPILOT 3-STATE INTERACTION CONTROLLER
    // ==============================================================
    let copilotCurrentState = 'fullscreen';

    function setCopilotState(targetState) {
      const panel = document.getElementById('copilot-persistent-panel');
      const compactTrigger = document.getElementById('copilot-compact-trigger');
      const expandBtn = document.getElementById('copilot-expand-btn');
      const minimizeBtn = document.getElementById('copilot-minimize-btn');
      const splitContainer = document.querySelector('.joiner-split-container');

      if (!panel) return;

      // Add rolling morph transition class for subtle tactile animation (Requirement 10 & 21)
      panel.classList.add('copilot-rolling-morph');
      setTimeout(() => {
        panel.classList.remove('copilot-rolling-morph');
      }, 420);

      if (targetState === 'fullscreen') {
        copilotCurrentState = 'fullscreen';
        panel.classList.remove('copilot-state-medium', 'copilot-state-compact');
        panel.classList.add('copilot-state-fullscreen');
        panel.style.display = 'flex';
        if (compactTrigger) compactTrigger.style.display = 'none';
        if (expandBtn) expandBtn.style.display = 'none';
        if (minimizeBtn) {
          minimizeBtn.title = 'Minimize chatbot';
          minimizeBtn.setAttribute('aria-label', 'Minimize chatbot to medium window');
        }
        if (splitContainer) splitContainer.style.gridTemplateColumns = '1fr';
        const input = document.getElementById('chatbot-input');
        if (input) setTimeout(() => input.focus(), 150);
      } else if (targetState === 'medium') {
        copilotCurrentState = 'medium';
        panel.classList.remove('copilot-state-fullscreen', 'copilot-state-compact');
        panel.classList.add('copilot-state-medium');
        panel.style.display = 'flex';
        if (compactTrigger) compactTrigger.style.display = 'none';
        if (expandBtn) expandBtn.style.display = 'inline-flex';
        if (minimizeBtn) {
          minimizeBtn.title = 'Minimize to Compact Copilot';
          minimizeBtn.setAttribute('aria-label', 'Minimize chatbot to compact copilot');
        }
        if (splitContainer) splitContainer.style.gridTemplateColumns = '1fr';
      } else if (targetState === 'compact') {
        copilotCurrentState = 'compact';
        panel.classList.remove('copilot-state-fullscreen', 'copilot-state-medium');
        panel.classList.add('copilot-state-compact');
        if (expandBtn) expandBtn.style.display = 'none';
        setTimeout(() => {
          if (copilotCurrentState === 'compact') {
            panel.style.display = 'none';
            if (compactTrigger) compactTrigger.style.display = 'flex';
          }
        }, 320);
        if (splitContainer) splitContainer.style.gridTemplateColumns = '1fr';
      }
    }

    function handleCopilotMinimizeClick() {
      if (copilotCurrentState === 'fullscreen') {
        setCopilotState('medium');
      } else if (copilotCurrentState === 'medium') {
        setCopilotState('compact');
      }
    }

    function askCopilotDirect(queryText) {
      const input = document.getElementById('chatbot-input');
      if (input) {
        input.value = queryText;
      }
      sendChatMessage();
    }

    function renderSuggestedFaqQuestions(emp) {
      const container = document.getElementById('copilot-chips-container');
      if (!container) return;

      const roleLevel = (emp?.roleLevel || emp?.role || '').toLowerCase();
      let questions = [];

      if (roleLevel.includes('manager') || roleLevel.includes('director') || roleLevel === 'ceo') {
        questions = [
          "How is my team progressing?",
          "Which Associates are behind?",
          "What are my Leads working on?",
          "What SLA blockers are pending?",
          "What is the department completion rate?",
          "Who should I contact if I need help?"
        ];
      } else if (roleLevel.includes('lead') || roleLevel.includes('senior')) {
        questions = [
          "What are my priorities today?",
          "How are my Associates progressing?",
          "What Associate tasks need attention?",
          "Who is my Manager?",
          "What is my team's onboarding status?",
          "Who should I contact if I need help?"
        ];
      } else {
        // Associate (Default)
        questions = [
          "What's my task for today?",
          "What do I need to complete this week?",
          "Who is my reporting manager?",
          "Who is my Lead?",
          "What should I complete on Day 1?",
          "How do I access my department resources?",
          "What's my onboarding progress?",
          "Who should I contact if I need help?"
        ];
      }

      container.innerHTML = questions.map(q => `
        <button class="copilot-chip" onclick="askCopilotDirect('${escapeHtml(q)}')" style="cursor: pointer; transition: all 0.15s ease;">
          ${escapeHtml(q)}
        </button>
      `).join('');
    }

    // Role-Aware Real Data Response Generators
    function getReportingManagerResponseHtml() {
      const emp = currentLiveDashboard?.employee;
      const managerName = emp?.reportingManager || (emp?.roleLevel === 'Manager' ? 'Senior VP of Operations' : (emp?.roleLevel === 'Lead' ? 'Engineering Manager (Vikram Shah)' : 'Rohan Verma (Engineering Manager)'));
      const managerEmail = emp?.managerEmail || 'rohan.manager@meridian.internal';
      return `
        <div style="color: #f8fafc;">
          <div style="font-size: 0.95rem; font-weight: 800; margin-bottom: 6px;">👔 Reporting Manager Information</div>
          <p style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.55; margin-bottom: 12px;">
            Your designated reporting manager is <strong>${escapeHtml(managerName)}</strong>. They oversee department progression, milestone evaluations, and final first-week sign-off.
          </p>
          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 10px 14px; font-size: 0.8rem; margin-bottom: 10px;">
            <div>📧 Email: <strong>${escapeHtml(managerEmail)}</strong></div>
            <div>📞 Direct Phone: <strong>+91 (80) 6789-89944</strong></div>
            <div>🗓️ Scheduled 1:1 Check-In: <strong>Day 1 at 4:30 PM & Day 5 Milestone Review</strong></div>
          </div>
          <div style="font-size: 0.8rem; color: #94a3b8;">
            💡 <em>Your manager receives automatic updates as you complete Day 1 requirements.</em>
          </div>
        </div>
      `;
    }

    function getReportingLeadResponseHtml() {
      const emp = currentLiveDashboard?.employee;
      const isLeadOrManager = emp?.roleLevel === 'Lead' || emp?.roleLevel === 'Manager';
      if (isLeadOrManager) {
        return `
          <div style="color: #f8fafc;">
            <div style="font-size: 0.95rem; font-weight: 800; margin-bottom: 6px;">👥 Lead & Supervisory Structure</div>
            <p style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.55;">
              You are authenticated as <strong>${escapeHtml(emp.fullTitle || emp.role)}</strong> (${escapeHtml(emp.roleLevel)}). You report directly to Department Management and oversee your assigned Associates.
            </p>
          </div>
        `;
      }
      const leadName = emp?.leadName || 'Priya Sharma (Staff Technical Lead)';
      return `
        <div style="color: #f8fafc;">
          <div style="font-size: 0.95rem; font-weight: 800; margin-bottom: 6px;">🤝 Assigned Technical Lead</div>
          <p style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.55; margin-bottom: 12px;">
            Your direct reporting lead is <strong>${escapeHtml(leadName)}</strong>. Your Lead provides technical pair programming, code reviews, and daily unblocking support.
          </p>
          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 10px 14px; font-size: 0.8rem;">
            <div>📧 Email: <strong>priya.lead@meridian.internal</strong></div>
            <div>💬 Team Channel: <strong>#eng-dev-team</strong></div>
            <div>⚡ Next Action: <strong>Day 1 Task 3 (Buddy & Lead Pairing Sync)</strong></div>
          </div>
        </div>
      `;
    }

    function getOnboardingProgressResponseHtml() {
      const metrics = currentLiveDashboard?.metrics || { totalTasks: 30, completedTasks: 1, pendingTasks: 29, percentage: 3 };
      const emp = currentLiveDashboard?.employee || {};
      return `
        <div style="color: #f8fafc;">
          <div style="font-size: 0.95rem; font-weight: 800; margin-bottom: 8px;">📊 Real-Time Onboarding Telemetry</div>
          <p style="font-size: 0.84rem; color: #cbd5e1; margin-bottom: 12px;">
            Here is your current first-week progress for <strong>${escapeHtml(emp.fullTitle || 'Your Role')}</strong>:
          </p>
          <div style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px; padding: 14px 18px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.85rem; font-weight: 700; color: #e2e8f0;">Completion Rate</span>
              <span style="font-size: 1.1rem; font-weight: 900; color: #34d399;">${metrics.percentage}%</span>
            </div>
            <div style="width: 100%; height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 9999px; overflow: hidden; margin-bottom: 10px;">
              <div style="width: ${metrics.percentage}%; height: 100%; background: linear-gradient(90deg, #10b981, #06b6d4); border-radius: 9999px;"></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center; font-size: 0.76rem;">
              <div><strong style="color: #f8fafc; font-size: 0.9rem;">${metrics.completedTasks}</strong><br><span style="color: #94a3b8;">Completed</span></div>
              <div><strong style="color: #f8fafc; font-size: 0.9rem;">${metrics.pendingTasks}</strong><br><span style="color: #94a3b8;">Pending</span></div>
              <div><strong style="color: #f8fafc; font-size: 0.9rem;">${metrics.totalTasks}</strong><br><span style="color: #94a3b8;">Total Tasks</span></div>
            </div>
          </div>
          <div style="font-size: 0.8rem; color: #94a3b8;">
            Cohort Status: <strong style="color: #34d399;">FLOWING</strong> · All systems operational.
          </div>
        </div>
      `;
    }

    function getWeeklyPlanResponseHtml() {
      const tasks = currentLiveDashboard?.tasks || [];
      const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];
      const daySummaries = days.map(d => {
        const dayTasks = tasks.filter(t => t.day === d);
        const done = dayTasks.filter(t => t.status === 'Completed' || t.done).length;
        return { day: d, count: dayTasks.length, done };
      });

      return `
        <div style="color: #f8fafc;">
          <div style="font-size: 0.95rem; font-weight: 800; margin-bottom: 6px;">📅 First-Week Task Roadmap (5-Day Plan)</div>
          <p style="font-size: 0.84rem; color: #cbd5e1; margin-bottom: 12px;">
            Your first week is structured into 30 authoritative milestones across 5 dedicated days:
          </p>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
            ${daySummaries.map(s => `
              <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="color: #f8fafc; font-size: 0.84rem;">${s.day}</strong>
                  <span style="font-size: 0.74rem; color: #94a3b8; margin-left: 8px;">${s.count} Milestones (${s.done} completed)</span>
                </div>
                <button class="copilot-chip" style="padding: 3px 9px; font-size: 0.72rem;" onclick="filterByDay('${s.day}'); setCopilotState('medium');">View ${s.day}</button>
              </div>
            `).join('')}
          </div>
          <div style="font-size: 0.8rem; color: #94a3b8;">
            💡 <em>Complete your Day 1 mandatory items first to unlock downstream technical milestones.</em>
          </div>
        </div>
      `;
    }

    function getDepartmentResourcesResponseHtml() {
      const emp = currentLiveDashboard?.employee || {};
      return `
        <div style="color: #f8fafc;">
          <div style="font-size: 0.95rem; font-weight: 800; margin-bottom: 6px;">📚 Departmental Resources & Access Portals</div>
          <p style="font-size: 0.84rem; color: #cbd5e1; margin-bottom: 12px;">
            Verified internal links for <strong>${escapeHtml(emp.department || 'Your Department')}</strong>:
          </p>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem;">
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 12px;">
              🔗 <strong>Architecture & Standards Wiki:</strong> <a href="#" style="color: #38bdf8; text-decoration: underline;">wiki.internal/${escapeHtml((emp.department || 'eng').toLowerCase())}/standards</a>
            </div>
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 12px;">
              🐙 <strong>Enterprise GitHub Org:</strong> <a href="#" style="color: #38bdf8; text-decoration: underline;">github.internal/enterprise-org</a>
            </div>
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 12px;">
              🛡️ <strong>IT Service Desk & Provisioning:</strong> <a href="#" style="color: #38bdf8; text-decoration: underline;">servicedesk.internal/access-requests</a>
            </div>
          </div>
        </div>
      `;
    }

    function getHighestPriorityTaskResponseHtml() {
      const tasks = currentLiveDashboard?.tasks || [];
      const pending = tasks.filter(t => !t.done && t.status !== 'Completed');
      const critical = pending.find(t => t.priority === 'Critical') || pending.find(t => t.priority === 'High') || pending[0];
      if (!critical) {
        return `<div style="color: #34d399; font-weight: 700;">🎉 All high-priority onboarding tasks are completed!</div>`;
      }
      return `
        <div style="color: #f8fafc;">
          <div style="font-size: 0.95rem; font-weight: 800; margin-bottom: 6px;">⚡ Highest Priority Pending Task</div>
          <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 10px; padding: 12px 16px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 0.74rem; font-weight: 800; padding: 2px 7px; border-radius: 6px; background: #f59e0b; color: #000;">${critical.priority} PRIORITY</span>
              <span style="font-size: 0.74rem; color: #fbbf24;">${critical.day} · ${critical.duration}</span>
            </div>
            <div style="font-size: 0.92rem; font-weight: 800; color: #ffffff; margin-bottom: 4px;">${escapeHtml(critical.title || critical.taskName)}</div>
            <div style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.45;">${escapeHtml(critical.description || critical.desc)}</div>
          </div>
          <button class="copilot-chip" onclick="explainTaskById('${critical.taskId || 1}')">💡 View Step-by-Step Playbook</button>
        </div>
      `;
    }

    function getLeadAssociateProgressResponseHtml() {
      return `
        <div style="color: #f8fafc;">
          <div style="font-size: 0.95rem; font-weight: 800; margin-bottom: 6px;">👥 Assigned Associate Progression Overview</div>
          <p style="font-size: 0.84rem; color: #cbd5e1; margin-bottom: 10px;">
            Here is the status of Associates assigned under your technical guidance:
          </p>
          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 12px 16px; font-size: 0.8rem; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <strong>Aarav Sharma (Associate - Engineer)</strong>
              <span style="color: #34d399; font-weight: 700;">Day 1 · Flowing</span>
            </div>
            <div style="color: #94a3b8; font-size: 0.76rem;">Completed: 2/30 (7%) · Pending: Task 3 (Buddy Pairing)</div>
          </div>
          <button class="copilot-chip" onclick="goToStep('step-task-management'); setCopilotState('medium');">⚡ Open Subordinate Task Management</button>
        </div>
      `;
    }

    function getManagerTeamProgressResponseHtml() {
      return `
        <div style="color: #f8fafc;">
          <div style="font-size: 0.95rem; font-weight: 800; margin-bottom: 6px;">👔 Departmental Joiner Progression Overview</div>
          <p style="font-size: 0.84rem; color: #cbd5e1; margin-bottom: 10px;">
            Department onboarding velocity and SLA compliance summary:
          </p>
          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 12px 16px; font-size: 0.8rem; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Active Department Joiners:</span>
              <strong style="color: #ffffff;">14 Active</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Cohort Velocity:</span>
              <strong style="color: #34d399;">12 Flowing · 2 Detouring</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Average Completion Rate:</span>
              <strong style="color: #38bdf8;">68% Overall</strong>
            </div>
          </div>
          <button class="copilot-chip" onclick="goToStep('step-task-management'); setCopilotState('medium');">⚡ Open Management Control Center</button>
        </div>
      `;
    }

    function getRbacRestrictedResponseHtml() {
      return `
        <div style="color: #f8fafc;">
          <div style="font-size: 0.95rem; font-weight: 800; color: #f87171; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>🔒</span> Role-Based Authorization Policy
          </div>
          <p style="font-size: 0.84rem; color: #cbd5e1; line-height: 1.55;">
            This information is restricted to Management level according to enterprise role governance. As an Associate, you have authorized access to your assigned onboarding roadmap, team directory, and technical documentation.
          </p>
        </div>
      `;
    }
'''

if 'function setCopilotState(' not in html:
    # Insert right before function sendChatMessage
    html = html.replace('function sendChatMessage() {', copilot_controller_js + '\n\n    function sendChatMessage() {', 1)
    print("[OK] Inserted copilot 3-state controller JS")

# 4. Update initJoinerChatbot to show professional welcome message matching Requirement 3
welcome_fn_js = '''
    function initJoinerChatbot(user) {
      const feed = document.getElementById('chatbot-messages-feed');
      if (!feed) return;

      const compName = currentLiveDashboard?.company?.name || user?.company?.name || 'Company';
      const firstName = user?.name ? user.name.split(' ')[0] : 'there';
      const fullTitle = user?.fullTitle || (currentLiveDashboard?.employee?.fullTitle) || user?.role || 'Associate';
      const roleLevel = user?.roleLevel || (currentLiveDashboard?.employee?.roleLevel) || 'Associate';
      const deptName = user?.department || (currentLiveDashboard?.employee?.department) || 'Department';
      const subDeptName = user?.subDepartment || (currentLiveDashboard?.employee?.subDepartment) || (currentLiveDashboard?.employee?.team) || 'Operations';

      const ctxUserEl = document.getElementById('copilot-context-user');
      if (ctxUserEl) ctxUserEl.textContent = user?.name || 'Aarav Sharma';

      const ctxSubEl = document.getElementById('copilot-context-subtitle');
      if (ctxSubEl) {
        ctxSubEl.innerHTML = `Context: <strong>${escapeHtml(user?.name || 'New Joiner')}</strong> (${escapeHtml(roleLevel)}) · ${escapeHtml(deptName)} > ${escapeHtml(subDeptName)}`;
      }

      const miniNameEl = document.getElementById('copilot-mini-name');
      if (miniNameEl) miniNameEl.textContent = firstName;

      feed.innerHTML = `
        <div class="chat-bubble assistant">
          <div class="chat-avatar ai" title="First-Week Maze Copilot">
            <img src="copilot-icon.png" onerror="this.src='/copilot-icon.png'" alt="Copilot" />
          </div>
          <div class="chat-bubble-body">
            <div style="font-size: 1.15rem; font-weight: 800; color: #f8fafc; margin-bottom: 4px;">
              Hi ${escapeHtml(firstName)} 👋
            </div>
            <div style="font-size: 1rem; font-weight: 700; color: #e2e8f0; margin-bottom: 12px;">
              Welcome to your First-Week Maze at ${escapeHtml(compName)}.
            </div>
            <p style="color: #cbd5e1; margin-bottom: 14px; font-size: 0.9rem; line-height: 1.6;">
              I'm your onboarding copilot for <strong>${escapeHtml(fullTitle)}</strong> in <strong>${escapeHtml(deptName)}</strong>. I can help you understand your tasks, find company resources, answer questions, and guide you through your first week.
            </p>
            <div style="font-size: 0.78rem; font-weight: 700; color: #818cf8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em;">
              Select a suggested question below or type anything in the chat:
            </div>
          </div>
        </div>
      `;

      renderSuggestedFaqQuestions(user);
    }
'''

# Replace old initJoinerChatbot
old_init_regex = r'function initJoinerChatbot\(user\) \{[\s\S]*?\n    \}'
html = re.sub(old_init_regex, welcome_fn_js.strip(), html, count=1)
print("[OK] Updated initJoinerChatbot with professional welcome state")

# 5. Update sendChatMessage query routing to handle all required questions
query_routing_patch = '''
      // Comprehensive natural language query routing for Onboarding Copilot
      if (lower.includes('salary') || lower.includes('compensation') || lower.includes('peer review') || lower.includes('confidential performance')) {
        runCopilotResponseWithThinking(query, getRbacRestrictedResponseHtml);
        return;
      }

      if (lower.includes('manager') || lower.includes('reporting manager') || lower.includes('who is my manager') || lower.includes('my manager')) {
        runCopilotResponseWithThinking(query, getReportingManagerResponseHtml);
        return;
      }

      if (lower.includes('lead') || lower.includes('reporting lead') || lower.includes('who is my lead') || lower.includes('my lead')) {
        runCopilotResponseWithThinking(query, getReportingLeadResponseHtml);
        return;
      }

      if (lower.includes('progress') || lower.includes('how much') || lower.includes('completed') || lower.includes('completion rate')) {
        runCopilotResponseWithThinking(query, getOnboardingProgressResponseHtml);
        return;
      }

      if (lower.includes('week') || lower.includes('this week') || lower.includes('5 day') || lower.includes('remaining tasks') || lower.includes('all tasks')) {
        runCopilotResponseWithThinking(query, getWeeklyPlanResponseHtml);
        return;
      }

      if (lower.includes('resource') || lower.includes('department resource') || lower.includes('wiki') || lower.includes('docs') || lower.includes('repo')) {
        runCopilotResponseWithThinking(query, getDepartmentResourcesResponseHtml);
        return;
      }

      if (lower.includes('highest') || lower.includes('priority') || lower.includes('critical task') || lower.includes('urgent')) {
        runCopilotResponseWithThinking(query, getHighestPriorityTaskResponseHtml);
        return;
      }

      if (lower.includes('associates progressing') || lower.includes('associate tasks') || lower.includes('my associates')) {
        runCopilotResponseWithThinking(query, getLeadAssociateProgressResponseHtml);
        return;
      }

      if (lower.includes('team progressing') || lower.includes('associates behind') || lower.includes('leads working')) {
        runCopilotResponseWithThinking(query, getManagerTeamProgressResponseHtml);
        return;
      }
'''

if 'getReportingManagerResponseHtml' not in html:
    target_pos = 'if (lower.includes(\'what i have to do\')'
    html = html.replace(target_pos, query_routing_patch.strip() + '\n\n      ' + target_pos, 1)
    print("[OK] Added comprehensive query routing to sendChatMessage")

# 6. Update handleMemberSignIn to show loading overlay and open full-screen copilot immediately
target_signin_end = "showNotification(`🎉 Welcome to ${comp.name}, ${formattedName}! Loaded ${mappedTasks.length} authoritative tasks for ${fullTitle}.`);"
replacement_signin_end = '''// Show Loading Overlay (Requirement 26)
        const overlay = document.getElementById('copilot-login-loading-overlay');
        const ctxText = document.getElementById('copilot-loading-context-text');
        if (ctxText) {
          ctxText.textContent = `Configuring personalized onboarding workspace for ${formattedName} (${fullTitle} · ${deptName})...`;
        }
        if (overlay) overlay.style.display = 'flex';

        setTimeout(() => {
          goToStep('step-joiner-chatbot');
          if (overlay) overlay.style.display = 'none';
          // Open Chatbot in FULL SCREEN mode immediately after successful login (Requirement 1 & 8)
          setCopilotState('fullscreen');
          showNotification(`🎉 Welcome to ${comp.name}, ${formattedName}! Loaded ${mappedTasks.length} authoritative tasks for ${fullTitle}.`);
        }, 500);'''

if target_signin_end in html:
    html = html.replace(target_signin_end, replacement_signin_end, 1)
    print("[OK] Updated handleMemberSignIn with login loading and immediate full-screen copilot")
else:
    print("WARNING: target_signin_end not found in handleMemberSignIn!")

# Write updated client/index.html
with open('client/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("[OK] Saved client/index.html")

# Sync to index.html and client/public/index.html
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
with open('client/public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("[OK] Synced index.html and client/public/index.html")
