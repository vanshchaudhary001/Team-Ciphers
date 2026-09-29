import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import {
  Building2,
  GitBranch,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [company, setCompany] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Cycle simulator state
  const [testTasks, setTestTasks] = useState([
    { id: '1', title: 'Task A (Provision)', prereqs: '' },
    { id: '2', title: 'Task B (Configure)', prereqs: '1' },
    { id: '3', title: 'Task C (Verify)', prereqs: '2' },
  ]);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [validating, setValidating] = useState(false);

  // Reset state
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const fetchCompany = async () => {
    try {
      const res = await api.getCompanyInfo();
      if (res.success) setCompany(res.company);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const handleValidateGraph = async () => {
    setValidating(true);
    setValidationResult(null);
    try {
      const formatted = testTasks.map((t) => ({
        id: t.id,
        title: t.title,
        prerequisiteIds: t.prereqs ? t.prereqs.split(',').map((s) => s.trim()) : [],
      }));

      const res = await api.validateTemplateGraph(formatted);
      if (res.success) {
        setValidationResult(res);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleAddSimulatorTask = () => {
    const nextId = String(testTasks.length + 1);
    setTestTasks([...testTasks, { id: nextId, title: `Task ${nextId}`, prereqs: '' }]);
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo database state back to initial scenario?')) return;
    setResetting(true);
    try {
      const res = await api.resetDemoData();
      if (res.success) {
        setResetMsg(res.message);
        setTimeout(() => setResetMsg(null), 5000);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
                Tenant & Organization Settings
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Multi-Company Architecture</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Company Administration & Graph Engine
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage organization metadata, configure owner groups, and validate onboarding DAG dependency acyclicity.
            </p>
          </div>

          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting Demo...' : '1-Click Scenario Reset'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {resetMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {resetMsg}
          </div>
        )}

        {/* Company Overview Card */}
        {company && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-lg">
                TN
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{company.name}</h2>
                <div className="text-xs text-slate-500">
                  Domain: <strong className="text-slate-700">{company.emailDomain}</strong> · Industry: {company.industry} · Default Timezone: {company.timezone}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Departments</span>
                <div className="flex flex-wrap gap-1">
                  {company.departments?.map((d: any) => (
                    <span key={d.id} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium">
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Office Locations</span>
                <div className="flex flex-wrap gap-1">
                  {company.locations?.map((l: any) => (
                    <span key={l.id} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium">
                      {l.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Configured Owner Groups</span>
                <div className="flex flex-wrap gap-1">
                  {company.ownerGroups?.map((og: any) => (
                    <span key={og.id} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium">
                      {og.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dependency Graph Simulator & Cycle Detector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Onboarding Graph Cycle Detector & Validator
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tests template dependency relationships using DFS cycle detection. Circular prerequisites are strictly prevented.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddSimulatorTask}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Node
              </button>
              <button
                onClick={handleValidateGraph}
                disabled={validating}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                {validating ? 'Testing...' : 'Run Cycle Check'}
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-12 gap-2 text-slate-400 font-semibold px-2 uppercase text-[10px]">
              <div className="col-span-2">Task ID</div>
              <div className="col-span-5">Task Title</div>
              <div className="col-span-5">Prerequisites (Comma separated IDs)</div>
            </div>

            {testTasks.map((t, idx) => (
              <div key={t.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div className="col-span-2 font-mono font-bold text-indigo-600 px-2">{t.id}</div>
                <div className="col-span-5">
                  <input
                    type="text"
                    value={t.title}
                    onChange={(e) => {
                      const updated = [...testTasks];
                      updated[idx].title = e.target.value;
                      setTestTasks(updated);
                    }}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="col-span-5">
                  <input
                    type="text"
                    value={t.prereqs}
                    onChange={(e) => {
                      const updated = [...testTasks];
                      updated[idx].prereqs = e.target.value;
                      setTestTasks(updated);
                    }}
                    placeholder="e.g. 1 or 1, 2"
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Validation Feedback */}
          {validationResult && (
            <div className="pt-3">
              {validationResult.valid ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Valid DAG: No circular dependencies detected. Graph can be published safely.</span>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{validationResult.error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
