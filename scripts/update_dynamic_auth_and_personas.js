const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '../client/index.html'),
  path.join(__dirname, '../index.html'),
  path.join(__dirname, '../client/public/index.html')
];

function updateFile(filePath) {
  console.log(`\nProcessing: ${path.basename(filePath)}`);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace static dummy persona section in HTML
  const oldPersonaSectionRegex = /<!-- 1-Click Quick Select Persona Chips[\s\S]*?id="microsoft-persona-section"[\s\S]*?<\/div>\s*<\/div>/;
  const newPersonaSectionHtml = `<!-- 1-Click Quick Select Persona Chips (Dynamic by Selected Department & Position) -->
        <div id="microsoft-persona-section" class="persona-section-box">
          <div class="persona-section-label" id="persona-section-header-label">
            ⚡ 1-Click Credentials for Selected Team & Role:
          </div>
          <div class="persona-quick-pills" id="persona-quick-pills-container">
            <button type="button" class="persona-pill-btn" style="border: 2px solid #2563eb; background: #eff6ff; font-weight: 800;"
              onclick="applyPersonaCredential('aarav.executive.assistant@microsoft.in', 'demo1234', 'POS-0001')">
              🟢 Aarav Sharma (Associate - Executive Assistant · POS-0001)
            </button>
            <button type="button" class="persona-pill-btn"
              onclick="applyPersonaCredential('priya.senior.executive.assistant@microsoft.in', 'demo1234', 'POS-0002')">
              🟣 Priya Nair (Lead - Senior Executive Assistant · POS-0002)
            </button>
            <button type="button" class="persona-pill-btn"
              onclick="applyPersonaCredential('rahul.executive.business.partner@microsoft.in', 'demo1234', 'POS-0003')">
              🔵 Rahul Kapoor (Manager - Executive Business Partner · POS-0003)
            </button>
            <button type="button" class="persona-pill-btn" onclick="applyPersonaCredential('hr@microsoft.in', 'demo1234', null, 'hr')">
              👤 Priya Sharma (HR People Partner · Administration)
            </button>
            <button type="button" class="persona-pill-btn" onclick="applyPersonaCredential('buddy@microsoft.in', 'demo1234', null, 'buddy')">
              🤝 Rahul Pandey (Assigned Buddy Mentor)
            </button>
          </div>
        </div>`;

  if (oldPersonaSectionRegex.test(content)) {
    content = content.replace(oldPersonaSectionRegex, newPersonaSectionHtml);
    console.log('   ✓ Replaced static persona HTML section');
  } else {
    console.log('   ! Static persona regex did not match, checking if already updated...');
  }

  // Also ensure default value in signin email input isn't rohan.sharma
  content = content.replace('value="rohan.sharma2026@microsoft.in"', 'value="aarav.executive.assistant@microsoft.in"');
  content = content.replace('value="rohan.executive.assis@microsoft.in"', 'value="aarav.executive.assistant@microsoft.in"');

  // Replace default detected role badge description
  content = content.replace(
    'Identified: Rohan Sharma (Software Engineer) · Routes to 70/30 Onboarding Workspace & AI Copilot',
    'Identified: Aarav Sharma (Executive Assistant · Administration) · Routes to 70/30 Onboarding Workspace & AI Copilot'
  );
  content = content.replace(
    'Detected Role: New Joiner',
    'Detected Role: Associate - Executive Assistant'
  );

  // 2. Replace selectRoleLevel with robust dynamic rendering
  const oldSelectRoleLevelRegex = /function selectRoleLevel\(roleLevel, posId\) \{[\s\S]*?goToStep\('step-signin'\);\s*\}/;

  const newSelectRoleLevelCode = `function selectRoleLevel(roleLevel, posId) {
      if (!currentSelectedTeam) return;
      const pos = currentSelectedTeam.positions.find(p => p.id === posId || p.roleLevel === roleLevel);
      if (!pos) return;

      currentSelectedPosition = pos;
      const comp = companiesDatabase[currentSelectedCompany] || companiesDatabase.microsoft;
      const domain = comp.domain ? comp.domain.replace('@', '') : 'microsoft.in';
      const cleanTitle = pos.title.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\\.|\\.$/g, '');
      const firstName = pos.roleLevel === 'Lead' ? 'priya' : (pos.roleLevel === 'Manager' ? 'rahul' : 'aarav');
      const fullEmail = \`\${firstName}.\${cleanTitle}@\${domain}\`;

      // 1. Update Target Position Confirmation Banner on Sign-in page
      const banner = document.getElementById('signin-target-position-banner');
      if (banner) {
        banner.style.display = 'flex';
        const titleEl = document.getElementById('signin-target-position-title');
        if (titleEl) titleEl.textContent = \`🎯 Selected Position: \${pos.fullTitle || (pos.roleLevel + ' - ' + pos.title)}\`;
        const pathEl = document.getElementById('signin-target-hierarchy-path');
        const branchName = currentSelectedBranch ? currentSelectedBranch.name : (currentSelectedDept ? currentSelectedDept.name : '');
        if (pathEl) pathEl.textContent = \`Hierarchy: \${comp.name} > \${currentSelectedDept.name} > \${branchName} > \${currentSelectedTeam.name} > \${pos.roleLevel}\`;
      }

      // 2. Update Sign In Header & Tenant Badges
      const breadcrumb = document.getElementById('signin-breadcrumb-company');
      if (breadcrumb) breadcrumb.textContent = comp.name;
      const pill = document.getElementById('signin-company-pill');
      if (pill) pill.textContent = comp.fullName;
      const title = document.getElementById('signin-company-title');
      if (title) title.textContent = comp.name;
      const tenantBadge = document.getElementById('signin-tenant-badge-name');
      if (tenantBadge) tenantBadge.textContent = comp.fullName;
      const tenantId = document.getElementById('signin-tenant-id');
      if (tenantId) tenantId.textContent = \`Tenant ID: \${currentSelectedCompany}-corp-in-prod\`;
      const ssoBtn = document.getElementById('signin-sso-btn-text');
      if (ssoBtn) ssoBtn.textContent = \`Continue with \${comp.name} SSO\`;
      const submitBtn = document.getElementById('signin-btn-text');
      if (submitBtn) submitBtn.textContent = \`Sign In as \${pos.roleLevel} (\${pos.title})\`;

      // 3. Update Logo
      const logoBox = document.getElementById('tenant-logo-container');
      if (logoBox) {
        logoBox.innerHTML = companyLogosSvg[currentSelectedCompany] || companyLogosSvg.microsoft;
      }

      // 4. Pre-fill email and password
      const emailInput = document.getElementById('signin-email');
      const passwordInput = document.getElementById('signin-password');
      if (emailInput) {
        emailInput.value = fullEmail;
        emailInput.placeholder = fullEmail;
      }
      if (passwordInput) {
        passwordInput.value = 'demo1234';
      }

      // 5. Update Detected Role Badge
      const badge = document.getElementById('signin-detected-badge');
      const detTitle = document.getElementById('detected-role-title');
      const detDesc = document.getElementById('detected-role-desc');
      const formattedName = firstName.charAt(0).toUpperCase() + firstName.slice(1) + (firstName === 'priya' ? ' Nair' : (firstName === 'rahul' ? ' Kapoor' : ' Sharma'));
      
      if (badge) badge.className = 'role-detect-badge joiner';
      if (detTitle) detTitle.textContent = \`Detected Role: \${pos.roleLevel} - \${pos.title}\`;
      if (detDesc) detDesc.textContent = \`Identified: \${formattedName} (\${pos.fullTitle}) · \${currentSelectedDept.name} (\${currentSelectedTeam.name}) · Routes to 70/30 Workspace\`;

      // 6. Dynamically render 1-click test credentials for this exact team
      renderDynamicSigninPersonas(pos, domain);

      showNotification(\`Selected: \${pos.fullTitle}\`);
      goToStep('step-signin');
    }`;

  if (oldSelectRoleLevelRegex.test(content)) {
    content = content.replace(oldSelectRoleLevelRegex, newSelectRoleLevelCode);
    console.log('   ✓ Replaced selectRoleLevel');
  } else {
    console.log('   ! selectRoleLevel regex did not match');
  }

  // 3. Add helper renderDynamicSigninPersonas and applyPersonaCredential
  const helperFunctionsCode = `
    // Helper to dynamically render test persona credentials matching selected team
    function renderDynamicSigninPersonas(selectedPos, domain) {
      const personaSection = document.getElementById('microsoft-persona-section');
      if (!personaSection || !currentSelectedTeam) return;

      personaSection.style.display = 'block';
      const teamPositions = currentSelectedTeam.positions;
      const assocPos = teamPositions.find(p => p.roleLevel === 'Associate') || selectedPos;
      const leadPos = teamPositions.find(p => p.roleLevel === 'Lead');
      const mgrPos = teamPositions.find(p => p.roleLevel === 'Manager');

      const assocTitleClean = assocPos.title.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\\.|\\.$/g, '');
      const assocEmail = \`aarav.\${assocTitleClean}@\${domain}\`;

      let leadEmail = '';
      if (leadPos) {
        const leadTitleClean = leadPos.title.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\\.|\\.$/g, '');
        leadEmail = \`priya.\${leadTitleClean}@\${domain}\`;
      }

      let mgrEmail = '';
      if (mgrPos) {
        const mgrTitleClean = mgrPos.title.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\\.|\\.$/g, '');
        mgrEmail = \`rahul.\${mgrTitleClean}@\${domain}\`;
      }

      let pillsHtml = \`
        <div class="persona-section-label" style="font-weight: 800; color: #0f172a; margin-bottom: 8px;">
          ⚡ 1-Click Credentials for \${escapeHtml(currentSelectedTeam.name)} (\${escapeHtml(currentSelectedDept.name)}):
        </div>
        <div class="persona-quick-pills">
          <button type="button" class="persona-pill-btn" style="\${selectedPos.roleLevel === 'Associate' ? 'border: 2px solid #2563eb; background: #eff6ff; font-weight: 800;' : ''}"
            onclick="applyPersonaCredential('\${assocEmail}', 'demo1234', '\${assocPos.id}')">
            🟢 Aarav Sharma (\${escapeHtml(assocPos.fullTitle)} · \${assocPos.id})
          </button>
      \`;

      if (leadPos) {
        pillsHtml += \`
          <button type="button" class="persona-pill-btn" style="\${selectedPos.roleLevel === 'Lead' ? 'border: 2px solid #7c3aed; background: #f5f3ff; font-weight: 800;' : ''}"
            onclick="applyPersonaCredential('\${leadEmail}', 'demo1234', '\${leadPos.id}')">
            🟣 Priya Nair (\${escapeHtml(leadPos.fullTitle)} · \${leadPos.id})
          </button>
        \`;
      }

      if (mgrPos) {
        pillsHtml += \`
          <button type="button" class="persona-pill-btn" style="\${selectedPos.roleLevel === 'Manager' ? 'border: 2px solid #d97706; background: #fffbeb; font-weight: 800;' : ''}"
            onclick="applyPersonaCredential('\${mgrEmail}', 'demo1234', '\${mgrPos.id}')">
            🔵 Rahul Kapoor (\${escapeHtml(mgrPos.fullTitle)} · \${mgrPos.id})
          </button>
        \`;
      }

      pillsHtml += \`
          <button type="button" class="persona-pill-btn" onclick="applyPersonaCredential('hr@\${domain}', 'demo1234', null, 'hr')">
            👤 Priya Sharma (HR People Partner · \${escapeHtml(currentSelectedDept.name)})
          </button>
          <button type="button" class="persona-pill-btn" onclick="applyPersonaCredential('buddy@\${domain}', 'demo1234', null, 'buddy')">
            🤝 Rahul Pandey (Assigned Senior Buddy Mentor)
          </button>
        </div>
      \`;

      personaSection.innerHTML = pillsHtml;
    }

    // Interactive Handler when user clicks a persona credential button
    function applyPersonaCredential(email, password, posId, roleOverride) {
      const emailInput = document.getElementById('signin-email');
      const passwordInput = document.getElementById('signin-password');
      if (emailInput) emailInput.value = email;
      if (passwordInput) passwordInput.value = password;

      if (posId && currentSelectedTeam) {
        const found = currentSelectedTeam.positions.find(p => p.id === posId);
        if (found) {
          currentSelectedPosition = found;
          const bannerTitle = document.getElementById('signin-target-position-title');
          if (bannerTitle) bannerTitle.textContent = \`🎯 Selected Position: \${found.fullTitle}\`;
          const submitBtn = document.getElementById('signin-btn-text');
          if (submitBtn) submitBtn.textContent = \`Sign In as \${found.roleLevel} (\${found.title})\`;
        }
      }

      if (roleOverride === 'hr') {
        const badge = document.getElementById('signin-detected-badge');
        const detTitle = document.getElementById('detected-role-title');
        const detDesc = document.getElementById('detected-role-desc');
        const submitBtn = document.getElementById('signin-btn-text');
        if (badge) badge.className = 'role-detect-badge hr';
        if (detTitle) detTitle.textContent = 'Detected Role: HR People Partner';
        if (detDesc) detDesc.textContent = \`HR Operations Lead for \${currentSelectedDept ? currentSelectedDept.name : 'Organization'} · Routes to HR Command\`;
        if (submitBtn) submitBtn.textContent = 'Sign In to HR Command →';
        return;
      }

      if (roleOverride === 'buddy') {
        const badge = document.getElementById('signin-detected-badge');
        const detTitle = document.getElementById('detected-role-title');
        const detDesc = document.getElementById('detected-role-desc');
        const submitBtn = document.getElementById('signin-btn-text');
        if (badge) badge.className = 'role-detect-badge buddy';
        if (detTitle) detTitle.textContent = 'Detected Role: Onboarding Buddy';
        if (detDesc) detDesc.textContent = \`Assigned Peer Mentor for \${currentSelectedTeam ? currentSelectedTeam.name : 'Team'} · Routes to Buddy Dashboard\`;
        if (submitBtn) submitBtn.textContent = 'Sign In to Buddy Dashboard →';
        return;
      }

      handleEmailInput(email);
    }
  `;

  // Check if renderDynamicSigninPersonas already exists
  if (!content.includes('function renderDynamicSigninPersonas(')) {
    content = content.replace('function fillPersona(email, password) {', helperFunctionsCode + '\n    function fillPersona(email, password) {');
    console.log('   ✓ Injected renderDynamicSigninPersonas & applyPersonaCredential');
  }

  // 4. Fix handleEmailInput so it DOES NOT navigate away or crash
  const oldHandleEmailInputRegex = /function handleEmailInput\(email\) \{[\s\S]*?if \(!em\) \{[\s\S]*?return;\s*\}[\s\S]*?const detection = detectRoleFromEmail\(email\);[\s\S]*?if \(detection\.role === 'joiner'\) \{/;

  const newHandleEmailInputCode = `function handleEmailInput(email) {
      const em = (email || '').toLowerCase().trim();
      const badge = document.getElementById('signin-detected-badge');
      const title = document.getElementById('detected-role-title');
      const desc = document.getElementById('detected-role-desc');
      const btnText = document.getElementById('signin-btn-text');

      if (!em) {
        if (badge) badge.className = 'role-detect-badge prompt';
        const span = badge ? badge.querySelector('span') : null;
        if (span) span.textContent = 'help';
        if (title) title.textContent = 'Enter Corporate Credentials';
        if (desc) desc.textContent = 'Type your work email above to automatically detect your role.';
        if (btnText) btnText.textContent = 'Sign In to Workspace';
        return;
      }

      const detection = detectRoleFromEmail(email);
      detectedRoleKey = detection.role;
      currentAuthenticatedUser = detection.user;

      if (badge) badge.className = \`role-detect-badge \${detection.role}\`;

      // Update badge UI display without premature navigation
      if (currentSelectedPosition && currentSelectedDept && currentSelectedTeam) {
        if (detection.role === 'joiner' || !detection.role) {
          const rawAlias = em.split('@')[0] || 'aarav';
          const formattedName = rawAlias.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Aarav Sharma';
          if (badge && badge.querySelector('span')) badge.querySelector('span').textContent = '🟢';
          if (title) title.textContent = \`Detected Role: \${currentSelectedPosition.roleLevel} - \${currentSelectedPosition.title}\`;
          if (desc) desc.textContent = \`Identified: \${formattedName} (\${currentSelectedPosition.fullTitle}) · \${currentSelectedDept.name} (\${currentSelectedTeam.name}) · Routes to 70/30 Workspace\`;
          if (btnText) btnText.textContent = \`Sign In as \${currentSelectedPosition.roleLevel} (\${currentSelectedPosition.title}) →\`;
          return;
        }
      }

      if (detection.role === 'joiner') {`;

  if (oldHandleEmailInputRegex.test(content)) {
    content = content.replace(oldHandleEmailInputRegex, newHandleEmailInputCode);
    console.log('   ✓ Fixed handleEmailInput (removed premature navigation)');
  } else {
    console.log('   ! handleEmailInput regex did not match, checking manual replacement...');
    // In case the file already has the modified handleEmailInput
    const idxStart = content.indexOf('function handleEmailInput(email) {');
    if (idxStart !== -1) {
      const idxJoiner = content.indexOf('if (detection.role === \'joiner\') {', idxStart);
      if (idxJoiner !== -1) {
        content = content.substring(0, idxStart) + newHandleEmailInputCode + content.substring(idxJoiner + 33);
        console.log('   ✓ Manually replaced handleEmailInput header');
      }
    }
  }

  // 5. Update handleMemberSignIn to generate domain-tailored tasks (specifically Administration!)
  const oldHandleSignInRegex = /async function handleMemberSignIn\(\) \{[\s\S]*?currentLiveDashboard = synthesized;[\s\S]*?goToStep\('step-joiner-chatbot'\);\s*showNotification[\s\S]*?return;\s*\}/;

  const newHandleSignInCode = `async function handleMemberSignIn() {
      const emailInput = document.getElementById('signin-email');
      const passwordInput = document.getElementById('signin-password');
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (currentSelectedPosition && currentSelectedDept && currentSelectedTeam && email) {
        const rawAlias = (email.split('@')[0] || 'aarav').toLowerCase();
        let formattedName = 'Aarav Sharma';
        if (rawAlias.startsWith('priya')) formattedName = 'Priya Nair';
        else if (rawAlias.startsWith('rahul')) formattedName = 'Rahul Kapoor';
        else if (rawAlias.startsWith('aarav')) formattedName = 'Aarav Sharma';
        else {
          formattedName = rawAlias.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
        const deptName = currentSelectedDept.name;
        const teamName = currentSelectedTeam.name;
        const branchName = currentSelectedBranch ? currentSelectedBranch.name : 'Executive Administration';
        const posTitle = currentSelectedPosition.title;
        const fullTitle = currentSelectedPosition.fullTitle;
        const roleLevel = currentSelectedPosition.roleLevel;

        // Domain-specific tailored onboarding tasks
        let tailoredTasks = [];
        if (deptName.toUpperCase().includes('ADMIN') || deptName.toUpperCase().includes('EXECUTIVE')) {
          tailoredTasks = [
            {
              id: 1,
              title: \`Day 1 Welcome & Administration Department Orientation\`,
              desc: \`Complete official Microsoft Administration department induction for \${teamName} and review executive office protocols.\`,
              day: 'Day 1',
              category: 'Administration',
              priority: 'High',
              done: true
            },
            {
              id: 2,
              title: \`Executive Calendar & VIP Scheduling Tooling Setup\`,
              desc: \`Configure Outlook Executive Delegation, Teams Room booking rights, and executive priority scheduling systems.\`,
              day: 'Day 1',
              category: 'Setup',
              priority: 'High',
              done: false
            },
            {
              id: 3,
              title: \`1:1 Executive Briefing Kickoff with Senior Team Buddy\`,
              desc: \`Connect with senior buddy Rahul Pandey for executive briefing packs, travel logistics, and expense reimbursement standards.\`,
              day: 'Day 1',
              category: 'Mentoring',
              priority: 'Medium',
              done: false
            },
            {
              id: 4,
              title: \`Executive Confidentiality & Board Governance Compliance\`,
              desc: \`Complete corporate non-disclosure certification, executive correspondence security, and compliance protocols.\`,
              day: 'Day 2',
              category: 'Security',
              priority: 'High',
              done: false
            },
            {
              id: 5,
              title: \`Review Weekly Leadership Cadence & Starter Deliverables in \${teamName}\`,
              desc: \`Prepare upcoming leadership briefing packet and align on weekly executive office deliverables as \${fullTitle}.\`,
              day: 'Day 3',
              category: 'Administration',
              priority: 'Medium',
              done: false
            }
          ];
        } else {
          tailoredTasks = [
            {
              id: 1,
              title: \`Day 1 Welcome & \${deptName} Department Orientation\`,
              desc: \`Complete the official department orientation for \${teamName} and review your responsibilities as \${fullTitle}.\`,
              day: 'Day 1',
              category: deptName,
              priority: 'High',
              done: true
            },
            {
              id: 2,
              title: \`Workspace & Tooling Configuration for \${posTitle}\`,
              desc: \`Set up corporate access credentials, security tokens, and workflow tooling for \${teamName}.\`,
              day: 'Day 1',
              category: 'Setup',
              priority: 'High',
              done: false
            },
            {
              id: 3,
              title: \`1:1 Mentorship Kickoff with Senior Team Buddy\`,
              desc: \`Connect with your assigned mentor for team overview, sprint cadence, and \${roleLevel} role expectations.\`,
              day: 'Day 1',
              category: 'Mentoring',
              priority: 'Medium',
              done: false
            },
            {
              id: 4,
              title: \`Complete Confidential Information & Compliance Certification\`,
              desc: \`Review Microsoft confidential information protection rules and complete compliance module for \${deptName}.\`,
              day: 'Day 2',
              category: 'Security',
              priority: 'High',
              done: false
            },
            {
              id: 5,
              title: \`Sprint Backlog & First Deliverables Review in \${teamName}\`,
              desc: \`Review your squad roadmap and pick up your first starter assignment as \${fullTitle}.\`,
              day: 'Day 3',
              category: deptName,
              priority: 'Medium',
              done: false
            }
          ];
        }

        const synthesized = {
          company: { name: 'Microsoft Corporation', tenantId: 'microsoft-corp-in-prod' },
          employee: {
            employeeId: 'MSFT-' + (currentSelectedPosition.id || 'POS-0001'),
            name: formattedName,
            email: email,
            role: posTitle,
            fullTitle: fullTitle,
            roleLevel: roleLevel,
            department: deptName,
            team: teamName,
            branch: branchName,
            location: 'Microsoft Corporate Campus · Bengaluru / Redmond IDC',
            joiningDate: '2026-10-04',
            startDate: '2026-10-04',
            status: 'Active',
            buddy: {
              name: 'Rahul Pandey',
              role: 'Senior Executive Assistant · Peer Mentor',
              phone: '+91 (80) 6789-89928',
              email: 'rahul.pandey@microsoft.in'
            },
            hr: {
              name: 'Priya Sharma',
              role: 'Lead HR People Partner · Employee Success',
              phone: '+91 (80) 6789-89912',
              email: 'priya.sharma@microsoft.in'
            }
          },
          metrics: {
            totalTasks: tailoredTasks.length,
            completedTasks: 1,
            pendingTasks: tailoredTasks.length - 1,
            percentage: Math.round((1 / tailoredTasks.length) * 100)
          },
          tasks: tailoredTasks
        };

        currentLiveDashboard = synthesized;
        window.currentLiveDashboard = synthesized;
        currentLiveEmployeeId = synthesized.employee.employeeId;
        liveTasksList = synthesized.tasks;
        renderManualDashboardFromLive(synthesized);
        initJoinerChatbot(synthesized.employee);
        goToStep('step-joiner-chatbot');
        showNotification(\`Welcome to Microsoft, \${formattedName}! Loaded workspace for \${fullTitle}.\`);
        return;
      }`;

  if (oldHandleSignInRegex.test(content)) {
    content = content.replace(oldHandleSignInRegex, newHandleSignInCode);
    console.log('   ✓ Replaced handleMemberSignIn');
  } else {
    console.log('   ! handleMemberSignIn regex did not match');
  }

  // 6. Update renderManualDashboardFromLive to also update contact cards (Buddy, HR)
  const contactUpdateHook = `
      // Update assigned contact cards if available
      if (emp.buddy) {
        const buddyNameEl = document.getElementById('contact-buddy-name');
        const buddyTitleEl = document.getElementById('contact-buddy-title');
        const buddyEmailEl = document.getElementById('contact-buddy-email');
        const buddyPhoneEl = document.getElementById('contact-buddy-phone');
        if (buddyNameEl) buddyNameEl.textContent = emp.buddy.name;
        if (buddyTitleEl) buddyTitleEl.textContent = emp.buddy.role;
        if (buddyEmailEl) buddyEmailEl.textContent = emp.buddy.email;
        if (buddyPhoneEl && emp.buddy.phone) buddyPhoneEl.textContent = emp.buddy.phone;
      }
      if (emp.hr) {
        const hrNameEl = document.getElementById('contact-hr-name');
        const hrTitleEl = document.getElementById('contact-hr-title');
        const hrEmailEl = document.getElementById('contact-hr-email');
        const hrPhoneEl = document.getElementById('contact-hr-phone');
        if (hrNameEl) hrNameEl.textContent = emp.hr.name;
        if (hrTitleEl) hrTitleEl.textContent = emp.hr.role;
        if (hrEmailEl) hrEmailEl.textContent = emp.hr.email;
        if (hrPhoneEl && emp.hr.phone) hrPhoneEl.textContent = emp.hr.phone;
      }
  `;

  if (!content.includes('emp.buddy.role') && content.includes('function renderManualDashboardFromLive(data) {')) {
    content = content.replace('if (copilotUserEl) copilotUserEl.textContent = emp.name;', 'if (copilotUserEl) copilotUserEl.textContent = emp.name;\n' + contactUpdateHook);
    console.log('   ✓ Injected contact cards update into renderManualDashboardFromLive');
  }

  fs.writeFileSync(filePath, content, 'utf8');

  // Verify JS syntax inside all <script> blocks
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
      console.log(`   ✓ Script block ${blockIndex}: VALID (${code.length} chars)`);
    } catch (e) {
      console.error(`   ✗ SYNTAX ERROR in script block ${blockIndex}:`, e.message);
      allValid = false;
    }
  }

  return allValid;
}

let allOk = true;
for (const file of targetFiles) {
  const ok = updateFile(file);
  if (!ok) allOk = false;
}

console.log('\nAll files processed successfully:', allOk);
