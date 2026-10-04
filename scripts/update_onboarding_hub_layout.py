#!/usr/bin/env python3
import re
import shutil

print("=== Applying Layout & Copilot Enhancements to Onboarding Hub ===")

# =========================================================================
# 1. Update client/index.html
# =========================================================================
with open("client/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1a. In #step-joiner-chatbot header: remove "First-Week Maze Onboarding Copilot" title text
html = re.sub(
    r'<span class="copilot-title-text"[^>]*>\s*First-Week Maze Onboarding Copilot\s*</span>\s*',
    '',
    html
)
print("✓ Removed 'First-Week Maze Onboarding Copilot' title text from chatbot header.")

# 1b. In #copilot-persistent-panel: hide/remove Suggested Questions section
new_quick_prompts = """          <!-- Suggested FAQ Questions Bar (Hidden per user requirement) -->
          <div class="copilot-quick-prompts" style="display: none !important;">
            <div class="copilot-chips-scroll" id="copilot-chips-container" style="display: none !important;"></div>
          </div>"""

html = re.sub(
    r'<!-- Suggested FAQ Questions Bar \(Direct Shortcuts into Chatbot\) -->\s*<div class="copilot-quick-prompts">[\s\S]*?id="copilot-chips-container"[\s\S]*?</div>\s*</div>',
    new_quick_prompts,
    html
)
print("✓ Removed Suggested Questions section from Copilot panel.")

# 1c. In goBackStep(): ensure intelligent fallback for step-joiner-chatbot
old_goback_case = """        } else if (currentStepId === 'step-signin') {
          goToStep('step-departments', false);
        } else {"""

new_goback_case = """        } else if (currentStepId === 'step-signin') {
          goToStep('step-departments', false);
        } else if (currentStepId === 'step-joiner-chatbot') {
          goToStep('step-signin', false);
        } else {"""

if old_goback_case in html and "step-joiner-chatbot" not in html[html.find("function goBackStep()"):html.find("function goBackStep()") + 700]:
    html = html.replace(old_goback_case, new_goback_case)
    print("✓ Added fallback for step-joiner-chatbot in goBackStep().")

# 1d. Update embedded CSS in client/index.html
embedded_css_replacement = """    /* Split Container: Side-by-Side Zero-Overlap Grid Layout (Enlarged 3 Boxes + Enlarged Chatbot) */
    .joiner-split-container {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) 540px !important;
      gap: 36px !important;
      align-items: start !important;
      width: 100% !important;
      position: relative !important;
      margin-top: 14px !important;
      transition: grid-template-columns 320ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    @media (min-width: 1600px) {
      .joiner-split-container {
        grid-template-columns: minmax(0, 1fr) 580px !important;
        gap: 40px !important;
      }
    }

    @media (max-width: 1180px) {
      .joiner-split-container {
        grid-template-columns: 1fr !important;
        gap: 28px !important;
      }
    }

    /* Full width dashboard when Copilot is minimized */
    .joiner-split-container.copilot-minimized {
      grid-template-columns: minmax(0, 1fr) !important;
    }

    /* Left area: Adapts dynamically, preserving all tasks, checklist, contacts, and telemetry */
    .joiner-main-dashboard {
      grid-column: 1 !important;
      min-width: 0 !important;
      width: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 34px !important;
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
      display: none !important;
    }

    #copilot-persistent-panel.copilot-state-fullscreen .copilot-composer {
      max-width: 1080px;
      width: 100%;
      margin: 0 auto;
      padding: 12px 36px 28px 36px;
      flex-shrink: 0;
    }

    /* STATE 2: SIDE-BY-SIDE DOCKED COPILOT PANEL (Enlarged 540px-580px Width & Increased Length, Zero Overlap) */
    #copilot-persistent-panel.copilot-state-medium {
      grid-column: 2 !important;
      position: sticky !important;
      top: 20px !important;
      bottom: auto !important;
      right: auto !important;
      left: auto !important;
      width: 100% !important;
      max-width: 540px !important;
      height: calc(100vh - 40px) !important;
      max-height: calc(100vh - 40px) !important;
      min-height: 840px !important;
      z-index: 20 !important;
      border-radius: 24px !important;
      border: 1px solid rgba(148, 163, 184, 0.25) !important;
      background: #0f172a !important;
      box-shadow: 0 24px 50px -10px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      transform: none !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }

    @media (min-width: 1600px) {
      #copilot-persistent-panel.copilot-state-medium {
        max-width: 580px !important;
      }
    }

    @media (max-width: 1180px) {
      #copilot-persistent-panel.copilot-state-medium {
        grid-column: 1 !important;
        position: relative !important;
        top: auto !important;
        width: 100% !important;
        max-width: 100% !important;
        height: 680px !important;
        min-height: 600px !important;
      }
    }

    #copilot-persistent-panel.copilot-state-medium .copilot-sidebar-header {
      padding: 18px 24px;
      background: #0d1322;
      border-bottom: 1px solid rgba(148, 163, 184, 0.15);
      flex-shrink: 0;
    }

    #copilot-persistent-panel.copilot-state-medium .copilot-messages-feed {
      width: 100%;
      flex: 1 1 auto;
      min-height: 520px;
      padding: 24px 26px;
      overflow-y: auto;
    }

    #copilot-persistent-panel.copilot-state-medium .copilot-quick-prompts {
      display: none !important;
    }

    #copilot-persistent-panel.copilot-state-medium .copilot-composer {
      width: 100%;
      padding: 14px 22px 22px 22px;
      flex-shrink: 0;
      background: #0d1322;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Extra sizing for the 3 Dashboard Boxes */
    .dashboard-hero-card {
      padding: 48px 56px !important;
      min-height: 260px !important;
      border-radius: 24px !important;
    }
    .hero-welcome-title {
      font-size: 2.5rem !important;
    }
    .hero-welcome-subtitle {
      font-size: 1.1rem !important;
    }
    .hero-meta-chip {
      padding: 10px 18px !important;
      font-size: 0.9rem !important;
      border-radius: 10px !important;
    }
    .hero-card-progress {
      padding: 28px 34px !important;
      min-width: 260px !important;
      border-radius: 20px !important;
    }
    #section-contacts-directory.dashboard-section-card,
    #section-tasks-checklist.dashboard-section-card {
      padding: 44px 50px !important;
      border-radius: 24px !important;
      margin-bottom: 34px !important;
    }
    .manual-task-card {
      padding: 22px 26px !important;
      border-radius: 16px !important;
      margin-bottom: 14px !important;
    }"""

# Replace the block in client/index.html
html = re.sub(
    r'/\* =========================================================================\s*PERSISTENT COPILOT: SIDE-BY-SIDE DYNAMIC LAYOUT[\s\S]*?/\* STATE 3: COMPACT BOTTOM-RIGHT COPILOT',
    f'/* =========================================================================\n       PERSISTENT COPILOT: SIDE-BY-SIDE DYNAMIC LAYOUT\n       ========================================================================= */\n\n{embedded_css_replacement}\n\n    /* STATE 3: COMPACT BOTTOM-RIGHT COPILOT',
    html
)

with open("client/index.html", "w", encoding="utf-8") as f:
    f.write(html)
print("✓ Saved client/index.html")


# =========================================================================
# 2. Update client/styles.css
# =========================================================================
with open("client/styles.css", "r", encoding="utf-8") as f:
    css = f.read()

# 2a. Update .joiner-split-container
css = re.sub(
    r'\.joiner-split-container\s*\{[^}]*grid-template-columns:[^;]*;[^}]*\}',
    """.joiner-split-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 540px;
  gap: 36px;
  align-items: start;
  width: 100%;
  margin-top: 16px;
  transition: grid-template-columns 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}""",
    css
)

# 2b. Update media queries for min-width: 1600px
css = re.sub(
    r'@media\s*\(min-width:\s*1600px\)\s*\{\s*\.joiner-split-container\s*\{[^}]*\}\s*\}',
    """@media (min-width: 1600px) {
  .joiner-split-container {
    grid-template-columns: minmax(0, 1fr) 580px;
    gap: 40px;
  }
}""",
    css
)

# 2c. Update .dashboard-hero-card
css = re.sub(
    r'\.dashboard-hero-card\s*\{[^}]*\}',
    """.dashboard-hero-card {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  border: 1px solid rgba(99, 102, 241, 0.28);
  border-radius: 24px;
  padding: 48px 56px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 38px;
  min-height: 260px;
  box-shadow: 0 24px 45px -10px rgba(15, 23, 42, 0.5), 0 0 32px rgba(99, 102, 241, 0.2);
  position: relative;
  overflow: hidden;
}""",
    css
)

# 2d. Update .dashboard-section-card
css = re.sub(
    r'\.dashboard-section-card\s*\{[^}]*\}',
    """.dashboard-section-card {
  background: #ffffff;
  border: 1px solid var(--color-slate-200);
  border-radius: 24px;
  padding: 44px 50px;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06), 0 1px 4px rgba(15, 23, 42, 0.04);
  position: relative;
  margin-bottom: 34px;
  transition: all var(--transition-normal);
}""",
    css
)

# 2e. Update .joiner-chat-panel
css = re.sub(
    r'\.joiner-chat-panel\s*\{[^}]*\}',
    """.joiner-chat-panel {
  position: sticky;
  top: 20px;
  height: calc(100vh - 40px);
  min-height: 840px;
  background: #0f172a;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 24px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.45), 0 0 30px rgba(99, 102, 241, 0.16);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 20;
}""",
    css
)

# 2f. Hide .copilot-quick-prompts in styles.css
css = re.sub(
    r'\.copilot-quick-prompts\s*\{[^}]*\}',
    """.copilot-quick-prompts {
  display: none !important;
}""",
    css
)

# 2g. Update .manual-task-card
css = re.sub(
    r'\.manual-task-card\s*\{[^}]*\}',
    """.manual-task-card {
  border: 1px solid var(--color-slate-200);
  background: #ffffff;
  border-radius: 16px;
  padding: 22px 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 14px;
  transition: all var(--transition-fast);
}""",
    css
)

with open("client/styles.css", "w", encoding="utf-8") as f:
    f.write(css)
print("✓ Saved client/styles.css")


# =========================================================================
# 3. Synchronize to public and root files
# =========================================================================
shutil.copy("client/index.html", "client/public/index.html")
shutil.copy("client/index.html", "index.html")
print("✓ Synchronized client/index.html -> client/public/index.html and index.html")

shutil.copy("client/styles.css", "client/public/styles.css")
shutil.copy("client/styles.css", "styles.css")
print("✓ Synchronized client/styles.css -> client/public/styles.css and styles.css")

print("\nAll Onboarding Hub layout updates successfully applied!")
