import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { UserCheck, RefreshCw, Sparkles, Building2, CheckCircle, ShieldAlert } from 'lucide-react';

export const DemoSwitcherBar: React.FC = () => {
  const { user, switchDemoUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const personas = [
    {
      name: 'Aarav Sharma',
      role: 'Employee',
      email: 'aarav@technova.demo',
      icon: '👤',
      route: '/dashboard',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
      activeColor: 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300',
    },
    {
      name: 'Priya Sharma',
      role: 'HR Admin',
      email: 'hr@technova.demo',
      icon: '📋',
      route: '/hr',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
      activeColor: 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300',
    },
    {
      name: 'Vikram IT',
      role: 'IT Task Owner',
      email: 'it.owner@technova.demo',
      icon: '⚙️',
      route: '/owner',
      color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
      activeColor: 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300',
    },
    {
      name: 'Neha Admin',
      role: 'Company Admin',
      email: 'admin@technova.demo',
      icon: '👑',
      route: '/admin',
      color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
      activeColor: 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-300',
    },
  ];

  const handleSelectPersona = async (p: typeof personas[0]) => {
    try {
      await switchDemoUser(p.email);
      queryClient.invalidateQueries();
      navigate(p.route);
    } catch (err: any) {
      console.error('Persona switch error:', err);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo state back to the initial scenario (VPN blocked, 4 downstream tasks locked)?')) {
      return;
    }
    setResetting(true);
    try {
      const res = await api.resetDemoData();
      await switchDemoUser('aarav@technova.demo');
      queryClient.invalidateQueries();
      navigate('/dashboard');
      setNotificationMsg('Demo database reset to initial blocked VPN scenario!');
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch (err: any) {
      alert('Error resetting demo: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs py-2 px-4 shadow-inner sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Hackathon Judge Persona Switcher Label */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-indigo-400 bg-indigo-950/80 px-2 py-1 rounded border border-indigo-800/60">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Judge Persona Switcher:
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
            <Building2 className="w-3 h-3 text-slate-400" />
            Org: <strong className="text-slate-200">TechNova Solutions</strong>
          </span>
        </div>

        {/* Center: Persona Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-1.5">
          {personas.map((p) => {
            const isActive = user?.email === p.email;
            return (
              <button
                key={p.email}
                onClick={() => handleSelectPersona(p)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-all text-xs border ${
                  isActive
                    ? p.activeColor
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
                title={`Switch active persona to ${p.name} (${p.role})`}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  {p.role}
                </span>
                {isActive && <CheckCircle className="w-3 h-3 text-white ml-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Right: Reset Demo State Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/70 hover:bg-rose-900 transition-colors disabled:opacity-50"
            title="Reset scenario to Aarav blocked on VPN"
          >
            <RefreshCw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetting...' : 'Reset Demo'}
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div className="bg-emerald-600 text-white text-center py-1 font-medium text-xs mt-1 rounded">
          {notificationMsg}
        </div>
      )}
    </div>
  );
};
