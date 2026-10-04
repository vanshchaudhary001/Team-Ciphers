import sys
import os
import re

print("Starting side-by-side copilot layout patch...")

def patch_file(filepath):
    print(f"Patching {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update CSS
    old_css_pattern = r'/\* =========================================================================\s*PERSISTENT COPILOT: 3-STATE SYSTEM \(FULLSCREEN, MEDIUM, COMPACT\)[\s\S]*?/\* Compact Pill Trigger Badge \*/'
    
    new_css = '''/* =========================================================================
       PERSISTENT COPILOT: SIDE-BY-SIDE DYNAMIC LAYOUT & 3-STATE SYSTEM
       ========================================================================= */

    /* Split Container: Grid side-by-side layout ensuring dashboard and copilot are both visible */
    .joiner-split-container {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) 390px !important;
      gap: 24px !important;
      align-items: start !important;
      width: 100% !important;
      margin-top: 12px !important;
      transition: grid-template-columns 320ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Full width dashboard when Copilot is minimized */
    .joiner-split-container.copilot-minimized {
      grid-template-columns: minmax(0, 1fr) !important;
    }

    /* Left area: Adapts dynamically, preserving all tasks, checklist, contacts, and telemetry */
    .joiner-main-dashboard {
      min-width: 0 !important;
      width: 100% !important;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    /* Panel base styling */
    #copilot-persistent-panel {
      transition: all 360ms cubic-bezier(0.16, 1, 0.3, 1), 
                  border-radius 360ms cubic-bezier(0.16, 1, 0.3, 1), 
                  opacity 260ms ease;
      will-change: transform, width, height, top, opacity;
      box-sizing: border-box;
    }

    #copilot-persistent-panel.copilot-rolling-morph {
      transform: scale(0.98) translateY(4px) !important;
    }

    /* STATE 1: FULL SCREEN (Focused modal overlay) */
    #copilot-persistent-panel.copilot-state-fullscreen {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      z-index: 99999 !important;
      margin: 0 !important;
      border-radius: 0 !important;
      border: none !important;
      background: #090d16 !important;
      box-shadow: none !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      transform: scale(1) rotate(0deg) !important;
      opacity: 1 !important;
    }

    #copilot-persistent-panel.copilot-state-fullscreen .copilot-sidebar-header {
      padding: 18px 36px;
      background: #0d1322;
      border-bottom: 1px solid rgba(148, 163, 184, 0.15);
      flex-shrink: 0;
    }

    #copilot-persistent-panel.copilot-state-fullscreen .copilot-messages-feed {
      max-width: 1080px;
      width: 100%;
      margin: 0 auto;
      flex: 1;
      padding: 28px 36px;
      overflow-y: auto;
    }

    #copilot-persistent-panel.copilot-state-fullscreen .copilot-quick-prompts {
      max-width: 1080px;
      width: 100%;
      margin: 0 auto;
      padding: 0 36px 12px 36px;
      flex-shrink: 0;
    }

    #copilot-persistent-panel.copilot-state-fullscreen .copilot-composer {
      max-width: 1080px;
      width: 100%;
      margin: 0 auto;
      padding: 12px 36px 28px 36px;
      flex-shrink: 0;
    }

    /* STATE 2: SIDE-BY-SIDE FLOATING COPILOT PANEL (Controlled 390px Width, Sticky) */
    #copilot-persistent-panel.copilot-state-medium {
      position: sticky !important;
      top: 20px !important;
      bottom: auto !important;
      right: auto !important;
      left: auto !important;
      width: 390px !important;
      max-width: 390px !important;
      height: calc(100vh - 40px) !important;
      max-height: calc(100vh - 40px) !important;
      z-index: 50 !important;
      border-radius: 20px !important;
      border: 1px solid rgba(148, 163, 184, 0.25) !important;
      background: #0f172a !important;
      box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      transform: scale(1) rotate(0deg) !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }

    #copilot-persistent-panel.copilot-state-medium .copilot-sidebar-header {
      padding: 14px 18px;
      background: #0d1322;
      border-bottom: 1px solid rgba(148, 163, 184, 0.15);
      flex-shrink: 0;
    }

    #copilot-persistent-panel.copilot-state-medium .copilot-messages-feed {
      width: 100%;
      flex: 1;
      min-height: 0;
      padding: 16px 18px;
      overflow-y: auto;
    }

    #copilot-persistent-panel.copilot-state-medium .copilot-quick-prompts {
      width: 100%;
      padding: 0 16px 8px 16px;
      flex-shrink: 0;
    }

    #copilot-persistent-panel.copilot-state-medium .copilot-composer {
      width: 100%;
      padding: 10px 16px 16px 16px;
      flex-shrink: 0;
    }

    /* STATE 3: COMPACT BOTTOM-RIGHT COPILOT (Panel hidden, Pill trigger shown) */
    #copilot-persistent-panel.copilot-state-compact {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    /* Responsive: on screens <= 1024px, intelligently stack below dashboard to avoid covering cards */
    @media (max-width: 1024px) {
      .joiner-split-container {
        grid-template-columns: 1fr !important;
        gap: 20px !important;
      }

      #copilot-persistent-panel.copilot-state-medium {
        position: relative !important;
        top: auto !important;
        bottom: auto !important;
        right: auto !important;
        left: auto !important;
        width: 100% !important;
        max-width: 100% !important;
        height: 560px !important;
        max-height: 80vh !important;
        margin-top: 24px !important;
        border-radius: 16px !important;
        z-index: 10 !important;
      }
    }

    /* Compact Pill Trigger Badge */'''

    if re.search(old_css_pattern, content):
        content = re.sub(old_css_pattern, new_css, content, count=1)
        print("  -> Replaced Copilot CSS successfully.")
    else:
        print("  -> Could not match old Copilot CSS pattern directly, attempting fallback...")

    # 2. Update HTML panel class from copilot-state-fullscreen to copilot-state-medium
    content = content.replace(
        '<div id="copilot-persistent-panel" class="joiner-chat-panel copilot-state-fullscreen">',
        '<div id="copilot-persistent-panel" class="joiner-chat-panel copilot-state-medium">'
    )

    # 3. Update expand button to toggle via handleCopilotExpandClick and show by default
    content = content.replace(
        '<button id="copilot-expand-btn" class="copilot-ctrl-btn" onclick="setCopilotState(\'fullscreen\')" title="Expand to Full Screen" aria-label="Expand chatbot to full screen" style="display: none;">',
        '<button id="copilot-expand-btn" class="copilot-ctrl-btn" onclick="handleCopilotExpandClick()" title="Expand to Full Screen" aria-label="Expand chatbot to full screen" style="display: inline-flex;">'
    )
    content = content.replace(
        'title="Minimize chatbot" aria-label="Minimize chatbot to medium window"',
        'title="Minimize Copilot" aria-label="Minimize Copilot to compact button"'
    )

    # 4. Update JS logic
    old_js_pattern = r"let copilotCurrentState = 'fullscreen';[\s\S]*?function handleCopilotMinimizeClick\(\) \{[\s\S]*?\n    \}"
    new_js = '''let copilotCurrentState = 'medium';

    function setCopilotState(targetState) {
      const panel = document.getElementById('copilot-persistent-panel');
      const compactTrigger = document.getElementById('copilot-compact-trigger');
      const expandBtn = document.getElementById('copilot-expand-btn');
      const minimizeBtn = document.getElementById('copilot-minimize-btn');
      const splitContainer = document.querySelector('.joiner-split-container');

      if (!panel) return;

      // Add rolling morph transition class for subtle tactile animation
      panel.classList.add('copilot-rolling-morph');
      setTimeout(() => {
        panel.classList.remove('copilot-rolling-morph');
      }, 360);

      if (targetState === 'fullscreen') {
        copilotCurrentState = 'fullscreen';
        panel.classList.remove('copilot-state-medium', 'copilot-state-compact');
        panel.classList.add('copilot-state-fullscreen');
        panel.style.display = 'flex';
        if (compactTrigger) compactTrigger.style.display = 'none';
        if (expandBtn) {
          expandBtn.style.display = 'inline-flex';
          expandBtn.title = 'Return to Side-by-Side view';
          expandBtn.setAttribute('aria-label', 'Return to Side-by-Side view');
          expandBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">close_fullscreen</span>';
        }
        if (minimizeBtn) {
          minimizeBtn.title = 'Minimize to Side-by-Side';
          minimizeBtn.setAttribute('aria-label', 'Minimize chatbot to side-by-side panel');
        }
        if (splitContainer) {
          splitContainer.classList.remove('copilot-minimized');
          splitContainer.classList.add('copilot-open');
        }
        const input = document.getElementById('chatbot-input');
        if (input) setTimeout(() => input.focus(), 150);
      } else if (targetState === 'medium') {
        copilotCurrentState = 'medium';
        panel.classList.remove('copilot-state-fullscreen', 'copilot-state-compact');
        panel.classList.add('copilot-state-medium');
        panel.style.display = 'flex';
        if (compactTrigger) compactTrigger.style.display = 'none';
        if (expandBtn) {
          expandBtn.style.display = 'inline-flex';
          expandBtn.title = 'Expand to Full Screen';
          expandBtn.setAttribute('aria-label', 'Expand chatbot to full screen');
          expandBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">open_in_full</span>';
        }
        if (minimizeBtn) {
          minimizeBtn.title = 'Minimize Copilot';
          minimizeBtn.setAttribute('aria-label', 'Minimize Copilot to compact button');
        }
        if (splitContainer) {
          splitContainer.classList.remove('copilot-minimized');
          splitContainer.classList.add('copilot-open');
          splitContainer.style.gridTemplateColumns = '';
        }
      } else if (targetState === 'compact') {
        copilotCurrentState = 'compact';
        panel.classList.remove('copilot-state-fullscreen', 'copilot-state-medium');
        panel.classList.add('copilot-state-compact');
        if (expandBtn) expandBtn.style.display = 'none';
        panel.style.display = 'none';
        if (compactTrigger) compactTrigger.style.display = 'flex';
        if (splitContainer) {
          splitContainer.classList.remove('copilot-open');
          splitContainer.classList.add('copilot-minimized');
          splitContainer.style.gridTemplateColumns = '1fr';
        }
      }
    }

    function handleCopilotMinimizeClick() {
      if (copilotCurrentState === 'fullscreen') {
        setCopilotState('medium');
      } else if (copilotCurrentState === 'medium') {
        setCopilotState('compact');
      }
    }

    function handleCopilotExpandClick() {
      if (copilotCurrentState === 'fullscreen') {
        setCopilotState('medium');
      } else {
        setCopilotState('fullscreen');
      }
    }'''

    if re.search(old_js_pattern, content):
        content = re.sub(old_js_pattern, new_js, content, count=1)
        print("  -> Replaced Copilot JS logic successfully.")
    else:
        print("  -> Could not match old Copilot JS logic pattern directly.")

    # 5. Update login handler to open in medium (side-by-side) instead of fullscreen
    old_login_fullscreen = "setCopilotState('fullscreen');\n          showNotification"
    new_login_medium = "setCopilotState('medium');\n          showNotification"
    if old_login_fullscreen in content:
        content = content.replace(old_login_fullscreen, new_login_medium)
        print("  -> Updated login transition to open side-by-side (medium).")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  -> {filepath} saved successfully.")

for path in ['client/index.html', 'client/public/index.html', 'index.html']:
    if os.path.exists(path):
        patch_file(path)

# Also update styles.css files
def patch_styles(filepath):
    print(f"Patching styles in {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        css = f.read()

    old_split = """.joiner-split-container {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(360px, 3fr);
  gap: 28px;
  align-items: start;
  width: 100%;
  margin-top: 12px;
}

@media (max-width: 1180px) {
  .joiner-split-container {
    grid-template-columns: 1fr;
  }
}"""

    new_split = """.joiner-split-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  gap: 24px;
  align-items: start;
  width: 100%;
  margin-top: 12px;
  transition: grid-template-columns 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.joiner-split-container.copilot-minimized {
  grid-template-columns: minmax(0, 1fr) !important;
}

@media (max-width: 1024px) {
  .joiner-split-container {
    grid-template-columns: 1fr !important;
    gap: 20px;
  }
}"""

    if old_split in css:
        css = css.replace(old_split, new_split)
        print(f"  -> Replaced joiner-split-container in {filepath}.")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(css)

for path in ['styles.css', 'client/styles.css', 'client/public/styles.css']:
    if os.path.exists(path):
        patch_styles(path)

print("Patching complete!")
