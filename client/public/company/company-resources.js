/*
 * Company knowledge: contacts, IT procedures, Library and Policies for every company in companiesDatabase.
 *
 * Each company gets a profile (its tools and names), and from it:
 *   companiesDatabase[key].contacts   IT, HR, security, payroll, facilities (people, phones, hours)
 *   companiesDatabase[key].procedures how to get access to common tools, what to check, how to escalate
 *   companiesDatabase[key].library    categorised resources (documents, forms, guides, links)
 *   companiesDatabase[key].policies   short, scannable policy summaries
 *
 * The Library / Policies panel (openCompanyResources) and the onboarding assistant both read this data,
 * so the assistant only answers from what is here. Plain script, loaded after the app script.
 */

const COMPANY_PROFILES = {
  microsoft: {
    identity: 'Microsoft Entra ID', accessPortal: 'My Access (myaccess.microsoft.com)', intranet: 'MSW, the Microsoft intranet',
    chat: 'Microsoft Teams', mail: 'Outlook', serviceDesk: 'Microsoft IT Service Portal (aka.ms/myit)', code: 'GitHub Enterprise',
    codeOrg: 'github.com/microsoft', tracker: 'Azure DevOps', docs: 'SharePoint', hrPortal: 'HRweb', learning: 'Viva Learning',
    vpn: 'MSFT-AzVPN', wifi: 'MSFTCORP', mfa: 'Microsoft Authenticator', device: 'Intune Company Portal', conduct: 'Standards of Business Conduct (Trust Code)',
    region: 'India', leaveDays: 18, sickDays: 12, hybrid: 'Up to 50% of your week from home, agreed with your manager',
    it: { person: 'Rahul Mehta', role: 'Lead IT systems engineer', phone: '+91 80 6789 89910', hours: 'Mon–Fri, 8:00 AM – 8:00 PM IST' },
    hr: { person: 'Priya Sharma', role: 'Lead HR people partner', phone: '+91 80 6789 89912', hours: 'Mon–Fri, 9:00 AM – 5:30 PM IST' },
    security: { person: 'Karan Patel', role: 'Cybersecurity lead', phone: '+91 80 6789 89915' },
    payroll: { person: 'Neha Gupta', role: 'Payroll operations', phone: '+91 80 6789 89917' },
    facilities: { person: 'Arjun Rao', role: 'Workplace services', phone: '+91 80 6789 89919' },
  },
  google: {
    identity: 'Google corporate SSO with a security key', accessPortal: 'the access request tool (go/access)', intranet: 'Moma, the Google intranet',
    chat: 'Google Chat', mail: 'Gmail', serviceDesk: 'Techstop (go/techstop)', code: 'GitHub (open-source projects) and internal code review',
    codeOrg: 'github.com/google', tracker: 'Buganizer', docs: 'Google Drive', hrPortal: 'the People portal (go/people)', learning: 'Grow (go/grow)',
    vpn: 'BeyondCorp (no VPN needed)', wifi: 'GoogleGuest / Corp Wi-Fi', mfa: 'Titan security key', device: 'the device management agent', conduct: 'Google Code of Conduct',
    region: 'US', leaveDays: 20, sickDays: 10, hybrid: 'Three office days a week, with up to four weeks of work-from-anywhere a year',
    it: { person: 'Techstop', role: 'IT support (Techstop)', phone: '+1 (800) 555-GOOG-IT', hours: '24/7' },
    hr: { person: 'Priya Sharma', role: 'People partner', phone: '+1 (650) 555-0142', hours: 'Mon–Fri, 9:00 AM – 5:00 PM PT' },
    security: { person: 'Security & Privacy team', role: 'Security operations', phone: '+1 (650) 555-0177' },
    payroll: { person: 'Payroll team', role: 'Payroll operations', phone: '+1 (650) 555-0188' },
    facilities: { person: 'REWS', role: 'Real estate & workplace services', phone: '+1 (650) 555-0199' },
  },
  amazon: {
    identity: 'Amazon Midway SSO', accessPortal: 'the permissions tool (Permissions / POSIX groups)', intranet: 'the Inside Amazon intranet',
    chat: 'Slack and Amazon Chime', mail: 'Outlook', serviceDesk: 'IT Support (ticketing portal)', code: 'GitHub and internal code repositories',
    codeOrg: 'github.com/aws', tracker: 'the internal ticketing system', docs: 'the internal wiki', hrPortal: 'A to Z', learning: 'AWS Skill Builder',
    vpn: 'Cisco AnyConnect', wifi: 'Amazon-Corp', mfa: 'YubiKey + Midway', device: 'ACME device management', conduct: 'Code of Business Conduct and Ethics',
    region: 'US', leaveDays: 20, sickDays: 6, hybrid: 'Five days in the office unless your team has an approved exception',
    it: { person: 'IT Support', role: 'IT service desk', phone: '+1 (800) 555-AWS-DESK', hours: '24/7' },
    hr: { person: 'Priya Sharma', role: 'HR business partner', phone: '+1 (206) 555-0121', hours: 'Mon–Fri, 8:00 AM – 5:00 PM PT' },
    security: { person: 'Corporate security', role: 'Security operations', phone: '+1 (206) 555-0133' },
    payroll: { person: 'Payroll team', role: 'Payroll operations', phone: '+1 (206) 555-0144' },
    facilities: { person: 'RWS facilities', role: 'Workplace services', phone: '+1 (206) 555-0155' },
  },
  apple: {
    identity: 'Apple corporate SSO', accessPortal: 'the access request portal', intranet: 'AppleConnect',
    chat: 'Slack', mail: 'Mail', serviceDesk: 'AppleCare for Enterprise (internal IT)', code: 'GitHub Enterprise and internal repositories',
    codeOrg: 'github.com/apple', tracker: 'Radar', docs: 'the internal wiki', hrPortal: 'the People portal', learning: 'Apple University',
    vpn: 'the corporate VPN', wifi: 'Apple-Corp', mfa: 'two-factor authentication on your Apple device', device: 'the managed-device profile', conduct: 'Business Conduct Policy',
    region: 'US', leaveDays: 15, sickDays: 10, hybrid: 'Three office days a week (Tuesday to Thursday)',
    it: { person: 'IT Help Desk', role: 'Internal IT support', phone: '+1 (800) 555-APPL-IT', hours: '24/7' },
    hr: { person: 'Priya Sharma', role: 'People business partner', phone: '+1 (408) 555-0111', hours: 'Mon–Fri, 9:00 AM – 5:00 PM PT' },
    security: { person: 'Information security', role: 'Security operations', phone: '+1 (408) 555-0122' },
    payroll: { person: 'Payroll team', role: 'Payroll operations', phone: '+1 (408) 555-0133' },
    facilities: { person: 'Real estate & development', role: 'Workplace services', phone: '+1 (408) 555-0144' },
  },
  nvidia: {
    identity: 'NVIDIA SSO (Okta)', accessPortal: 'the IT access request portal', intranet: 'NVIDIA Connect',
    chat: 'Slack and Microsoft Teams', mail: 'Outlook', serviceDesk: 'the IT Service Desk portal', code: 'GitHub Enterprise and GitLab',
    codeOrg: 'github.com/NVIDIA', tracker: 'Jira', docs: 'Confluence', hrPortal: 'Workday', learning: 'NVIDIA Learning',
    vpn: 'GlobalProtect VPN', wifi: 'NVIDIA-Corp', mfa: 'Okta Verify', device: 'the managed laptop profile', conduct: 'Code of Conduct',
    region: 'US', leaveDays: 'flexible', sickDays: 'as needed', hybrid: 'Flexible hybrid, agreed with your manager',
    it: { person: 'IT Service Desk', role: 'IT operations', phone: '+1 (800) 555-NVDA-OPS', hours: '24/7' },
    hr: { person: 'Priya Sharma', role: 'HR business partner', phone: '+1 (408) 555-0161', hours: 'Mon–Fri, 9:00 AM – 5:00 PM PT' },
    security: { person: 'Product & corporate security', role: 'Security operations', phone: '+1 (408) 555-0162' },
    payroll: { person: 'Payroll team', role: 'Payroll operations', phone: '+1 (408) 555-0163' },
    facilities: { person: 'Workplace team', role: 'Workplace services', phone: '+1 (408) 555-0164' },
  },
  stripe: {
    identity: 'Okta SSO', accessPortal: 'the access request bot in Slack', intranet: 'Home, the Stripe intranet',
    chat: 'Slack', mail: 'Gmail', serviceDesk: 'the IT help channel and ticket form', code: 'GitHub Enterprise',
    codeOrg: 'github.com/stripe', tracker: 'Jira', docs: 'Google Drive and the internal wiki', hrPortal: 'Workday', learning: 'the Learning hub',
    vpn: 'the corporate VPN', wifi: 'Stripe-Corp', mfa: 'Okta Verify with a security key', device: 'the managed laptop profile', conduct: 'Code of Conduct',
    region: 'US', leaveDays: 'flexible', sickDays: 'as needed', hybrid: 'Hybrid, with team-agreed office days',
    it: { person: 'IT Help', role: 'IT support', phone: '+1 (888) 555-STRIPE', hours: 'Mon–Fri, 7:00 AM – 7:00 PM PT' },
    hr: { person: 'Priya Sharma', role: 'People partner', phone: '+1 (415) 555-0171', hours: 'Mon–Fri, 9:00 AM – 5:00 PM PT' },
    security: { person: 'Security team', role: 'Security operations', phone: '+1 (415) 555-0172' },
    payroll: { person: 'Payroll team', role: 'Payroll operations', phone: '+1 (415) 555-0173' },
    facilities: { person: 'Workplace team', role: 'Workplace services', phone: '+1 (415) 555-0174' },
  },
  salesforce: {
    identity: 'Salesforce SSO (Okta)', accessPortal: 'the Concierge access request', intranet: 'the Salesforce intranet (Basecamp)',
    chat: 'Slack', mail: 'Outlook', serviceDesk: 'Concierge (IT help)', code: 'GitHub Enterprise',
    codeOrg: 'github.com/salesforce', tracker: 'GUS (agile tracking)', docs: 'Quip', hrPortal: 'Workday', learning: 'Trailhead',
    vpn: 'the corporate VPN', wifi: 'SFDC-Corp', mfa: 'Salesforce Authenticator', device: 'the managed laptop profile', conduct: 'Code of Conduct',
    region: 'US', leaveDays: 'flexible', sickDays: 'as needed', hybrid: 'Flexible, with team anchor days in the office',
    it: { person: 'Concierge', role: 'IT support', phone: '+1 (800) 555-CRM-HELP', hours: '24/7' },
    hr: { person: 'Priya Sharma', role: 'Employee success partner', phone: '+1 (415) 555-0181', hours: 'Mon–Fri, 9:00 AM – 5:00 PM PT' },
    security: { person: 'Trust & security', role: 'Security operations', phone: '+1 (415) 555-0182' },
    payroll: { person: 'Payroll team', role: 'Payroll operations', phone: '+1 (415) 555-0183' },
    facilities: { person: 'Real estate & workplace', role: 'Workplace services', phone: '+1 (415) 555-0184' },
  },
  technova: {
    identity: 'TechNova SSO (Okta)', accessPortal: 'the IT access portal', intranet: 'the TechNova intranet',
    chat: 'Slack', mail: 'Google Workspace mail', serviceDesk: 'the IT help desk portal', code: 'GitHub',
    codeOrg: 'github.com/technova', tracker: 'Jira', docs: 'Confluence', hrPortal: 'BambooHR', learning: 'the Learning hub',
    vpn: 'WireGuard VPN', wifi: 'TechNova-Staff', mfa: 'Okta Verify', device: 'the managed laptop profile', conduct: 'Code of Conduct',
    region: 'US', leaveDays: 18, sickDays: 8, hybrid: 'Hybrid, two office days a week',
    it: { person: 'IT Help Desk', role: 'IT support', phone: '+1 (800) 555-TECHNOVA', hours: 'Mon–Fri, 8:00 AM – 6:00 PM CT' },
    hr: { person: 'Priya Sharma', role: 'HR partner', phone: '+1 (512) 555-0191', hours: 'Mon–Fri, 9:00 AM – 5:00 PM CT' },
    security: { person: 'Security team', role: 'Security operations', phone: '+1 (512) 555-0192' },
    payroll: { person: 'Payroll team', role: 'Payroll operations', phone: '+1 (512) 555-0193' },
    facilities: { person: 'Office team', role: 'Workplace services', phone: '+1 (512) 555-0194' },
  },
  finwise: {
    identity: 'Finwise SSO (Azure AD)', accessPortal: 'the entitlement request portal', intranet: 'the Finwise intranet',
    chat: 'Microsoft Teams', mail: 'Outlook', serviceDesk: 'the IT Service Desk (ServiceNow)', code: 'GitHub Enterprise',
    codeOrg: 'github.com/finwise', tracker: 'Jira', docs: 'SharePoint', hrPortal: 'Workday', learning: 'the Compliance learning portal',
    vpn: 'Zscaler Private Access', wifi: 'Finwise-Secure', mfa: 'Microsoft Authenticator', device: 'Intune', conduct: 'Code of Ethics',
    region: 'US', leaveDays: 20, sickDays: 10, hybrid: 'Four office days a week (regulated roles may require five)',
    it: { person: 'IT Service Desk', role: 'IT support', phone: '+1 (800) 555-FINWISE', hours: '24/7' },
    hr: { person: 'Priya Sharma', role: 'HR business partner', phone: '+1 (212) 555-0101', hours: 'Mon–Fri, 9:00 AM – 5:30 PM ET' },
    security: { person: 'Information security', role: 'Security operations', phone: '+1 (212) 555-0102' },
    payroll: { person: 'Payroll team', role: 'Payroll operations', phone: '+1 (212) 555-0103' },
    facilities: { person: 'Workplace team', role: 'Workplace services', phone: '+1 (212) 555-0104' },
  },
  medcore: {
    identity: 'MedCore SSO (Okta)', accessPortal: 'the access request portal', intranet: 'the MedCore intranet',
    chat: 'Microsoft Teams', mail: 'Outlook', serviceDesk: 'the IT Service Desk', code: 'GitHub Enterprise',
    codeOrg: 'github.com/medcore', tracker: 'Jira', docs: 'SharePoint', hrPortal: 'Workday', learning: 'the HIPAA learning portal',
    vpn: 'GlobalProtect VPN', wifi: 'MedCore-Staff', mfa: 'Okta Verify', device: 'Intune', conduct: 'Code of Conduct',
    region: 'US', leaveDays: 20, sickDays: 10, hybrid: 'Hybrid, three office days a week',
    it: { person: 'IT Service Desk', role: 'IT support', phone: '+1 (800) 555-MEDCORE', hours: '24/7' },
    hr: { person: 'Priya Sharma', role: 'HR business partner', phone: '+1 (617) 555-0131', hours: 'Mon–Fri, 9:00 AM – 5:00 PM ET' },
    security: { person: 'Privacy & security office', role: 'Security operations', phone: '+1 (617) 555-0132' },
    payroll: { person: 'Payroll team', role: 'Payroll operations', phone: '+1 (617) 555-0133' },
    facilities: { person: 'Facilities team', role: 'Workplace services', phone: '+1 (617) 555-0134' },
  },
};

function companyKeyOf(key) {
  try { return COMPANY_PROFILES[key] ? key : (COMPANY_PROFILES[currentSelectedCompany] ? currentSelectedCompany : 'microsoft'); } catch (e) { return 'microsoft'; }
}
const companyDomainOf = (comp) => String((comp && comp.domain) || '@microsoft.in').replace('@', '');

// ---------------------------------------------------------------- contacts
function buildCompanyContacts(key, comp, P) {
  const d = companyDomainOf(comp);
  return {
    it: { key: 'it', team: 'IT Service Desk', ...P.it, email: `it-support@${d}`, hotline: comp.itPhone, channel: P.serviceDesk, messageId: `SVC-IT-${key}`,
      covers: 'accounts, sign-in, MFA, laptop, VPN, Wi-Fi, email, GitHub and other tool access' },
    hr: { key: 'hr', team: 'HR People Operations', ...P.hr, email: `hr@${d}`, channel: P.hrPortal, messageId: `SVC-HR-${key}`,
      covers: 'leave, payroll setup, benefits, documents, policies and workplace concerns' },
    security: { key: 'security', team: 'Security', ...P.security, email: `security@${d}`, hours: '24/7 for incidents',
      covers: 'phishing, lost devices, suspicious activity and data incidents' },
    payroll: { key: 'payroll', team: 'Payroll', ...P.payroll, email: `payroll@${d}`, hours: P.hr.hours, covers: 'salary, bank details, payslips and tax forms' },
    facilities: { key: 'facilities', team: 'Workplace services', ...P.facilities, email: `facilities@${d}`, hours: P.hr.hours, covers: 'badges, desks, parking and office access' },
  };
}

// ---------------------------------------------------------------- how-to procedures (used by the assistant)
// Each: what it is, how to get it, what to check if it fails, and what to do when the normal route doesn't work.
function buildProcedures(comp, P) {
  const d = companyDomainOf(comp);
  return {
    github: {
      tool: 'GitHub', title: `Getting ${P.code} access`, keywords: ['github', 'git hub', 'repo', 'repository', 'repositories', 'source code', 'pull request', 'git'],
      steps: [
        `Activate your ${comp.name} account and sign in once with ${P.identity}.`,
        `Request the GitHub group for your team in ${P.accessPortal}. Your Lead & Manager approves it.`,
        `Accept the email invitation to ${P.codeOrg} and link your GitHub account to your corporate SSO identity.`,
        'Add an SSH key (or a personal access token) and authorise it for SSO.',
      ],
      checks: [
        'You are signed in to GitHub with the account you linked to SSO, not a personal one.',
        `The invitation to ${P.codeOrg} was accepted (check your ${P.mail} inbox and spam).`,
        'Your SSH key or token shows "SSO authorised" next to the organisation.',
        `The access request in ${P.accessPortal} is approved, not still pending.`,
        'Approvals can take up to 4 business hours to sync.',
      ],
      escalate: [`If it still fails after the checks, raise a ticket in ${P.serviceDesk} with the exact error message and a screenshot.`, 'If it is blocking a Day 1 or Day 2 task, message IT Support and tell your Lead & Manager.'],
      contact: 'it',
    },
    vpn: {
      tool: 'VPN', title: `Connecting to ${P.vpn}`, keywords: ['vpn', 'remote access', 'globalprotect', 'anyconnect', 'zscaler', 'wireguard', 'remote network'],
      steps: [`Make sure your laptop is enrolled in ${P.device}.`, `Install or open ${P.vpn} from the company software catalogue.`, `Sign in with ${P.identity} and approve the ${P.mfa} prompt.`],
      checks: ['Your password has not expired.', `Your ${P.mfa} prompt is approved within the time limit.`, 'Your laptop date and time are correct.', 'You are not on a network that blocks VPN (try a mobile hotspot).'],
      escalate: [`Raise a ticket in ${P.serviceDesk}.`, 'Call IT Support if you are fully blocked from working.'], contact: 'it',
    },
    email: {
      tool: 'Email', title: `Setting up ${P.mail}`, keywords: ['email', 'e-mail', 'mail', 'outlook', 'gmail', 'inbox', 'mailbox'],
      steps: [`Open ${P.mail} and sign in with your corporate address (you@${d}).`, `Approve the ${P.mfa} prompt.`, 'Add the company email signature from the Communication guidelines in the Library.'],
      checks: ['New mailboxes can take up to 30 minutes to appear.', 'Use your corporate address, not a personal one.', 'Check that your account is activated.'],
      escalate: [`Raise a ticket in ${P.serviceDesk} if the mailbox is still missing after an hour.`], contact: 'it',
    },
    chat: {
      tool: P.chat, title: `Getting started with ${P.chat}`, keywords: ['teams', 'slack', 'chat', 'google chat', 'chime', 'channel', 'channels'],
      steps: [`Install ${P.chat} and sign in with ${P.identity}.`, 'Ask your Lead & Manager which team channels to join.', 'Post a short introduction in your team channel.'],
      checks: ['Private channels need an invitation from a channel owner.', 'Sign out and back in if channels do not load.'],
      escalate: [`Raise a ticket in ${P.serviceDesk} if you cannot sign in.`], contact: 'it',
    },
    account: {
      tool: 'Account and password', title: 'Account activation and password reset', keywords: ['password', 'account', 'login', 'log in', 'sign in', 'signin', 'locked out', 'sso', 'credentials', 'activate', 'activation'],
      steps: [`Activate your account with the temporary credentials sent to your personal email.`, `Set a new password and register ${P.mfa}.`, `Use the self-service password reset in ${P.identity} if you forget it.`],
      checks: ['Activation links expire after 48 hours.', 'Passwords must be at least 14 characters with no dictionary words.', 'Too many failed attempts lock the account for 30 minutes.'],
      escalate: ['If you are still locked out, call IT Support so they can verify your identity and reset it.'], contact: 'it',
    },
    mfa: {
      tool: 'MFA', title: `Setting up ${P.mfa}`, keywords: ['mfa', '2fa', 'two factor', 'two-factor', 'authenticator', 'otp', 'security key', 'yubikey', 'verify'],
      steps: [`Install ${P.mfa} on your phone (or collect your security key).`, `Register it from your ${P.identity} security settings.`, 'Save your recovery codes in the company password manager.'],
      checks: ['Notifications for the authenticator app are switched on.', 'Your phone time is set automatically (codes depend on it).', 'You are approving the prompt for the right sign-in.'],
      escalate: ['If you changed or lost your phone, call IT Support to reset MFA.'], contact: 'it',
    },
    laptop: {
      tool: 'Laptop', title: 'Collecting and setting up your laptop', keywords: ['laptop', 'device', 'computer', 'hardware', 'machine', 'monitor', 'charger', 'keyboard', 'mouse'],
      steps: ['Collect your laptop from IT on Day 1 (or check the delivery email if remote).', `Sign in and let ${P.device} finish enrolment (about 30 minutes).`, 'Install required apps from the company software catalogue.'],
      checks: ['Keep the laptop plugged in and on Wi-Fi during enrolment.', 'Restart once enrolment completes.'],
      escalate: [`Raise a hardware ticket in ${P.serviceDesk}; urgent issues can be reported by phone.`], contact: 'it',
    },
    wifi: {
      tool: 'Wi-Fi', title: `Joining ${P.wifi}`, keywords: ['wifi', 'wi-fi', 'wireless', 'internet', 'network'],
      steps: [`Choose the ${P.wifi} network on your enrolled laptop.`, `Sign in with ${P.identity}.`],
      checks: ['Personal devices use the guest network instead.', 'Forget the network and reconnect if it keeps dropping.'],
      escalate: [`Raise a ticket in ${P.serviceDesk} with your location (building and floor).`], contact: 'it',
    },
    tracker: {
      tool: P.tracker, title: `Getting access to ${P.tracker}`, keywords: ['jira', 'azure devops', 'ado', 'buganizer', 'radar', 'gus', 'tracker', 'ticket board', 'backlog', 'board'],
      steps: [`Request the ${P.tracker} project for your team in ${P.accessPortal}.`, 'Your Lead & Manager approves the request.', 'Open the team board and confirm you can see the backlog.'],
      checks: ['The request is approved, not pending.', 'You are signed in with SSO.'], escalate: [`Raise a ticket in ${P.serviceDesk} if access is still missing after approval.`], contact: 'it',
    },
    payroll: {
      tool: 'Payroll', title: 'Payroll and bank details', keywords: ['payroll', 'salary', 'payslip', 'pay slip', 'bank details', 'bank account', 'tax form', 'pay'],
      steps: [`Add your bank account and tax details in ${P.hrPortal} in your first week.`, 'Upload any required ID documents.', 'Check your first payslip in the same portal.'],
      checks: ['The name on your bank account matches your offer letter.', 'All required documents are uploaded.'],
      escalate: ['Message HR if a payroll deadline is close or something is missing.'], contact: 'payroll',
    },
    badge: {
      tool: 'Badge', title: 'Office badge and building access', keywords: ['badge', 'id card', 'access card', 'building access', 'door', 'parking'],
      steps: ['Collect your temporary badge from reception on Day 1.', 'Upload a photo for your permanent badge in the facilities portal.', 'Your permanent badge is ready in 2–3 working days.'],
      checks: ['Badges are activated for your building only.', 'Temporary badges expire after 7 days.'],
      escalate: ['Contact Workplace services if your badge stops working.'], contact: 'facilities',
    },
  };
}

// ---------------------------------------------------------------- library
function buildLibrary(comp, P) {
  const n = comp.name;
  const r = (category, title, type, summary, extra = {}) => ({ category, title, type, summary, owner: extra.owner || 'People Operations', updated: extra.updated || 'Sep 2026', ...extra });
  const items = [
    // Employee onboarding documents
    r('Employee onboarding documents', `Welcome to ${n}: your first week`, 'PDF', 'What happens each day of your first week, who you will meet and what to bring.', { size: '1.2 MB', sections: ['Day-by-day plan', 'People you will meet', 'What to bring on Day 1', 'Where to get help'] }),
    r('Employee onboarding documents', 'New joiner checklist', 'Checklist', 'Every account, form and training you need to finish in your first 30 days.', { sections: ['Accounts and access', 'HR forms', 'Mandatory training', 'Meet your team'] }),
    r('Employee onboarding documents', 'Org chart and who does what', 'Page', `How ${n} teams are organised and who to ask for what.`, { owner: 'HR', sections: ['Your department', 'Leadership', 'Support teams'] }),
    // Important forms
    r('Important forms', 'Emergency contact form', 'Form', 'Add at least two emergency contacts. Required in week 1.', { fields: ['Contact name', 'Relationship', 'Phone number', 'Alternate phone'], where: P.hrPortal }),
    r('Important forms', 'Bank and tax details form', 'Form', 'Bank account for salary and your tax declarations.', { fields: ['Account holder name', 'Account number', 'Bank code', 'Tax ID'], where: P.hrPortal, owner: 'Payroll' }),
    r('Important forms', 'IT equipment request', 'Form', 'Request a monitor, keyboard, headset or other equipment.', { fields: ['Item', 'Reason', 'Delivery location'], where: P.serviceDesk, owner: 'IT' }),
    // HR forms
    r('HR forms', 'Leave request', 'Form', `Apply for annual, sick or personal leave in ${P.hrPortal}.`, { fields: ['Leave type', 'Dates', 'Reason (optional)', 'Approver'], where: P.hrPortal, owner: 'HR' }),
    r('HR forms', 'Address and personal details change', 'Form', 'Update your address, phone or legal name.', { fields: ['What is changing', 'New details', 'Supporting document'], where: P.hrPortal, owner: 'HR' }),
    r('HR forms', 'Employment verification letter request', 'Form', 'Ask HR for a letter confirming your employment (bank, visa, housing).', { fields: ['Purpose', 'Addressed to', 'Delivery email'], where: P.hrPortal, owner: 'HR' }),
    // IT setup guides
    r('IT setup guides', `GitHub access guide`, 'Guide', `Request and set up ${P.code} access, and fix common sign-in errors.`, { owner: 'IT', procedure: 'github' }),
    r('IT setup guides', `VPN and remote access guide`, 'Guide', `Connect to ${P.vpn} from home or on the move.`, { owner: 'IT', procedure: 'vpn' }),
    r('IT setup guides', `Laptop setup guide`, 'Guide', `Enrol your laptop in ${P.device} and install your apps.`, { owner: 'IT', procedure: 'laptop' }),
    r('IT setup guides', `MFA and password guide`, 'Guide', `Register ${P.mfa} and reset your password safely.`, { owner: 'IT', procedure: 'mfa' }),
    // Security guidelines
    r('Security guidelines', 'Spotting phishing', 'Guide', 'How to recognise phishing emails and messages, and how to report them.', { owner: 'Security', sections: ['Warning signs', 'How to report', 'What to do if you clicked'] }),
    r('Security guidelines', 'Data classification guide', 'Guide', 'Public, internal, confidential and restricted data, and how to handle each.', { owner: 'Security', sections: ['The four levels', 'Sharing rules', 'Storage rules'] }),
    r('Security guidelines', 'Lost or stolen device', 'Guide', 'What to do in the first hour if a laptop or phone goes missing.', { owner: 'Security', sections: ['Report immediately', 'Remote wipe', 'Replacement'] }),
    // Internal tools/resources
    r('Internal tools and resources', P.intranet.charAt(0).toUpperCase() + P.intranet.slice(1), 'Link', 'News, teams, people search and links to every internal tool.', { owner: 'Internal comms' }),
    r('Internal tools and resources', P.serviceDesk.charAt(0).toUpperCase() + P.serviceDesk.slice(1), 'Link', 'Raise IT tickets, request access and track their status.', { owner: 'IT' }),
    r('Internal tools and resources', P.tracker, 'Link', 'Where your team plans and tracks work.', { owner: 'Engineering' }),
    // Employee handbooks
    r('Employee handbooks', `${n} employee handbook`, 'PDF', 'How we work: conduct, time off, benefits, safety and where to get help.', { size: '3.4 MB', sections: ['Our values', 'Working hours and time off', 'Benefits overview', 'Conduct and speaking up'] }),
    r('Employee handbooks', P.conduct, 'PDF', 'The standards every employee follows, with real examples.', { owner: 'Legal & Compliance', size: '2.1 MB', sections: ['Integrity', 'Conflicts of interest', 'Gifts', 'How to report concerns'] }),
    r('Employee handbooks', 'Manager and lead handbook', 'PDF', 'For people who lead others: reviews, approvals, 1:1s and support.', { owner: 'HR', size: '1.6 MB' }),
    // Benefits information
    r('Benefits information', 'Health insurance overview', 'Guide', 'Coverage, how to add dependants (within 30 days) and how to claim.', { owner: 'Benefits', sections: ['What is covered', 'Adding dependants', 'Making a claim'] }),
    r('Benefits information', 'Wellbeing and learning allowance', 'Guide', `What the yearly allowance covers and how to claim it in ${P.hrPortal}.`, { owner: 'Benefits' }),
    r('Benefits information', 'Retirement and savings plan', 'Guide', 'How contributions and company matching work.', { owner: 'Benefits' }),
    // Communication guidelines
    r('Communication guidelines', `Using ${P.chat} well`, 'Guide', 'Channels vs direct messages, response times and status etiquette.', { owner: 'Internal comms', sections: ['Channels or DMs', 'Expected response times', 'Status and focus time'] }),
    r('Communication guidelines', 'Email signature and templates', 'Template', 'The standard signature and common email templates.', { owner: 'Internal comms' }),
    r('Communication guidelines', 'Meeting guidelines', 'Guide', 'Agendas, notes, recordings and keeping meetings short.', { owner: 'Internal comms' }),
    // Technical documentation
    r('Technical documentation', 'Engineering standards', 'Page', 'Coding standards, branching, code review and pull request rules.', { owner: 'Engineering', sections: ['Branch naming', 'Commit messages', 'Code review', 'Testing'] }),
    r('Technical documentation', 'Architecture overview', 'Page', 'How the main systems fit together, with diagrams.', { owner: 'Engineering' }),
    r('Technical documentation', 'Release and on-call process', 'Page', 'How releases go out and how on-call works.', { owner: 'Engineering' }),
    // Useful links
    r('Useful links', P.hrPortal.replace(/^the /, '').replace(/^./, (c) => c.toUpperCase()), 'Link', 'Payslips, leave, personal details and benefits.', { owner: 'HR' }),
    r('Useful links', P.learning.replace(/^the /, '').replace(/^./, (c) => c.toUpperCase()), 'Link', 'Mandatory and optional training courses.', { owner: 'Learning' }),
    r('Useful links', 'Holiday calendar', 'Page', `Public holidays for ${n} offices this year.`, { owner: 'HR' }),
    // Frequently used
    r('Frequently used resources', 'Expense and reimbursement guide', 'Guide', 'What you can claim, receipts and how fast you are paid back.', { owner: 'Finance', sections: ['What you can claim', 'Receipts', 'Approval and payment'] }),
    r('Frequently used resources', 'Travel booking guide', 'Guide', 'Booking work travel, approvals and travel safety.', { owner: 'Finance' }),
    r('Frequently used resources', 'Office guide', 'Page', `Floors, meeting rooms, canteen and parking at ${comp.location || n}.`, { owner: 'Workplace services' }),
  ];
  return items.map((x, i) => ({ id: 'lib-' + (i + 1), ...x }));
}

// ---------------------------------------------------------------- policies
function buildPolicies(comp, P) {
  const n = comp.name;
  const leave = typeof P.leaveDays === 'number'
    ? [`${P.leaveDays} days of paid annual leave a year, plus ${P.sickDays} days of sick leave.`, 'Apply at least 2 weeks ahead for leave longer than 3 days.']
    : ['Flexible paid time off: agree time off with your Lead & Manager ahead of time.', 'Sick leave is taken as needed; tell your Lead & Manager the same morning.'];
  const p = (id, title, owner, summary, points, contact = 'hr') => ({ id, title, owner, summary, points, contact, effective: 'Jan 2026', appliesTo: `All ${n} employees and contractors` });
  return [
    p('conduct', P.conduct, 'Legal & Compliance', `How everyone at ${n} is expected to act, and how to raise a concern.`, [
      'Act with integrity: be honest with customers, colleagues and partners.', 'Avoid conflicts of interest and declare any that come up.', 'Never offer or accept gifts that could influence a decision.', 'Speak up: report concerns to your Lead & Manager, HR or the ethics line. Retaliation is not allowed.']),
    p('infosec', 'Information Security Policy', 'Security', 'Keeping company systems and data safe is everyone\'s job.', [
      `Always use ${P.mfa} and never share passwords or codes.`, 'Lock your screen whenever you step away.', 'Report phishing or suspicious activity to Security straight away.', 'Only install software from the company catalogue.'], 'security'),
    p('privacy', 'Data Privacy Policy', 'Privacy Office', 'How we collect, use and protect personal data about customers and employees.', [
      'Only access personal data you need for your job.', 'Never copy personal data to personal devices or accounts.', 'Report a suspected data breach within 1 hour.', 'Delete data when it is no longer needed.'], 'security'),
    p('acceptable-use', 'Acceptable Use Policy', 'IT', 'What company devices, accounts and networks may and may not be used for.', [
      'Company devices are for work; light personal use is fine.', 'No illegal, offensive or unlicensed content.', 'Do not bypass security controls or use unapproved cloud storage.', 'Activity on company systems may be monitored.'], 'it'),
    p('remote-work', 'Remote and Hybrid Work Policy', 'HR', 'When and how you can work away from the office.', [
      P.hybrid + '.', 'Work from a private, safe space with a secure network.', 'Keep your status and calendar up to date.', 'Working from another country needs HR approval first.']),
    p('attendance', 'Attendance and Working Hours Policy', 'HR', 'Core hours and how to tell people when you are away.', [
      'Be available during your team\'s core hours (agreed with your Lead & Manager).', 'Tell your Lead & Manager before 10:00 AM if you are unwell or late.', 'Record time off in ' + P.hrPortal + '.']),
    p('leave', 'Leave Policy', 'HR', 'Types of leave and how to apply.', [
      ...leave, 'Public holidays follow your office\'s holiday calendar (see the Library).', `Apply for leave in ${P.hrPortal}; your Lead & Manager approves it.`]),
    p('workplace', 'Workplace Behaviour Policy', 'HR', 'A respectful, inclusive workplace free from harassment and discrimination.', [
      'Treat everyone with respect, in person and online.', 'Harassment, bullying and discrimination are never acceptable.', 'Report any concern to HR or your Lead & Manager; reports are handled confidentially.']),
    p('confidentiality', 'Confidentiality Policy', 'Legal & Compliance', 'Protecting company, customer and partner information.', [
      'Do not share confidential information outside the company without approval.', 'Do not discuss unreleased products or financials in public places.', 'Your confidentiality obligations continue after you leave.']),
    p('device', 'Device and IT Security Policy', 'IT', 'Keeping laptops and phones that access company data secure.', [
      `All devices must be enrolled in ${P.device} and kept updated.`, 'Encrypt devices and use a screen lock with a PIN or password.', 'Report a lost or stolen device to Security within 1 hour.', 'Never leave devices unattended in public.'], 'it'),
    p('compliance', 'Compliance and Training Policy', 'Legal & Compliance', 'Mandatory training and following the laws that apply to our work.', [
      'Complete mandatory training (security, privacy, conduct) within your first 30 days.', 'Follow anti-bribery and trade compliance rules.', 'Ask Legal & Compliance before signing any external agreement.']),
  ];
}

// ---------------------------------------------------------------- attach to the existing company data
(function attachCompanyKnowledge() {
  if (typeof companiesDatabase === 'undefined') return;
  Object.keys(companiesDatabase).forEach((key) => {
    const comp = companiesDatabase[key];
    const P = COMPANY_PROFILES[key] || COMPANY_PROFILES.technova;
    comp.profile = P;
    comp.contacts = buildCompanyContacts(key, comp, P);
    comp.procedures = buildProcedures(comp, P);
    comp.library = buildLibrary(comp, P);
    comp.policies = buildPolicies(comp, P);
  });
})();

function currentCompanyData() {
  const key = companyKeyOf();
  return { key, comp: companiesDatabase[key] };
}

// ==========================================================================
// Library / Policies panel
// ==========================================================================
let cresState = { tab: 'library', query: '', category: 'All', open: null };
const cresEsc = (s) => (typeof escapeHtml === 'function' ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s));
const CRES_TYPE_ICON = {
  PDF: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4"/>',
  Form: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/>',
  Guide: '<path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z"/><path d="M12 6.5v13"/>',
  Link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  Page: '<rect x="4.5" y="4" width="15" height="16" rx="2"/><path d="M8 8.5h8M8 12h8M8 15.5h5"/>',
  Template: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 9v11"/>',
  Checklist: '<path d="M9 6.5h10M9 12h10M9 17.5h10"/><path d="M4.5 6.5l1 1 2-2M4.5 12l1 1 2-2M4.5 17.5l1 1 2-2"/>',
};
const cresIcon = (type) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CRES_TYPE_ICON[type] || CRES_TYPE_ICON.Page}</svg>`;

function openCompanyResources(tab, focus) {
  const root = document.getElementById('cres');
  if (!root) return;
  cresState = { tab: tab === 'policies' ? 'policies' : 'library', query: '', category: 'All', open: focus || null };
  if (focus && cresState.tab === 'library') {
    const { comp } = currentCompanyData();
    const hit = comp.library.find((x) => x.id === focus || x.procedure === focus);
    if (hit) cresState.open = hit.id;
  }
  root.hidden = false;
  document.documentElement.classList.add('tmsg-open');
  cresRender();
  setTimeout(() => {
    const target = cresState.open ? root.querySelector(`[data-cres-id="${cresState.open}"]`) : root.querySelector('.cres-search input');
    if (target) { target.scrollIntoView({ block: 'center' }); if (target.focus) target.focus({ preventScroll: true }); }
  }, 40);
}
function closeCompanyResources() {
  const root = document.getElementById('cres');
  if (!root || root.hidden) return;
  root.hidden = true;
  if (document.getElementById('tmsg')?.hidden !== false) document.documentElement.classList.remove('tmsg-open');
}
function cresSetTab(tab) { cresState.tab = tab; cresState.category = 'All'; cresState.open = null; cresRender(); }
function cresSetCategory(c) { cresState.category = c; cresRender(); }
function cresToggle(id) { cresState.open = cresState.open === id ? null : id; cresRender(); }
function cresSearch(v) { cresState.query = v; cresRender(true); }

function cresContactActions(key) {
  const { comp } = currentCompanyData();
  const c = comp.contacts[key] || comp.contacts.hr;
  const msg = c.messageId ? `<button type="button" class="tm-btn is-sm" onclick="closeCompanyResources(); openTeamMessages('${c.messageId}')">Message ${cresEsc(c.team)}</button>` : '';
  return `${msg}<a class="tm-btn is-sm is-ghost" href="tel:${String(c.phone).replace(/[^\d+]/g, '')}">Call ${cresEsc(c.phone)}</a>`;
}

function cresRender(keepFocus) {
  const root = document.getElementById('cres');
  if (!root || root.hidden) return;
  const { comp } = currentCompanyData();
  const q = cresState.query.trim().toLowerCase();
  root.querySelector('#cres-company').textContent = comp.fullName || comp.name;
  root.querySelectorAll('.cres-tab').forEach((b) => { const on = b.dataset.tab === cresState.tab; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
  const body = root.querySelector('#cres-body');
  const searchBox = root.querySelector('.cres-search input');
  if (!keepFocus && searchBox) { searchBox.value = cresState.query; searchBox.placeholder = cresState.tab === 'library' ? 'Search forms, guides and documents' : 'Search policies'; }

  if (cresState.tab === 'library') {
    const cats = ['All', ...new Set(comp.library.map((x) => x.category))];
    const items = comp.library.filter((x) => (cresState.category === 'All' || x.category === cresState.category)
      && (!q || [x.title, x.summary, x.category, x.type].join(' ').toLowerCase().includes(q)));
    const groups = [...new Set(items.map((x) => x.category))];
    body.innerHTML = `
      <div class="cres-chips" role="group" aria-label="Library categories">${cats.map((c) => `<button type="button" class="persona-pill-btn${c === cresState.category ? ' active' : ''}" onclick="cresSetCategory('${cresEsc(c).replace(/'/g, "\\'")}')">${cresEsc(c)}</button>`).join('')}</div>
      ${groups.length ? groups.map((g) => `
        <section class="cres-group">
          <h3 class="cres-group-title">${cresEsc(g)}</h3>
          <ul class="cres-list">${items.filter((x) => x.category === g).map((x) => cresLibraryItem(x, comp)).join('')}</ul>
        </section>`).join('') : `<p class="tm-empty">Nothing matches "${cresEsc(cresState.query)}". Try another word, or ask the onboarding assistant.</p>`}`;
  } else {
    const items = comp.policies.filter((x) => !q || [x.title, x.summary, x.points.join(' ')].join(' ').toLowerCase().includes(q));
    body.innerHTML = items.length ? `<ul class="cres-list">${items.map((x) => cresPolicyItem(x)).join('')}</ul>`
      : `<p class="tm-empty">No policy matches "${cresEsc(cresState.query)}".</p>`;
  }
}

function cresLibraryItem(x, comp) {
  const open = cresState.open === x.id;
  const proc = x.procedure && comp.procedures[x.procedure];
  const detail = open ? `
    <div class="cres-detail">
      ${proc ? `<p class="cres-detail-label">Steps</p><ol class="cres-steps">${proc.steps.map((s) => `<li>${cresEsc(s)}</li>`).join('')}</ol>
        <p class="cres-detail-label">If it doesn't work</p><ul class="cres-points">${proc.checks.map((s) => `<li>${cresEsc(s)}</li>`).join('')}</ul>` : ''}
      ${x.sections ? `<p class="cres-detail-label">What's inside</p><ul class="cres-points">${x.sections.map((s) => `<li>${cresEsc(s)}</li>`).join('')}</ul>` : ''}
      ${x.fields ? `<p class="cres-detail-label">You'll need</p><ul class="cres-points">${x.fields.map((s) => `<li>${cresEsc(s)}</li>`).join('')}</ul>` : ''}
      ${x.where ? `<p class="cres-detail-where">Submit it in ${cresEsc(x.where)}.</p>` : ''}
      <div class="cres-detail-actions">${cresContactActions(x.owner === 'IT' || x.procedure ? 'it' : 'hr')}</div>
    </div>` : '';
  return `
    <li class="cres-item${open ? ' is-open' : ''}" data-cres-id="${x.id}" tabindex="-1">
      <button type="button" class="cres-item-head" onclick="cresToggle('${x.id}')" aria-expanded="${open}">
        <span class="cres-icon">${cresIcon(x.type)}</span>
        <span class="cres-item-text">
          <span class="cres-item-title">${cresEsc(x.title)}</span>
          <span class="cres-item-summary">${cresEsc(x.summary)}</span>
          <span class="cres-item-meta">${cresEsc(x.type)}${x.size ? ' · ' + cresEsc(x.size) : ''} · ${cresEsc(x.owner)} · Updated ${cresEsc(x.updated)}</span>
        </span>
        <svg class="cres-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      ${detail}
    </li>`;
}

function cresPolicyItem(x) {
  const open = cresState.open === x.id;
  return `
    <li class="cres-item${open ? ' is-open' : ''}" data-cres-id="${x.id}" tabindex="-1">
      <button type="button" class="cres-item-head" onclick="cresToggle('${x.id}')" aria-expanded="${open}">
        <span class="cres-icon">${cresIcon('PDF')}</span>
        <span class="cres-item-text">
          <span class="cres-item-title">${cresEsc(x.title)}</span>
          <span class="cres-item-summary">${cresEsc(x.summary)}</span>
          <span class="cres-item-meta">${cresEsc(x.owner)} · Effective ${cresEsc(x.effective)}</span>
        </span>
        <svg class="cres-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      ${open ? `
      <div class="cres-detail">
        <p class="cres-detail-label">What you need to know</p>
        <ul class="cres-points">${x.points.map((s) => `<li>${cresEsc(s)}</li>`).join('')}</ul>
        <p class="cres-detail-where">Applies to: ${cresEsc(x.appliesTo)}</p>
        <div class="cres-detail-actions">${cresContactActions(x.contact)}</div>
      </div>` : ''}
    </li>`;
}

(function initCompanyResources() {
  document.body.insertAdjacentHTML('beforeend', `
    <div id="cres" class="tmsg cres" hidden>
      <div class="tmsg-scrim" data-cres-close></div>
      <section class="tmsg-panel cres-panel" role="dialog" aria-modal="true" aria-labelledby="cres-title">
        <header class="tmsg-head">
          <div>
            <p class="tmsg-eyebrow" id="cres-company">Company</p>
            <h2 id="cres-title" class="tmsg-title">Library &amp; policies</h2>
          </div>
          <button type="button" class="tmsg-icon-btn" data-cres-close aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </header>
        <div class="cres-bar">
          <div class="cres-tabs" role="tablist">
            <button type="button" role="tab" class="persona-pill-btn cres-tab" data-tab="library" onclick="cresSetTab('library')">Library</button>
            <button type="button" role="tab" class="persona-pill-btn cres-tab" data-tab="policies" onclick="cresSetTab('policies')">Policies</button>
          </div>
          <label class="tm-search cres-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>
            <span class="visually-hidden">Search</span>
            <input type="search" oninput="cresSearch(this.value)">
          </label>
        </div>
        <div id="cres-body" class="cres-body"></div>
      </section>
    </div>`);
  const root = document.getElementById('cres');
  root.addEventListener('click', (e) => { if (e.target.closest('[data-cres-close]')) closeCompanyResources(); });
  document.addEventListener('keydown', (e) => { if (!root.hidden && e.key === 'Escape') { e.preventDefault(); closeCompanyResources(); } });
})();
