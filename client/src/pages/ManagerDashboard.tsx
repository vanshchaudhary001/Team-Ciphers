import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { TeamOverviewResponse, OrgPosition, Blocker } from '../types/index.js';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Building2,
  Shield,
  Send,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  FolderTree,
  Sliders,
  Layers,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teamData, setTeamData] = useState<TeamOverviewResponse | null>(null);
  const [deptPositions, setDeptPositions] = useState<OrgPosition[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [selectedRoleLevel, setSelectedRoleLevel] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [nudgingId, setNudgingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchManagerData = async () => {
    try {
      const [tRes, pRes] = await Promise.all([
        api.getTeamOverview(),
        api.getOrgPositions({ departmentId: user?.departmentId || 'DEP-06' }),
      ]);
      if (tRes.success) setTeamData(tRes);
      if (pRes.success) setDeptPositions(pRes.positions);
    } catch (err: any) {
      console.error('Manager dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
  }, [user]);

  const handleNudgeBlocker = async (blockerId: string) => {
    setNudgingId(blockerId);
    try {
      const res = await api.nudgeBlocker(blockerId, 'Manager SLA escalation follow-up');
      if (res.success) {
        setNotification(`Manager escalation nudge dispatched for Blocker #${blockerId.slice(0, 8)}`);
        await fetchManagerData();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch escalation');
    } finally {
      setNudgingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Loading Management Overview...</span>
        </div>
      </div>
    );
  }

  const members = teamData?.members || [];
  const blockers = teamData?.teamBlockers || [];

  const totalJoiners = members.length;
  const flowingCount = members.filter((m) => m.health === 'FLOWING').length;
  const detouringCount = members.filter((m) => m.health === 'DETOURING').length;
  const stalledCount = members.filter((m) => m.health === 'STALLED').length;

  const filteredPositions = deptPositions.filter((p) => {
    const matchesSearch =
      p.fullTitle.toLowerCase().includes(posSearch.toLowerCase()) ||
      p.team.toLowerCase().includes(posSearch.toLowerCase()) ||
      p.branch.toLowerCase().includes(posSearch.toLowerCase());
    const matchesLevel =
      selectedRoleLevel === 'ALL' || p.roleLevel.toLowerCase() === selectedRoleLevel.toLowerCase();
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                Manager · Senior Level
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {user?.departmentName || 'ENGINEERING, DEVELOPMENT AND SERVICES'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">
                {user?.branch || 'Software Engineering'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Management Command Center · {user?.departmentName || 'Engineering Operations'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
              Signed in as <span className="font-bold text-slate-800">{user?.name}</span> ({user?.positionTitle || user?.title || 'Manager - Engineering Manager'}) · Employee ID: <code className="font-mono text-slate-700 font-bold">{user?.employeeId || 'EMP-MGR-001'}</code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchManagerData()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Department Telemetry
            </button>
            <button
              onClick={() => navigate('/rippleview')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Dependency Graph
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="p-4 bg-purple-50 border border-purple-200 text-purple-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span>{notification}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Department Joiners</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalJoiners} Joiners</div>
            <div className="text-[11px] text-slate-500 font-medium">Across active cohorts</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Onboarding Velocity</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{flowingCount} Flowing</div>
            <div className="text-[11px] text-slate-500 font-medium">
              {detouringCount} Detouring · {stalledCount} Stalled
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">SLA Escalations</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600">{blockers.length} Pending</div>
            <div className="text-[11px] text-slate-500 font-medium">Owner queue bottlenecks</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Authoritative Positions</span>
              <FolderTree className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{deptPositions.length} Defined</div>
            <div className="text-[11px] text-slate-500 font-medium">Word Document Schema</div>
          </div>
        </div>

        {/* Department Joiners Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Departmental Joiners & Progression
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Stage progression, blocker visibility, and direct managerial escalation.
              </p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 w-fit">
              {user?.departmentName || 'Engineering Department'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Joiner</th>
                  <th className="px-6 py-3.5">Authoritative Position</th>
                  <th className="px-6 py-3.5">Team & Sub-Branch</th>
                  <th className="px-6 py-3.5">Health State</th>
                  <th className="px-6 py-3.5">Completion</th>
                  <th className="px-6 py-3.5 text-right">Manager Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => {
                  const healthBadge =
                    member.health === 'FLOWING'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : member.health === 'DETOURING'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{member.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{member.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{member.title}</div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {member.roleLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{member.team}</div>
                        <div className="text-[10px] text-slate-400">{member.branch}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${healthBadge}`}>
                          {member.health}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                            <span>{member.progress}%</span>
                            <span className="text-slate-400 font-normal">
                              {member.completedTasks}/{member.totalTasks}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-purple-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${member.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate('/rippleview')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:text-purple-600 bg-white font-bold text-[11px] transition-all shadow-2xs"
                        >
                          <span>Review DAG</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Authoritative Organizational Structure Explorer */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-purple-600" />
                Department Organizational Structure Drilldown
              </h3>
              <p className="text-xs text-slate-500">
                Authoritative positions and role levels for {user?.departmentName || 'this department'}.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search positions..."
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-purple-500 text-slate-800"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                {['ALL', 'Associate', 'Lead', 'Manager'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedRoleLevel(lvl)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      selectedRoleLevel === lvl
                        ? 'bg-white text-purple-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPositions.map((p) => {
              const badgeColor =
                p.roleLevel === 'Associate'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : p.roleLevel === 'Lead'
                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200';

              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-300 transition-all space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${badgeColor}`}>
                      {p.roleLevel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{p.id}</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{p.title}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {p.branch} &gt; {p.team}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
