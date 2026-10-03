import React from 'react';
import { HierarchicalTaskManager } from '../components/HierarchicalTaskManager.js';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const TaskManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userRole = (user?.role || '').toUpperCase();
  const isManager = userRole === 'MANAGER' || userRole === 'CEO';
  const returnPath = isManager ? '/dashboard/manager' : '/dashboard/lead';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(returnPath)}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <span className="text-xs font-semibold text-slate-400">
            Enterprise Governance · Hierarchical Task Control Center
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <HierarchicalTaskManager />
      </div>
    </div>
  );
};
