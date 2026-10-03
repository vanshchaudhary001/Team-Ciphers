import sys
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

print("Starting authoritative tasks & chatbot patcher...")

target_files = [
    'client/index.html',
    'index.html',
    'client/public/index.html'
]

with open('client/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# 1. Add getWhatIHaveToDoResponseHtml and getConfusionResolutionResponseHtml right before getChecklistResponseHtml
new_chatbot_functions = """
    function getWhatIHaveToDoResponseHtml() {
      const emp = currentLiveDashboard?.employee || { name: 'New Joiner', role: 'Associate', fullTitle: 'Associate - Executive Assistant', department: 'Administration' };
      const allTasks = (currentLiveDashboard && currentLiveDashboard.tasks && currentLiveDashboard.tasks.length > 0)
        ? currentLiveDashboard.tasks
        : (dailyTasksState || []);

      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(t => t.status === 'Completed' || t.done).length;
      const pendingTasks = allTasks.filter(t => t.status !== 'Completed' && !t.done);
      const nextPending = pendingTasks[0] || allTasks[0];
      const day1Tasks = allTasks.filter(t => (t.day === 'Day 1' || String(t.day).toLowerCase().includes('1')));

      let html = `
        <div style="font-family: inherit; line-height: 1.5;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.15); padding-bottom: 10px;">
            <div>
              <div style="font-weight: 800; font-size: 0.98rem; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                <span>🎯</span> Your Day-1 Execution Blueprint
              </div>
              <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 2px;">
                Role: <strong>${escapeHtml(emp.fullTitle || emp.role)}</strong> · ${escapeHtml(emp.department)}
              </div>
            </div>
            <span style="font-size: 0.72rem; font-weight: 800; color: #34d399; background: rgba(16, 185, 129, 0.18); padding: 3px 9px; border-radius: 9999px;">
              ${completedTasks}/${totalTasks} Tasks Done
            </span>
          </div>

          <div style="background: rgba(99, 102, 241, 0.12); border-left: 3px solid #818cf8; padding: 10px 12px; border-radius: 6px; margin-bottom: 14px; font-size: 0.82rem; color: #e2e8f0;">
            <div style="font-weight: 700; color: #a5b4fc; margin-bottom: 3px;">👋 What you need to do right now:</div>
            Your onboarding plan contains <strong>30 authoritative tasks</strong> designed specifically for your post in <strong>${escapeHtml(emp.subBranch || emp.team || emp.department)}</strong>. For Day 1, focus on completing your first 6 foundational setup, charter, and workflow tasks.
          </div>

          ${nextPending ? `
            <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 10px 12px; margin-bottom: 14px;">
              <div style="font-size: 0.72rem; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
                <span>👉</span> Immediate Next Action Item
              </div>
              <div style="font-weight: 800; font-size: 0.92rem; color: #ffffff; margin-top: 4px;">
                #Task ${nextPending.num || nextPending.taskId}: ${escapeHtml(nextPending.taskName || nextPending.title)}
              </div>
              <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 4px; line-height: 1.45;">
                ${escapeHtml(nextPending.desc || nextPending.description || nextPending.objective)}
              </div>
              <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <button class="chat-action-chip" onclick="explainTaskById('${nextPending.taskId || nextPending.id}')" style="background: #4f46e5; color: #ffffff; border-color: #6366f1; padding: 4px 10px; font-weight: 700;">
                  💡 Open Step-by-Step Playbook
                </button>
                <span style="font-size: 0.72rem; color: #94a3b8;">⏱️ Duration: ${nextPending.duration || '60 mins'}</span>
              </div>
            </div>
          ` : ''}

          <div style="font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px;">
            Day-1 Task Priority Briefs:
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; padding-right: 4px;">
      `;

      day1Tasks.slice(0, 6).forEach((t, i) => {
        const isDone = t.status === 'Completed' || t.done;
        html += `
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 8px 10px; font-size: 0.8rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <div style="font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
                <span>${isDone ? '✅' : '⏳'}</span>
                <span>#Task ${t.num || (i + 1)}: ${escapeHtml(t.taskName || t.title)}</span>
              </div>
              <button class="chat-action-chip" onclick="explainTaskById('${t.taskId || t.id}')" style="padding: 2px 7px; font-size: 0.7rem;">
                💡 Playbook
              </button>
            </div>
            <div style="font-size: 0.76rem; color: #94a3b8; line-height: 1.4;">
              ${escapeHtml(t.desc || t.description)}
            </div>
          </div>
        `;
      });

      html += `
          </div>

          <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="chat-action-chip" onclick="explainTaskById(1)">💡 Explain Task 1</button>
            <button class="chat-action-chip" onclick="explainTaskById(2)">💡 Explain Task 2</button>
            <button class="chat-action-chip" onclick="filterByDay('all')">📋 View All 30 Tasks</button>
            <button class="chat-action-chip" onclick="handleChatOption('contacts')">📞 Contact Buddy</button>
          </div>
        </div>
      `;
      return html;
    }

    function getConfusionResolutionResponseHtml() {
      const emp = currentLiveDashboard?.employee || { name: 'New Joiner', role: 'Associate', fullTitle: 'Associate - Executive Assistant', department: 'Administration' };
      const buddy = emp.buddy || { name: 'Rahul Pandey', role: 'Senior Peer Mentor', phone: '+91 80 6789 89928', email: 'buddy@microsoft.in' };
      const hr = emp.hr || { name: 'Priya Sharma', role: 'Lead HR People Partner', phone: '+91 80 6789 89912', email: 'hr@microsoft.in' };

      return `
        <div style="font-family: inherit; line-height: 1.5;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.15); padding-bottom: 8px;">
            <div style="font-weight: 800; font-size: 0.95rem; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
              <span>💡</span> Role Clarity & Confusion Resolution
            </div>
            <span style="font-size: 0.72rem; font-weight: 800; color: #38bdf8; background: rgba(56, 189, 248, 0.18); padding: 3px 9px; border-radius: 9999px;">
              AI Guidance
            </span>
          </div>

          <p style="font-size: 0.82rem; color: #cbd5e1; margin-bottom: 12px; line-height: 1.55;">
            It is completely normal to feel confused or overwhelmed during your first week! Here is how to navigate your onboarding cleanly as <strong>${escapeHtml(emp.fullTitle || emp.role)}</strong> in <strong>${escapeHtml(emp.department)}</strong>:
          </p>

          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; font-size: 0.8rem;">
            <div style="font-weight: 700; color: #a5b4fc; margin-bottom: 4px;">1. Focus on one day at a time:</div>
            <div style="color: #cbd5e1;">Your 30 onboarding tasks are staggered across 5 days. For today, only focus on <strong>Day 1 (Tasks 1 to 6)</strong>. Click the Day 1 pill above your checklist to isolate today's deliverables.</div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; font-size: 0.8rem;">
            <div style="font-weight: 700; color: #a5b4fc; margin-bottom: 4px;">2. Ask Copilot to break down any task:</div>
            <div style="color: #cbd5e1;">Whenever you are unsure of how to execute a requirement, click <strong>"💡 Explain in Copilot"</strong> on any task card, or ask me <em>"Explain task 2"</em> to receive the exact step-by-step instructions.</div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; font-size: 0.8rem;">
            <div style="font-weight: 700; color: #a5b4fc; margin-bottom: 4px;">3. Direct Human Support:</div>
            <div style="color: #cbd5e1; display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
              <div>🤝 <strong>Assigned Buddy:</strong> ${escapeHtml(buddy.name)} (${escapeHtml(buddy.role)}) · <a href="mailto:${buddy.email}" style="color: #38bdf8;">${buddy.email}</a> · ${buddy.phone}</div>
              <div>💼 <strong>HR Partner:</strong> ${escapeHtml(hr.name)} (${escapeHtml(hr.role)}) · <a href="mailto:${hr.email}" style="color: #38bdf8;">${hr.email}</a> · ${hr.phone}</div>
            </div>
          </div>

          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="chat-action-chip" onclick="handleChatOption('what_to_do')">❓ What I Have To Do</button>
            <button class="chat-action-chip" onclick="explainTaskById(1)">💡 Explain Task 1</button>
            <button class="chat-action-chip" onclick="explainTaskById(2)">💡 Explain Task 2</button>
            <button class="chat-action-chip" onclick="handleChatOption('contacts')">📞 Call Support</button>
          </div>
        </div>
      `;
    }
"""

# Check if functions already exist
if 'getWhatIHaveToDoResponseHtml' not in content:
    target = 'function getChecklistResponseHtml()'
    if target in content:
        content = content.replace(target, new_chatbot_functions + "\n    " + target)
        print("✅ Added getWhatIHaveToDoResponseHtml and getConfusionResolutionResponseHtml")

# 2. Update handleChatOption to support 'what_to_do'
old_chat_opt = """    function handleChatOption(optionKey) {
      if (optionKey === 'contacts') {
        runCopilotResponseWithThinking('Show me the verified Contact Directory and emergency support numbers.', getContactDirectoryResponseHtml);
      } else if (optionKey === 'checklist') {
        runCopilotResponseWithThinking("Show my Today's Work and Day 1 onboarding checklist.", getChecklistResponseHtml);
      } else if (optionKey === 'stuck') {
        runCopilotResponseWithThinking("I'm stuck on one of my onboarding tasks. What should I do?", getStuckTroubleshootingResponseHtml);
      }
    }"""

new_chat_opt = """    function handleChatOption(optionKey) {
      if (optionKey === 'what_to_do') {
        runCopilotResponseWithThinking('What do I have to do today?', getWhatIHaveToDoResponseHtml);
      } else if (optionKey === 'contacts') {
        runCopilotResponseWithThinking('Show me the verified Contact Directory and emergency support numbers.', getContactDirectoryResponseHtml);
      } else if (optionKey === 'checklist') {
        runCopilotResponseWithThinking("Show my Today's Work and Day 1 onboarding checklist.", getChecklistResponseHtml);
      } else if (optionKey === 'stuck' || optionKey === 'confused') {
        runCopilotResponseWithThinking("I'm confused or stuck on my tasks. What should I do?", getConfusionResolutionResponseHtml);
      }
    }"""

if old_chat_opt in content:
    content = content.replace(old_chat_opt, new_chat_opt)
    print("✅ Updated handleChatOption")

# 3. Update sendChatMessage query routing for "what i have to do", "confusion", etc.
old_send_start = """      // Route natural language queries intelligently with 3.5s thinking delay
      if (lower.includes('contact') || lower.includes('phone') || lower.includes('call') || lower.includes('directory') || lower.includes('number') || lower.includes('who to call') || lower.includes('who to contact')) {
        runCopilotResponseWithThinking(query, getContactDirectoryResponseHtml);
        return;
      }

      if (lower.includes('checklist') || (lower.includes('show') && lower.includes('task')) || lower.includes('today') || lower.includes('complete today') || lower.includes('day 1 tasks') || lower.includes('what to do')) {
        runCopilotResponseWithThinking(query, getChecklistResponseHtml);
        return;
      }"""

new_send_start = """      // Route natural language queries intelligently with realistic thinking delay
      if (lower.includes('what i have to do') || lower.includes('what do i have to do') || lower.includes('what to do') || lower.includes('what should i do') || lower.includes('what are my tasks') || lower.includes('what is my work') || lower.includes('what do i do') || lower.includes('my tasks')) {
        runCopilotResponseWithThinking(query, getWhatIHaveToDoResponseHtml);
        return;
      }

      if (lower.includes('confus') || lower.includes('not sure') || lower.includes('dont know') || lower.includes("don't know") || lower.includes('dont understand') || lower.includes("don't understand") || lower.includes('lost') || lower.includes('clarify')) {
        runCopilotResponseWithThinking(query, getConfusionResolutionResponseHtml);
        return;
      }

      if (lower.includes('contact') || lower.includes('phone') || lower.includes('call') || lower.includes('directory') || lower.includes('number') || lower.includes('who to call') || lower.includes('who to contact')) {
        runCopilotResponseWithThinking(query, getContactDirectoryResponseHtml);
        return;
      }

      if (lower.includes('checklist') || (lower.includes('show') && lower.includes('task')) || lower.includes('today') || lower.includes('complete today') || lower.includes('day 1 tasks')) {
        runCopilotResponseWithThinking(query, getChecklistResponseHtml);
        return;
      }"""

if old_send_start in content:
    content = content.replace(old_send_start, new_send_start)
    print("✅ Updated sendChatMessage natural language routing")

# 4. Update initJoinerChatbot welcome chips
old_init_chips = """            <div class="chat-options-group">
              <button class="chat-action-chip" onclick="handleChatOption('contacts')">📞 Contact Directory</button>
              <button class="chat-action-chip" onclick="handleChatOption('checklist')">📋 Today's Checklist</button>
              <button class="chat-action-chip" onclick="explainTaskById(1)">💡 Explain Task 1</button>
              <button class="chat-action-chip" onclick="explainTaskById(2)">💡 Explain Task 2</button>
              <button class="chat-action-chip" onclick="handleChatOption('stuck')">🚨 I'm Stuck</button>
            </div>"""

new_init_chips = """            <div class="chat-options-group" id="copilot-welcome-chips">
              <button class="chat-action-chip" onclick="handleChatOption('what_to_do')" style="background: rgba(99,102,241,0.25); color: #a5b4fc; border-color: #6366f1; font-weight: 700;">❓ What I Have To Do</button>
              <button class="chat-action-chip" onclick="explainTaskById(1)">💡 Task 1: Setup</button>
              <button class="chat-action-chip" onclick="explainTaskById(2)">💡 Task 2: Charter</button>
              <button class="chat-action-chip" onclick="handleChatOption('contacts')">📞 Contact Directory</button>
              <button class="chat-action-chip" onclick="handleChatOption('confused')">🚨 I'm Confused / Stuck</button>
            </div>"""

if old_init_chips in content:
    content = content.replace(old_init_chips, new_init_chips)
    print("✅ Updated initJoinerChatbot welcome chips")

# 5. Ensure task cards have clean heading and 2-3 lines description and Explain button
# In renderManualDashboardFromLive:
old_card_info = """                <div class="manual-task-title" style="font-size: 1rem; font-weight: 800; margin-top: 6px; color: var(--color-slate-900);">${t.taskName}</div>
                <div class="manual-task-desc" style="font-size: 0.8rem; color: var(--color-slate-600); margin-top: 3px; line-height: 1.45;">${t.description}</div>"""

new_card_info = """                <div class="manual-task-title" style="font-size: 1.02rem; font-weight: 800; margin-top: 6px; color: var(--color-slate-900); line-height: 1.35;">#Task ${t.num || t.taskId}: ${escapeHtml(t.taskName || t.title)}</div>
                <div class="manual-task-desc" style="font-size: 0.84rem; color: #475569; margin-top: 4px; line-height: 1.5;">${escapeHtml(t.desc || t.description)}</div>
                <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <button type="button" class="btn-explain-copilot" onclick="explainTaskById('${t.taskId || t.id}')" style="font-size: 0.76rem; font-weight: 700; color: #4338ca; background: #e0e7ff; border: 1px solid #c7d2fe; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s ease;">
                    <span>💡 Explain in Copilot</span>
                  </button>
                  <span style="font-size: 0.72rem; color: #64748b; font-weight: 600;">⏱️ ${t.duration || '60 mins'}</span>
                </div>"""

if old_card_info in content:
    content = content.replace(old_card_info, new_card_info)
    print("✅ Updated card title, 2-line description, and Explain in Copilot button")

# Write to all 3 files
for fpath in target_files:
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Successfully written patched content to {fpath} ({os.path.getsize(fpath):,} bytes)")

print("\n🎉 Patch applied successfully to all index.html files!")
