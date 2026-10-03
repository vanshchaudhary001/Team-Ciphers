import re
import sys

print("Reading client/index.html...")
with open('client/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# 1. Read markup snippet
with open('scripts/task_mgmt_markup.html', 'r', encoding='utf-8') as f:
    markup = f.read()

# 2. Read controller script snippet
with open('scripts/task_mgmt_controller.js', 'r', encoding='utf-8') as f:
    controller_js = f.read()

# 3. Insert workspace switcher bar in step-joiner-chatbot right before <div class="joiner-split-container">
nav_bar_html = '''
      <!-- Role-Based Hierarchical Workspace Switcher Bar (Appears for Manager & Lead) -->
      <div id="role-workspace-nav-bar" style="display: none; margin-bottom: 20px; background: #ffffff; border: 1px solid var(--color-slate-200); border-radius: 12px; padding: 10px 18px; box-shadow: var(--shadow-xs); justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span id="role-workspace-role-badge" style="font-size: 0.74rem; font-weight: 800; padding: 3px 9px; border-radius: 6px; background: #0037b0; color: #ffffff; letter-spacing: 0.04em;">
            MANAGEMENT WORKSPACE
          </span>
          <span id="role-workspace-scope-text" style="font-size: 0.82rem; font-weight: 500; color: var(--color-slate-600);">
            Hierarchical Task Control Active
          </span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="tab-my-checklist-btn" class="persona-pill-btn active" onclick="switchJoinerWorkspaceTab('checklist')">
            📋 My Onboarding Tasks
          </button>
          <button id="tab-subordinate-management-btn" class="persona-pill-btn" onclick="switchJoinerWorkspaceTab('management')">
            ⚡ Subordinate Task Management
          </button>
        </div>
      </div>
'''

if 'id="role-workspace-nav-bar"' not in html:
    target = '<div class="joiner-split-container">'
    if target in html:
        html = html.replace(target, nav_bar_html + '\n      ' + target, 1)
        print("[OK] Inserted role-workspace-nav-bar into step-joiner-chatbot")
    else:
        print("WARNING: joiner-split-container not found!")

# 4. Insert step-task-management section right before step-hr-portal
if 'id="step-task-management"' not in html:
    target_hr = '<section id="step-hr-portal"'
    if target_hr in html:
        html = html.replace(target_hr, markup + '\n\n    ' + target_hr, 1)
        print("[OK] Inserted step-task-management markup before step-hr-portal")
    else:
        print("WARNING: step-hr-portal not found!")

# 5. Insert controller JavaScript functions into the inline <script>
if 'function openTaskManagement()' not in html:
    # Insert right before window.addEventListener('DOMContentLoaded'
    target_load = "window.addEventListener('DOMContentLoaded'"
    if target_load in html:
        html = html.replace(target_load, controller_js + '\n\n    ' + target_load, 1)
        print("[OK] Inserted task management controller JS")
    else:
        print("WARNING: DOMContentLoaded event listener not found!")

# 6. Update renderManualDashboardFromLive to show/hide role-workspace-nav-bar
role_nav_toggle_code = '''
      // Toggle Hierarchical Workspace Switcher Bar based on authentic role
      const roleNav = document.getElementById('role-workspace-nav-bar');
      const roleBadge = document.getElementById('role-workspace-role-badge');
      const roleScope = document.getElementById('role-workspace-scope-text');
      const subMgmtBtn = document.getElementById('tab-subordinate-management-btn');

      if (roleNav) {
        const rLevel = (data.employee.roleLevel || data.employee.role || '').toLowerCase();
        const isMgr = rLevel.includes('manager') || rLevel === 'ceo' || rLevel.includes('director');
        const isLd = rLevel.includes('lead') || rLevel.includes('senior');

        if (isMgr || isLd) {
          roleNav.style.display = 'flex';
          if (isMgr) {
            if (roleBadge) {
              roleBadge.textContent = 'MANAGER WORKSPACE';
              roleBadge.style.background = '#0037b0';
            }
            if (roleScope) {
              roleScope.textContent = 'Authority Scope: Leads & Associates Across Department';
            }
            if (subMgmtBtn) subMgmtBtn.textContent = '⚡ Manage Subordinate Tasks (Leads & Associates)';
          } else {
            if (roleBadge) {
              roleBadge.textContent = 'LEAD WORKSPACE';
              roleBadge.style.background = '#0d9488';
            }
            if (roleScope) {
              roleScope.textContent = 'Authority Scope: Assigned Associates (Direct Reports)';
            }
            if (subMgmtBtn) subMgmtBtn.textContent = '⚡ Manage My Associates Tasks';
          }
        } else {
          // Associate is strictly execution-only (Section 10)
          roleNav.style.display = 'none';
        }
      }
'''

if 'Toggle Hierarchical Workspace Switcher Bar' not in html:
    target_render = "function renderManualDashboardFromLive(data) {"
    if target_render in html:
        html = html.replace(target_render, target_render + '\n' + role_nav_toggle_code, 1)
        print("[OK] Patched renderManualDashboardFromLive with role switcher logic")
    else:
        print("WARNING: renderManualDashboardFromLive not found!")

# Write updated client/index.html
with open('client/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("[OK] Saved client/index.html")

# Sync to root index.html and client/public/index.html
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
with open('client/public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("[OK] Synced index.html and client/public/index.html")
