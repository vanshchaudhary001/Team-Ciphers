const fs = require('fs');
const path = require('path');

function updateFiles(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace the team card rendering in renderSubDepartmentsList to NOT disclose Associate, Lead, Manager on this page
  const oldTeamCardRegex = /<div class="team-item-card"[\s\S]*?<\/div>\s*<\/div>\s*`;\s*\}\)\.join\(''\)\}/;
  
  const newTeamCardContent = `<div class="team-item-card" onclick="selectTeam('\${escapeHtml(branch.name)}', '\${escapeHtml(item.subBranchName)}', '\${escapeHtml(team.name)}')">
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">
                      <div>
                        <div class="team-item-name">\${team.name}</div>
                        <div class="team-item-subbranch">\${item.subBranchName !== team.name ? item.subBranchName : branch.name}</div>
                      </div>
                      <div class="team-icon-circle" style="width: 34px; height: 34px; border-radius: 8px; background: #eff4ff; display: flex; align-items: center; justify-content: center; color: #0037b0; flex-shrink: 0;">
                        <span class="material-symbols-outlined" style="font-size: 18px;">groups</span>
                      </div>
                    </div>
                    <div class="team-card-action-footer" style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 0.8rem; font-weight: 700; color: #0037b0;">
                      <span>Select Team &amp; View Roles</span>
                      <span class="material-symbols-outlined" style="font-size: 16px;">arrow_forward</span>
                    </div>
                  </div>
                \`;
              }).join('')}`;

  content = content.replace(oldTeamCardRegex, newTeamCardContent);

  // 2. Ensure step-subdepartments and step-roles have top padding so they aren't hidden behind the sticky header
  content = content.replace(
    'id="step-subdepartments" class="step-view" style="display: none; max-width: 1200px; margin: 0 auto; width: 100%;"',
    'id="step-subdepartments" class="step-view" style="display: none; max-width: 1200px; margin: 24px auto; padding-top: 12px; width: 100%;"'
  );
  content = content.replace(
    'id="step-roles" class="step-view" style="display: none; max-width: 1200px; margin: 0 auto; width: 100%;"',
    'id="step-roles" class="step-view" style="display: none; max-width: 1200px; margin: 24px auto; padding-top: 12px; width: 100%;"'
  );
  content = content.replace(
    'id="step-departments" class="step-view" style="display: none; max-width: 1200px; margin: 0 auto; width: 100%;"',
    'id="step-departments" class="step-view" style="display: none; max-width: 1200px; margin: 24px auto; padding-top: 12px; width: 100%;"'
  );

  // 3. Make sure window.scrollTo in goToStep always resets to top smoothly
  content = content.replace(
    'window.scrollTo({ top: 0, behavior: \'smooth\' });',
    'window.scrollTo(0, 0);'
  );

  fs.writeFileSync(filePath, content, 'utf8');

  // Verify syntax
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  let blockIndex = 0;
  let allValid = true;
  while ((m = scriptRegex.exec(content)) !== null) {
    blockIndex++;
    const code = m[1];
    if (!code.trim()) continue;
    try {
      new Function(code);
      console.log(`[${path.basename(filePath)}] Script block ${blockIndex}: VALID (${code.length} chars)`);
    } catch (e) {
      console.error(`[${path.basename(filePath)}] ERROR in script block ${blockIndex}:`, e.message);
      allValid = false;
    }
  }

  return allValid;
}

const rootOk = updateFiles(path.join(__dirname, '../index.html'));
const clientOk = updateFiles(path.join(__dirname, '../client/index.html'));
const publicOk = updateFiles(path.join(__dirname, '../client/public/index.html'));

console.log('Update results:', { rootOk, clientOk, publicOk });
