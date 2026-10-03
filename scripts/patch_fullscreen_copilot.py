import sys
import io
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("Reading client/index.html...")
with open('client/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# 1. Add Copilot 3-State CSS into <style> tag
copilot_css = '''
    /* =========================================================================
       PERSISTENT COPILOT: 3-STATE SYSTEM (FULLSCREEN, MEDIUM, COMPACT)
       ========================================================================= */

    /* Panel base with smooth rolling / morphing transition */
    #copilot-persistent-panel {
      transition: all 420ms cubic-bezier(0.16, 1, 0.3, 1), 
                  transform 420ms cubic-bezier(0.16, 1, 0.3, 1), 
                  border-radius 420ms cubic-bezier(0.16, 1, 0.3, 1), 
                  opacity 300ms ease;
      will-change: transform, width, height, top, left, right, bottom, border-radius, opacity;
      box-sizing: border-box;
    }

    #copilot-persistent-panel.copilot-rolling-morph {
      transform: scale(0.97) rotate(-1.5deg) translateY(6px) !important;
    }

    /* STATE 1: FULL SCREEN (100% of Viewport) */
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
    }

    #copilot-persistent-panel.copilot-state-fullscreen .copilot-composer {
      max-width: 1080px;
      width: 100%;
      margin: 0 auto;
      padding: 12px 36px 28px 36px;
    }

    /* STATE 2: MEDIUM FLOATING COPILOT (30–40% Viewport) */
    #copilot-persistent-panel.copilot-state-medium {
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      top: auto !important;
      left: auto !important;
      width: min(460px, calc(100vw - 32px)) !important;
      height: min(720px, calc(100vh - 48px)) !important;
      z-index: 99990 !important;
      border-radius: 20px !important;
      border: 1px solid rgba(148, 163, 184, 0.25) !important;
      background: #0f172a !important;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      transform: scale(1) rotate(0deg) !important;
      opacity: 1 !important;
    }

    #copilot-persistent-panel.copilot-state-medium .copilot-sidebar-header {
      padding: 14px 18px;
    }

    #copilot-persistent-panel.copilot-state-medium .copilot-messages-feed {
      width: 100%;
      flex: 1;
      padding: 16px 18px;
      overflow-y: auto;
    }

    #copilot-persistent-panel.copilot-state-medium .copilot-quick-prompts {
      width: 100%;
      padding: 0 16px 8px 16px;
    }

    #copilot-persistent-panel.copilot-state-medium .copilot-composer {
      width: 100%;
      padding: 10px 16px 16px 16px;
    }

    /* STATE 3: COMPACT BOTTOM-RIGHT COPILOT (Panel hidden, Pill trigger shown) */
    #copilot-persistent-panel.copilot-state-compact {
      transform: scale(0.2) translate(100%, 100%) !important;
      opacity: 0 !important;
      pointer-events: none !important;
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      width: 440px !important;
      height: 600px !important;
      z-index: 99990 !important;
    }

    /* Compact Pill Trigger Badge */
    #copilot-compact-trigger {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99990;
      background: #0f172a;
      border: 1px solid rgba(148, 163, 184, 0.35);
      border-radius: 9999px;
      padding: 10px 20px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08);
      cursor: pointer;
      display: none;
      align-items: center;
      gap: 12px;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
      user-select: none;
    }

    #copilot-compact-trigger:hover {
      transform: translateY(-2px) scale(1.02);
      border-color: rgba(56, 189, 248, 0.6);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6), 0 0 18px rgba(56, 189, 248, 0.2);
    }

    #copilot-compact-trigger .compact-copilot-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: #ffffff;
      border: 1px solid rgba(148, 163, 184, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3px;
      position: relative;
      flex-shrink: 0;
    }

    #copilot-compact-trigger .compact-copilot-icon img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    #copilot-compact-trigger .compact-copilot-dot {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #10b981;
      border: 2px solid #0f172a;
    }

    #copilot-compact-trigger .compact-copilot-text {
      display: flex;
      flex-direction: column;
    }

    #copilot-compact-trigger .compact-copilot-title {
      font-size: 0.86rem;
      font-weight: 800;
      color: #f8fafc;
      line-height: 1.2;
    }

    #copilot-compact-trigger .compact-copilot-sub {
      font-size: 0.72rem;
      font-weight: 500;
      color: #94a3b8;
      line-height: 1.2;
    }

    /* Copilot Window Controls */
    .copilot-ctrl-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.16);
      color: #cbd5e1;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
    }

    .copilot-ctrl-btn:hover {
      background: rgba(255, 255, 255, 0.18);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.35);
      transform: translateY(-1px);
    }

    /* Full-Screen Loading Overlay after Login */
    #copilot-login-loading-overlay {
      position: fixed;
      inset: 0;
      z-index: 100001;
      background: #090d16;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      transition: opacity 0.35s ease;
    }
'''

if '/* PERSISTENT COPILOT: 3-STATE SYSTEM' not in html:
    html = html.replace('</style>', copilot_css + '\n  </style>', 1)
    print("[OK] Inserted Copilot 3-State CSS into <style>")

with open('client/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("[OK] Saved client/index.html")
