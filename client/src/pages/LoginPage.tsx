import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  Lock,
  Mail,
  ArrowRight,
  Shield,
  ArrowLeft,
  User,
  Users,
  Briefcase,
  Crown,
  AlertCircle,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const roleParam = searchParams.get('role');
  const presetEmailParam = searchParams.get('presetEmail');

  const [email, setEmail] = useState('associate@technova.demo');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (presetEmailParam) {
      setEmail(presetEmailParam);
    } else if (roleParam === 'associate') {
      setEmail('associate@technova.demo');
    } else if (roleParam === 'lead') {
      setEmail('lead@technova.demo');
    } else if (roleParam === 'manager') {
      setEmail('manager@technova.demo');
    } else if (roleParam === 'ceo') {
      setEmail('ceo@technova.demo');
    }
  }, [roleParam, presetEmailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);

      // Read updated user from local storage or context
      const userStr = localStorage.getItem('startsmart_token');
      // Fetch me or route by email/role directly
      if (email.includes('ceo')) navigate('/dashboard/ceo');
      else if (email.includes('manager')) navigate('/dashboard/manager');
      else if (email.includes('lead')) navigate('/dashboard/lead');
      else if (email.includes('hr')) navigate('/hr');
      else if (email.includes('it.owner')) navigate('/owner');
      else if (email.includes('admin')) navigate('/admin');
      else navigate('/dashboard/associate');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('demo1234');
    setError(null);
  };

  const demoAccounts = [
    {
      name: 'Aarav Sharma',
      roleLevel: 'Associate',
      roleName: 'Associate (Entry Level)',
      title: 'Associate - Software Engineer',
      email: 'associate@technova.demo',
      icon: User,
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      name: 'Priya Lead',
      roleLevel: 'Lead',
      roleName: 'Lead (Mid Level)',
      title: 'Lead - Senior Software Engineer',
      email: 'lead@technova.demo',
      icon: Users,
      badge: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      name: 'Rohan Verma',
      roleLevel: 'Manager',
      roleName: 'Manager (Senior Level)',
      title: 'Manager - Engineering Manager',
      email: 'manager@technova.demo',
      icon: Briefcase,
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      name: 'Rajesh Mehta',
      roleLevel: 'CEO',
      roleName: 'CEO (Executive Access)',
      title: 'Manager - Chief Executive Officer',
      email: 'ceo@technova.demo',
      icon: Crown,
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      name: 'Priya Sharma (HR)',
      roleLevel: 'HR',
      roleName: 'HR Control Center',
      title: 'Lead People Partner',
      email: 'hr@technova.demo',
      icon: Shield,
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      name: 'Vikram IT',
      roleLevel: 'Owner',
      roleName: 'IT Task Owner',
      title: 'IT Systems Lead',
      email: 'it.owner@technova.demo',
      icon: Shield,
      badge: 'bg-slate-100 text-slate-700 border-slate-300',
    },
  ];

  const getRoleHeaderInfo = () => {
    if (roleParam === 'associate' || email.includes('associate')) {
      return {
        title: 'Associate Gateway',
        subtitle: 'Entry Level Access · Daily Onboarding & Tasks',
        badge: 'Associate',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    }
    if (roleParam === 'lead' || email.includes('lead')) {
      return {
        title: 'Lead Gateway',
        subtitle: 'Mid Level Access · Team Progress & Technical Mentorship',
        badge: 'Lead',
        color: 'bg-teal-50 text-teal-700 border-teal-200',
      };
    }
    if (roleParam === 'manager' || email.includes('manager')) {
      return {
        title: 'Manager Gateway',
        subtitle: 'Senior Level Access · Departmental Oversight & SLA Management',
        badge: 'Manager',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    }
    if (roleParam === 'ceo' || email.includes('ceo')) {
      return {
        title: 'Executive CEO Gateway',
        subtitle: 'Executive Access · 18 Departments & Organization-Wide Telemetry',
        badge: 'CEO',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    return {
      title: 'Company Member Sign In',
      subtitle: 'StartSmart Enterprise Onboarding Portal',
      badge: 'Enterprise',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  const headerInfo = getRoleHeaderInfo();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-6 sm:p-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/gateway"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Switch Role
          </Link>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${headerInfo.color}`}>
            {headerInfo.badge}
          </span>
        </div>

        {/* Brand */}
        <div className="text-center space-y-1.5">
          <img
            src="/start-smart-logo-transparent.png"
            alt="Start Smart"
            className="h-12 object-contain mx-auto mb-2"
          />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {headerInfo.title}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {headerInfo.subtitle}
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Company Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@technova.demo"
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Password</label>
              <span className="text-[11px] text-slate-400 font-mono">Demo: demo1234</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Authenticating & Verifying Role...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Role Credentials Quick Fill */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Demo Credentials (1-Click Fill)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">pwd: demo1234</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {demoAccounts.map((acc) => {
              const Icon = acc.icon;
              const isSelected = email === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-400'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${acc.badge}`}>
                      {acc.roleLevel}
                    </span>
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="font-bold text-slate-800 text-[11px] truncate">{acc.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">{acc.email}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security Note */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed">
          <span className="font-bold text-slate-700">RBAC Enforcement:</span> Backend determines and enforces your true organizational level and positions upon session verification.
        </div>
      </div>
    </div>
  );
};
