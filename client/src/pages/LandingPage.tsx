import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  Zap,
  ArrowRight,
  GitBranch,
  LifeBuoy,
  Compass,
  ShieldCheck,
  Users,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  Building2,
  CheckSquare,
  UserPlus,
  PlusCircle,
  UserCheck,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchDemoUser } = useAuth();

  const handleLaunchDemo = async (role = 'aarav@technova.demo') => {
    try {
      await switchDemoUser(role);
      if (role.includes('hr')) navigate('/hr');
      else if (role.includes('owner')) navigate('/owner');
      else navigate('/dashboard');
    } catch (err) {
      navigate('/login');
    }
  };

  const chain = [
    { title: 'Laptop Provisioning', state: 'DONE', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 border-emerald-300' },
    { title: 'VPN Approval', state: 'WAITING (BLOCKER)', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-400 ring-2 ring-amber-300' },
    { title: 'GitHub Access', state: 'LOCKED', icon: Lock, color: 'text-slate-400 bg-slate-100 border-slate-300' },
    { title: 'Repository Access', state: 'LOCKED', icon: Lock, color: 'text-slate-400 bg-slate-100 border-slate-300' },
    { title: 'Development Env', state: 'LOCKED', icon: Lock, color: 'text-slate-400 bg-slate-100 border-slate-300' },
    { title: 'First Coding PR', state: 'LOCKED', icon: Lock, color: 'text-slate-400 bg-slate-100 border-slate-300' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            AI-Powered, Dependency-Aware Employee Onboarding Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Your first week.{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
              Without the maze.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Onboarding should move people forward, not leave them waiting. Start Smart connects every task,
            identifies the real blocker, routes it to the right owner, and keeps new employees moving.
          </p>

          {/* Role Identification Gateway Section */}
          <div className="mt-12 mb-10 max-w-6xl mx-auto text-left">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome to the Enterprise Onboarding Portal. Please select your role to continue.
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                Identify your profile to enter your personalized day-one onboarding workspace, access your company's SSO environment, or manage staff escalations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: I'm a New Joiner */}
              <a
                href="/new-joiner.html"
                className="group relative bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      Employee Portal
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    I'm a New Joiner
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    Routes to the employee onboarding checklist and registration portal.
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Company & branch selector
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Assigned Buddy & HR contacts
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Interactive "Work for Today"
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-indigo-600">
                  <span>Start Onboarding</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>

              {/* Card 2: Existing Company */}
              <a
                href="/existing-company.html"
                className="group relative bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      Org Login
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Existing Company
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    Routes to the standard login for enrolled organizations.
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Okta / Azure AD SAML SSO
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Tenant domain credentials
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Organization directory sync
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-blue-600">
                  <span>Company Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>

              {/* Card 3: Register a Company */}
              <a
                href="/register.html"
                className="group relative bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex items-center justify-center">
                      <PlusCircle className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      Setup Master
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Register a Company
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    Routes to the master setup form for new organizations.
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Department workflow blueprints
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> SLA & escalation rules
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 14-day enterprise pilot
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-emerald-600">
                  <span>Register Workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>

              {/* Card 4: I'm a Buddy (Manager / HR Admin) */}
              <a
                href="/buddy.html"
                className="group relative bg-white border border-slate-200 hover:border-purple-400 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors flex items-center justify-center">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                      Staff Portal
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
                    I'm a Buddy (Manager / HR Admin)
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    Routes to the staff mentoring, escalation, and management dashboard.
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Assigned mentee roster
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Live bottleneck escalation
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 1:1 syncs & approval actions
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-purple-600">
                  <span>Open Staff Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => handleLaunchDemo('aarav@technova.demo')}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all hover:scale-102"
            >
              <span>Explore Live Demo as Aarav</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleLaunchDemo('hr@technova.demo')}
              className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-sm shadow-xs flex items-center gap-2 transition-all"
            >
              <span>View HR Control Center</span>
            </button>

            <button
              onClick={() => handleLaunchDemo('it.owner@technova.demo')}
              className="px-6 py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-sm shadow-xs flex items-center gap-2 transition-all"
            >
              <span>IT Task Owner Hub</span>
            </button>
          </div>

          {/* Visual Dependency Chain Showcase */}
          <div className="mt-16 bg-white rounded-2xl border border-slate-200 p-6 shadow-xl max-w-5xl mx-auto text-left space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-indigo-600" />
                Live Dependency Chain: Software Engineer Onboarding
              </span>
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                1 Root Blocker Detected · 4 Tasks Downstream Locked
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {chain.map((c, i) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.title}
                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between space-y-2 ${c.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold">0{i + 1}</span>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold leading-tight">{c.title}</div>
                      <div className="text-[9px] uppercase font-extrabold mt-1 tracking-wider opacity-80">{c.state}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* The Core Contrast Comparison: Traditional vs Start Smart */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              The Paradigm Shift
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
              Checklists tell you what is pending. <br />
              <span className="text-indigo-600">Start Smart tells you why, who, and what to do next.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Traditional */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Traditional Portals</span>
              <div className="text-lg font-bold text-slate-800">
                "GitHub access is pending."
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Joiner has no visibility into why it's pending, who holds the keys, how many other tasks are blocked, or what productive work they can do while waiting.
              </p>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600">
                Result: Joiner sits idle on Day 2 browsing Slack, disengages, and feeling helpless.
              </div>
            </div>

            {/* Start Smart */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/50 border border-indigo-200 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                  Start Smart Platform
                </span>
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>

              <div className="text-lg font-bold text-indigo-950">
                "GitHub access is waiting for VPN approval from IT Operations. 4 downstream tasks are affected. Complete security training while you wait."
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                AI diagnosis detects the root blocker, calculates downstream impact, notifies the exact owner group, and recommends valid SideQuests with zero blocker dependencies.
              </p>

              <div className="p-3 bg-white rounded-lg border border-indigo-200 text-xs text-indigo-900 font-medium">
                Result: Continuous progress. Blocker resolved in minutes. Zero wasted onboarding hours.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Designed for the Entire First-Week Ecosystem
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Three roles, one shared database, deterministic DAG engine, and AI that proposes while rules decide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">UNSTICK™ Blocker Recovery</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Natural-language blocker diagnosis. Identifies root causes upstream, estimates wait time, calculates affected downstream tasks, and routes gentle nudges to owners.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">SideQuest™ Rerouting</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When the main critical path is blocked, the engine calculates useful tasks whose prerequisites are satisfied and that have zero dependency on the blocked gate.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">RippleView™ Interactive Graph</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              React Flow-powered dependency visualization with animated ripple indicators highlighting root bottlenecks and live state unlocking upon owner approvals.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">HR Intervention Center</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complete bird's-eye view over all active joiners. Track flowing, detouring, and stalled journeys, SLA breaches, and send nudges directly to task owners.
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Task Owner Action Hub</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dedicated dashboard for IT Operations, Facilities, and Security. Approve pending requests, log delays with reasons, and watch downstream dependencies unlock in real time.
            </p>
          </div>

          {/* Pillar 6 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Verified Knowledge & Human Handoff</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Answers strictly grounded in company-approved policy guides. Sensitive questions (salary, HR grievances) automatically route to a verified human buddy or partner.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-bold text-slate-700">
            START SMART — Your first week. Without the maze.
          </div>
          <div>
            Bennett University Hackathon 2026 · Challenge: The First-Week Maze (Enterprise Edition)
          </div>
        </div>
      </footer>
    </div>
  );
};
