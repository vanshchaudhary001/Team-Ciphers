import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  UserCheck,
  MessageSquare,
  GitBranch,
  RefreshCw,
  X,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<any | null>(null);
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [delayReason, setDelayReason] = useState('');
  const [delayEta, setDelayEta] = useState(24);
  const [noteText, setNoteText] = useState('');

  const fetchActions = async () => {
    try {
      const res = await api.getOwnerActions();
      if (res.success) {
        setActions(res.actions);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleApprove = async (action: any) => {
    setActionLoadingId(action.id);
    try {
      const res = await api.approveOwnerTask(action.id);
      if (res.success) {
        alert(`SUCCESS: "${action.title}" approved! Downstream dependencies recalculated. GitHub Access for ${action.employee.name} is now UNLOCKED!`);
        await fetchActions();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelay = async () => {
    if (!selectedAction || !delayReason.trim()) return;
    try {
      const res = await api.delayOwnerTask(selectedAction.id, delayReason, delayEta);
      if (res.success) {
        setDelayModalOpen(false);
        setDelayReason('');
        await fetchActions();
        alert('Task delay recorded and notification sent to employee.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddNote = async (taskId: string) => {
    if (!noteText.trim()) return;
    try {
      const res = await api.addOwnerTaskNote(taskId, noteText);
      if (res.success) {
        setNoteText('');
        await fetchActions();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                Task Owner Hub
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">IT Operations & Fulfillments</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              My Assigned Actions & Approvals
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review joiner gate requests, approve credentials, and resolve onboarding blockers to unlock downstream work.
            </p>
          </div>

          <button
            onClick={() => navigate('/rippleview')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <GitBranch className="w-4 h-4 text-indigo-600" />
            <span>View Dependency Graph</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {actions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-lg text-slate-900">All Assigned Actions Completed!</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You have no pending approvals or tasks in your queue. All joiners are unblocked.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {actions.map((act) => {
              const isBlocked = act.downstreamImpactCount > 0;
              return (
                <div
                  key={act.id}
                  className={`bg-white rounded-2xl border shadow-2xs overflow-hidden transition-all ${
                    isBlocked ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                  }`}
                >
                  <div className="p-6 space-y-4">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {act.state}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">·</span>
                          <span className="text-xs font-bold text-slate-700">{act.ownerGroupName}</span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900">{act.title}</h3>
                        <p className="text-xs text-slate-600">{act.purpose}</p>
                      </div>

                      {/* Blocker Impact Badge */}
                      {isBlocked && (
                        <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-1.5 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          <span>Blocks {act.downstreamImpactCount} Downstream Tasks</span>
                        </div>
                      )}
                    </div>

                    {/* Joiner Details Box */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Employee</span>
                        <strong className="text-slate-900">{act.employee.name}</strong>
                        <span className="block text-[11px] text-slate-500">{act.employee.email}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block font-medium">Department & Role</span>
                        <span className="text-slate-800 font-semibold">{act.employee.department}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block font-medium">Time In Queue</span>
                        <span className="text-amber-800 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> ~{act.waitingHours} hours
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block font-medium">Target SLA</span>
                        <span className="text-slate-700 font-semibold">{act.slaHours} hours</span>
                      </div>
                    </div>

                    {/* Delay or flagged note if present */}
                    {act.delayReason && (
                      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span><strong>Delay logged:</strong> {act.delayReason}</span>
                      </div>
                    )}

                    {/* Action buttons bar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {/* THE MAIN ACTION: Approve & Unlock! */}
                        <button
                          onClick={() => handleApprove(act)}
                          disabled={actionLoadingId === act.id}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-100 flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{actionLoadingId === act.id ? 'Unlocking...' : 'Approve & Unlock Dependencies'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedAction(act);
                            setDelayModalOpen(true);
                          }}
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                        >
                          Log Delay
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-400 italic">
                        Approving will immediately recalculate the dependency graph and notify {act.employee.name}.
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delay Modal */}
      {delayModalOpen && selectedAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Record Action Delay</h3>
            <p className="text-xs text-slate-600">
              Provide a clear reason and estimated ETA. This will be visible on the employee journey.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Delay Reason</label>
                <textarea
                  rows={3}
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  placeholder="e.g. Device enrollment profile verification delayed in queue..."
                  className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Estimated New ETA (Hours)</label>
                <input
                  type="number"
                  value={delayEta}
                  onChange={(e) => setDelayEta(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDelayModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelay}
                className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700"
              >
                Save Delay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
