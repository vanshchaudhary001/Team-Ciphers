import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import {
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  GitBranch,
  Search,
  Filter,
  Plus,
  BellRing,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HRControlCenter: React.FC = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<any | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [nudgingId, setNudgingId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isAddJoinerOpen, setIsAddJoinerOpen] = useState(false);
  const [newJoiner, setNewJoiner] = useState({
    name: '',
    email: '',
    roleTitle: 'Software Engineer',
    departmentCode: 'ENG',
    locationName: 'Bengaluru',
  });

  const fetchData = async () => {
    try {
      const [dashRes, empRes] = await Promise.all([
        api.getHrDashboard(),
        api.getHrEmployees({ search, health: healthFilter }),
      ]);
      if (dashRes.success) setDashboard(dashRes);
      if (empRes.success) setEmployees(empRes.employees);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, healthFilter]);

  const handleNudge = async (blockerId: string) => {
    setNudgingId(blockerId);
    try {
      const res = await api.nudgeBlocker(blockerId, 'HR nudge regarding pending blocker SLA');
      if (res.success) {
        alert(res.message);
        await fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setNudgingId(null);
    }
  };

  const handleEscalate = async (blockerId: string) => {
    if (!window.confirm('Escalate this blocker to leadership / high priority?')) return;
    try {
      const res = await api.escalateBlocker(blockerId, 'HR escalation due to onboarding critical path delay');
      if (res.success) {
        alert(res.message);
        await fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateJoiner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createJoiner(newJoiner);
      if (res.success) {
        setIsAddJoinerOpen(false);
        setNewJoiner({ name: '', email: '', roleTitle: 'Software Engineer', departmentCode: 'ENG', locationName: 'Bengaluru' });
        await fetchData();
        alert('New joiner created with personalized onboarding journey!');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleViewEmployeeDetail = async (empId: string) => {
    try {
      const res = await api.getHrEmployeeDetail(empId);
      if (res.success) {
        setSelectedEmployee(res);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const summary = dashboard?.summary || {
    activeJoiners: 0,
    flowingCount: 0,
    detouringCount: 0,
    stalledCount: 0,
    activeBlockersCount: 0,
    slaBreachCount: 0,
  };

  const blockers = dashboard?.blockers || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                People Operations
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Live Onboarding Oversight</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              HR Control Center & Blocker Intervention
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Identify systemic bottlenecks, trace root causes, and nudge responsible owners before joiners disengage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/index.html"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>HR Partner Workspace &amp; Checklists ↗</span>
            </a>

            <button
              onClick={() => navigate('/rippleview')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <GitBranch className="w-4 h-4 text-indigo-600" />
              <span>Global RippleView™</span>
            </button>

            <button
              onClick={() => setIsAddJoinerOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Joiner</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Joiners</span>
            <div className="text-2xl font-black text-slate-900 mt-2">{summary.activeJoiners}</div>
            <span className="text-[11px] text-slate-400 font-medium">First-week cohort</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Flowing</span>
            <div className="text-2xl font-black text-emerald-600 mt-2">{summary.flowingCount}</div>
            <span className="text-[11px] text-emerald-700 font-medium">Zero blockers</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Detouring</span>
            <div className="text-2xl font-black text-amber-600 mt-2">{summary.detouringCount}</div>
            <span className="text-[11px] text-amber-700 font-medium">On SideQuests</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stalled</span>
            <div className="text-2xl font-black text-rose-600 mt-2">{summary.stalledCount}</div>
            <span className="text-[11px] text-rose-700 font-medium">Critical attention</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Blockers</span>
            <div className="text-2xl font-black text-amber-600 mt-2">{summary.activeBlockersCount}</div>
            <span className="text-[11px] text-slate-400 font-medium">Pending resolution</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SLA Breaches</span>
            <div className="text-2xl font-black text-rose-600 mt-2">{summary.slaBreachCount}</div>
            <span className="text-[11px] text-rose-700 font-medium">&gt;24h waiting</span>
          </div>
        </div>

        {/* Active Blockers Intervention Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Active Onboarding Blockers
              </h2>
              <p className="text-xs text-slate-500">
                Deterministic root cause diagnosis with calculated downstream impact.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">{blockers.length} active blockers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Root Blocker</th>
                  <th className="px-6 py-3">Responsible Owner</th>
                  <th className="px-6 py-3">Time Waiting</th>
                  <th className="px-6 py-3">Downstream Impact</th>
                  <th className="px-6 py-3">SLA Status</th>
                  <th className="px-6 py-3 text-right">Intervention Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blockers.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div>{b.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{b.employeeEmail}</div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div>{b.rootBlockerTitle}</div>
                      <div className="text-[10px] text-slate-400">Blocked: {b.affectedTaskTitle}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 font-semibold text-slate-700">
                        {b.responsibleOwner}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-mono font-medium text-slate-700">
                      {b.waitingHours} hours
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        🔒 {b.downstreamImpactCount} tasks blocked
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {b.isSlaBreached ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          <ShieldAlert className="w-3 h-3" /> SLA Breached
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Within SLA ({b.slaHours}h)
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleNudge(b.id)}
                          disabled={nudgingId === b.id}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                          title="Nudge owner with in-app notification"
                        >
                          <BellRing className="w-3.5 h-3.5 text-amber-600" />
                          <span>{nudgingId === b.id ? 'Nudging...' : `Nudge (${b.nudgedCount})`}</span>
                        </button>

                        <button
                          onClick={() => handleEscalate(b.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-semibold transition-all"
                        >
                          Escalate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Employee Cohort Directory */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-base text-slate-900">Active Employee Journeys</h2>
              <p className="text-xs text-slate-500">Track journey health, completion pace, and pending gates.</p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search joiner..."
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">All Health States</option>
                <option value="FLOWING">Flowing</option>
                <option value="DETOURING">Detouring</option>
                <option value="STALLED">Stalled</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {employees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => handleViewEmployeeDetail(emp.id)}
                className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{emp.name}</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          emp.journeyHealth === 'FLOWING'
                            ? 'bg-emerald-100 text-emerald-800'
                            : emp.journeyHealth === 'DETOURING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {emp.journeyHealth}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5">
                      {emp.role} · {emp.department} · {emp.location} ({emp.workMode})
                    </div>
                  </div>
                </div>

                {/* Progress Mini Bar */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800">
                      {emp.doneTasks} of {emp.totalTasks} Done
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {emp.waitingTasks} Waiting · {emp.lockedTasks} Locked
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Joiner Modal */}
      {isAddJoinerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Add New Joiner to TechNova</h3>
              <button onClick={() => setIsAddJoinerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJoiner} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Full Name</label>
                <input
                  required
                  type="text"
                  value={newJoiner.name}
                  onChange={(e) => setNewJoiner({ ...newJoiner, name: e.target.value })}
                  placeholder="e.g. Tanvi Gupta"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Company Email</label>
                <input
                  required
                  type="email"
                  value={newJoiner.email}
                  onChange={(e) => setNewJoiner({ ...newJoiner, email: e.target.value })}
                  placeholder="tanvi.gupta@technova.demo"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Role</label>
                  <input
                    type="text"
                    value={newJoiner.roleTitle}
                    onChange={(e) => setNewJoiner({ ...newJoiner, roleTitle: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Location</label>
                  <select
                    value={newJoiner.locationName}
                    onChange={(e) => setNewJoiner({ ...newJoiner, locationName: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddJoinerOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-xs hover:bg-indigo-700"
                >
                  Generate Journey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Detail & Audit Logs Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {selectedEmployee.profile.user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedEmployee.profile.user.name}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedEmployee.profile.user.email} · {selectedEmployee.profile.role?.title || 'Engineer'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task list for this employee */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Assigned Journey Tasks
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedEmployee.journey?.tasks?.map((t: any) => (
                  <div key={t.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">{t.title}</span>
                      <span className="text-[11px] text-slate-400 ml-2">({t.ownerGroup?.name || 'Self'})</span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        t.state === 'DONE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.state === 'WAITING'
                          ? 'bg-amber-100 text-amber-800'
                          : t.state === 'AVAILABLE'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.state}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit log history */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Audit Trail & History
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs">
                {selectedEmployee.auditLogs?.map((log: any) => (
                  <div key={log.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-slate-500 ml-2">{log.reason}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
