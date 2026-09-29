import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { JourneyTask } from '../types/index.js';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  PlayCircle,
  LifeBuoy,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { UnstickModal } from '../components/UnstickModal.js';

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isUnstickOpen, setIsUnstickOpen] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueReason, setIssueReason] = useState('');

  const fetchTask = async () => {
    if (!id) return;
    try {
      const res = await api.getTask(id);
      if (res.success) {
        setTask(res.task);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleComplete = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await api.completeTask(id);
      if (res.success) {
        await fetchTask();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportIssue = async () => {
    if (!id || !issueReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.reportTaskIssue(id, issueReason);
      if (res.success) {
        setShowIssueModal(false);
        setIssueReason('');
        await fetchTask();
        alert('Your issue report has been logged and notified to IT & HR.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-sm font-semibold text-slate-500">Loading task details...</span>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-center">
        <p className="text-red-600 font-semibold">Task not found</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isDone = task.state === 'DONE';
  const isAvailable = task.state === 'AVAILABLE';
  const isLocked = task.state === 'LOCKED';
  const isWaiting = task.state === 'WAITING';

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {/* Back Link */}
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Start Dashboard</span>
        </button>

        {/* Main Task Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-mono font-bold text-slate-400">
                TASK #{task.orderIndex || 1} · {task.category}
              </span>

              <span
                className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full ${
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

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {task.title}
            </h1>

            {task.purpose && (
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {task.purpose}
              </p>
            )}

            {/* Flagged Issue Warning */}
            {task.stillNotWorkingReason && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Issue Flagged: </strong>
                  <span>{task.stillNotWorkingReason}</span>
                </div>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Step Instructions */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Action Instructions
              </h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed">
                {task.instructions || 'Follow company onboarding handbook to execute this task.'}
              </div>
            </div>

            {/* Dependencies & Impact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prerequisites */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Prerequisites:</span>
                  <span className="text-[11px] text-slate-400">
                    {task.prerequisites?.length || 0} required
                  </span>
                </div>

                {task.prerequisites && task.prerequisites.length > 0 ? (
                  <div className="space-y-1.5">
                    {task.prerequisites.map((pre: any) => (
                      <div
                        key={pre.id}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-800">{pre.title}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            pre.state === 'DONE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {pre.state}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No upstream prerequisites. Independent task.</p>
                )}
              </div>

              {/* Downstream Unlocked Tasks */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Unlocks Next:</span>
                  <span className="text-[11px] text-slate-400">
                    {task.downstream?.length || 0} dependent tasks
                  </span>
                </div>

                {task.downstream && task.downstream.length > 0 ? (
                  <div className="space-y-1.5">
                    {task.downstream.map((down: any) => (
                      <div
                        key={down.id}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-800">{down.title}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {down.state}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Final leaf task in chain.</p>
                )}
              </div>
            </div>

            {/* Approved Knowledge Citations */}
            {task.approvedResources && task.approvedResources.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Approved Knowledge Resources & Guides
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.approvedResources.map((res: any) => (
                    <div key={res.id} className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-emerald-950 flex items-center justify-between">
                        <span>{res.title}</span>
                        <ExternalLink className="w-3 h-3 text-emerald-600" />
                      </div>
                      <p className="text-slate-600 line-clamp-2">{res.excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons Bar */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isAvailable && (
                  <button
                    onClick={handleComplete}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{actionLoading ? 'Verifying...' : 'Mark as Completed'}</span>
                  </button>
                )}

                {isLocked && (
                  <button
                    onClick={() => setIsUnstickOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all"
                  >
                    <LifeBuoy className="w-4 h-4" />
                    <span>Diagnose Blocker with UNSTICK</span>
                  </button>
                )}

                {isDone && (
                  <button
                    onClick={() => setShowIssueModal(true)}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Still Not Working?</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/knowledge')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Request Human Buddy / HR Help</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Still Not Working Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Report Issue: Still Not Working?</h3>
            <p className="text-xs text-slate-600">
              Tell us why this task is not working. The original completion audit log will be preserved, and the task flagged for support.
            </p>
            <textarea
              rows={3}
              value={issueReason}
              onChange={(e) => setIssueReason(e.target.value)}
              placeholder="e.g. My VPN connects but cannot resolve internal cluster DNS..."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowIssueModal(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReportIssue}
                disabled={actionLoading || !issueReason.trim()}
                className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNSTICK Modal */}
      <UnstickModal
        isOpen={isUnstickOpen}
        onClose={() => {
          setIsUnstickOpen(false);
          fetchTask();
        }}
        defaultTaskId={task.id}
      />
    </div>
  );
};
