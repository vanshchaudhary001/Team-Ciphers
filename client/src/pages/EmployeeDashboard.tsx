import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { JourneyData, JourneyTask, SideQuest } from '../types/index.js';
import {
  LifeBuoy,
  PlayCircle,
  Clock,
  Lock,
  CheckCircle2,
  Compass,
  ArrowRight,
  Sparkles,
  Users,
  Building,
  MapPin,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UnstickModal } from '../components/UnstickModal.js';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [sidequests, setSidequests] = useState<SideQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnstickOpen, setIsUnstickOpen] = useState(false);
  const [unstickTargetTaskId, setUnstickTargetTaskId] = useState<string | undefined>();
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [jRes, sqRes] = await Promise.all([api.getJourney(), api.getSideQuests()]);
      if (jRes.success) setJourneyData(jRes.journey);
      if (sqRes.success) setSidequests(sqRes.sidequests);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleQuickComplete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletingTaskId(taskId);
    try {
      const res = await api.completeTask(taskId);
      if (res.success) {
        await fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleOpenUnstick = (taskId?: string) => {
    setUnstickTargetTaskId(taskId);
    setIsUnstickOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Loading your onboarding journey...</span>
        </div>
      </div>
    );
  }

  const tasks = journeyData?.tasks || [];
  const stats = journeyData?.stats || { total: 0, done: 0, available: 0, waiting: 0, locked: 0 };
  const health = journeyData?.health || 'FLOWING';
  const activeBlockers = journeyData?.activeBlockers || [];
  const nextMove = journeyData?.nextMove;

  const percentComplete = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Welcome Header */}
      <div className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                New Joiner Portal
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Day 2 of Week 1</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              Good morning, {user?.name?.split(' ')[0] || 'Aarav'}.
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Welcome to <strong className="text-indigo-950 font-bold">TechNova Solutions</strong>. Let's get you set up for your first contribution.
            </p>

            {/* People & Context Badges */}
            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg font-medium">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Manager: <strong>Priya Sharma</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg font-medium">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Buddy: <strong>Rahul Mehta</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                Bengaluru Office (Hybrid)
              </span>
            </div>
          </div>

          {/* Journey Health & Unstick Callout */}
          <div className="flex flex-col items-start md:items-end gap-3">
            {/* Journey Health Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-bold text-xs shadow-2xs bg-amber-50 border-amber-300 text-amber-900">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Journey Health: {health}</span>
              <span className="text-[11px] font-normal text-amber-800">
                (Main path blocked, useful SideQuests available)
              </span>
            </div>

            {/* Persistent I'm Stuck CTA */}
            <button
              onClick={() => handleOpenUnstick()}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl font-bold text-sm shadow-md shadow-rose-100 flex items-center gap-2 transition-all hover:scale-102"
            >
              <LifeBuoy className="w-4 h-4 animate-spin-slow" />
              <span>I'M STUCK (UNSTICK)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Progress & Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {/* Progress % */}
          <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</span>
            <div className="text-2xl font-black text-slate-900 mt-2">{percentComplete}%</div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {/* Done */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">{stats.done}</div>
            <span className="text-[11px] text-slate-400 font-medium">Verified Done</span>
          </div>

          {/* Available Now */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available</span>
              <PlayCircle className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-indigo-600 mt-2">{stats.available}</div>
            <span className="text-[11px] text-slate-400 font-medium">Ready to start</span>
          </div>

          {/* Waiting */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waiting</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-2">{stats.waiting}</div>
            <span className="text-[11px] text-slate-400 font-medium">On external owner</span>
          </div>

          {/* Locked */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Locked</span>
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-600 mt-2">{stats.locked}</div>
            <span className="text-[11px] text-slate-400 font-medium">Prereqs incomplete</span>
          </div>
        </div>

        {/* Active Blocker Alert Banner (The Hackathon Focal Point) */}
        {activeBlockers.length > 0 && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-amber-300/80 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500 text-white shadow-2xs">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Active Blocker Detected on Your Journey
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {activeBlockers[0].rootCauseSummary}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/rippleview')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
                >
                  <span>Inspect RippleView™</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleOpenUnstick(activeBlockers[0].affectedTaskId)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>Diagnose Blocker</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Next Move Card */}
        {nextMove && (
          <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                  Recommended Next Move
                </div>
                <h3 className="font-extrabold text-base text-slate-900 mt-0.5">{nextMove.title}</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {nextMove.purpose || 'Start your next immediately actionable onboarding module.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleQuickComplete(nextMove.id, e)}
                disabled={completingTaskId === nextMove.id}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {completingTaskId === nextMove.id ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Complete</span>
                  </>
                )}
              </button>

              <button
                onClick={() => navigate(`/tasks/${nextMove.id}`)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                View Details
              </button>
            </div>
          </div>
        )}

        {/* SideQuest Section: Keep Moving While Waiting */}
        {sidequests.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 rounded-2xl border border-indigo-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-2xs">
                  <Compass className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    SideQuest™ Recommendations — Keep Moving While Blocked
                  </h3>
                  <p className="text-xs text-slate-500">
                    Useful, self-contained onboarding tasks that have <strong>zero dependency</strong> on the pending VPN approval.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sidequests.slice(0, 3).map((quest) => (
                <div
                  key={quest.id}
                  onClick={() => navigate(`/tasks/${quest.id}`)}
                  className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {quest.category}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 mt-2 line-clamp-2">{quest.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {quest.purpose || 'Independent onboarding action.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10px] text-slate-400 font-medium">{quest.slaHours}h SLA</span>
                    <span className="text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Start <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Journey Task List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-slate-900">Your Full Onboarding Journey</h2>
              <p className="text-xs text-slate-500">
                Tasks unlock automatically as upstream prerequisites are resolved.
              </p>
            </div>

            <button
              onClick={() => navigate('/rippleview')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View Interactive Graph</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {tasks.map((task, idx) => {
              const isDone = task.state === 'DONE';
              const isWaiting = task.state === 'WAITING';
              const isAvailable = task.state === 'AVAILABLE';
              const isLocked = task.state === 'LOCKED';

              return (
                <div
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    {/* State Icon Indicator */}
                    <div className="mt-0.5 shrink-0">
                      {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      {isWaiting && <Clock className="w-5 h-5 text-amber-500 animate-pulse" />}
                      {isAvailable && <PlayCircle className="w-5 h-5 text-indigo-600" />}
                      {isLocked && <Lock className="w-5 h-5 text-slate-400" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">#{idx + 1}</span>
                        <h4
                          className={`text-sm font-bold ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h4>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800'
                              : isWaiting
                              ? 'bg-amber-100 text-amber-800'
                              : isAvailable
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {task.state}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {task.purpose || task.instructions}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span>Category: <strong className="text-slate-600">{task.category}</strong></span>
                        <span>Owner: <strong className="text-slate-600">{task.ownerGroup?.name || 'Self-Service'}</strong></span>
                        {task.completedBy && <span>Completed by: {task.completedBy}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right side actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                    {isAvailable && (
                      <button
                        onClick={(e) => handleQuickComplete(task.id, e)}
                        disabled={completingTaskId === task.id}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>
                    )}

                    {isLocked && (
                      <button
                        onClick={() => handleOpenUnstick(task.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <LifeBuoy className="w-3.5 h-3.5" />
                        <span>I'm Stuck</span>
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating UNSTICK Action Button */}
      <button
        onClick={() => handleOpenUnstick()}
        className="fixed bottom-6 right-6 px-4 py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-2xl shadow-xl flex items-center gap-2.5 font-extrabold text-sm z-30 transition-all hover:scale-105"
        title="Open UNSTICK blocker recovery"
      >
        <LifeBuoy className="w-5 h-5 text-amber-200" />
        <span>I'M STUCK</span>
      </button>

      {/* Persistent UNSTICK Modal */}
      <UnstickModal
        isOpen={isUnstickOpen}
        onClose={() => {
          setIsUnstickOpen(false);
          fetchDashboardData();
        }}
        defaultTaskId={unstickTargetTaskId}
      />
    </div>
  );
};
