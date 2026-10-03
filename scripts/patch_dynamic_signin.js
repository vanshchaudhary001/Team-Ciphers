const fs = require('fs');
const path = require('path');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Update selectRoleLevel to dynamically replace persona pills with the selected team's positions
  const oldSelectRoleLevelRegex = /function selectRoleLevel\(roleLevel, posId\) \{[\s\S]*?goToStep\('step-signin'\);\s*\}/;

  const newSelectRoleLevelCode = `function selectRoleLevel(roleLevel, posId) {
      if (!currentSelectedTeam) return;
      const pos = currentSelectedTeam.positions.find(p => p.id === posId || p.roleLevel === roleLevel);
      if (!pos) return;

      currentSelectedPosition = pos;
      const comp = companiesDatabase[currentSelectedCompany] || companiesDatabase.microsoft;
      const domain = comp.domain ? comp.domain.replace('@', '') : 'microsoft.in';
      const cleanTitle = pos.title.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\\.|\\.$/g, '');
      const fullEmail = \`aarav.\${cleanTitle}@\${domain}\`;

      // Update Target Position Confirmation Banner on Sign-in page
      const banner = document.getElementById('signin-target-position-banner');
      if (banner) {
        banner.style.display = 'flex';
        const titleEl = document.getElementById('signin-target-position-title');
        if (titleEl) titleEl.textContent = \`🎯 Selected Position: \${pos.fullTitle || (pos.roleLevel + ' - ' + pos.title)}\`;
        const pathEl = document.getElementById('signin-target-hierarchy-path');
        if (pathEl) pathEl.textContent = \`Hierarchy: \${comp.name} > \${currentSelectedDept.name} > \${currentSelectedTeam.name} > \${pos.roleLevel}\`;
      }

      // Update Sign In Header & Tenant Badge
      const breadcrumb = document.getElementById('signin-breadcrumb-company');
      if (breadcrumb) breadcrumb.textContent = comp.name;
      const pill = document.getElementById('signin-company-pill');
      if (pill) pill.textContent = comp.fullName;
      const title = document.getElementById('signin-company-title');
      if (title) title.textContent = comp.name;
      const tenantBadge = document.getElementById('signin-tenant-badge-name');
      if (tenantBadge) tenantBadge.textContent = comp.fullName;
      const tenantId = document.getElementById('signin-tenant-id');
      if (tenantId) tenantId.textContent = \`Tenant ID: \${currentSelectedCompany}-corp-\${currentSelectedCompany === 'microsoft' ? 'in-prod' : 'us-prod'}\`;
      const ssoBtn = document.getElementById('signin-sso-btn-text');
      if (ssoBtn) ssoBtn.textContent = \`Continue with \${comp.name} SSO\`;
      const submitBtn = document.getElementById('signin-btn-text');
      if (submitBtn) submitBtn.textContent = \`Sign In as \${pos.roleLevel} (\${pos.title})\`;

      // Update Logo
      const logoBox = document.getElementById('tenant-logo-container');
      if (logoBox) {
        logoBox.innerHTML = companyLogosSvg[currentSelectedCompany] || companyLogosSvg.microsoft;
      }

      // Pre-fill email specifically with the chosen position & department
      const emailInput = document.getElementById('signin-email');
      const passwordInput = document.getElementById('signin-password');
      if (emailInput) {
        emailInput.value = fullEmail;
        emailInput.placeholder = fullEmail;
      }
      if (passwordInput) {
        passwordInput.value = 'demo1234';
      }

      // Dynamically replace the dummy personas with the selected team's positions
      const personaSection = document.getElementById('microsoft-persona-section');
      if (personaSection) {
        personaSection.style.display = 'block';
        const teamPositions = currentSelectedTeam.positions;
        const assocPos = teamPositions.find(p => p.roleLevel === 'Associate') || pos;
        const leadPos = teamPositions.find(p => p.roleLevel === 'Lead');
        const mgrPos = teamPositions.find(p => p.roleLevel === 'Manager');

        const assocEmail = \`aarav.\${assocPos.title.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\\.|\\.$/g, '')}@\${domain}\`;
        const leadEmail = leadPos ? \`priya.\${leadPos.title.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\\.|\\.$/g, '')}@\${domain}\` : '';
        const mgrEmail = mgrPos ? \`rahul.\${mgrPos.title.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\\.|\\.$/g, '')}@\${domain}\` : '';

        let pillsHtml = \`
          <div class="persona-section-label" style="font-weight: 800; color: #0f172a; margin-bottom: 8px;">
            ⚡ 1-Click Credentials for \${currentSelectedTeam.name} (\${currentSelectedDept.name}):
          </div>
          <div class="persona-quick-pills">
            <button type="button" class="persona-pill-btn" style="\${pos.roleLevel === 'Associate' ? 'border: 2px solid #2563eb; background: #eff6ff; font-weight: 800;' : ''}"
              onclick="fillPersona('\${assocEmail}', 'demo1234')">
              🟢 Aarav Sharma (\${assocPos.fullTitle} · \${assocPos.id})
            </button>
        \`;

        if (leadPos) {
          pillsHtml += \`
            <button type="button" class="persona-pill-btn" style="\${pos.roleLevel === 'Lead' ? 'border: 2px solid #7c3aed; background: #f5f3ff; font-weight: 800;' : ''}"
              onclick="fillPersona('\${leadEmail}', 'demo1234')">
              🟣 Priya Nair (\${leadPos.fullTitle} · \${leadPos.id})
            </button>
          \`;
        }

        if (mgrPos) {
          pillsHtml += \`
            <button type="button" class="persona-pill-btn" style="\${pos.roleLevel === 'Manager' ? 'border: 2px solid #d97706; background: #fffbeb; font-weight: 800;' : ''}"
              onclick="fillPersona('\${mgrEmail}', 'demo1234')">
              🔵 Rahul Kapoor (\${mgrPos.fullTitle} · \${mgrPos.id})
            </button>
          \`;
        }

        pillsHtml += \`
            <button type="button" class="persona-pill-btn" onclick="fillPersona('hr@\${domain}', 'demo1234')">
              👤 Priya Sharma (HR People Partner)
            </button>
            <button type="button" class="persona-pill-btn" onclick="fillPersona('buddy@\${domain}', 'demo1234')">
              🤝 Rahul Pandey (Assigned Buddy Mentor)
            </button>
          </div>
        \`;
        personaSection.innerHTML = pillsHtml;
      }

      handleEmailInput(fullEmail);

      showNotification(\`Selected: \${pos.fullTitle}\`);
      goToStep('step-signin');
    }`;

  content = content.replace(oldSelectRoleLevelRegex, newSelectRoleLevelCode);

  // 2. Update detectRoleFromEmail to prioritize currentSelectedPosition
  const oldDetectRoleRegex = /function detectRoleFromEmail\(email\) \{[\s\S]*?const em = email\.toLowerCase\(\)\.trim\(\);/;

  const newDetectRoleCode = `function detectRoleFromEmail(email) {
      const em = email.toLowerCase().trim();

      // If user came through the 18 departments wizard, detect their selected position
      if (currentSelectedPosition && currentSelectedDept && currentSelectedTeam) {
        if (!em.includes('hr') && !em.includes('buddy') && !em.includes('admin')) {
          const rawAlias = em.split('@')[0] || 'aarav';
          const formattedName = rawAlias.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Aarav Sharma';
          return {
            role: 'joiner',
            user: {
              name: formattedName,
              title: currentSelectedPosition.title,
              fullTitle: currentSelectedPosition.fullTitle,
              roleLevel: currentSelectedPosition.roleLevel,
              department: currentSelectedDept.name,
              team: currentSelectedTeam.name,
              email: email,
              employeeId: 'MSFT-' + currentSelectedPosition.id
            },
            employeeId: 'MSFT-' + currentSelectedPosition.id,
            title: currentSelectedPosition.fullTitle || (currentSelectedPosition.roleLevel + ' - ' + currentSelectedPosition.title),
            desc: \`Identified: \${formattedName} (\${currentSelectedPosition.fullTitle}) · \${currentSelectedDept.name} (\${currentSelectedTeam.name})\`
          };
        }
      }`;

  content = content.replace(oldDetectRoleRegex, newDetectRoleCode);

  // 3. Update handleMemberSignIn to properly route to customized dashboard
  const oldHandleSignInRegex = /async function handleMemberSignIn\(\) \{[\s\S]*?if \(!email\) \{/;

  const newHandleSignInCode = `async function handleMemberSignIn() {
      const emailInput = document.getElementById('signin-email');
      const passwordInput = document.getElementById('signin-password');
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (currentSelectedPosition && currentSelectedDept && currentSelectedTeam && email) {
        const rawAlias = email.split('@')[0] || 'aarav';
        const formattedName = rawAlias.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Aarav Sharma';

        const synthesized = {
          employee: {
            employeeId: 'MSFT-' + (currentSelectedPosition.id || 'E001'),
            name: formattedName,
            email: email,
            role: currentSelectedPosition.title,
            fullTitle: currentSelectedPosition.fullTitle,
            roleLevel: currentSelectedPosition.roleLevel,
            department: currentSelectedDept.name,
            team: currentSelectedTeam.name,
            branch: currentSelectedBranch ? currentSelectedBranch.name : currentSelectedDept.name,
            location: 'Microsoft Corporate Campus',
            startDate: '2026-10-04',
            status: 'Active',
            buddyName: 'Rahul Pandey (Assigned Senior Mentor)',
            buddyEmail: 'rahul.pandey@microsoft.in',
            hrName: 'Priya Sharma (HR Operations Lead)',
            hrEmail: 'priya.sharma@microsoft.in'
          },
          metrics: {
            totalTasks: 5,
            completedTasks: 1,
            pendingTasks: 4,
            percentage: 20
          },
          tasks: [
            {
              id: 1,
              title: \`Day 1 Welcome & \${currentSelectedDept.name} Department Orientation\`,
              desc: \`Complete the official department orientation for \${currentSelectedTeam.name} and review your responsibilities as \${currentSelectedPosition.fullTitle}.\`,
              day: 'Day 1',
              category: currentSelectedDept.name,
              priority: 'High',
              done: true
            },
            {
              id: 2,
              title: \`Workspace & Tooling Configuration for \${currentSelectedPosition.title}\`,
              desc: \`Set up your corporate access credentials, security tokens, and workflow tooling for \${currentSelectedTeam.name}.\`,
              day: 'Day 1',
              category: 'Setup',
              priority: 'High',
              done: false
            },
            {
              id: 3,
              title: \`1:1 Mentorship Kickoff with Senior Team Buddy\`,
              desc: \`Connect with your assigned mentor for team overview, sprint cadence, and \${currentSelectedPosition.roleLevel} role expectations.\`,
              day: 'Day 1',
              category: 'Mentoring',
              priority: 'Medium',
              done: false
            },
            {
              id: 4,
              title: \`Complete Confidential Information & Compliance Certification\`,
              desc: \`Review Microsoft confidential information protection rules and complete compliance module for \${currentSelectedDept.name}.\`,
              day: 'Day 2',
              category: 'Security',
              priority: 'High',
              done: false
            },
            {
              id: 5,
              title: \`Sprint Backlog & First Deliverables Review in \${currentSelectedTeam.name}\`,
              desc: \`Review your squad roadmap and pick up your first starter assignment as \${currentSelectedPosition.fullTitle}.\`,
              day: 'Day 3',
              category: currentSelectedDept.name,
              priority: 'Medium',
              done: false
            }
          ]
        };

        currentLiveDashboard = synthesized;
        currentLiveEmployeeId = synthesized.employee.employeeId;
        liveTasksList = synthesized.tasks;
        renderManualDashboardFromLive(synthesized);
        initJoinerChatbot(synthesized.employee);
        goToStep('step-joiner-chatbot');
        showNotification(\`Welcome to Microsoft, \${formattedName}! Loaded workspace for \${currentSelectedPosition.fullTitle}.\`);
        return;
      }

      if (!email) {`;

  content = content.replace(oldHandleSignInRegex, newHandleSignInCode);

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
      console.error(`[${path.basename(filePath)}] SYNTAX ERROR in script block ${blockIndex}:`, e.message);
      allValid = false;
    }
  }

  return allValid;
}

const r1 = patchFile(path.join(__dirname, '../client/index.html'));
const r2 = patchFile(path.join(__dirname, '../index.html'));
const r3 = patchFile(path.join(__dirname, '../client/public/index.html'));

console.log('Patch results:', { client: r1, root: r2, public: r3 });
