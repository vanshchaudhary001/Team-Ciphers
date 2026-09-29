import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Laptop,
  Lock,
  FileCheck,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

export const PreJoinReadinessPage: React.FC = () => {
  const [readinessList, setReadinessList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReadiness = async () => {
    try {
      const res = await api.getPreJoinReadiness();
      if (res.success) {
        setReadinessList(res.readiness);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
  }, []);

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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
              Pre-Boarding Gateways
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">Day 0 Health Checks</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Pre-Join Readiness Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate hardware provisioning, corporate identity, and credentials before joiners walk through the door.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ready Joiners</span>
            <div className="text-2xl font-black text-emerald-600 mt-2">
              {readinessList.filter((r) => r.status === 'READY').length}
            </div>
            <span className="text-[11px] text-slate-400">100% prerequisites cleared</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">At Risk</span>
            <div className="text-2xl font-black text-amber-600 mt-2">
              {readinessList.filter((r) => r.status === 'AT_RISK').length}
            </div>
            <span className="text-[11px] text-amber-700 font-medium">Pending IT/HR approvals</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Blocked</span>
            <div className="text-2xl font-black text-rose-600 mt-2">
              {readinessList.filter((r) => r.status === 'BLOCKED').length}
            </div>
            <span className="text-[11px] text-rose-700 font-medium">Critical hardware delays</span>
          </div>
        </div>

        {/* Readiness Matrix Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-base text-slate-900">Pre-Day 1 Joiner Status</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Joiner</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Joining Date</th>
                  <th className="px-6 py-3.5">Hardware (Laptop)</th>
                  <th className="px-6 py-3.5">VPN Access</th>
                  <th className="px-6 py-3.5">HR Documents</th>
                  <th className="px-6 py-3.5">Buddy Allocated</th>
                  <th className="px-6 py-3.5 text-right">Overall Readiness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readinessList.map((item) => (
                  <tr key={item.employeeId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{item.email}</div>
                    </td>

                    <td className="px-6 py-4 text-slate-700 font-medium">{item.department}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono">
                      {new Date(item.joiningDate).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          item.checklist.laptop === 'DONE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.checklist.laptop === 'WAITING'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        <Laptop className="w-3 h-3" />
                        {item.checklist.laptop}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          item.checklist.vpn === 'DONE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        {item.checklist.vpn}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                        <FileCheck className="w-3 h-3" />
                        {item.checklist.documentation}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {item.checklist.buddyAssigned ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Assigned
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                          item.status === 'READY'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'AT_RISK'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
