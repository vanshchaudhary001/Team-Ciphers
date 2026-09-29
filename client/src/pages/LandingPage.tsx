import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  location: string;
  monogram: string;
  tagline: string;
  icon: string;
  colorClass: string;
  badge: string;
  departments: string[];
  workflowType: string;
  ssoProvider: string;
  defaultEmail: string;
}

const COMPANIES: Company[] = [
  {
    id: 'technova',
    name: 'TechNova Solutions',
    domain: 'technova.demo',
    industry: 'Technology & Cloud Systems',
    location: 'Bengaluru HQ · Remote',
    monogram: 'TN',
    tagline: 'Enterprise cloud infrastructure, microservices, and AI platform engineering.',
    icon: 'bolt',
    colorClass: 'text-primary bg-primary-fixed border-primary/30',
    badge: 'Primary Demo Tenant',
    departments: ['Engineering', 'HR Operations', 'IT Infrastructure'],
    workflowType: '6-Step Dependency DAG with UNSTICK™ Recovery',
    ssoProvider: 'Azure AD / SAML 2.0',
    defaultEmail: 'aarav@technova.demo',
  },
  {
    id: 'finwise',
    name: 'Finwise Capital',
    domain: 'finwise.demo',
    industry: 'Fintech & Asset Management',
    location: 'Mumbai HQ',
    monogram: 'FW',
    tagline: 'High-frequency algorithmic trading, risk management, and regulatory compliance.',
    icon: 'monitoring',
    colorClass: 'text-secondary bg-secondary-fixed border-secondary/30',
    badge: 'Financial Services',
    departments: ['Quant Analytics', 'Compliance & Legal', 'Security Ops'],
    workflowType: 'SOC2 & Regulatory Compliance Gating',
    ssoProvider: 'Okta Enterprise SSO',
    defaultEmail: 'hr@technova.demo',
  },
  {
    id: 'medcore',
    name: 'MedCore Health Systems',
    domain: 'medcore.demo',
    industry: 'Healthcare & Biotech',
    location: 'Delhi HQ',
    monogram: 'MC',
    tagline: 'Digital clinical health records, diagnostic devices, and patient management.',
    icon: 'health_metrics',
    colorClass: 'text-tertiary bg-tertiary-fixed border-tertiary/30',
    badge: 'Clinical Healthcare',
    departments: ['Clinical Care', 'Hospital IT', 'Biomedical Ops'],
    workflowType: 'HIPAA & Hospital System Credentialing',
    ssoProvider: 'Ping Identity SSO',
    defaultEmail: 'it.owner@technova.demo',
  },
  {
    id: 'microsoft',
    name: 'Microsoft Corporation',
    domain: 'microsoft.in',
    industry: 'Enterprise Cloud & AI',
    location: 'Redmond / Bengaluru',
    monogram: 'MS',
    tagline: 'Global enterprise software ecosystem, Azure infrastructure, and Copilot tools.',
    icon: 'grid_view',
    colorClass: 'text-blue-700 bg-blue-100 border-blue-300',
    badge: 'Global Cloud Tenant',
    departments: ['Cloud + AI', 'Strategic Missions', 'Enterprise Security'],
    workflowType: 'Automated GitHub Enterprise & Azure AD Provisioning',
    ssoProvider: 'Microsoft Entra ID',
    defaultEmail: 'admin@technova.demo',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchDemoUser } = useAuth();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('technova');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleLaunchDemo = async (role = 'aarav@technova.demo') => {
    try {
      await switchDemoUser(role);
      if (role.includes('hr') || role.includes('priya')) navigate('/hr');
      else if (role.includes('it.owner') || role.includes('vikram') || role.includes('owner')) navigate('/owner');
      else if (role.includes('admin') || role.includes('neha')) navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      navigate('/login');
    }
  };

  const handleSelectCompany = (company: Company) => {
    setSelectedCompanyId(company.id);
    navigate(`/login?company=${encodeURIComponent(company.id)}&domain=${encodeURIComponent(company.domain)}`);
  };

  const filteredCompanies = COMPANIES.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q)
    );
  });

  const chain = [
    {
      step: '01',
      title: 'Laptop Provisioning',
      state: 'DONE',
      icon: 'check_circle',
      badgeClass: 'badge-done',
      containerClass: 'bg-emerald-50/70 border-emerald-200 text-emerald-950',
    },
    {
      step: '02',
      title: 'VPN Approval',
      state: 'WAITING (BLOCKER)',
      icon: 'timer',
      badgeClass: 'badge-blocker',
      containerClass: 'bg-amber-50/90 border-amber-300 text-amber-950 ring-2 ring-amber-300 shadow-sm',
    },
    {
      step: '03',
      title: 'GitHub Access',
      state: 'LOCKED',
      icon: 'lock',
      badgeClass: 'badge-locked',
      containerClass: 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant opacity-75',
    },
    {
      step: '04',
      title: 'Repository Access',
      state: 'LOCKED',
      icon: 'lock',
      badgeClass: 'badge-locked',
      containerClass: 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant opacity-75',
    },
    {
      step: '05',
      title: 'Development Env',
      state: 'LOCKED',
      icon: 'lock',
      badgeClass: 'badge-locked',
      containerClass: 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant opacity-75',
    },
    {
      step: '06',
      title: 'First Coding PR',
      state: 'LOCKED',
      icon: 'lock',
      badgeClass: 'badge-locked',
      containerClass: 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant opacity-75',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8 border-b border-outline-variant/20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-fixed/25 via-transparent to-transparent pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/40 text-primary mb-6 shadow-xs">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <span className="text-label-caps uppercase tracking-wider font-semibold">
              Enterprise Orchestration Workspace
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-display-lg font-bold text-on-background tracking-tight max-w-4xl mx-auto leading-tight">
            Your first week.{' '}
            <span className="bg-gradient-to-r from-primary via-indigo-600 to-secondary bg-clip-text text-transparent">
              Without the maze.
            </span>
          </h1>

          {/* Value Proposition Subtitle */}
          <p className="mt-5 text-base sm:text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Your personalised onboarding workspace that helps you know what to do, where to go, and who can help.
            Connects every task, identifies the root blocker, routes it to the right owner, and keeps new employees moving.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleLaunchDemo('aarav@technova.demo')}
              className="btn-primary-gradient px-6 py-3 text-label-lg font-semibold shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <span>Explore Live Demo as Aarav</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>

            <a
              href="#company-gateway"
              className="btn-secondary-outline px-5 py-3 text-label-lg font-semibold flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base text-primary">domain</span>
              <span>Select Organization</span>
            </a>

            <button
              onClick={() => handleLaunchDemo('hr@technova.demo')}
              className="btn-secondary-outline px-4 py-3 text-label-md font-semibold text-slate-700 hover:text-primary flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base text-emerald-600">manage_accounts</span>
              <span>HR Command</span>
            </button>

            <button
              onClick={() => handleLaunchDemo('it.owner@technova.demo')}
              className="btn-secondary-outline px-4 py-3 text-label-md font-semibold text-slate-700 hover:text-amber-700 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base text-amber-600">terminal</span>
              <span>IT Task Owner Hub</span>
            </button>
          </div>

          {/* Visual Dependency Chain Showcase */}
          <div className="mt-14 w-full card-stitch text-left">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-outline-variant/30">
              <div className="flex items-center gap-2 text-label-md font-semibold text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  account_tree
                </span>
                <span>Live Dependency Chain: Software Engineer Onboarding</span>
              </div>
              <div className="badge-blocker">
                <span className="material-symbols-outlined text-xs">warning</span>
                <span>1 Root Blocker Detected · 4 Tasks Downstream Locked</span>
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {chain.map((c) => (
                <div
                  key={c.title}
                  className={`p-3 rounded-lg border flex flex-col justify-between space-y-2 transition-all ${c.containerClass}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold tracking-tight text-on-surface-variant/80">
                      {c.step}
                    </span>
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {c.icon}
                    </span>
                  </div>
                  <div>
                    <div className="text-body-sm font-semibold leading-snug text-on-surface">
                      {c.title}
                    </div>
                    <div className="mt-1">
                      <span className={c.badgeClass}>{c.state}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Company Selection / Enterprise Gateway Section */}
      <section id="company-gateway" className="py-16 md:py-24 bg-surface-container-low border-b border-outline-variant/20 scroll-mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40 text-on-surface-variant text-label-caps uppercase tracking-wider font-semibold mb-3">
              <span className="material-symbols-outlined text-xs text-primary">hub</span>
              <span>Enterprise Gateway</span>
            </div>
            <h2 className="text-3xl sm:text-headline-xl font-bold text-on-surface tracking-tight">
              Select Your Organization
            </h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Click your enrolled company tile to authenticate via SSO. StartSmart will automatically detect your role and route you to your designated workspace.
            </p>

            {/* Company Search / Filter Interaction */}
            <div className="mt-6 max-w-md mx-auto relative">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant/60 text-lg pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search organization, domain, or industry..."
                  className="input-stitch pl-10 pr-10 text-body-sm h-11"
                  aria-label="Filter organizations"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-on-surface-variant/60 hover:text-on-surface p-1"
                    aria-label="Clear search"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-label-caps text-on-surface-variant/70 px-1">
                <span>
                  {filteredCompanies.length} of {COMPANIES.length} organizations displayed
                </span>
                <span className="font-mono">Single Sign-On (SAML/Okta)</span>
              </div>
            </div>
          </div>

          {/* Organization Tiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCompanies.map((company) => {
              const isSelected = selectedCompanyId === company.id;
              return (
                <div
                  key={company.id}
                  onClick={() => handleSelectCompany(company)}
                  className={`card-stitch cursor-pointer group flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 shadow-stitch-hover bg-surface-container-lowest'
                      : 'hover:border-primary/50 hover:shadow-stitch-hover bg-surface-container-lowest'
                  }`}
                >
                  {/* Selected Indicator Top Line */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  />

                  <div>
                    {/* Header: Monogram/Icon & Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm border ${company.colorClass}`}>
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {company.icon}
                        </span>
                      </div>
                      <span className="text-label-caps font-semibold uppercase px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                        {company.badge}
                      </span>
                    </div>

                    {/* Company Identity */}
                    <h3 className="text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                      <span>{company.name}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                      )}
                    </h3>

                    <div className="text-[11px] font-mono text-on-surface-variant/80 mt-0.5">
                      @{company.domain} · {company.location}
                    </div>

                    <p className="mt-2.5 text-body-sm text-on-surface-variant leading-relaxed line-clamp-2">
                      {company.tagline}
                    </p>

                    {/* Metadata Specs */}
                    <div className="mt-4 pt-3.5 border-t border-outline-variant/30 space-y-1.5 text-body-sm text-on-surface-variant">
                      <div className="flex items-center gap-1.5 text-on-surface">
                        <span className="material-symbols-outlined text-emerald-600 text-sm">verified</span>
                        <span className="text-[12px] font-medium truncate">{company.workflowType}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-primary text-sm">key</span>
                        <span className="text-[12px]">{company.ssoProvider}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-6 pt-3.5 border-t border-outline-variant/30 flex items-center justify-between">
                    <span className="text-label-md font-semibold text-primary group-hover:underline">
                      Enter Gateway
                    </span>
                    <span className="material-symbols-outlined text-primary text-base group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12 card-stitch max-w-md mx-auto">
              <span className="material-symbols-outlined text-3xl text-outline mb-2">domain_disabled</span>
              <h3 className="text-headline-sm font-semibold text-on-surface">No organization matched</h3>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Try searching for "TechNova", "Finwise", "MedCore", or "Microsoft".
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn-secondary-outline mt-4 text-label-md"
              >
                Reset Search
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Feature Pillars Section (from Stitch Reference) */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40 text-on-surface-variant text-label-caps uppercase tracking-wider font-semibold mb-3">
            <span className="material-symbols-outlined text-xs text-primary">verified_user</span>
            <span>Architectural Foundation</span>
          </div>
          <h2 className="text-3xl sm:text-headline-xl font-bold text-on-background mb-4">
            Engineered for surgical clarity
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            Designed to replace onboarding bloat with kinetic momentum and ambient intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="card-stitch-hover relative overflow-hidden group p-8">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
            <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center text-primary mb-6 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                route
              </span>
            </div>
            <h3 className="text-headline-lg font-bold text-on-surface mb-3">Personalised Journeys</h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Tailored onboarding roadmaps constructed automatically based on your department, role seniority, and exact geographic compliance requirements.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card-stitch-hover relative overflow-hidden group p-8">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary" />
            <div className="w-12 h-12 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary mb-6 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_tree
              </span>
            </div>
            <h3 className="text-headline-lg font-bold text-on-surface mb-3">Dependency DAG</h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Visualise clear prerequisite pathways and blockers, ensuring administrative tasks are cleared in the precise logical sequence required.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card-stitch-hover relative overflow-hidden group p-8">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-tertiary" />
            <div className="w-12 h-12 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary mb-6 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock_open
              </span>
            </div>
            <h3 className="text-headline-lg font-bold text-on-surface mb-3">Live Unlocking</h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Dynamic milestone progression that immediately opens systems access, security keys, and mentor introductions as soon as prerequisites finalize.
            </p>
          </div>
        </div>
      </section>

      {/* The Core Contrast Comparison: Traditional vs StartSmart */}
      <section className="py-16 bg-surface-container-lowest border-y border-outline-variant/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-label-caps uppercase tracking-wider font-semibold text-primary bg-primary-fixed px-3 py-1 rounded-full">
              The Paradigm Shift
            </span>
            <h2 className="text-3xl font-bold text-on-surface tracking-tight mt-3">
              Checklists tell you what is pending. <br />
              <span className="text-primary">StartSmart tells you why, who, and what to do next.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Traditional */}
            <div className="p-8 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-4">
              <span className="text-label-caps uppercase tracking-wider font-semibold text-on-surface-variant/70">
                Traditional Portals
              </span>
              <div className="text-headline-sm font-semibold text-on-surface">
                "GitHub access is pending."
              </div>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                Joiner has no visibility into why it's pending, who holds the keys, how many other tasks are blocked, or what productive work they can do while waiting.
              </p>
              <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-body-sm text-on-surface-variant">
                Result: Joiner sits idle on Day 2 browsing Slack, disengages, and feels helpless.
              </div>
            </div>

            {/* StartSmart */}
            <div className="p-8 rounded-xl bg-gradient-to-br from-primary-fixed/30 to-secondary-fixed/30 border border-primary/30 space-y-4 shadow-stitch-card">
              <div className="flex items-center justify-between">
                <span className="text-label-caps uppercase tracking-wider font-semibold text-primary bg-primary-fixed px-2.5 py-0.5 rounded-full">
                  StartSmart Platform
                </span>
                <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
              </div>

              <div className="text-headline-sm font-semibold text-on-surface">
                "GitHub access is waiting for VPN approval from IT Operations. 4 downstream tasks are affected. Complete security training while you wait."
              </div>

              <p className="text-body-sm text-on-surface leading-relaxed">
                AI diagnosis detects the root blocker, calculates downstream impact, notifies the exact owner group, and recommends valid SideQuests with zero blocker dependencies.
              </p>

              <div className="p-3 bg-surface-container-lowest rounded-lg border border-primary/20 text-body-sm text-primary font-medium">
                Result: Continuous progress. Blocker resolved in minutes. Zero wasted onboarding hours.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Gateway Cards Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-on-surface tracking-tight">
            Designed for the Entire First-Week Ecosystem
          </h2>
          <p className="text-body-md text-on-surface-variant mt-2">
            Four entry portals connected to a single dependency DAG, real-time unstick recovery, and role-based permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: New Joiner */}
          <div
            onClick={() => handleLaunchDemo('aarav@technova.demo')}
            className="card-stitch-hover cursor-pointer p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 text-primary border border-indigo-200 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">person_add</span>
                </div>
                <span className="badge-available">Employee</span>
              </div>
              <h3 className="text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                I'm a New Joiner
              </h3>
              <p className="mt-2 text-body-sm text-on-surface-variant leading-relaxed">
                Routes to the employee onboarding checklist and interactive DAG workspace.
              </p>
              <div className="mt-4 pt-3.5 border-t border-outline-variant/30 space-y-1 text-[12px] text-on-surface-variant font-medium">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Company & branch selector
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Assigned Buddy & HR contacts
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Interactive "Next Move" queue
                </div>
              </div>
            </div>
            <div className="mt-6 pt-3.5 border-t border-outline-variant/30 flex items-center justify-between text-label-md font-semibold text-primary">
              <span>Start Onboarding</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>

          {/* Card 2: Existing Company */}
          <div
            onClick={() => navigate('/login')}
            className="card-stitch-hover cursor-pointer p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">domain</span>
                </div>
                <span className="badge-done">Org Login</span>
              </div>
              <h3 className="text-headline-sm font-bold text-on-surface group-hover:text-blue-700 transition-colors">
                Existing Company
              </h3>
              <p className="mt-2 text-body-sm text-on-surface-variant leading-relaxed">
                Routes to standard corporate login for enrolled organizations with auto role detection.
              </p>
              <div className="mt-4 pt-3.5 border-t border-outline-variant/30 space-y-1 text-[12px] text-on-surface-variant font-medium">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Okta / Azure AD SAML SSO
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Automatic role detection
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Corporate directory sync
                </div>
              </div>
            </div>
            <div className="mt-6 pt-3.5 border-t border-outline-variant/30 flex items-center justify-between text-label-md font-semibold text-blue-700">
              <span>Company Sign In</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>

          {/* Card 3: Register a Company */}
          <div
            onClick={() => handleLaunchDemo('admin@technova.demo')}
            className="card-stitch-hover cursor-pointer p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">add_business</span>
                </div>
                <span className="badge-done">Admin Setup</span>
              </div>
              <h3 className="text-headline-sm font-bold text-on-surface group-hover:text-emerald-700 transition-colors">
                Register Organization
              </h3>
              <p className="mt-2 text-body-sm text-on-surface-variant leading-relaxed">
                Routes to master tenant setup and blueprint configuration for administrators.
              </p>
              <div className="mt-4 pt-3.5 border-t border-outline-variant/30 space-y-1 text-[12px] text-on-surface-variant font-medium">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Blueprint workflow builder
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span> SLA & escalation rules
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Multi-tenant isolation
                </div>
              </div>
            </div>
            <div className="mt-6 pt-3.5 border-t border-outline-variant/30 flex items-center justify-between text-label-md font-semibold text-emerald-700">
              <span>Configure Admin</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>

          {/* Card 4: Buddy & HR Partner */}
          <div
            onClick={() => handleLaunchDemo('hr@technova.demo')}
            className="card-stitch-hover cursor-pointer p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-50 text-secondary border border-purple-200 flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">supervisor_account</span>
                </div>
                <span className="badge-available">Staff Hub</span>
              </div>
              <h3 className="text-headline-sm font-bold text-on-surface group-hover:text-secondary transition-colors">
                Buddy & HR Partner
              </h3>
              <p className="mt-2 text-body-sm text-on-surface-variant leading-relaxed">
                Routes to staff mentoring, escalation management, and live journey intervention.
              </p>
              <div className="mt-4 pt-3.5 border-t border-outline-variant/30 space-y-1 text-[12px] text-on-surface-variant font-medium">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Active mentee roster
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Live bottleneck escalation
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span> 1:1 syncs & approvals
                </div>
              </div>
            </div>
            <div className="mt-6 pt-3.5 border-t border-outline-variant/30 flex items-center justify-between text-label-md font-semibold text-secondary">
              <span>Open Staff Portal</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Footer matching Stitch Reference */}
      <footer className="bg-surface-container-low border-t border-outline-variant/30">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-headline-sm font-bold text-primary tracking-tight">StartSmart</span>
            <span className="text-body-sm text-on-surface-variant">
              © 2026 StartSmart Onboarding Technologies. All rights reserved.
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <span className="text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
              Terms of Service
            </span>
            <span className="text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
              Enterprise Security
            </span>
            <span className="text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
              Status: Operational (99.99%)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
