const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Ensure <script src="org_structure_data.js"></script> is in <head>
if (!html.includes('src="org_structure_data.js"')) {
  html = html.replace('</head>', '  <script src="org_structure_data.js"></script>\n</head>');
}

// 2. Add rich CSS styles for departments, subdepartments, role levels, and hierarchy badges
const customStyles = `
    /* ==============================================================
       AUTHORITATIVE 18 DEPARTMENTS & MULTI-TIER ROLE GATEWAY STYLES
       ============================================================== */
    .org-wizard-step-header {
      margin-bottom: 24px;
    }
    .org-wizard-breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 0.82rem;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 16px;
    }
    .org-wizard-breadcrumb button {
      background: none;
      border: none;
      color: #2563eb;
      font-weight: 700;
      cursor: pointer;
      padding: 0;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .org-wizard-breadcrumb button:hover {
      text-decoration: underline;
    }
    .org-wizard-breadcrumb .crumb-sep {
      color: #cbd5e1;
    }
    .org-wizard-breadcrumb .crumb-current {
      color: #0f172a;
      font-weight: 700;
    }

    .org-hierarchy-banner {
      background: linear-gradient(135deg, #0b1c30 0%, #1e293b 100%);
      color: #ffffff;
      border-radius: var(--radius-lg);
      padding: 18px 24px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 4px 16px rgba(11, 28, 48, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .org-hierarchy-banner .banner-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .org-hierarchy-banner .banner-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #38bdf8;
    }
    .org-hierarchy-banner .banner-title {
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: -0.01em;
      color: #ffffff;
    }
    .org-hierarchy-banner .banner-subtitle {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-top: 2px;
    }
    .org-hierarchy-banner .banner-badge {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.35);
      color: #38bdf8;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      white-space: nowrap;
    }

    /* Department Cards Grid */
    .departments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 18px;
      margin-top: 20px;
    }
    .department-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .department-card:hover {
      border-color: #3b82f6;
      transform: translateY(-3px);
      box-shadow: 0 12px 24px -4px rgba(37, 99, 235, 0.12);
    }
    .department-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: #0037b0;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .department-card:hover::before {
      opacity: 1;
    }
    .department-card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }
    .department-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #eff4ff;
      color: #0037b0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    .department-code-badge {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .department-name {
      font-size: 1.02rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.35;
      margin-bottom: 8px;
      letter-spacing: -0.01em;
    }
    .department-meta-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.78rem;
      color: #64748b;
      margin-top: 8px;
    }
    .department-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .department-card-footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8rem;
      font-weight: 700;
      color: #0037b0;
    }

    /* Sub-Department / Branch Sections */
    .branch-group-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-xl);
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.03);
    }
    .branch-group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 12px;
      margin-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .branch-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .branch-title-row h3 {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }
    .team-item-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-md);
      padding: 14px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .team-item-card:hover {
      background: #eff6ff;
      border-color: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
    }
    .team-item-name {
      font-size: 0.92rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .team-item-subbranch {
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 10px;
    }
    .team-positions-pill-row {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .pos-level-mini-pill {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
    }
    .pos-level-mini-pill.associate {
      border-color: #93c5fd;
      color: #1d4ed8;
      background: #eff6ff;
    }
    .pos-level-mini-pill.lead {
      border-color: #c4b5fd;
      color: #6d28d9;
      background: #f5f3ff;
    }
    .pos-level-mini-pill.manager {
      border-color: #fde047;
      color: #854d0e;
      background: #fefce8;
    }
    .pos-level-mini-pill.ceo {
      border-color: #fca5a5;
      color: #991b1b;
      background: #fef2f2;
    }

    /* Role Level Selection Cards */
    .role-levels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 24px;
    }
    .role-level-selection-card {
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: var(--radius-xl);
      padding: 24px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .role-level-selection-card:hover {
      border-color: #2563eb;
      transform: translateY(-4px);
      box-shadow: 0 16px 32px -6px rgba(37, 99, 235, 0.16);
    }
    .role-level-selection-card.role-associate {
      border-top: 5px solid #2563eb;
    }
    .role-level-selection-card.role-lead {
      border-top: 5px solid #7c3aed;
    }
    .role-level-selection-card.role-manager {
      border-top: 5px solid #d97706;
    }
    .role-level-selection-card.role-ceo {
      border-top: 5px solid #dc2626;
    }
    .role-level-tier-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 12px;
      width: fit-content;
    }
    .role-associate .role-level-tier-badge {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .role-lead .role-level-tier-badge {
      background: #f5f3ff;
      color: #6d28d9;
      border: 1px solid #ddd6fe;
    }
    .role-manager .role-level-tier-badge {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .role-ceo .role-level-tier-badge {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .role-position-exact-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
      margin-bottom: 8px;
    }
    .role-position-path-tag {
      font-size: 0.78rem;
      color: #64748b;
      margin-bottom: 16px;
      line-height: 1.4;
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .role-position-bullets {
      list-style: none;
      padding: 0;
      margin: 0 0 20px 0;
      font-size: 0.82rem;
      color: #334155;
    }
    .role-position-bullets li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
    }
    .role-select-action-btn {
      width: 100%;
      padding: 12px;
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.88rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .role-associate .role-select-action-btn {
      background: #2563eb;
      color: #ffffff;
      border: 1px solid #1d4ed8;
    }
    .role-associate .role-select-action-btn:hover {
      background: #1d4ed8;
    }
    .role-lead .role-select-action-btn {
      background: #7c3aed;
      color: #ffffff;
      border: 1px solid #6d28d9;
    }
    .role-lead .role-select-action-btn:hover {
      background: #6d28d9;
    }
    .role-manager .role-select-action-btn {
      background: #d97706;
      color: #ffffff;
      border: 1px solid #b45309;
    }
    .role-manager .role-select-action-btn:hover {
      background: #b45309;
    }
    .role-ceo .role-select-action-btn {
      background: #dc2626;
      color: #ffffff;
      border: 1px solid #b91c1c;
    }
    .role-ceo .role-select-action-btn:hover {
      background: #b91c1c;
    }

    /* Target Position Banner in Step Signin */
    .target-position-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: var(--radius-lg);
      padding: 14px 18px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .target-position-banner .target-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #166534;
    }
    .target-position-banner .target-path {
      font-size: 0.75rem;
      color: #15803d;
      margin-top: 2px;
    }
`;

if (!html.includes('AUTHORITATIVE 18 DEPARTMENTS & MULTI-TIER ROLE GATEWAY STYLES')) {
  html = html.replace('</style>', customStyles + '\n  </style>');
}

// 3. Define the HTML for the 3 new views: step-departments, step-subdepartments, step-roles
const newStepSectionsHtml = `
    <!-- ==============================================================
         STEP 2A: 18 AUTHORITATIVE DEPARTMENTS SELECTION
         ============================================================== -->
    <section id="step-departments" class="step-view" style="display: none; max-width: 1200px; margin: 0 auto; width: 100%;">
      <div class="org-wizard-breadcrumb">
        <button onclick="goToStep('step-gateway')"><span class="material-symbols-outlined" style="font-size: 16px;">home</span> Gateway</button>
        <span class="crumb-sep">/</span>
        <button onclick="goToStep('step-companies')">Companies</button>
        <span class="crumb-sep">/</span>
        <span id="breadcrumb-dept-company" class="crumb-current">Microsoft Corporation</span>
        <span class="crumb-sep">/</span>
        <span class="crumb-current">18 Departments</span>
      </div>

      <div class="gateway-hero" style="margin-bottom: 24px;">
        <div class="hero-pill" style="margin-bottom: 12px;">
          <span class="material-symbols-outlined" style="font-size: 15px; color: var(--stitch-primary);">account_tree</span>
          Authoritative Organizational Taxonomy
        </div>
        <h2 class="hero-heading" style="font-size: 2.2rem;">
          Select Department — <span id="dept-company-title" class="highlight">Microsoft Corporation</span>
        </h2>
        <p class="hero-subtitle">
          Choose from the 18 official organizational departments extracted directly from the authoritative company structure document.
        </p>
      </div>

      <!-- Department Directory Toolbar -->
      <div class="directory-toolbar-container" style="margin-bottom: 20px;">
        <div class="directory-search-bar">
          <span class="material-symbols-outlined search-icon">search</span>
          <input type="text" id="dept-filter-input" class="directory-search-input"
            placeholder="Search 18 departments (e.g. Engineering, Security, Analytics, Marketing, HR)..."
            oninput="filterDepartmentCards(this.value)" autocomplete="off">
          <span id="dept-result-counter" class="directory-counter-pill">18 divisions available</span>
        </div>

        <div class="directory-category-bar">
          <button type="button" class="filter-pill active" onclick="filterDeptCategory('all', this)">All (18)</button>
          <button type="button" class="filter-pill" onclick="filterDeptCategory('Tech', this)">Engineering & Tech (6)</button>
          <button type="button" class="filter-pill" onclick="filterDeptCategory('Corporate', this)">Corporate & Shared (6)</button>
          <button type="button" class="filter-pill" onclick="filterDeptCategory('Business', this)">Business & Strategy (4)</button>
          <button type="button" class="filter-pill" onclick="filterDeptCategory('Operations', this)">Operations & Support (2)</button>
        </div>
      </div>

      <!-- 18 Department Cards Grid Container -->
      <div class="departments-grid" id="departments-grid">
        <!-- Rendered dynamically by renderDepartmentsList() -->
      </div>
    </section>

    <!-- ==============================================================
         STEP 2B: SUB-DEPARTMENTS, BRANCHES & TEAMS SELECTION
         ============================================================== -->
    <section id="step-subdepartments" class="step-view" style="display: none; max-width: 1200px; margin: 0 auto; width: 100%;">
      <div class="org-wizard-breadcrumb">
        <button onclick="goToStep('step-gateway')">Gateway</button>
        <span class="crumb-sep">/</span>
        <button onclick="goToStep('step-companies')">Companies</button>
        <span class="crumb-sep">/</span>
        <button onclick="goToStep('step-departments')"><span id="subdept-breadcrumb-dept-name">Department</span></button>
        <span class="crumb-sep">/</span>
        <span class="crumb-current">Select Sub-Department & Team</span>
      </div>

      <div class="org-hierarchy-banner">
        <div class="banner-left">
          <div class="banner-icon" id="subdept-header-icon">
            <span class="material-symbols-outlined" style="font-size: 26px;">layers</span>
          </div>
          <div>
            <div class="banner-title" id="subdept-header-title">ENGINEERING, DEVELOPMENT AND SERVICES</div>
            <div class="banner-subtitle" id="subdept-header-subtitle">Select your specific Branch, Sub-Branch, and Team to explore role positions</div>
          </div>
        </div>
        <div class="banner-badge" id="subdept-header-badge">DEP_06 · 5 Branches</div>
      </div>

      <!-- Search Bar for Subdepartments -->
      <div class="directory-toolbar-container" style="margin-bottom: 20px;">
        <div class="directory-search-bar">
          <span class="material-symbols-outlined search-icon">search</span>
          <input type="text" id="subdept-filter-input" class="directory-search-input"
            placeholder="Search branches, sub-branches, or teams..."
            oninput="filterSubDepartmentList(this.value)" autocomplete="off">
          <span id="subdept-result-counter" class="directory-counter-pill">Branches ready</span>
        </div>
      </div>

      <!-- Subdepartments & Teams Container -->
      <div id="subdepartments-list-container">
        <!-- Rendered dynamically by renderSubDepartmentsList() -->
      </div>
    </section>

    <!-- ==============================================================
         STEP 2C: ROLE LEVEL & POSITION SELECTION (Associate, Lead, Manager, CEO)
         ============================================================== -->
    <section id="step-roles" class="step-view" style="display: none; max-width: 1200px; margin: 0 auto; width: 100%;">
      <div class="org-wizard-breadcrumb">
        <button onclick="goToStep('step-gateway')">Gateway</button>
        <span class="crumb-sep">/</span>
        <button onclick="goToStep('step-companies')">Companies</button>
        <span class="crumb-sep">/</span>
        <button onclick="goToStep('step-departments')"><span id="role-breadcrumb-dept">Department</span></button>
        <span class="crumb-sep">/</span>
        <button onclick="goToStep('step-subdepartments')"><span id="role-breadcrumb-team">Team</span></button>
        <span class="crumb-sep">/</span>
        <span class="crumb-current">Select Role Level</span>
      </div>

      <div class="gateway-hero" style="margin-bottom: 18px;">
        <div class="hero-pill" style="margin-bottom: 12px;">
          <span class="material-symbols-outlined" style="font-size: 15px; color: var(--stitch-primary);">badge</span>
          Step 3: Role Level & Exact Position Title
        </div>
        <h2 class="hero-heading" style="font-size: 2.2rem;">
          Select Your Role Level in <span id="roles-hero-team-title" class="highlight">Team</span>
        </h2>
        <p class="hero-subtitle">
          Choose whether you are joining as an <strong>Associate</strong>, <strong>Lead</strong>, or <strong>Manager</strong>. The exact position title from the official Word document will be assigned to your workspace.
        </p>
      </div>

      <!-- Hierarchy Path Confirmation Card -->
      <div class="org-hierarchy-banner" style="background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; box-shadow: var(--shadow-sm);">
        <div class="banner-left">
          <div class="banner-icon" style="background: #eff6ff; color: #2563eb;">
            <span class="material-symbols-outlined" style="font-size: 24px;">apartment</span>
          </div>
          <div>
            <div style="font-size: 0.78rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Selected Hierarchy Path</div>
            <div style="font-size: 0.96rem; font-weight: 800; color: #0f172a;" id="roles-hierarchy-path-text">Microsoft > Department > Branch > Sub-Branch > Team</div>
          </div>
        </div>
        <button onclick="goToStep('step-subdepartments')" class="persona-pill-btn" style="padding: 6px 14px; font-size: 0.8rem;">
          Change Team
        </button>
      </div>

      <!-- Role Levels Grid (Associate, Lead, Manager, CEO) -->
      <div class="role-levels-grid" id="role-levels-grid">
        <!-- Rendered dynamically by renderRoleLevelSelection() -->
      </div>
    </section>
`;

// Insert new sections before step-signin if not already there
if (!html.includes('id="step-departments"')) {
  html = html.replace('<section id="step-signin"', newStepSectionsHtml + '\n    <section id="step-signin"');
}

// 4. Update the sign-in section breadcrumbs & back link to point back to step-roles
html = html.replace(
  '<a href="javascript:void(0)" onclick="goToStep(\'step-companies\')" class="signin-back-link">',
  '<a href="javascript:void(0)" onclick="goToStep(\'step-roles\')" class="signin-back-link">'
);

// 5. Insert Target Position indicator in Step Sign-In
const targetPosBannerHtml = `
        <!-- Selected Position & Hierarchy Confirmation Banner -->
        <div id="signin-target-position-banner" class="target-position-banner" style="display: none;">
          <div>
            <div class="target-title" id="signin-target-position-title">🎯 Position: Software Engineer</div>
            <div class="target-path" id="signin-target-hierarchy-path">Hierarchy: Microsoft > Engineering > Cloud Core > Software Engineer</div>
          </div>
          <button type="button" onclick="goToStep('step-roles')" class="persona-pill-btn" style="padding: 4px 10px; font-size: 0.75rem; background: #ffffff; border: 1px solid #86efac; color: #166534;">
            Change Role
          </button>
        </div>
`;

if (!html.includes('id="signin-target-position-banner"')) {
  html = html.replace('<div class="signin-card">', '<div class="signin-card">\n' + targetPosBannerHtml);
}

// 6. Add JavaScript Controller functions for Department, Subdepartment, and Role Level navigation
const jsControllerCode = `
    // ==============================================================
    // AUTHORITATIVE 18-DEPARTMENT & ROLE LEVEL CONTROLLER
    // ==============================================================
    let currentSelectedCompany = 'microsoft';
    let currentSelectedDept = null;
    let currentSelectedBranch = null;
    let currentSelectedSubBranch = null;
    let currentSelectedTeam = null;
    let currentSelectedPosition = null;
    let currentDeptCategoryFilter = 'all';

    const DEPT_ICONS_MAP = {
      'ADMINISTRATION': 'work',
      'ANALYTICS': 'analytics',
      'CONSULTING AND CUSTOMER SUPPORT': 'support_agent',
      'CORPORATE AND SHARED SERVICES': 'layers',
      'DESIGN AND CREATIVE': 'palette',
      'ENGINEERING, DEVELOPMENT AND SERVICES': 'code',
      'FINANCE': 'account_balance',
      'GENERAL MANAGEMENT': 'explore',
      'HARDWARE AND MANUFACTURING': 'memory',
      'HUMAN RESOURCES': 'group',
      'LEARNING': 'school',
      'LEGAL AND CORPORATE AFFAIRS': 'gavel',
      'MARKETING': 'campaign',
      'OPERATIONS AND SUPPLY CHAIN': 'local_shipping',
      'PRODUCT AND PROGRAM MANAGEMENT': 'view_kanban',
      'RESEARCH, APPLIED AND DATA SCIENCES': 'science',
      'SALES': 'trending_up',
      'SECURITY ENGINEERING': 'security'
    };

    const DEPT_CATEGORIES_MAP = {
      'ADMINISTRATION': 'Corporate',
      'ANALYTICS': 'Tech',
      'CONSULTING AND CUSTOMER SUPPORT': 'Operations',
      'CORPORATE AND SHARED SERVICES': 'Corporate',
      'DESIGN AND CREATIVE': 'Tech',
      'ENGINEERING, DEVELOPMENT AND SERVICES': 'Tech',
      'FINANCE': 'Corporate',
      'GENERAL MANAGEMENT': 'Business',
      'HARDWARE AND MANUFACTURING': 'Tech',
      'HUMAN RESOURCES': 'Corporate',
      'LEARNING': 'Corporate',
      'LEGAL AND CORPORATE AFFAIRS': 'Corporate',
      'MARKETING': 'Business',
      'OPERATIONS AND SUPPLY CHAIN': 'Operations',
      'PRODUCT AND PROGRAM MANAGEMENT': 'Business',
      'RESEARCH, APPLIED AND DATA SCIENCES': 'Tech',
      'SALES': 'Business',
      'SECURITY ENGINEERING': 'Tech'
    };

    function getAuthoritativeOrgData() {
      if (window.AUTHORITATIVE_ORG_STRUCTURE && window.AUTHORITATIVE_ORG_STRUCTURE.departments) {
        return window.AUTHORITATIVE_ORG_STRUCTURE;
      }
      return { departments: [] };
    }

    // Step 2 Action: Select Company -> Routes to Step 2A (18 Departments)
    function selectCompany(companyKey) {
      currentSelectedCompany = companyKey;
      const comp = companiesDatabase[companyKey] || companiesDatabase.microsoft;

      // Update Department Page Titles
      const deptCompanyTitle = document.getElementById('dept-company-title');
      if (deptCompanyTitle) deptCompanyTitle.textContent = comp.fullName || comp.name;
      const breadcrumbCompany = document.getElementById('breadcrumb-dept-company');
      if (breadcrumbCompany) breadcrumbCompany.textContent = comp.name;

      // Render 18 Departments Grid
      renderDepartmentsList();

      showNotification(\`Selected \${comp.fullName}. Choose from the 18 departments.\`);
      goToStep('step-departments');
    }

    // Filter and Render 18 Departments List
    function renderDepartmentsList(filterText = '') {
      const orgData = getAuthoritativeOrgData();
      const container = document.getElementById('departments-grid');
      if (!container) return;

      const q = filterText.toLowerCase().trim();
      let visibleCount = 0;

      const deptCardsHtml = orgData.departments.map(dept => {
        const cat = DEPT_CATEGORIES_MAP[dept.name] || 'Corporate';
        const iconName = DEPT_ICONS_MAP[dept.name] || 'domain';

        let totalPos = 0;
        dept.branches.forEach(b => {
          b.subBranches.forEach(sb => {
            sb.teams.forEach(t => {
              totalPos += t.positions.length;
            });
          });
        });

        const matchesQuery = !q || dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q) || cat.toLowerCase().includes(q);
        const matchesCategory = currentDeptCategoryFilter === 'all' || cat.toLowerCase() === currentDeptCategoryFilter.toLowerCase();

        if (matchesQuery && matchesCategory) visibleCount++;

        return \`
          <div class="department-card" data-dept-code="\${dept.code}" data-category="\${cat}"
               onclick="selectDepartment('\${dept.code}')"
               style="display: \${matchesQuery && matchesCategory ? 'flex' : 'none'};">
            <div>
              <div class="department-card-top">
                <div class="department-icon-box">
                  <span class="material-symbols-outlined">\${iconName}</span>
                </div>
                <span class="department-code-badge">\${dept.code}</span>
              </div>
              <h3 class="department-name">\${dept.name}</h3>
              <div class="department-meta-row">
                <span class="department-meta-item">
                  <span class="material-symbols-outlined" style="font-size: 15px; color: #3b82f6;">account_tree</span>
                  \${dept.branches.length} Branches
                </span>
                <span class="department-meta-item">
                  <span class="material-symbols-outlined" style="font-size: 15px; color: #10b981;">badge</span>
                  \${totalPos} Positions
                </span>
              </div>
            </div>
            <div class="department-card-footer">
              <span>Explore Sub-Departments</span>
              <span class="material-symbols-outlined" style="font-size: 17px;">arrow_forward</span>
            </div>
          </div>
        \`;
      }).join('');

      container.innerHTML = deptCardsHtml;
      const counterEl = document.getElementById('dept-result-counter');
      if (counterEl) counterEl.textContent = \`\${visibleCount} divisions available\`;
    }

    function filterDepartmentCards(query) {
      renderDepartmentsList(query);
    }

    function filterDeptCategory(category, btnEl) {
      currentDeptCategoryFilter = category;
      document.querySelectorAll('#step-departments .filter-pill').forEach(p => p.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      const searchInp = document.getElementById('dept-filter-input');
      renderDepartmentsList(searchInp ? searchInp.value : '');
    }

    // Step 2A Action: Select Department -> Routes to Step 2B (Sub-Departments & Teams)
    function selectDepartment(deptCode) {
      const orgData = getAuthoritativeOrgData();
      const dept = orgData.departments.find(d => d.code === deptCode || d.name === deptCode);
      if (!dept) {
        showNotification('⚠️ Department not found.');
        return;
      }

      currentSelectedDept = dept;

      // Update Sub-department Header & Breadcrumbs
      const iconName = DEPT_ICONS_MAP[dept.name] || 'domain';
      const breadcrumbDept = document.getElementById('subdept-breadcrumb-dept-name');
      if (breadcrumbDept) breadcrumbDept.textContent = dept.name;
      const headerTitle = document.getElementById('subdept-header-title');
      if (headerTitle) headerTitle.textContent = dept.name;
      const headerBadge = document.getElementById('subdept-header-badge');
      if (headerBadge) headerBadge.textContent = \`\${dept.code} · \${dept.branches.length} Branches\`;
      const headerIcon = document.getElementById('subdept-header-icon');
      if (headerIcon) headerIcon.innerHTML = \`<span class="material-symbols-outlined" style="font-size: 26px;">\${iconName}</span>\`;

      // Render Sub-departments
      renderSubDepartmentsList();

      showNotification(\`Selected \${dept.name}\`);
      goToStep('step-subdepartments');
    }

    // Render Sub-departments, Branches and Teams List
    function renderSubDepartmentsList(filterText = '') {
      if (!currentSelectedDept) return;
      const container = document.getElementById('subdepartments-list-container');
      if (!container) return;

      const q = filterText.toLowerCase().trim();
      let totalTeamsFound = 0;

      const branchesHtml = currentSelectedDept.branches.map(branch => {
        const teamsList = [];
        branch.subBranches.forEach(sb => {
          sb.teams.forEach(team => {
            const matches = !q ||
              branch.name.toLowerCase().includes(q) ||
              sb.name.toLowerCase().includes(q) ||
              team.name.toLowerCase().includes(q) ||
              team.positions.some(p => p.title.toLowerCase().includes(q));

            if (matches) {
              totalTeamsFound++;
              teamsList.push({
                subBranchName: sb.name,
                team: team
              });
            }
          });
        });

        if (teamsList.length === 0) return '';

        return \`
          <div class="branch-group-box">
            <div class="branch-group-header">
              <div class="branch-title-row">
                <span class="material-symbols-outlined" style="color: #0037b0; font-size: 20px;">folder_open</span>
                <h3>\${branch.name}</h3>
              </div>
              <span class="company-category-chip" style="font-size: 0.72rem;">\${teamsList.length} Teams</span>
            </div>

            <div class="teams-grid">
              \${teamsList.map(item => {
                const team = item.team;
                return \`
                  <div class="team-item-card" onclick="selectTeam('\${escapeHtml(branch.name)}', '\${escapeHtml(item.subBranchName)}', '\${escapeHtml(team.name)}')">
                    <div>
                      <div class="team-item-name">\${team.name}</div>
                      <div class="team-item-subbranch">\${item.subBranchName !== team.name ? item.subBranchName : branch.name}</div>
                    </div>
                    <div class="team-positions-pill-row">
                      \${team.positions.map(p => {
                        const levelCls = (p.roleLevel || 'associate').toLowerCase();
                        return \`<span class="pos-level-mini-pill \${levelCls}">\${p.roleLevel}: \${p.title}</span>\`;
                      }).join('')}
                    </div>
                  </div>
                \`;
              }).join('')}
            </div>
          </div>
        \`;
      }).filter(Boolean).join('');

      container.innerHTML = branchesHtml || '<div style="text-align: center; padding: 40px; color: #64748b;">No matching teams or sub-departments found.</div>';
      const counterEl = document.getElementById('subdept-result-counter');
      if (counterEl) counterEl.textContent = \`\${totalTeamsFound} teams available\`;
    }

    function filterSubDepartmentList(query) {
      renderSubDepartmentsList(query);
    }

    // Step 2B Action: Select Team -> Routes to Step 2C (Role Level & Position)
    function selectTeam(branchName, subBranchName, teamName) {
      if (!currentSelectedDept) return;
      const branch = currentSelectedDept.branches.find(b => b.name === branchName);
      if (!branch) return;
      const subBranch = branch.subBranches.find(sb => sb.name === subBranchName);
      if (!subBranch) return;
      const team = subBranch.teams.find(t => t.name === teamName);
      if (!team) return;

      currentSelectedBranch = branch;
      currentSelectedSubBranch = subBranch;
      currentSelectedTeam = team;

      // Update Step 2C Breadcrumbs & Headers
      const comp = companiesDatabase[currentSelectedCompany] || companiesDatabase.microsoft;
      const breadcrumbDept = document.getElementById('role-breadcrumb-dept');
      if (breadcrumbDept) breadcrumbDept.textContent = currentSelectedDept.name;
      const breadcrumbTeam = document.getElementById('role-breadcrumb-team');
      if (breadcrumbTeam) breadcrumbTeam.textContent = team.name;

      const heroTeamTitle = document.getElementById('roles-hero-team-title');
      if (heroTeamTitle) heroTeamTitle.textContent = \`\${team.name} (\${currentSelectedDept.name})\`;

      const pathText = document.getElementById('roles-hierarchy-path-text');
      if (pathText) pathText.textContent = \`\${comp.name} > \${currentSelectedDept.name} > \${branch.name} > \${team.name}\`;

      // Render Role Levels
      renderRoleLevelSelection();

      showNotification(\`Selected Team: \${team.name}\`);
      goToStep('step-roles');
    }

    // Render Role Levels (Associate, Lead, Manager, CEO) for the selected team
    function renderRoleLevelSelection() {
      if (!currentSelectedTeam) return;
      const container = document.getElementById('role-levels-grid');
      if (!container) return;

      const positions = currentSelectedTeam.positions;

      const roleCardsHtml = positions.map(pos => {
        const level = pos.roleLevel;
        const levelCls = (level || 'associate').toLowerCase();
        let tierLabel = 'Entry - Mid Level (L1-L3)';
        let tierIcon = 'person';
        let bullet1 = 'Executes core squad deliverables, hands-on development & tasks';
        let bullet2 = 'Paired with Senior Mentor Buddy for Day 1 ramp-up';

        if (level === 'Lead') {
          tierLabel = 'Senior - Lead Level (L4-L6)';
          tierIcon = 'military_tech';
          bullet1 = 'Technical leadership, architecture reviews & peer mentorship';
          bullet2 = 'Owns sprint deliverables, code quality and security gates';
        } else if (level === 'Manager') {
          tierLabel = 'Leadership - Director Level (M1-M3)';
          tierIcon = 'manage_accounts';
          bullet1 = 'People management, roadmap execution & team staffing';
          bullet2 = 'HR performance evaluation, budget and strategy oversight';
        } else if (pos.isCeo || level === 'CEO') {
          tierLabel = 'Executive C-Suite';
          tierIcon = 'crown';
          bullet1 = 'Enterprise vision, corporate governance & executive leadership';
          bullet2 = 'Direct board reporting and organization-wide strategy';
        }

        return \`
          <div class="role-level-selection-card role-\${levelCls}" onclick="selectRoleLevel('\${pos.roleLevel}', '\${pos.id}')">
            <div>
              <div class="role-level-tier-badge">
                <span class="material-symbols-outlined" style="font-size: 15px;">\${tierIcon}</span>
                <span>\${tierLabel}</span>
              </div>
              <div class="role-position-exact-title">\${pos.fullTitle || (pos.roleLevel + ' - ' + pos.title)}</div>
              <div class="role-position-path-tag">
                📍 <strong>ID:</strong> \${pos.id} · \${pos.roleTier} Tier
              </div>

              <ul class="role-position-bullets">
                <li>
                  <span class="material-symbols-outlined" style="font-size: 16px; color: #10b981;">check_circle</span>
                  <span>\${bullet1}</span>
                </li>
                <li>
                  <span class="material-symbols-outlined" style="font-size: 16px; color: #10b981;">check_circle</span>
                  <span>\${bullet2}</span>
                </li>
                <li>
                  <span class="material-symbols-outlined" style="font-size: 16px; color: #10b981;">check_circle</span>
                  <span>Tailored onboarding checklist & AI Copilot prompts</span>
                </li>
              </ul>
            </div>

            <button type="button" class="role-select-action-btn">
              <span>Select \${pos.roleLevel} Position</span>
              <span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span>
            </button>
          </div>
        \`;
      }).join('');

      container.innerHTML = roleCardsHtml;
    }

    // Step 2C Action: Select Role Level -> Routes to Step 3 (Sign In with Position Context)
    function selectRoleLevel(roleLevel, posId) {
      if (!currentSelectedTeam) return;
      const pos = currentSelectedTeam.positions.find(p => p.id === posId || p.roleLevel === roleLevel);
      if (!pos) return;

      currentSelectedPosition = pos;
      const comp = companiesDatabase[currentSelectedCompany] || companiesDatabase.microsoft;

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

      // Pre-fill a realistic matching email
      const emailInput = document.getElementById('signin-email');
      const passwordInput = document.getElementById('signin-password');
      const cleanTitle = pos.title.toLowerCase().replace(/[^a-z0-9]/g, '.');
      const domain = comp.domain ? comp.domain.replace('@', '') : 'microsoft.in';

      if (emailInput) {
        emailInput.value = \`rohan.\${cleanTitle.substring(0, 15)}@\${domain}\`;
      }
      if (passwordInput) {
        passwordInput.value = 'demo1234';
      }

      handleEmailInput(emailInput ? emailInput.value : '');

      showNotification(\`Role Position Set: \${pos.fullTitle}\`);
      goToStep('step-signin');
    }
`;

// Insert the JS controller code into index.html right before selectCompany definition
html = html.replace('function selectCompany(companyKey) {', jsControllerCode + '\n    // Original selectCompany fallback wrapper\n    function legacySelectCompany(companyKey) {');

// Update handleMemberSignIn to honor currentSelectedPosition if set
const patchedSignInCode = `
      // Inject selected hierarchy context if coming through the 18 departments wizard
      if (currentSelectedPosition && currentSelectedDept && currentSelectedTeam) {
        if (detection.role === 'joiner' || !detection.role) {
          const synthesized = {
            employee: {
              employeeId: 'E-POS-' + currentSelectedPosition.id,
              name: (email.split('@')[0].replace('.', ' ').replace(/(^|\\s)\\S/g, l => l.toUpperCase())) || 'Rohan Sharma',
              email: email,
              role: currentSelectedPosition.title,
              fullTitle: currentSelectedPosition.fullTitle,
              roleLevel: currentSelectedPosition.roleLevel,
              department: currentSelectedDept.name,
              team: currentSelectedTeam.name,
              branch: currentSelectedBranch ? currentSelectedBranch.name : currentSelectedDept.name,
              location: 'Bengaluru / Redmond IDC',
              startDate: '2026-10-04',
              status: 'Active',
              buddyName: 'Rahul Pandey (Senior Mentor)',
              buddyEmail: 'rahul.pandey@microsoft.in',
              hrName: 'Priya Nair (People Partner)',
              hrEmail: 'priya.nair@microsoft.in'
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
                title: \`Day 1 Welcome & \${currentSelectedDept.name} Overview\`,
                desc: \`Complete the department orientation for \${currentSelectedTeam.name} and review team deliverables as \${currentSelectedPosition.fullTitle}.\`,
                day: 'Day 1',
                category: currentSelectedDept.name,
                priority: 'High',
                done: true
              },
              {
                id: 2,
                title: \`Setup Workstation & Tooling for \${currentSelectedPosition.title}\`,
                desc: \`Configure security certificates, corporate repositories, and staging environment for \${currentSelectedTeam.name}.\`,
                day: 'Day 1',
                category: 'Engineering',
                priority: 'High',
                done: false
              },
              {
                id: 3,
                title: \`1:1 Technical Mentorship Kickoff with Assigned Buddy\`,
                desc: \`Meet with senior buddy for sprint cadence, architecture overview, and \${currentSelectedPosition.roleLevel} role expectations.\`,
                day: 'Day 1',
                category: 'Mentoring',
                priority: 'Medium',
                done: false
              },
              {
                id: 4,
                title: \`Complete Zero-Trust Security & Data Handling Compliance\`,
                desc: \`Review Microsoft confidential data guidelines and complete mandatory security assessment.\`,
                day: 'Day 2',
                category: 'Security',
                priority: 'High',
                done: false
              },
              {
                id: 5,
                title: \`Sprint Backlog & First Task Assignment in \${currentSelectedTeam.name}\`,
                desc: \`Review squad backlog on Azure DevOps and pick up your first starter story as \${currentSelectedPosition.title}.\`,
                day: 'Day 3',
                category: 'Engineering',
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
          return;
        }
      }
`;

if (!html.includes('Inject selected hierarchy context if coming through the 18 departments wizard')) {
  html = html.replace('if (detection.role === \'joiner\') {', patchedSignInCode + '\n      if (detection.role === \'joiner\') {');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully updated index.html with complete 18 departments and role-level selection!');
