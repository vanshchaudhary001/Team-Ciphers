import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import {
  BookOpen,
  Search,
  ExternalLink,
  ShieldCheck,
  Send,
  MessageSquare,
  Sparkles,
  UserCheck,
  LifeBuoy,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';

export const KnowledgePage: React.FC = () => {
  const [sources, setSources] = useState<any[]>([]);
  const [helpRequests, setHelpRequests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Human help form
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [helpTarget, setHelpTarget] = useState('BUDDY');
  const [helpSubject, setHelpSubject] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSubmitting, setHelpSubmitting] = useState(false);

  const fetchKnowledge = async () => {
    try {
      const [kRes, hRes] = await Promise.all([api.getKnowledgeSources(), api.getHelpRequests()]);
      if (kRes.success) setSources(kRes.sources);
      if (hRes.success) setHelpRequests(hRes.requests);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);

    try {
      const res = await api.askAI(aiQuestion);
      if (res.success) {
        setAiAnswer(res.data);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmitHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpSubject.trim() || !helpMessage.trim()) return;
    setHelpSubmitting(true);

    try {
      const res = await api.submitHelpRequest({
        targetType: helpTarget,
        subject: helpSubject,
        message: helpMessage,
      });

      if (res.success) {
        setHelpModalOpen(false);
        setHelpSubject('');
        setHelpMessage('');
        await fetchKnowledge();
        alert('Your help request has been routed to ' + helpTarget + '. You will receive a response shortly.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setHelpSubmitting(false);
    }
  };

  const filteredSources = sources.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.content.toLowerCase().includes(search.toLowerCase()) ||
      s.excerpt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Verified Knowledge Base
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Approved Runbooks & Human Buddies</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Company Knowledge & Human Support
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Grounded, approved onboarding documentation and direct human handoffs.
            </p>
          </div>

          <button
            onClick={() => setHelpModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Request Human Buddy / HR Support</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* AI Grounded Search Box */}
        <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-indigo-900">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="font-extrabold text-sm uppercase tracking-wider">
              Ask Start Smart Assistant (Grounded In Approved Guides)
            </h2>
          </div>

          <form onSubmit={handleAskAI} className="relative">
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="e.g. How do I request VPN access, or what are the Docker environment prerequisites?"
              className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
            <button
              type="submit"
              disabled={aiLoading || !aiQuestion.trim()}
              className="absolute right-2 top-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              {aiLoading ? 'Searching...' : 'Ask AI'}
            </button>
          </form>

          {/* AI Response Display */}
          {aiAnswer && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3 animate-in fade-in duration-200">
              <div className="font-semibold text-slate-800 leading-relaxed">
                {aiAnswer.answer}
              </div>

              {aiAnswer.citedSources && aiAnswer.citedSources.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-500 text-[11px] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Cited Official Documentation:
                  </span>
                  {aiAnswer.citedSources.map((cs: any) => (
                    <div key={cs.id} className="p-2 bg-white rounded border border-slate-200 text-[11px] text-slate-600">
                      <strong>{cs.title}</strong>: {cs.excerpt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Knowledge Sources Grid */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-base text-slate-900">Approved Company Guides & Policies</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter guides..."
                className="pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSources.map((s) => (
              <div
                key={s.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {s.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Owner: {s.owner}</span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{s.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{s.excerpt}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Verified {new Date(s.lastReviewedAt).toLocaleDateString()}
                  </span>
                  {s.sourceUrl && (
                    <a
                      href={s.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <span>Read Full Handbook</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Human Help Requests Tracker */}
        {helpRequests.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Your Submitted Human Help Inquiries</h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {helpRequests.map((hr) => (
                <div key={hr.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{hr.subject}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        Target: {hr.targetType}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        hr.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {hr.status}
                    </span>
                  </div>

                  <p className="text-slate-600">{hr.message}</p>

                  {hr.response && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 font-medium">
                      <strong>Response:</strong> {hr.response}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Human Help Request Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Request Human Help</h3>
            <p className="text-xs text-slate-600">
              Need personal support or clarification on team norms? Send a direct confidential message.
            </p>

            <form onSubmit={handleSubmitHelp} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Send Request To</label>
                <select
                  value={helpTarget}
                  onChange={(e) => setHelpTarget(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="BUDDY">Onboarding Buddy (Rahul Mehta)</option>
                  <option value="MANAGER">Hiring Manager (Priya Sharma)</option>
                  <option value="HR">People Partner (HR Operations)</option>
                  <option value="TEAM">Core Engineering Team Lead</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Subject</label>
                <input
                  required
                  type="text"
                  value={helpSubject}
                  onChange={(e) => setHelpSubject(e.target.value)}
                  placeholder="e.g. Quick question on local testing environment..."
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Message</label>
                <textarea
                  required
                  rows={3}
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  placeholder="Explain what you need assistance with..."
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHelpModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={helpSubmitting}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {helpSubmitting ? 'Routing...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
