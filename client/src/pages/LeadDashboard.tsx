import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { TeamOverviewResponse, TeamMemberSummary, Blocker } from '../types/index.js';
import {
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  LifeBuoy,
  Building,
  Shield,
  Send,
  ExternalLink,
  ChevronRight,
  BookOpen,
  RefreshCw,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LeadDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teamData, setTeamData] = useState<TeamOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [nudgingId, setNudgingId] = useState<string | null>(null);
  const [nudgeSuccess, setNudgeSuccess] = useState<string | null>(null);

  const fetchTeamData = async () => {
    try {
      const res = await api.getTeamOverview();
      if (res.success) {
        setTeamData(res);
      }
    } catch (err: any) {
      console.error('Lead dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [user]);

  const handleNudge = async (blockerId: string) => {
    setNudgingId(blockerId);
    try {
      const res = await api.nudgeBlocker(blockerId, 'Lead follow-up on joiner unblocking');
      if (res.success) {
        setNudgeSuccess(`Nudge sent to responsible owner for Blocker #${blockerId.slice(0, 8)}`);
        await fetchTeamData();
        setTimeout(() => setNudgeSuccess(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send nudge');
    } finally {
      setNudgingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Loading Lead dashboard...</span>
        </div>
      </div>
    );
  }

  const members = teamData?.members || [];
  const teamBlockers = teamData?.teamBlockers || [];

  const flowingCount = members.filter((m) => m.health === 'FLOWING').length;
  const detouringCount = members.filter((m) => m.health === 'DETOURING').length;
  const stalledCount = members.filter((m) => m.health === 'STALLED').length;

  const avgProgress =
    members.length > 0
      ? Math.round(members.reduce((acc, m) => acc + m.progress, 0) / members.length)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                Lead · Mid Level Leadership
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
              Lead Control Hub · {user?.team || 'Web and Mobile Development'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
              Signed in as <span className="font-bold text-slate-800">{user?.name}</span> ({user?.positionTitle || user?.title || 'Lead - Senior Software Engineer'}) · Employee ID: <code className="font-mono text-slate-700 font-bold">{user?.employeeId || 'EMP-LED-001'}</code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchTeamData()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Team Sync
            </button>
            <button
              onClick={() => navigate('/rippleview')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              RippleView Graph
            </button>
          </div>
        </div>
      </div>

      {nudgeSuccess && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{nudgeSuccess}</span>
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
              <span className="text-xs font-bold uppercase tracking-wider">Team Joiners</span>
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{members.length} Active</div>
            <div className="text-[11px] text-slate-500 font-medium">Assigned to your sub-branch</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Cohort Health</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{flowingCount} Flowing</div>
            <div className="text-[11px] text-slate-500 font-medium">
              {detouringCount} Detouring · {stalledCount} Stalled
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Team Blockers</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600">{teamBlockers.length} Active</div>
            <div className="text-[11px] text-slate-500 font-medium">Awaiting external IT/HR resolution</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Average Progress</span>
              <Briefcase className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{avgProgress}%</div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
              <div
                className="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${avgProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Team Members Roster */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Team Joiners & Onboarding Roster
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Live onboarding progress, health states, and blocker statuses across your direct reports.
              </p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 w-fit">
              {members.length} Members in {user?.team || 'Web and Mobile Development'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Authoritative Position</th>
                  <th className="px-6 py-3.5">Cohort Health</th>
                  <th className="px-6 py-3.5">Tasks Completed</th>
                  <th className="px-6 py-3.5">Progress</th>
                  <th className="px-6 py-3.5 text-right">Lead Action</th>
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
                        <div className="text-[10px] text-slate-400">{member.branch}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${healthBadge}`}>
                          {member.health}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {member.completedTasks} / {member.totalTasks} Tasks
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                            <span>{member.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-teal-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${member.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate('/rippleview')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:text-teal-600 bg-white font-bold text-[11px] transition-all shadow-2xs"
                        >
                          <span>Inspect Graph</span>
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

        {/* Active Blockers & Unblocking Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Active Team Blockers & Escalation Queue
                </h3>
                <p className="text-xs text-slate-500">
                  Prerequisites blocking your team joiners from progressing.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                {teamBlockers.length} Blockers
              </span>
            </div>

            {teamBlockers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                No active blockers reported. All team paths are moving forward.
              </div>
            ) : (
              <div className="space-y-3">
                {teamBlockers.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {b.rootTask?.title || 'Root Blocker'}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                          {b.responsibleOwnerGroup?.name || 'IT Operations'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {b.rootCauseSummary}
                      </p>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Impacts: <span className="font-bold text-slate-700">{b.affectedTask?.title || 'Downstream Task'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleNudge(b.id)}
                      disabled={nudgingId === b.id}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{nudgingId === b.id ? 'Nudging...' : '1-Click Nudge'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lead Quick Mentorship Guide */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              Lead Responsibilities
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-800">Day 1 Introduction</div>
                <p className="text-[11px] text-slate-500">
                  Host 30-min coffee chat to introduce team communication norms, Slack channels, and code review etiquette.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-800">Prerequisite Clearance</div>
                <p className="text-[11px] text-slate-500">
                  If joiners are blocked on VPN or Git access, recommend SideQuest modules (Compliance training, Notion docs).
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-800">First PR Pair Programming</div>
                <p className="text-[11px] text-slate-500">
                  Review the starter ticket ticket ENG-101 and approve initial CI/CD pipeline triggers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
