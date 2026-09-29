import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

interface CompanyInfo {
  id: string;
  name: string;
  domain: string;
  industry: string;
  monogram: string;
  icon: string;
  badge: string;
  colorClass: string;
}

const KNOWN_COMPANIES: Record<string, CompanyInfo> = {
  technova: {
    id: 'technova',
    name: 'TechNova Solutions',
    domain: 'technova.demo',
    industry: 'Technology & Cloud Systems',
    monogram: 'TN',
    icon: 'bolt',
    badge: 'Primary Demo Tenant',
    colorClass: 'text-primary bg-primary-fixed',
  },
  finwise: {
    id: 'finwise',
    name: 'Finwise Capital',
    domain: 'finwise.demo',
    industry: 'Fintech & Asset Management',
    monogram: 'FW',
    icon: 'monitoring',
    badge: 'Financial Services',
    colorClass: 'text-secondary bg-secondary-fixed',
  },
  medcore: {
    id: 'medcore',
    name: 'MedCore Health Systems',
    domain: 'medcore.demo',
    industry: 'Healthcare & Biotech',
    monogram: 'MC',
    icon: 'health_metrics',
    badge: 'Clinical Healthcare',
    colorClass: 'text-tertiary bg-tertiary-fixed',
  },
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft Corporation',
    domain: 'microsoft.in',
    industry: 'Enterprise Cloud & AI',
    monogram: 'MS',
    icon: 'grid_view',
    badge: 'Global Cloud Tenant',
    colorClass: 'text-blue-700 bg-blue-100',
  },
};

interface DemoPersona {
  name: string;
  role: string;
  roleCategory: string;
  email: string;
  companyName: string;
  badgeClass: string;
  icon: string;
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    name: 'Aarav Sharma',
    role: 'New Joiner',
    roleCategory: 'EMPLOYEE',
    email: 'aarav@technova.demo',
    companyName: 'TechNova Solutions',
    badgeClass: 'badge-available',
    icon: 'badge',
  },
  {
    name: 'Priya Sharma (HR)',
    role: 'HR Admin',
    roleCategory: 'HR_ADMIN',
    email: 'hr@technova.demo',
    companyName: 'TechNova Solutions',
    badgeClass: 'badge-done',
    icon: 'manage_accounts',
  },
  {
    name: 'Vikram IT (IT Ops)',
    role: 'Task Owner / IT',
    roleCategory: 'TASK_OWNER',
    email: 'it.owner@technova.demo',
    companyName: 'TechNova Solutions',
    badgeClass: 'badge-waiting',
    icon: 'terminal',
  },
  {
    name: 'Neha Admin',
    role: 'Company Admin',
    roleCategory: 'COMPANY_ADMIN',
    email: 'admin@technova.demo',
    companyName: 'TechNova Solutions',
    badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200 font-semibold',
    icon: 'admin_panel_settings',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const companyParam = searchParams.get('company')?.toLowerCase() || 'technova';
  const selectedCompany = KNOWN_COMPANIES[companyParam] || KNOWN_COMPANIES['technova'];

  const [email, setEmail] = useState<string>('aarav@technova.demo');
  const [password, setPassword] = useState<string>('demo1234');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Automatic role detection from email input (honest visual state)
  const detectedRole = useMemo(() => {
    const em = email.toLowerCase().trim();
    if (!em) return null;

    if (em.includes('aarav') || em.includes('rohan') || em.includes('joiner') || em.includes('employee')) {
      return {
        roleKey: 'EMPLOYEE',
        title: 'New Joiner',
        subtitle: 'Employee Onboarding Track',
        description: 'Routes to personalized day-1 workspace, Next Move queue, and dependency DAG.',
        badgeClass: 'badge-available',
        cardClass: 'border-primary/40 bg-primary-fixed/20',
        icon: 'badge',
        btnText: 'Sign In to Employee Workspace',
      };
    }

    if (em.includes('hr') || em.includes('priya') || em.includes('people')) {
      return {
        roleKey: 'HR_ADMIN',
        title: 'HR Partner / Admin',
        subtitle: 'People Operations Command',
        description: 'Routes to HR Control Center, joiner journey health, and SLA bottleneck escalations.',
        badgeClass: 'badge-done',
        cardClass: 'border-emerald-300 bg-emerald-50/50',
        icon: 'manage_accounts',
        btnText: 'Sign In to HR Control Center',
      };
    }

    if (em.includes('it.owner') || em.includes('vikram') || em.includes('owner') || em.includes('it')) {
      return {
        roleKey: 'TASK_OWNER',
        title: 'Task Owner / IT Ops',
        subtitle: 'Operations & Provisioning',
        description: 'Routes to IT Task Owner Hub, provisioning approvals, and UNSTICK™ recovery queue.',
        badgeClass: 'badge-waiting',
        cardClass: 'border-amber-300 bg-amber-50/50',
        icon: 'terminal',
        btnText: 'Sign In to Task Owner Hub',
      };
    }

    if (em.includes('admin') || em.includes('neha') || em.includes('platform')) {
      return {
        roleKey: 'COMPANY_ADMIN',
        title: 'Company Administrator',
        subtitle: 'Executive Tenant Governance',
        description: 'Routes to Admin blueprint setup, template DAG validator, and SLA configurations.',
        badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200 font-semibold',
        cardClass: 'border-purple-300 bg-purple-50/50',
        icon: 'admin_panel_settings',
        btnText: 'Sign In to Admin Setup',
      };
    }

    return {
      roleKey: 'SSO_PENDING',
      title: 'Enterprise SSO User',
      subtitle: 'Corporate Tenant Directory',
      description: 'Domain credentials recognized. Role permissions will be confirmed upon sign in.',
      badgeClass: 'badge-locked',
      cardClass: 'border-outline-variant/40 bg-surface-container-low',
      icon: 'verified_user',
      btnText: 'Sign In with SSO',
    };
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      // Route by role
      if (email.includes('hr') || email.includes('priya')) navigate('/hr');
      else if (email.includes('it.owner') || email.includes('vikram') || email.includes('owner')) navigate('/owner');
      else if (email.includes('admin') || email.includes('neha')) navigate('/admin');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPersona = (personaEmail: string) => {
    setEmail(personaEmail);
    setPassword('demo1234');
    setError(null);
  };

  const handleInstantLaunch = async (personaEmail: string) => {
    setEmail(personaEmail);
    setPassword('demo1234');
    setError(null);
    setLoading(true);

    try {
      await login(personaEmail, 'demo1234');
      if (personaEmail.includes('hr') || personaEmail.includes('priya')) navigate('/hr');
      else if (personaEmail.includes('it.owner') || personaEmail.includes('vikram') || personaEmail.includes('owner')) navigate('/owner');
      else if (personaEmail.includes('admin') || personaEmail.includes('neha')) navigate('/admin');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-between py-10 px-4 sm:px-6 selection:bg-primary-container selection:text-on-primary-container">
      {/* Central Login Container */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg card-stitch bg-surface-container-lowest p-6 sm:p-8 space-y-6">
          {/* Header & Enterprise Identity */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                hub
              </span>
            </div>
            <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">
              Enterprise Sign In
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              StartSmart Orchestration Gateway · Multi-Tenant Access
            </p>
          </div>

          {/* Selected Company Context Badge */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${selectedCompany.colorClass}`}>
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {selectedCompany.icon}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-body-md font-semibold text-on-surface truncate">
                    {selectedCompany.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium shrink-0">
                    @{selectedCompany.domain}
                  </span>
                </div>
                <div className="text-[11px] text-on-surface-variant truncate">
                  {selectedCompany.industry} · SAML / SSO Active
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-label-sm font-semibold text-primary hover:text-primary-600 transition-colors flex items-center gap-1 shrink-0 px-2 py-1 rounded hover:bg-surface-container"
              title="Select another company"
            >
              <span>Change</span>
              <span className="material-symbols-outlined text-xs">swap_horiz</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 text-base shrink-0">
                error
              </span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="company-email" className="block text-label-md font-semibold text-on-surface mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant/60 text-lg pointer-events-none">
                  mail
                </span>
                <input
                  id="company-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`name@${selectedCompany.domain}`}
                  className="input-stitch pl-10 pr-3 text-body-md"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="company-password" className="block text-label-md font-semibold text-on-surface">
                  Password
                </label>
                <span className="text-[11px] font-mono text-on-surface-variant/70">
                  Demo password: <code className="bg-surface-container px-1 py-0.5 rounded text-on-surface font-semibold">demo1234</code>
                </span>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant/60 text-lg pointer-events-none">
                  lock
                </span>
                <input
                  id="company-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-stitch pl-10 pr-10 text-body-md font-mono"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-on-surface-variant/60 hover:text-on-surface p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-base">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Dynamic Automatic Role Detection Badge */}
            {detectedRole && (
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${detectedRole.cardClass}`}>
                <span
                  className="material-symbols-outlined text-xl mt-0.5 shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {detectedRole.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-label-caps uppercase font-bold tracking-wider text-on-surface-variant">
                      Automatic Role Detection:
                    </span>
                    <span className={detectedRole.badgeClass}>
                      {detectedRole.title}
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant mt-1 leading-snug">
                    {detectedRole.description}
                  </p>
                </div>
              </div>
            )}

            {/* Primary Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-gradient w-full h-11 text-label-lg font-semibold shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  <span>Authenticating session...</span>
                </>
              ) : (
                <>
                  <span>{detectedRole ? detectedRole.btnText : 'Sign In to Platform'}</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Persona Quick Buttons (1-Click Test Personas) */}
          <div className="pt-5 border-t border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-label-caps uppercase tracking-wider font-bold text-on-surface-variant">
                1-Click Demo Personas
              </span>
              <span className="text-[11px] text-on-surface-variant/70 font-mono">
                Click chip to test role
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_PERSONAS.map((persona) => {
                const isSelected = email === persona.email;
                return (
                  <div
                    key={persona.email}
                    onClick={() => handleSelectPersona(persona.email)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'border-primary bg-primary-fixed/20 shadow-xs'
                        : 'border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="text-label-md font-semibold text-on-surface flex items-center gap-1.5 truncate">
                        <span>{persona.name}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-primary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-on-surface-variant/70 truncate">
                        {persona.email}
                      </div>
                      <div className="mt-1">
                        <span className={persona.badgeClass}>{persona.role}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInstantLaunch(persona.email);
                      }}
                      title={`Fast Launch as ${persona.name}`}
                      className="w-7 h-7 rounded-md bg-surface-container text-on-surface-variant hover:bg-primary hover:text-white flex items-center justify-center transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm">login</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center text-body-sm text-on-surface-variant/70 mt-6">
        <span>StartSmart Enterprise Platform · Bennett University Hackathon 2026</span>
      </div>
    </div>
  );
};
