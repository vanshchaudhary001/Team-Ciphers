const fs = require('fs');
const path = require('path');

// Read existing datasets to ensure seamless lookup
const datasetsPath = path.resolve(__dirname, '../client/public/datasets.json');
const datasets = JSON.parse(fs.readFileSync(datasetsPath, 'utf8'));

// Build detailed task elaboration database for all 40 tasks
const DEEP_TASK_DETAILS = {
  T001: {
    objective: "Activating your corporate account establishes your cryptographic digital identity within Microsoft Entra ID (Azure Active Directory) and Okta Federated SSO. This credentials provision is the prerequisite master key for your corporate inbox, Microsoft Teams, GitHub Enterprise, HashiCorp Vault, and cloud environments. Failure to activate within 24 hours of Day 1 triggers automated IT security quarantine.",
    steps: [
      "Access the Enterprise Identity Self-Service Portal at <code>https://identity.microsoft.internal/activate</code>.",
      "Enter your temporary corporate username (sent to your personal email) and the one-time temporary activation token.",
      "Establish a compliant enterprise password: Minimum 14 characters, combining uppercase letters, numbers, and non-alphanumeric symbols. Dictionary words or common sequences are strictly rejected by policy.",
      "Federate your corporate email address (e.g. <code>aarav.sharma2026@microsoft.in</code>) and register your statutory backup verification mobile number.",
      "Review the Enterprise Acceptable Use Policy and submit digital acceptance."
    ],
    verification: "Navigate to <code>https://portal.office.com</code> and verify successful federated sign-in with your new corporate password without encountering access challenge errors.",
    troubleshooting: [
      "<strong>Invalid or Expired Activation Token:</strong> Tokens expire 48 hours post-issuance. Contact Rahul Mehta at +91 80 6789 89910 or ping #it-helpdesk on Slack to trigger an instant token re-issuance.",
      "<strong>Password Policy Violation:</strong> Avoid using your name, employee ID, or common words like 'Password@123'. Use an alphanumeric passphrase such as 'Cloud#Apex2026!Azure'."
    ]
  },
  T002: {
    objective: "Multi-Factor Authentication (MFA) enforces Zero-Trust boundary compliance (SOC-2 Type II & ISO 27001). It requires cryptographic proof of possession (smartphone authenticator app or hardware FIDO2 YubiKey) in addition to your master password before granting token access to sensitive developer repositories, VPNs, and production clusters.",
    steps: [
      "Download and install <strong>Microsoft Authenticator</strong> or <strong>Google Authenticator</strong> from the Apple App Store or Google Play Store on your corporate-registered mobile device.",
      "On your workstation, navigate to the MFA Registration Dashboard at <code>https://mysignins.microsoft.com/security-info</code>.",
      "Click <strong>'Add sign-in method'</strong>, select <strong>'Authenticator app'</strong>, and click <strong>'Set up'</strong> to display your unique encrypted enterprise QR code.",
      "In your mobile app, tap <strong>'+' -> 'Work or school account' -> 'Scan QR code'</strong> and align your camera with the screen.",
      "Approve the test notification prompt on your phone by entering the two-digit challenge number displayed on your laptop monitor.",
      "CRITICAL: Generate your 10 one-time emergency bypass recovery codes. Copy and store them in an encrypted password vault (Bitwarden / 1Password)."
    ],
    verification: "Open an Incognito / Private browser tab, browse to <code>https://myworkplace.internal</code>, log in, and verify that your phone receives an instant push verification prompt.",
    troubleshooting: [
      "<strong>Push Notification Timeout:</strong> Ensure mobile notifications are enabled for the Authenticator app. If push fails, select 'I can't use my Authenticator app right now' to enter the 6-digit rolling TOTP code manually.",
      "<strong>Device Clock Drift:</strong> TOTP codes require clock synchronization. In your phone's Authenticator app settings, select 'Sync Time' to align with NTP servers."
    ]
  },
  T003: {
    objective: "Completing your statutory employee profile in Workday HRMS synchronizes your legal payroll records, benefits eligibility, PF/Provident Fund / 401(k) allocations, group health insurance coverage, and official emergency escalation tree.",
    steps: [
      "Log into the Workday Employee Portal using your newly activated corporate SSO credentials.",
      "Navigate to <strong>Personal Information -> Complete Profile</strong>.",
      "Upload high-resolution scans of your government photo identification (Passport / PAN / National ID) and proof of permanent address.",
      "Input your primary commercial bank account number and IFSC/routing code for direct monthly payroll deposits.",
      "Designate at least two emergency contacts with verified mobile phone numbers and family relationship tags.",
      "Submit the digital onboarding verification questionnaire and download your submission receipt."
    ],
    verification: "Your Workday profile banner changes from 'Pending Employee Actions' to a green verified badge 'Onboarding Profile 100% Completed'.",
    troubleshooting: [
      "<strong>Bank Account Name Mismatch:</strong> The name on your salary account must match your legal hiring offer name. If there is a variation, contact Priya Nair (HR Operations) to attach an affidavit verification."
    ]
  },
  T004: {
    objective: "The Global Employee Handbook outlines the corporate code of business conduct, ethical integrity policies, open-source software contribution rules, intellectual property assignment, and non-disclosure standards.",
    steps: [
      "Download the PDF package of the Global Code of Business Conduct & Employee Handbook from the HR Resources directory.",
      "Carefully review Section 4 (Confidentiality & Insider Information) and Section 7 (Workplace Harassment & Whistleblower Protections).",
      "Pay specific attention to the Open-Source Contribution Policy: Employees must receive formal Open-Source Review Board (OSRB) clearance before publishing internal code to public repositories.",
      "Sign the electronic acknowledgement form on DocuSign / Adobe Sign confirming your comprehension and compliance."
    ],
    verification: "Confirm that your DocuSign audit certificate is linked to your Workday compliance profile.",
    troubleshooting: [
      "<strong>DocuSign Session Timeout:</strong> If the signing page expires, clear browser cookies or reopen the unique signing link delivered to your corporate inbox."
    ]
  },
  T005: {
    objective: "Mandatory Cyber Security Awareness training educates new joiners on social engineering vectors, spear-phishing campaigns, clean desk & screen lock protocols, confidential data classification, and zero-day threat reporting procedures.",
    steps: [
      "Launch the Enterprise Security Learning Management System (LMS) at <code>https://learn.security.internal</code>.",
      "Complete Module 1: Phishing & Spear-Phishing Detection (real-world simulation scenarios).",
      "Complete Module 2: Data Classification & Safe Handling (Public vs Internal vs Confidential vs Restricted).",
      "Complete Module 3: Physical Device Security (enforcing Win+L screen locks, BitLocker disk encryption, no unauthorized USB drives).",
      "Score 90% or higher on the comprehensive 10-question evaluation quiz."
    ],
    verification: "The Security LMS issues a digital certificate of completion and automatically checks off your SOC-2 compliance ticket in Jira.",
    troubleshooting: [
      "<strong>Failed Quiz Attempt:</strong> If you score below 90%, review the missed modules and immediately retake the quiz. There is no penalty or cooling-off period."
    ]
  },
  T006: {
    objective: "Your Onboarding Buddy is a designated senior peer mentor tasked with integrating you into the squad, teaching team sprint cadence, explaining unwritten team norms, and unblocking local development challenges.",
    steps: [
      "Check your Outlook / Google Calendar for the scheduled 45-minute 'Buddy Intro & Sprint Pairing' calendar invite.",
      "Review your buddy's bio and tech stack background (Dhruv Agarwal · Senior Full-Stack Engineer · 4+ years on team).",
      "Prepare 3 concrete questions regarding the team's repository conventions, branching model, and deployment schedule.",
      "Join the Microsoft Teams / Zoom video call and discuss your 30-day onboarding milestones.",
      "Ask your buddy to add you to the squad Slack/Teams channel and introduce you to your sprint squad."
    ],
    verification: "Your buddy submits an onboarding buddy sync confirmation to People Operations via the portal.",
    troubleshooting: [
      "<strong>Buddy Reschedule / Conflict:</strong> If your buddy is engaged in a production incident, ping them on Slack or call directly at +91 80 6789 89928 to propose an alternate time on Day 1."
    ]
  },
  T007: {
    objective: "The Day 1 Company Orientation provides a comprehensive briefing from leadership on organizational mission, annual revenue goals, executive team structure, and strategic product roadmaps.",
    steps: [
      "Join the live virtual Townhall or auditorium broadcast session at 11:00 AM.",
      "Listen to executive keynote presentations from the VP of Engineering and Head of People Operations.",
      "Participate in the live interactive Q&A session using Slido / Teams Live.",
      "Connect with fellow cohort freshers and bookmark the cohort Slack channel."
    ],
    verification: "Orientation attendance is automatically registered via your Teams / Zoom single sign-on login.",
    troubleshooting: [
      "<strong>Live Stream Audio/Video Glitch:</strong> Use your enterprise VPN connection and ensure you are connected to the corporate high-bandwidth Wi-Fi network."
    ]
  },
  T008: {
    objective: "Configuring your corporate email synchronizes your calendar, team mail distribution lists, IT announcements, automated Jira/GitHub notifications, and client communications.",
    steps: [
      "Launch Microsoft Outlook or Outlook Web App at <code>https://outlook.office.com</code>.",
      "Authenticate using your corporate email and approve the MFA challenge on your mobile device.",
      "Configure your standardized corporate email signature using the corporate template (Name, Role, Department, Pronouns, Office Location).",
      "Subscribe to squad distribution lists: <code>eng-all@company.com</code>, <code>freshers-2026@company.com</code>, and <code>team-updates@company.com</code>.",
      "Set your calendar working hours (e.g. 9:30 AM - 6:30 PM IST) and primary working location."
    ],
    verification: "Send a test ping email to your buddy (<code>buddy@demo-company.com</code>) and verify delivery without bounce-backs.",
    troubleshooting: [
      "<strong>Mailbox Provisioning Delay:</strong> New mailboxes may take up to 30 minutes to propagate across Exchange Online. If access fails after 30 mins, ping IT Support."
    ]
  },
  T009: {
    objective: "Understanding corporate leave and attendance policies ensures transparent time management, statutory compliance, and predictable sprint delivery across globally distributed teams.",
    steps: [
      "Open the HR Time & Attendance portal in Workday.",
      "Review the Leave Policy Guide: Accrual rates for Paid Time Off (PTO), sick leaves, casual leaves, and bereavement leaves.",
      "Note the 14-day advance notice requirement for planned PTO vacations longer than 3 business days.",
      "Familiarize yourself with the core working hours (10:00 AM - 4:00 PM) where overlap is expected for team standups and code reviews.",
      "Review the public holiday calendar for your office location (Bangalore / Hyderabad / Redmond)."
    ],
    verification: "Submit a mock 0-day training leave inquiry in the portal to verify your routing manager is correctly assigned.",
    troubleshooting: [
      "<strong>Incorrect Manager Assigned:</strong> If Workday routes leave requests to an unknown manager, contact Priya Nair (HR) with your department code."
    ]
  },
  T010: {
    objective: "Familiarizing yourself with corporate benefits allows you to enroll dependents in health insurance, opt into retirement savings matching, and claim learning and wellness allowances.",
    steps: [
      "Navigate to <strong>Workday -> Benefits & Wellbeing</strong>.",
      "Review Group Medical Insurance policy details (coverage for self, spouse, children, and dependent parents up to ₹10,00,000 / $50,000).",
      "Enroll your eligible dependents within the mandatory 30-day initial enrollment window.",
      "Review the Annual Wellness Allowance (gym memberships, fitness trackers, ergonomics equipment).",
      "Explore the Continuous Learning Stipend ($1,500/year for books, cloud certifications, and tech conferences)."
    ],
    verification: "Your benefits election confirmation statement is generated with policy group numbers.",
    troubleshooting: [
      "<strong>Dependent Document Requirements:</strong> Dependent enrollment requires government birth / marriage certificates. Upload high-res copies under 'Beneficiary Documents'."
    ]
  },
  T011: {
    objective: "Workplace safety training covers emergency evacuation procedures, fire warden locations, first-aid station locations, and workstation ergonomics to ensure physical wellbeing in the office.",
    steps: [
      "Complete the 20-minute Workplace Health & Safety module on the LMS.",
      "Review the floor plan showing emergency fire exits, automated external defibrillators (AEDs), and assembly points.",
      "Adjust your ergonomic desk setup: Monitor at eye level, chair lumbar support aligned, elbows at 90 degrees.",
      "Save the Corporate Emergency SOS hotline (+91 80 6789 9111) in your mobile contacts."
    ],
    verification: "Receive an automated confirmation of safety compliance on your HR dashboard.",
    troubleshooting: [
      "<strong>Ergonomic Equipment Request:</strong> If you require an ergonomic keyboard, mouse, or footrest, submit an IT Facilities ticket on the internal portal."
    ]
  },
  T012: {
    objective: "The 1-on-1 meeting with your Reporting Manager aligns your onboarding focus with squad delivery targets, clarifies 30-60-90 day performance expectations, and establishes direct trust.",
    steps: [
      "Review your manager's welcome agenda and background (Vikram Shah · Director of Engineering).",
      "Prepare a summary of your technical background, preferred programming stacks, and learning interests.",
      "Discuss your 30-Day Milestone: Completing onboarding, submitting first PR, and mastering team deployment pipeline.",
      "Discuss your 60-Day Milestone: Owning an independent feature end-to-end with unit test coverage.",
      "Discuss your 90-Day Milestone: Participating in on-call rotation shadow and contributing to architecture RFCs.",
      "Agree on a recurring weekly 30-minute 1-on-1 sync cadence."
    ],
    verification: "Your manager approves your onboarding roadmap in the engineering talent tracking tool.",
    troubleshooting: [
      "<strong>Meeting Scheduling Conflict:</strong> If your manager is pulled into leadership reviews, message their executive assistant to lock in the next available open slot."
    ]
  },
  T013: {
    objective: "Joining official departmental Slack / Microsoft Teams channels integrates you into real-time squad discussions, incident response alerts, and technical design forums.",
    steps: [
      "Open your corporate Slack / Teams client.",
      "Join mandatory team channels: <code>#eng-general</code>, <code>#eng-announcements</code>, <code>#cloud-platform</code>, <code>#fresher-cohort-2026</code>.",
      "Join your squad-specific channel: <code>#squad-core-services</code> or <code>#squad-frontend-architecture</code>.",
      "Post a short, friendly introduction: Name, university/previous experience, team role, hobbies, and a picture or favorite GIF.",
      "Configure your notification preferences to prevent alert fatigue during deep work hours."
    ],
    verification: "Receive welcome reactions from your teammates and buddy in your squad channel.",
    troubleshooting: [
      "<strong>Private Channel Invitation Needed:</strong> Some squad channels are private. Ping your buddy Dhruv Agarwal to add you to restricted engineering channels."
    ]
  },
  T014: {
    objective: "GitHub Enterprise access is the fundamental software development workspace. Setting up SSH keys and commit signing ensures cryptographic provenance (SOC-2 requirement) for every line of code you contribute, preventing commit spoofing and unauthorized repo access.",
    steps: [
      "Open your corporate inbox and accept the invitation to the <strong>Enterprise GitHub Organization</strong> (<code>github.com/enterprises/corporate-org</code>).",
      "Link your personal GitHub account with your corporate Single Sign-On (SSO) SAML identity.",
      "Generate a modern ed25519 cryptographic SSH key in your terminal:<br><pre style='background:rgba(0,0,0,0.4);padding:8px;border-radius:6px;color:#a5f3fc;'>ssh-keygen -t ed25519 -C \"aarav.sharma2026@microsoft.in\"</pre>",
      "Copy your public key to clipboard:<br><pre style='background:rgba(0,0,0,0.4);padding:8px;border-radius:6px;color:#a5f3fc;'>cat ~/.ssh/id_ed25519.pub | clip</pre>",
      "Navigate to <strong>GitHub -> Settings -> SSH and GPG keys -> New SSH Key</strong>, paste the key, and click <strong>'Configure SSO'</strong> to authorize with your corporate credentials.",
      "Configure global Git identity settings in your terminal:<br><pre style='background:rgba(0,0,0,0.4);padding:8px;border-radius:6px;color:#a5f3fc;'>git config --global user.name \"Aarav Sharma\"\ngit config --global user.email \"aarav.sharma2026@microsoft.in\"</pre>"
    ],
    verification: "Execute in terminal: <pre style='background:rgba(0,0,0,0.4);padding:8px;border-radius:6px;color:#a5f3fc;'>ssh -T git@github.com</pre> Expected output: <em>'Hi username! You've successfully authenticated, but GitHub does not provide shell access.'</em>",
    troubleshooting: [
      "<strong>Permission Denied (publickey):</strong> Ensure your SSH agent is running (<code>eval $(ssh-agent -s)</code>) and your key is loaded (<code>ssh-add ~/.ssh/id_ed25519</code>).",
      "<strong>SSO Authorization Missing:</strong> You must click the 'Authorize' button next to the enterprise org in your GitHub SSH keys settings."
    ]
  },
  T015: {
    objective: "Setting up a standardized, reproducible local development environment ensures zero discrepancy between local testing and remote CI/CD containers. It installs compilers, runtimes, package managers, and container daemons.",
    steps: [
      "Install Homebrew (macOS) or WSL2 with Ubuntu 22.04 LTS (Windows).",
      "Install Node.js LTS via <code>nvm</code> (Node Version Manager):<br><pre style='background:rgba(0,0,0,0.4);padding:8px;border-radius:6px;color:#a5f3fc;'>nvm install 20 && nvm use 20</pre>",
      "Install <strong>Docker Desktop</strong> (Enterprise License) and enable the WSL2 integration or Docker daemon.",
      "Install <strong>Visual Studio Code</strong> or <strong>JetBrains IntelliJ IDEA Ultimate</strong>.",
      "Install required team extensions: ESLint, Prettier, GitLens, Docker, SonarQube, and GitHub Copilot Enterprise.",
      "Clone the local dev bootstrap repository:<br><pre style='background:rgba(0,0,0,0.4);padding:8px;border-radius:6px;color:#a5f3fc;'>git clone git@github.com:corporate-org/dev-bootstrap.git && cd dev-bootstrap && ./setup.sh</pre>"
    ],
    verification: "Run <code>docker --version && node -v && npm -v</code> and verify all runtimes return supported enterprise LTS versions.",
    troubleshooting: [
      "<strong>Docker Engine Daemon Not Starting:</strong> Ensure virtualization (VT-x / AMD-V) is enabled in BIOS and Hyper-V is running on Windows.",
      "<strong>Corporate Proxy SSL Interception:</strong> If npm fails with self-signed certificate errors, install the corporate root CA bundle (<code>export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/corporate-ca.pem</code>)."
    ]
  },
  T016: {
    objective: "Engineering Coding Guidelines ensure maintainability, testability, and security across millions of lines of code. Following linting rules, naming conventions, and pull request etiquette guarantees fast, frictionless code reviews.",
    steps: [
      "Review the Engineering Handbook repository section on <strong>TypeScript & Go Design Patterns</strong>.",
      "Learn the Git Branching Standard: <code>feature/JIRA-1234-short-desc</code>, <code>fix/JIRA-5678-bug-fix</code>, or <code>chore/upgrade-deps</code>.",
      "Understand the Commit Message Convention: Follow Conventional Commits (e.g. <code>feat(auth): implement oauth token refresh flow</code>).",
      "Review Pull Request requirements: Minimum 80% automated unit test coverage, zero critical SonarQube security smells, and approval from 2 senior squad engineers.",
      "Install the pre-commit Git hook that runs local linting and secrets detection before every commit."
    ],
    verification: "Create a test branch, stage a small commit, and observe the pre-commit hook automatically lint and format your code.",
    troubleshooting: [
      "<strong>Pre-commit Hook Failure:</strong> Run <code>npm run lint -- --fix</code> or <code>npx prettier --write .</code> to automatically correct syntax formatting."
    ]
  },
  T017: {
    objective: "Reviewing the software architecture allows engineers to understand how microservices communicate, how data flows through event streams (Kafka), how caching layers operate (Redis), and how Kubernetes deploys workloads across multi-region cloud clusters.",
    steps: [
      "Open the Software Architecture Portal on Confluence / Miro.",
      "Examine the High-Level System Architecture Diagram (Edge CloudFront -> API Gateway -> Service Mesh -> Microservices -> PostgreSQL / Aurora / DynamoDB).",
      "Review the asynchronous messaging topology: Kafka event buses for order processing, telemetry, and background notifications.",
      "Inspect the OpenAPI / Swagger specifications at <code>https://api-docs.internal.demo</code>.",
      "Schedule a 30-minute architecture walkthrough pairing session with your Tech Lead or Buddy."
    ],
    verification: "Summarize the flow of an authenticated user request from Edge to Database to your buddy during your afternoon pairing session.",
    troubleshooting: [
      "<strong>Miro / Confluence Access Missing:</strong> Request 'Architecture Reader' group access via the Identity Self-Service portal."
    ]
  },
  T018: {
    objective: "Joining the engineering repository connects you to the live monorepo containing your squad's active microservices. Running local integration tests verifies end-to-end build health.",
    steps: [
      "Clone your squad's primary repository:<br><pre style='background:rgba(0,0,0,0.4);padding:8px;border-radius:6px;color:#a5f3fc;'>git clone git@github.com:corporate-org/core-platform-services.git</pre>",
      "Install repository dependencies using npm / pnpm / yarn:<br><pre style='background:rgba(0,0,0,0.4);padding:8px;border-radius:6px;color:#a5f3fc;'>cd core-platform-services && npm install</pre>",
      "Copy the example environment configuration:<br><pre style='background:rgba(0,0,0,0.4);padding:8px;border-radius:6px;color:#a5f3fc;'>cp .env.example .env.local</pre>",
      "Launch local mock services using Docker Compose:<br><pre style='background:rgba(0,0,0,0.4);padding:8px;border-radius:6px;color:#a5f3fc;'>docker compose -f docker-compose.dev.yml up -d</pre>",
      "Execute the automated test suite:<br><pre style='background:rgba(0,0,0,0.4);padding:8px;border-radius:6px;color:#a5f3fc;'>npm run test:unit</pre>"
    ],
    verification: "Verify terminal outputs <code>PASS: 142 tests completed successfully</code> with 0 errors.",
    troubleshooting: [
      "<strong>Port Conflict (EADDRINUSE):</strong> If port 5432 or 6379 is occupied, check for running local databases (<code>lsof -i :5432</code>) or stop conflicting containers."
    ]
  },
  T019: {
    objective: "Code security training covers secure software development lifecycle (SSDLC), OWASP Top 10 vulnerabilities (SQLi, XSS, SSRF, broken access control), secrets management via Vault, and container vulnerability scanning.",
    steps: [
      "Complete the 45-minute Interactive Secure Coding Lab on SecureCodeWarrior / HackEDU.",
      "Learn secrets management policy: NEVER commit API keys, private keys, passwords, or tokens to Git. Use environment variables sourced from HashiCorp Vault or AWS Secrets Manager.",
      "Configure <code>git-secrets</code> on your workstation to automatically prevent accidental credential commits.",
      "Learn how to review Dependabot / Snyk dependency vulnerability alerts."
    ],
    verification: "Complete the practical SQL injection & XSS remediation lab with 100% score.",
    troubleshooting: [
      "<strong>False Positive Secret Detection:</strong> If a mock test key triggers a commit block, use approved test placeholder formats (e.g. <code>EXAMPLE_API_KEY_000000000000</code>)."
    ]
  },
  T020: {
    objective: "Meeting the engineering team establishes direct human connection with your squad peers, QA automation engineers, Product Manager (PM), and Engineering Director. It integrates you into daily agile ceremonies.",
    steps: [
      "Attend the daily 15-minute Squad Standup at 10:00 AM.",
      "Introduce yourself: Briefly share your role, your squad focus, and what you're completing on Day 1.",
      "Pair with a mid-level or senior engineer during their afternoon sprint task for 1 hour to observe active pull request reviews.",
      "Join the bi-weekly Sprint Retrospective and Sprint Demo calendar series.",
      "Ask your PM to assign you a 'Good First Issue' bug or minor feature ticket in Jira for Day 3."
    ],
    verification: "Your Product Manager assigns you an initial onboarding ticket in Jira Sprint Backlog.",
    troubleshooting: [
      "<strong>Standup Link Missing:</strong> Check your squad Slack channel topic banner for the recurring meeting link."
    ]
  }
};

// Generic elaboration generator for tasks 21 to 40 or custom dynamic tasks
function generateGenericDeepElaboration(task) {
  const dept = task.department || 'Enterprise';
  const role = task.applicableRole || 'Team Member';
  const helper = (task.assignedBy === 'IT') ? 'Rahul Mehta (IT Support Lead · +91 80 6789 89910)' :
                 (task.assignedBy === 'HR') ? 'Priya Nair (HR Operations Partner · +91 80 6789 89912)' :
                 (task.assignedBy === 'Security') ? 'Karan Patel (Cybersecurity Lead · +91 80 6789 89915)' :
                 'Dhruv Agarwal (Senior Buddy & Mentor · +91 80 6789 89928)';

  return {
    objective: `${task.taskName} is a foundational requirement for ${role} professionals within the ${dept} department. Completing this ensures full access to operational tools, cross-functional databases, compliance frameworks, and collaboration channels required for day-to-day excellence.`,
    steps: [
      `Navigate to the official ${dept} portal using your corporate SSO credentials.`,
      `Verify that your profile permissions match the required access group for ${role}.`,
      `Review standard operating procedures (SOP), templates, and metric dashboards associated with ${task.taskName}.`,
      `Configure your local workspace or tool licenses according to departmental security standards.`,
      `Coordinate with your assigned supervisor or squad lead to validate deliverables and unlock dependent workflows.`
    ],
    verification: `Confirm active status on your departmental dashboard with zero pending permissions warnings.`,
    troubleshooting: [
      `<strong>Access Permission Pending:</strong> If the portal displays an 'Access Denied' message, verify that your manager has approved the role entitlement ticket in ServiceDesk.`,
      `<strong>Tool License Exhaustion:</strong> Contact your designated support lead to allocate an enterprise seat license.`
    ]
  };
}

// Function to generate the comprehensive, deep HTML card
function buildDeepElaborationHtml(task) {
  const isDone = task.status === 'Completed' || task.done;
  const taskId = task.taskId || task.id;
  const tTitle = task.taskName || task.title;

  const detail = DEEP_TASK_DETAILS[taskId] || generateGenericDeepElaboration(task);

  const helperName = (task.assignedBy === 'IT') ? 'Rahul Mehta' :
                     (task.assignedBy === 'HR') ? 'Priya Nair' :
                     (task.assignedBy === 'Security') ? 'Karan Patel' :
                     'Dhruv Agarwal';
  const helperRole = (task.assignedBy === 'IT') ? 'Lead IT Systems Architect' :
                     (task.assignedBy === 'HR') ? 'Senior HR Business Partner' :
                     (task.assignedBy === 'Security') ? 'Information Security Officer' :
                     'Senior Onboarding Buddy & Mentor';
  const helperPhone = (task.assignedBy === 'IT') ? '+91 80 6789 89910' :
                      (task.assignedBy === 'HR') ? '+91 80 6789 89912' :
                      (task.assignedBy === 'Security') ? '+91 80 6789 89915' :
                      '+91 80 6789 89928';
  const helperEmail = (task.assignedBy === 'IT') ? 'it@demo-company.com' :
                      (task.assignedBy === 'HR') ? 'hr@demo-company.com' :
                      (task.assignedBy === 'Security') ? 'security@demo-company.com' :
                      'buddy@demo-company.com';

  let stepsHtml = '';
  detail.steps.forEach((step, idx) => {
    stepsHtml += `
      <div style="display: flex; gap: 10px; margin-bottom: 8px; align-items: flex-start;">
        <span style="background: rgba(99, 102, 241, 0.3); color: #c7d2fe; font-weight: 800; font-size: 0.72rem; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">${idx + 1}</span>
        <div style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">${step}</div>
      </div>
    `;
  });

  let troubleshootHtml = '';
  detail.troubleshooting.forEach(tb => {
    troubleshootHtml += `
      <div style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 6px 10px; border-radius: 0 6px 6px 0; margin-bottom: 6px; font-size: 0.78rem; color: #e2e8f0; line-height: 1.45;">
        ${tb}
      </div>
    `;
  });

  const resourceLink = task.resource?.link || '/resources/onboarding-playbook';
  const resourceName = task.resource?.resourceName || task.resource?.name || 'Enterprise Onboarding & Security Standard Manual';

  return `
    <div class="deep-task-elaboration" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 12px; padding: 16px; margin-top: 6px; box-shadow: 0 8px 30px rgba(0,0,0,0.5); font-family: var(--font-sans);">
      
      <!-- Top Metadata Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.12); padding-bottom: 8px; margin-bottom: 10px; flex-wrap: wrap; gap: 6px;">
        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
          <span style="font-size: 0.72rem; font-weight: 800; background: rgba(99, 102, 241, 0.35); color: #c7d2fe; padding: 2px 8px; border-radius: 4px; font-family: var(--font-mono);">
            ${escapeHtml(taskId)}
          </span>
          <span style="font-size: 0.72rem; font-weight: 700; background: rgba(56, 189, 248, 0.15); color: #7dd3fc; padding: 2px 8px; border-radius: 4px;">
            ${escapeHtml(task.department || 'Core')} · ${escapeHtml(task.applicableRole || 'All')}
          </span>
          <span style="font-size: 0.72rem; font-weight: 700; background: rgba(245, 158, 11, 0.15); color: #fcd34d; padding: 2px 8px; border-radius: 4px;">
            📅 ${escapeHtml(task.day || 'Day 1')}
          </span>
          <span style="font-size: 0.72rem; font-weight: 700; background: rgba(239, 68, 68, 0.15); color: #fca5a5; padding: 2px 8px; border-radius: 4px;">
            ★ ${escapeHtml(task.priority || 'High')}
          </span>
        </div>
        <span style="font-size: 0.72rem; font-weight: 800; color: ${isDone ? '#34d399' : '#f87171'}; background: ${isDone ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)'}; padding: 2px 8px; border-radius: 4px;">
          ${isDone ? '✓ Completed' : '● Action Required'}
        </span>
      </div>

      <!-- Task Title & Quick Info -->
      <h3 style="font-size: 1.05rem; font-weight: 800; color: #ffffff; margin-bottom: 6px; line-height: 1.35;">
        ${escapeHtml(tTitle)}
      </h3>
      <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 12px; display: flex; gap: 14px; flex-wrap: wrap;">
        <span>⏱️ Estimated Duration: <strong style="color: #f1f5f9;">${escapeHtml(task.duration || '25 mins')}</strong></span>
        <span>📌 Assigned By: <strong style="color: #f1f5f9;">${escapeHtml(task.assignedBy || 'IT Operations')}</strong></span>
      </div>

      <!-- SECTION 1: Deep Strategic Objective & Impact -->
      <div style="background: rgba(30, 41, 59, 0.55); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
        <div style="font-size: 0.8rem; font-weight: 800; color: #a5b4fc; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>🎯</span> Strategic Objective & System Impact:
        </div>
        <p style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.55; margin: 0;">
          ${detail.objective}
        </p>
      </div>

      <!-- SECTION 2: Step-by-Step Implementation Guide -->
      <div style="margin-bottom: 12px;">
        <div style="font-size: 0.8rem; font-weight: 800; color: #93c5fd; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
          <span>📝</span> In-Depth Execution Playbook:
        </div>
        <div>
          ${stepsHtml}
        </div>
      </div>

      <!-- SECTION 3: Definition of Done & Verification -->
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
        <div style="font-size: 0.78rem; font-weight: 800; color: #34d399; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <span>🔍</span> Verification & Definition of Done:
        </div>
        <div style="font-size: 0.78rem; color: #e2e8f0; line-height: 1.5;">
          ${detail.verification}
        </div>
      </div>

      <!-- SECTION 4: Common Pitfalls & Blocker Troubleshooting -->
      <div style="margin-bottom: 12px;">
        <div style="font-size: 0.78rem; font-weight: 800; color: #f87171; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>⚠️</span> Common Pitfalls & Self-Service Troubleshooting:
        </div>
        <div>
          ${troubleshootHtml}
        </div>
      </div>

      <!-- SECTION 5: Official Documentation -->
      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 9px 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">📄</span>
        <div>
          <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Official Documentation:</div>
          <a href="${escapeHtml(resourceLink)}" target="_blank" style="color: #38bdf8; font-weight: 700; text-decoration: underline; font-size: 0.8rem;">
            ${escapeHtml(resourceName)}
          </a>
        </div>
      </div>

      <!-- SECTION 6: Support Lead & Escalation -->
      <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Designated Support Contact:</div>
          <div style="color: #f8fafc; font-weight: 800; font-size: 0.84rem;">${escapeHtml(helperName)} <span style="font-weight: 500; color: #cbd5e1; font-size: 0.75rem;">(${escapeHtml(helperRole)})</span></div>
          <div style="color: #cbd5e1; font-size: 0.74rem; font-family: var(--font-mono); margin-top: 2px;">📞 ${escapeHtml(helperPhone)} · 📧 ${escapeHtml(helperEmail)}</div>
        </div>
        <a href="tel:${escapeHtml(helperPhone)}" style="background: #059669; color: #ffffff; font-weight: 700; font-size: 0.75rem; padding: 5px 12px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
          📞 Direct Call
        </a>
      </div>

      <!-- Action Footer -->
      <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <button class="copilot-chip" style="background: ${isDone ? 'rgba(255,255,255,0.12)' : '#4f46e5'}; color: #fff; padding: 7px 16px; font-size: 0.78rem; font-weight: 700; border-radius: 6px; cursor: pointer; border: none;" onclick="toggleLiveTask('${task.progressId || ('P_' + taskId)}', '${task.status}', '${taskId}')">
          ${isDone ? '✓ Mark as Pending' : '✓ Mark Task as Completed'}
        </button>
        <button class="copilot-chip" style="background: rgba(255,255,255,0.08); color: #cbd5e1; padding: 7px 14px; font-size: 0.78rem; border-radius: 6px; cursor: pointer; border: none;" onclick="handleChatOption('contacts')">
          👥 All Direct Contacts
        </button>
      </div>

    </div>
  `;
}

// Convert DEEP_TASK_DETAILS and generator to code string to inject into html
const injectionCode = `
    const DEEP_TASK_DETAILS = ${JSON.stringify(DEEP_TASK_DETAILS)};

    function generateGenericDeepElaboration(task) {
      const dept = task.department || 'Enterprise';
      const role = task.applicableRole || 'Team Member';
      const helper = (task.assignedBy === 'IT') ? 'Rahul Mehta (IT Support Lead · +91 80 6789 89910)' :
                     (task.assignedBy === 'HR') ? 'Priya Nair (HR Operations Partner · +91 80 6789 89912)' :
                     (task.assignedBy === 'Security') ? 'Karan Patel (Cybersecurity Lead · +91 80 6789 89915)' :
                     'Dhruv Agarwal (Senior Buddy & Mentor · +91 80 6789 89928)';

      return {
        objective: \`\${task.taskName} is a foundational requirement for \${role} professionals within the \${dept} department. Completing this ensures full access to operational tools, cross-functional databases, compliance frameworks, and collaboration channels required for day-to-day engineering excellence.\`,
        steps: [
          \`Navigate to the official \${dept} portal using your corporate SSO credentials.\`,
          \`Verify that your profile permissions match the required access group for \${role}.\`,
          \`Review standard operating procedures (SOP), templates, and metric dashboards associated with \${task.taskName}.\`,
          \`Configure your local workspace or tool licenses according to departmental security standards.\`,
          \`Coordinate with your assigned supervisor or squad lead to validate deliverables and unlock dependent workflows.\`
        ],
        verification: \`Confirm active status on your departmental dashboard with zero pending permissions warnings.\`,
        troubleshooting: [
          \`<strong>Access Permission Pending:</strong> If the portal displays an 'Access Denied' message, verify that your manager has approved the role entitlement ticket in ServiceDesk.\`,
          \`<strong>Tool License Exhaustion:</strong> Contact your designated support lead to allocate an enterprise seat license.\`
        ]
      };
    }

    function getExplainTaskResponseHtml(taskId) {
      const allTasks = (currentLiveDashboard && currentLiveDashboard.tasks) ? currentLiveDashboard.tasks : (ALL_40_TASKS || []);
      const numId = parseInt(String(taskId).replace(/\\D/g, ''), 10) || 1;

      let task = allTasks.find(t => 
        String(t.taskId).toLowerCase() === String(taskId).toLowerCase() ||
        String(t.taskId).replace(/\\D/g, '') === String(taskId).replace(/\\D/g, '') ||
        parseInt(String(t.taskId).replace(/\\D/g, ''), 10) === numId
      );

      if (!task && dailyTasksState) {
        task = dailyTasksState.find(t => String(t.id) === String(taskId) || parseInt(String(t.id).replace(/\\D/g, ''), 10) === numId);
      }

      if (!task) {
        task = {
          taskId: 'T' + String(numId).padStart(3, '0'),
          taskName: 'Enterprise Onboarding Task #' + taskId,
          department: 'Engineering',
          applicableRole: 'Software Engineer',
          day: 'Day 1',
          priority: 'High',
          duration: '25 mins',
          description: 'Standard enterprise onboarding checklist requirement.'
        };
      }

      const isDone = task.status === 'Completed' || task.done;
      const tId = task.taskId || ('T' + String(numId).padStart(3, '0'));
      const tTitle = task.taskName || task.title;

      const detail = DEEP_TASK_DETAILS[tId] || DEEP_TASK_DETAILS['T' + String(numId).padStart(3, '0')] || generateGenericDeepElaboration(task);

      const helperName = (task.assignedBy === 'IT') ? 'Rahul Mehta' :
                         (task.assignedBy === 'HR') ? 'Priya Nair' :
                         (task.assignedBy === 'Security') ? 'Karan Patel' :
                         'Dhruv Agarwal';
      const helperRole = (task.assignedBy === 'IT') ? 'Lead IT Systems Architect' :
                         (task.assignedBy === 'HR') ? 'Senior HR Business Partner' :
                         (task.assignedBy === 'Security') ? 'Information Security Officer' :
                         'Senior Onboarding Buddy & Mentor';
      const helperPhone = (task.assignedBy === 'IT') ? '+91 80 6789 89910' :
                          (task.assignedBy === 'HR') ? '+91 80 6789 89912' :
                          (task.assignedBy === 'Security') ? '+91 80 6789 89915' :
                          '+91 80 6789 89928';
      const helperEmail = (task.assignedBy === 'IT') ? 'it@demo-company.com' :
                          (task.assignedBy === 'HR') ? 'hr@demo-company.com' :
                          (task.assignedBy === 'Security') ? 'security@demo-company.com' :
                          'buddy@demo-company.com';

      let stepsHtml = '';
      detail.steps.forEach((step, idx) => {
        stepsHtml += \`
          <div style="display: flex; gap: 10px; margin-bottom: 8px; align-items: flex-start;">
            <span style="background: rgba(99, 102, 241, 0.3); color: #c7d2fe; font-weight: 800; font-size: 0.72rem; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">\${idx + 1}</span>
            <div style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">\${step}</div>
          </div>
        \`;
      });

      let troubleshootHtml = '';
      detail.troubleshooting.forEach(tb => {
        troubleshootHtml += \`
          <div style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 6px 10px; border-radius: 0 6px 6px 0; margin-bottom: 6px; font-size: 0.78rem; color: #e2e8f0; line-height: 1.45;">
            \${tb}
          </div>
        \`;
      });

      const resourceLink = task.resource?.link || '/resources/onboarding-playbook';
      const resourceName = task.resource?.resourceName || task.resource?.name || 'Enterprise Onboarding & Security Standard Manual';

      return \`
        <div class="deep-task-elaboration" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 12px; padding: 16px; margin-top: 6px; box-shadow: 0 8px 30px rgba(0,0,0,0.5); font-family: var(--font-sans);">
          
          <!-- Top Metadata Header -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.12); padding-bottom: 8px; margin-bottom: 10px; flex-wrap: wrap; gap: 6px;">
            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              <span style="font-size: 0.72rem; font-weight: 800; background: rgba(99, 102, 241, 0.35); color: #c7d2fe; padding: 2px 8px; border-radius: 4px; font-family: var(--font-mono);">
                \${escapeHtml(tId)}
              </span>
              <span style="font-size: 0.72rem; font-weight: 700; background: rgba(56, 189, 248, 0.15); color: #7dd3fc; padding: 2px 8px; border-radius: 4px;">
                \${escapeHtml(task.department || 'Core')} · \${escapeHtml(task.applicableRole || 'All')}
              </span>
              <span style="font-size: 0.72rem; font-weight: 700; background: rgba(245, 158, 11, 0.15); color: #fcd34d; padding: 2px 8px; border-radius: 4px;">
                📅 \${escapeHtml(task.day || 'Day 1')}
              </span>
              <span style="font-size: 0.72rem; font-weight: 700; background: rgba(239, 68, 68, 0.15); color: #fca5a5; padding: 2px 8px; border-radius: 4px;">
                ★ \${escapeHtml(task.priority || 'High')}
              </span>
            </div>
            <span style="font-size: 0.72rem; font-weight: 800; color: \${isDone ? '#34d399' : '#f87171'}; background: \${isDone ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)'}; padding: 2px 8px; border-radius: 4px;">
              \${isDone ? '✓ Completed' : '● Action Required'}
            </span>
          </div>

          <!-- Task Title & Quick Info -->
          <h3 style="font-size: 1.05rem; font-weight: 800; color: #ffffff; margin-bottom: 6px; line-height: 1.35;">
            \${escapeHtml(tTitle)}
          </h3>
          <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 12px; display: flex; gap: 14px; flex-wrap: wrap;">
            <span>⏱️ Estimated Duration: <strong style="color: #f1f5f9;">\${escapeHtml(task.duration || '25 mins')}</strong></span>
            <span>📌 Assigned By: <strong style="color: #f1f5f9;">\${escapeHtml(task.assignedBy || 'IT Operations')}</strong></span>
          </div>

          <!-- SECTION 1: Deep Strategic Objective & Impact -->
          <div style="background: rgba(30, 41, 59, 0.55); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
            <div style="font-size: 0.8rem; font-weight: 800; color: #a5b4fc; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>🎯</span> Strategic Objective & System Impact:
            </div>
            <p style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.55; margin: 0;">
              \${detail.objective}
            </p>
          </div>

          <!-- SECTION 2: Step-by-Step Implementation Guide -->
          <div style="margin-bottom: 12px;">
            <div style="font-size: 0.8rem; font-weight: 800; color: #93c5fd; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span>📝</span> In-Depth Execution Playbook:
            </div>
            <div>
              \${stepsHtml}
            </div>
          </div>

          <!-- SECTION 3: Definition of Done & Verification -->
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
            <div style="font-size: 0.78rem; font-weight: 800; color: #34d399; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span>🔍</span> Verification & Definition of Done:
            </div>
            <div style="font-size: 0.78rem; color: #e2e8f0; line-height: 1.5;">
              \${detail.verification}
            </div>
          </div>

          <!-- SECTION 4: Common Pitfalls & Blocker Troubleshooting -->
          <div style="margin-bottom: 12px;">
            <div style="font-size: 0.78rem; font-weight: 800; color: #f87171; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>⚠️</span> Common Pitfalls & Self-Service Troubleshooting:
            </div>
            <div>
              \${troubleshootHtml}
            </div>
          </div>

          <!-- SECTION 5: Official Documentation -->
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 9px 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">📄</span>
            <div>
              <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Official Documentation:</div>
              <a href="\${escapeHtml(resourceLink)}" target="_blank" style="color: #38bdf8; font-weight: 700; text-decoration: underline; font-size: 0.8rem;">
                \${escapeHtml(resourceName)}
              </a>
            </div>
          </div>

          <!-- SECTION 6: Support Lead & Escalation -->
          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Designated Support Contact:</div>
              <div style="color: #f8fafc; font-weight: 800; font-size: 0.84rem;">\${escapeHtml(helperName)} <span style="font-weight: 500; color: #cbd5e1; font-size: 0.75rem;">(\${escapeHtml(helperRole)})</span></div>
              <div style="color: #cbd5e1; font-size: 0.74rem; font-family: var(--font-mono); margin-top: 2px;">📞 \${escapeHtml(helperPhone)} · 📧 \${escapeHtml(helperEmail)}</div>
            </div>
            <a href="tel:\${escapeHtml(helperPhone)}" style="background: #059669; color: #ffffff; font-weight: 700; font-size: 0.75rem; padding: 5px 12px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
              📞 Direct Call
            </a>
          </div>

          <!-- Action Footer -->
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button class="copilot-chip" style="background: \${isDone ? 'rgba(255,255,255,0.12)' : '#4f46e5'}; color: #fff; padding: 7px 16px; font-size: 0.78rem; font-weight: 700; border-radius: 6px; cursor: pointer; border: none;" onclick="toggleLiveTask('\${task.progressId || ('P_' + tId)}', '\${task.status}', '\${tId}')">
              \${isDone ? '✓ Mark as Pending' : '✓ Mark Task as Completed'}
            </button>
            <button class="copilot-chip" style="background: rgba(255,255,255,0.08); color: #cbd5e1; padding: 7px 14px; font-size: 0.78rem; border-radius: 6px; cursor: pointer; border: none;" onclick="handleChatOption('contacts')">
              👥 All Direct Contacts
            </button>
          </div>

        </div>
      \`;
    }
`;

const files = [
  path.resolve(__dirname, '../client/index.html'),
  path.resolve(__dirname, '../index.html'),
  path.resolve(__dirname, '../client/public/index.html')
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  console.log(`Injecting deep task elaboration into: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace getExplainTaskResponseHtml with injectionCode
  const oldExplainRegex = /function getExplainTaskResponseHtml\s*\(taskId\)\s*\{[\s\S]*?return `[\s\S]*?<\/div>\s*`;\s*\}/;
  if (oldExplainRegex.test(content)) {
    content = content.replace(oldExplainRegex, injectionCode.trim());
    console.log('  Replaced getExplainTaskResponseHtml with deep elaboration engine');
  }

  // Update explainTaskById to prompt clearly for deep elaboration
  const oldExplainTaskByIdRegex = /function explainTaskById\s*\(taskId\)\s*\{[\s\S]*?runCopilotResponseWithThinking\([\s\S]*?\);\s*\}/;
  const newExplainTaskById = `function explainTaskById(taskId) {
      const allTasks = (currentLiveDashboard && currentLiveDashboard.tasks) ? currentLiveDashboard.tasks : (ALL_40_TASKS || []);
      const numId = parseInt(String(taskId).replace(/\\D/g, ''), 10) || 1;
      const t = allTasks.find(x => String(x.taskId).toLowerCase() === String(taskId).toLowerCase() || parseInt(String(x.taskId).replace(/\\D/g, ''), 10) === numId);
      const tTitle = (t && (t.taskName || t.title)) || ('Task #' + taskId);
      runCopilotResponseWithThinking(\`Please provide a comprehensive, deep walkthrough for Task \${taskId}: "\${tTitle}"\`, () => getExplainTaskResponseHtml(taskId));
    }`;

  if (oldExplainTaskByIdRegex.test(content)) {
    content = content.replace(oldExplainTaskByIdRegex, newExplainTaskById);
    console.log('  Updated explainTaskById');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  Saved ${filePath}`);
});

console.log('Injection of deep task elaboration complete.');
