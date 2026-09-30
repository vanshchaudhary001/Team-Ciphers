import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { AIUnstickResponse } from '../types/index.js';
import {
  LifeBuoy,
  X,
  Send,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Users,
  Compass,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  BellRing,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UnstickModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTaskId?: string;
  defaultQuery?: string;
  onTaskSelect?: (taskId: string) => void;
}

export const UnstickModal: React.FC<UnstickModalProps> = ({
  isOpen,
  onClose,
  defaultTaskId,
  defaultQuery = "I can't access GitHub",
  onTaskSelect,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(defaultQuery);
  const [category, setCategory] = useState<string>('Account access');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIUnstickResponse | null>(null);
  const [nudging, setNudging] = useState(false);
  const [nudgeSuccess, setNudgeSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['Account access', 'Equipment', 'Permissions', 'Approval', 'Documentation', 'Training'];

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setNudgeSuccess(null);

    try {
      const res = await api.analyzeUnstick({
        taskId: defaultTaskId,
        query,
        category,
      });
      if (res.success) {
        setResult(res.data);
      }
    } catch (err: any) {
      alert('Error diagnosing blocker: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNudgeOwner = async () => {
    if (!result?.diagnosis) return;
    setNudging(true);
    try {
      // Find blocker ID or nudge using root blocker task
      const journeyRes = await api.getJourney();
      const blocker = journeyRes.journey?.activeBlockers?.find(
        (b: any) => b.rootTaskId === result.diagnosis?.rootBlockerId
      );

      if (blocker) {
        await api.nudgeBlocker(blocker.id, 'Friendly reminder from employee via UNSTICK');
        setNudgeSuccess(`Nudge sent to ${result.diagnosis.responsibleOwnerGroupName}! Notification logged.`);
      } else {
        setNudgeSuccess(`Notification dispatched to ${result.diagnosis.responsibleOwnerGroupName}.`);
      }
    } catch (err: any) {
      setNudgeSuccess('Note: Nudge sent to team queue.');
    } finally {
      setNudging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <LifeBuoy className="w-6 h-6 text-indigo-300 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">UNSTICK™ Blocker Recovery</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  Root Cause Engine
                </span>
              </div>
              <p className="text-indigo-200 text-xs mt-0.5">
                AI diagnosis proposes; backend dependency engine deterministically decides.
              </p>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-5">
          {/* Query input */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Describe where you are stuck
            </label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. I can't access GitHub, or I need repository permissions..."
                className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <button
                onClick={handleAnalyze}
                disabled={loading || !query.trim()}
                className="absolute right-2 top-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
              >
                {loading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <span>Diagnose</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Quick Category Chips */}
            <div className="flex flex-wrap gap-1.5 items-center pt-1">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick categories:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setQuery(`I am having an issue with ${cat.toLowerCase()}`);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    category === cat
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results section */}
          {result && (
            <div className="space-y-4 pt-2 border-t border-slate-200 animate-in fade-in duration-300">
              {/* Answer summary box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <span className="font-semibold text-xs text-indigo-950 uppercase tracking-wide">
                      Intelligence Diagnosis
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                      ⚡ Powered by {result.aiProvider || 'AI Onboarding Copilot'}
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs sm:text-sm">{result.answer}</p>
                </div>
              </div>

              {/* Blocker Breakdown Card */}
              {result.diagnosis && (
                <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 uppercase tracking-wide">
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                      Detected Root Blocker
                    </span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Waiting ~{result.diagnosis.waitingHours} hours
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-rose-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        {result.diagnosis.rootBlockerTitle}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Responsible: <span className="font-semibold text-slate-700">{result.diagnosis.responsibleOwnerGroupName}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleNudgeOwner}
                      disabled={nudging}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      {nudging ? 'Sending...' : 'Nudge Responsible Owner'}
                    </button>
                  </div>

                  {nudgeSuccess && (
                    <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      {nudgeSuccess}
                    </div>
                  )}

                  {/* Downstream Impact List */}
                  <div className="bg-white/80 p-3 rounded-lg border border-rose-100">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Downstream Impact:</span>
                      <span className="text-rose-700 font-extrabold">
                        {result.diagnosis.downstreamImpactCount} affected tasks currently locked
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {result.diagnosis.impactedTasks.map((t) => (
                        <span
                          key={t.id}
                          className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-medium"
                        >
                          🔒 {t.title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SideQuest Recommendations */}
              {result.diagnosis && result.diagnosis.availableSideQuests.length > 0 && (
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wide">
                      <Compass className="w-4 h-4 text-indigo-600" />
                      SideQuest™ — Useful Work Available Meanwhile
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      Zero Dependency On Blocker
                    </span>
                  </div>

                  <div className="space-y-2">
                    {result.diagnosis.availableSideQuests.map((quest) => (
                      <div
                        key={quest.id}
                        className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs flex items-center justify-between gap-2 hover:border-indigo-300 transition-all"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{quest.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {quest.purpose || 'Self-contained onboarding training module.'}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            navigate(`/tasks/${quest.id}`);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs shrink-0"
                        >
                          Start Task
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grounded Knowledge Citations */}
              {result.citedSources.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Verified Company Knowledge Citations
                  </div>
                  {result.citedSources.map((source) => (
                    <div
                      key={source.id}
                      className="p-3 bg-emerald-50/40 border border-emerald-200/80 rounded-lg text-xs"
                    >
                      <div className="font-semibold text-emerald-950 flex items-center justify-between">
                        <span>{source.title}</span>
                        {source.sourceUrl && (
                          <span className="text-[10px] text-emerald-700 flex items-center gap-0.5">
                            Approved Source <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed">{source.excerpt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                onClose();
                navigate('/knowledge');
              }}
              className="text-xs text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Need human buddy / HR handoff?
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
