import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

interface DemoPersona {
  name: string;
  roleTitle: string;
  email: string;
  icon: string;
  route: string;
}

export const DemoSwitcherBar: React.FC = () => {
  const { user, switchDemoUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const personas: DemoPersona[] = [
    {
      name: 'Aarav (Associate)',
      roleTitle: 'Associate',
      email: 'associate@technova.demo',
      icon: 'person',
      route: '/dashboard/associate',
    },
    {
      name: 'Priya (Lead)',
      roleTitle: 'Lead',
      email: 'lead@technova.demo',
      icon: 'groups',
      route: '/dashboard/lead',
    },
    {
      name: 'Rohan (Manager)',
      roleTitle: 'Manager',
      email: 'manager@technova.demo',
      icon: 'business_center',
      route: '/dashboard/manager',
    },
    {
      name: 'Rajesh (CEO)',
      roleTitle: 'CEO',
      email: 'ceo@technova.demo',
      icon: 'military_tech',
      route: '/dashboard/ceo',
    },
    {
      name: 'HR Admin',
      roleTitle: 'HR Admin',
      email: 'hr@technova.demo',
      icon: 'badge',
      route: '/hr',
    },
    {
      name: 'IT Owner',
      roleTitle: 'IT Owner',
      email: 'it.owner@technova.demo',
      icon: 'support_agent',
      route: '/owner',
    },
    {
      name: 'Admin',
      roleTitle: 'Company Admin',
      email: 'admin@technova.demo',
      icon: 'shield_person',
      route: '/admin',
    },
  ];

  const currentPersona = personas.find((p) => p.email === user?.email) || personas[0];

  const handleSelectPersona = async (p: DemoPersona) => {
    try {
      await switchDemoUser(p.email);
      queryClient.invalidateQueries();
      navigate(p.route);
    } catch (err: any) {
      console.error('Persona switch error:', err);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo state back to the initial scenario (Aarav blocked on VPN, 4 downstream tasks locked)?')) {
      return;
    }
    setResetting(true);
    try {
      const res = await api.resetDemoData();
      if (res.success) {
        await switchDemoUser('aarav@technova.demo');
        queryClient.invalidateQueries();
        navigate('/dashboard');
        setNotificationMsg('Demo environment reset to initial blocked VPN scenario');
        setTimeout(() => setNotificationMsg(null), 3500);
      }
    } catch (err: any) {
      alert('Error resetting demo: ' + (err.message || 'Server error'));
    } finally {
      setResetting(false);
    }
  };

  return (
    <aside
      aria-label="Demo Environment Switcher"
      className="bg-slate-900 text-slate-200 border-b border-slate-800 text-xs py-1.5 px-3 sm:px-6 sticky top-0 z-50 select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Environment, Company & Active Persona Summary */}
        <div className="flex items-center gap-2 text-label-caps flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            Demo Environment
          </span>

          <span className="text-slate-500 hidden sm:inline">•</span>

          <span className="hidden sm:inline-flex items-center gap-1 text-slate-300 font-sans">
            <span className="text-slate-400">Org:</span>
            <strong className="font-semibold text-white">
              {user?.company?.name || 'TechNova Solutions'}
            </strong>
          </span>

          <span className="text-slate-500 hidden md:inline">•</span>

          <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300 font-sans">
            <span className="text-slate-400">Active:</span>
            <span className="text-white font-medium">{user?.name || currentPersona.name}</span>
            <span className="text-slate-500 font-mono text-[10px]">({user?.role?.replace('_', ' ') || currentPersona.roleTitle})</span>
          </span>
        </div>

        {/* Center: Compact Persona Switcher Chips */}
        <div className="flex items-center flex-wrap gap-1">
          {personas.map((p) => {
            const isActive = user?.email === p.email;
            return (
              <button
                key={p.email}
                type="button"
                onClick={() => handleSelectPersona(p)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-xs font-semibold ring-1 ring-primary/40'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
                }`}
                title={`Switch active persona to ${p.name} (${p.roleTitle})`}
              >
                <span className="material-symbols-outlined text-[13px] leading-none" aria-hidden="true">
                  {p.icon}
                </span>
                <span>{p.name.split(' ')[0]}</span>
                <span
                  className={`text-[9px] font-mono uppercase px-1 py-0.2 rounded ${
                    isActive ? 'bg-black/25 text-white' : 'bg-slate-700/80 text-slate-400'
                  }`}
                >
                  {p.roleTitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Reset Demo Scenario Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDemo}
            disabled={resetting}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-rose-950/70 hover:text-rose-200 border border-slate-700 hover:border-rose-800/60 transition-colors disabled:opacity-50"
            title="Reset scenario to initial state (Aarav blocked on VPN approval)"
          >
            <span
              className={`material-symbols-outlined text-[13px] leading-none ${
                resetting ? 'animate-spin text-rose-400' : 'text-slate-400'
              }`}
              aria-hidden="true"
            >
              restart_alt
            </span>
            <span>{resetting ? 'Resetting...' : 'Reset Scenario'}</span>
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div className="max-w-7xl mx-auto mt-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-center text-[11px] font-medium animate-in fade-in duration-150">
          {notificationMsg}
        </div>
      )}
    </aside>
  );
};

export default DemoSwitcherBar;
