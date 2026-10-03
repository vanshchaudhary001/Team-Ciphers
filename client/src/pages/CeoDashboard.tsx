import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import {
  ExecutiveMetrics,
  DepartmentSummary,
  OrgPosition,
  OrgDepartment,
  Blocker,
} from '../types/index.js';
import {
  Crown,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderTree,
  TrendingUp,
  Search,
  Filter,
  Shield,
  Send,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Sparkles,
  BarChart3,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CeoDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [departmentSummaries, setDepartmentSummaries] = useState<DepartmentSummary[]>([]);
  const [activeBlockers, setActiveBlockers] = useState<Blocker[]>([]);
  const [allPositions, setAllPositions] = useState<OrgPosition[]>([]);
  const [allDepartments, setAllDepartments] = useState<OrgDepartment[]>([]);

  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [selectedRoleTier, setSelectedRoleTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'positions' | 'blockers'>('overview');

  const fetchCeoData = async () => {
    try {
      const [execRes, posRes, deptRes] = await Promise.all([
        api.getExecutiveOverview(),
        api.getOrgPositions({ limit: '500' }),
        api.getOrgDepartments(),
      ]);

      if (execRes.success) {
        setMetrics(execRes.metrics);
        setDepartmentSummaries(execRes.departmentSummaries);
        setActiveBlockers(execRes.activeBlockers || []);
      }
      if (posRes.success) {
        setAllPositions(posRes.positions);
      }
      if (deptRes.success) {
        setAllDepartments(deptRes.departments);
      }
    } catch (err: any) {
      console.error('CEO Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCeoData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-sm font-semibold text-slate-600">
            Initializing Executive CEO Telemetry...
          </span>
        </div>
      </div>
    );
  }

  // Filter positions by department, role level, and search query
  const filteredPositions = allPositions.filter((p) => {
    const matchesDept = selectedDeptId === 'ALL' || p.departmentId === selectedDeptId;
    const matchesTier =
      selectedRoleTier === 'ALL' || p.roleLevel.toLowerCase() === selectedRoleTier.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      p.fullTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.departmentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesTier && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Executive Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-10 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                CEO Executive Access Portal
              </span>
              <span className="text-xs font-semibold text-slate-400">
                18 Enterprise Departments
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-400">
                423 Authoritative Positions
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Executive Command &amp; Organizational Directory
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">
              Signed in as <span className="font-bold text-white">{user?.name}</span> ({user?.positionTitle || 'Manager - Chief Executive Officer'}) · Department: <span className="text-amber-400 font-bold">GENERAL MANAGEMENT</span> · ID: <code className="text-slate-300 font-mono font-bold">{user?.employeeId || 'EMP-CEO-001'}</code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchCeoData()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Analytics
            </button>
            <button
              onClick={() => navigate('/rippleview')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-black transition-all shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Org Dependency Graph
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Executive KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Workforce</span>
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">
              {metrics?.totalWorkforce || 0}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Across all 18 organizational departments
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Active Onboarding</span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-600">
              {metrics?.activeOnboardings || 0} Cohorts
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Overall completion rate: <span className="font-bold text-slate-800">{metrics?.overallCompletionRate || 0}%</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Cohort Health</span>
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-emerald-600">{metrics?.cohortHealth?.FLOWING || 0}</span>
              <span className="text-slate-300 font-normal">/</span>
              <span className="text-amber-500">{metrics?.cohortHealth?.DETOURING || 0}</span>
              <span className="text-slate-300 font-normal">/</span>
              <span className="text-rose-500">{metrics?.cohortHealth?.STALLED || 0}</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Flowing · Detouring · Stalled
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Authoritative Catalog</span>
              <FolderTree className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-600">
              {metrics?.totalAuthoritativePositions || 423}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Positions across 18 authoritative departments
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-200/70 p-1.5 rounded-2xl border border-slate-200 w-fit text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Organization Overview
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'departments'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            18 Departments Breakdown
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'positions'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Authoritative Positions Tree (423)
          </button>
          <button
            onClick={() => setActiveTab('blockers')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'blockers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Executive Blocker Overview ({activeBlockers.length})
          </button>
        </div>

        {/* Tab 1: Organization Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 18 Departments Grid Summary */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    18 Authoritative Departments Overview
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Workforce distribution, active joiners, and completion rates mapped strictly from authentic records.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                  18 Departments · 423 Positions
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departmentSummaries.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        {dept.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          dept.health === 'FLOWING'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : dept.health === 'DETOURING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {dept.health}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{dept.name}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {dept.totalPositions} Defined Positions
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-medium text-slate-600">
                      <div>
                        Headcount: <span className="font-bold text-slate-800">{dept.headcount}</span>
                      </div>
                      <div>
                        Active Joiners: <span className="font-bold text-slate-800">{dept.activeJoiners}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 18 Departments Breakdown Table */}
        {activeTab === 'departments' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Authoritative 18 Departments Roster
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Verified structural departments from the authoritative source document.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Code</th>
                    <th className="px-6 py-3.5">Department Name</th>
                    <th className="px-6 py-3.5">Authoritative Positions</th>
                    <th className="px-6 py-3.5">Enrolled Headcount</th>
                    <th className="px-6 py-3.5">Active Joiners</th>
                    <th className="px-6 py-3.5">Onboarding Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departmentSummaries.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-700">
                        {dept.code}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                        {dept.name}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {dept.totalPositions} Positions
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {dept.headcount} Members
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {dept.activeJoiners} Joiners
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            dept.health === 'FLOWING'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : dept.health === 'DETOURING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {dept.health}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Authoritative Positions Explorer (All 423) */}
        {activeTab === 'positions' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-amber-500" />
                  Authoritative Position Hierarchy Explorer (423 Positions)
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Dynamic Department &gt; Branch &gt; Sub-Branch &gt; Team &gt; Role Level &gt; Position mapping.
                </p>
              </div>

              {/* Filtering Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by title or team..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-amber-500 text-slate-800 w-48 sm:w-60"
                  />
                </div>

                {/* Department Dropdown */}
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  <option value="ALL">All 18 Departments</option>
                  {allDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>

                {/* Role Level Tier */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  {['ALL', 'Associate', 'Lead', 'Manager'].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedRoleTier(tier)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        selectedRoleTier === tier
                          ? 'bg-white text-amber-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Counter */}
            <div className="text-xs font-bold text-slate-500">
              Showing {filteredPositions.length} of {allPositions.length} authoritative positions
            </div>

            {/* Positions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[700px] overflow-y-auto p-1">
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
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-amber-400 hover:shadow-2xs transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md border ${badgeColor}`}>
                        {p.roleLevel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{p.id}</span>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-xs">{p.title}</div>
                      <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                        {p.departmentName}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 space-y-0.5">
                      <div>Branch: <span className="text-slate-700 font-medium">{p.branch}</span></div>
                      <div>Sub-Branch: <span className="text-slate-700 font-medium">{p.subBranch}</span></div>
                      <div>Team: <span className="text-slate-700 font-medium">{p.team}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Executive Blocker Overview */}
        {activeTab === 'blockers' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Organization-Wide Blocker Telemetry
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Live visibility into upstream bottlenecks holding up joiner onboarding across all teams.
              </p>
            </div>

            {activeBlockers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-semibold">
                No active bottlenecks reported across the organization.
              </div>
            ) : (
              <div className="space-y-4">
                {activeBlockers.map((b) => (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl border border-rose-200 bg-rose-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">
                          {b.rootTask?.title || 'Upstream Blocker'}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-md">
                          Responsible: {b.responsibleOwnerGroup?.name || 'IT Operations'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {b.rootCauseSummary}
                      </p>
                      <div className="text-xs text-slate-500">
                        Impacted Downstream Gate: <span className="font-bold text-slate-800">{b.affectedTask?.title || 'GitHub Access'}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => navigate('/rippleview')}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm"
                      >
                        Inspect DAG
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
