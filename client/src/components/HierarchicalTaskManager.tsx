import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { JourneyTask, TaskAuditRecord, ManagementSubordinate } from '../types/index.js';
import {
  Users,
  Shield,
  Plus,
  Edit2,
  Archive,
  RotateCcw,
  History,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Sparkles,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface Props {
  defaultSubordinateId?: string;
}

export const HierarchicalTaskManager: React.FC<Props> = ({ defaultSubordinateId }) => {
  const { user } = useAuth();

  // Role detection
  const userRole = (user?.role || '').toUpperCase();
  const isManager = userRole === 'MANAGER' || userRole === 'CEO' || userRole === 'COMPANY_ADMIN' || userRole === 'PLATFORM_ADMIN';
  const isLead = userRole === 'LEAD';
  const isAssociate = !isManager && !isLead;

  // Subordinates state
  const [subordinates, setSubordinates] = useState<ManagementSubordinate[]>([]);
  const [selectedSubordinate, setSelectedSubordinate] = useState<ManagementSubordinate | null>(null);
  const [subordinateFilterRole, setSubordinateFilterRole] = useState<'ALL' | 'LEAD' | 'ASSOCIATE'>('ALL');
  const [subordinateSearch, setSubordinateSearch] = useState('');

  // Tasks state
  const [tasks, setTasks] = useState<JourneyTask[]>([]);
  const [loadingSubordinates, setLoadingSubordinates] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [taskSearch, setTaskSearch] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<JourneyTask | null>(null);
  const [auditHistory, setAuditHistory] = useState<TaskAuditRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form state for Add/Edit
  const [formData, setFormData] = useState({
    title: '',
    purpose: '',
    instructions: '',
    day: 1,
    priority: 'MEDIUM' as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
    estimatedDuration: 30,
    slaHours: 8,
    resourceLinks: '',
    category: 'ROLE_EXECUTION',
  });
  const [savingTask, setSavingTask] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // 1. Fetch subordinates on mount
  const fetchSubordinates = async () => {
    if (isAssociate) return;
    setLoadingSubordinates(true);
    try {
      const res = await api.getManagementSubordinates();
      if (res.success) {
        const subs: ManagementSubordinate[] = res.subordinates || [];
        setSubordinates(subs);

        // Select initial subordinate
        if (subs.length > 0) {
          if (defaultSubordinateId) {
            const found = subs.find((s) => s.id === defaultSubordinateId);
            setSelectedSubordinate(found || subs[0]);
          } else if (!selectedSubordinate) {
            setSelectedSubordinate(subs[0]);
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching subordinates:', err);
    } finally {
      setLoadingSubordinates(false);
    }
  };

  useEffect(() => {
    fetchSubordinates();
  }, [user]);

  // 2. Fetch tasks for selected subordinate
  const fetchSubordinateTasks = async (employeeId: string) => {
    setLoadingTasks(true);
    try {
      const res = await api.getEmployeeManagementTasks(employeeId);
      if (res.success) {
        setTasks(res.tasks || []);
      }
    } catch (err: any) {
      console.error('Error fetching subordinate tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (selectedSubordinate) {
      fetchSubordinateTasks(selectedSubordinate.id);
    } else {
      setTasks([]);
    }
  }, [selectedSubordinate]);

  // Helper notification
  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Associate execution-only guard
  if (isAssociate) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-2xl mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Associate Execution-Only Scope</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Associates have execution-only access to their assigned onboarding checklist.
          Task template creation, modification, reordering, and archiving are strictly governed by designated Leads and Department Managers.
        </p>
      </div>
    );
  }

  // Filter subordinates list
  const filteredSubordinates = subordinates.filter((sub) => {
    const roleMatch =
      subordinateFilterRole === 'ALL' ||
      (subordinateFilterRole === 'LEAD' && (sub.roleLevel?.toLowerCase() === 'lead' || sub.role === 'LEAD')) ||
      (subordinateFilterRole === 'ASSOCIATE' && (sub.roleLevel?.toLowerCase() === 'associate' || sub.role === 'ASSOCIATE'));

    const searchMatch =
      sub.name.toLowerCase().includes(subordinateSearch.toLowerCase()) ||
      sub.email.toLowerCase().includes(subordinateSearch.toLowerCase()) ||
      (sub.title && sub.title.toLowerCase().includes(subordinateSearch.toLowerCase())) ||
      (sub.team && sub.team.toLowerCase().includes(subordinateSearch.toLowerCase()));

    return roleMatch && searchMatch;
  });

  // Filter tasks list
  const filteredTasks = tasks.filter((t) => {
    const dayMatch = selectedDay === 'ALL' || t.day === selectedDay;
    const statusMatch =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && t.managementStatus !== 'ARCHIVED') ||
      (statusFilter === 'ARCHIVED' && t.managementStatus === 'ARCHIVED');
    const priorityMatch = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const searchMatch =
      t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      (t.purpose && t.purpose.toLowerCase().includes(taskSearch.toLowerCase())) ||
      (t.instructions && t.instructions.toLowerCase().includes(taskSearch.toLowerCase()));

    return dayMatch && statusMatch && priorityMatch && searchMatch;
  });

  // Handlers for Task Actions
  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      purpose: '',
      instructions: '',
      day: selectedDay === 'ALL' ? 1 : selectedDay,
      priority: 'MEDIUM',
      estimatedDuration: 30,
      slaHours: 8,
      resourceLinks: '',
      category: 'ROLE_EXECUTION',
    });
    setFormError(null);
    setConflictWarning(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (task: JourneyTask) => {
    setActiveTask(task);
    setFormData({
      title: task.title,
      purpose: task.purpose || '',
      instructions: task.instructions || '',
      day: task.day || 1,
      priority: task.priority || 'MEDIUM',
      estimatedDuration: task.estimatedDuration || 30,
      slaHours: task.slaHours || 8,
      resourceLinks: Array.isArray(task.resourceLinks) ? task.resourceLinks.join('\n') : '',
      category: task.category || 'ROLE_EXECUTION',
    });
    setFormError(null);
    setConflictWarning(null);
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubordinate) return;
    if (!formData.title.trim()) {
      setFormError('Task title is required.');
      return;
    }

    setSavingTask(true);
    setFormError(null);
    try {
      const res = await api.createEmployeeTask(selectedSubordinate.id, {
        title: formData.title.trim(),
        purpose: formData.purpose.trim() || undefined,
        instructions: formData.instructions.trim() || undefined,
        day: Number(formData.day),
        priority: formData.priority,
        estimatedDuration: Number(formData.estimatedDuration),
        slaHours: Number(formData.slaHours),
        resourceLinks: formData.resourceLinks
          ? formData.resourceLinks.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
        category: formData.category,
      });

      if (res.success) {
        showSuccess(`Custom task "${formData.title}" added to ${selectedSubordinate.name}'s plan.`);
        setIsAddModalOpen(false);
        await fetchSubordinateTasks(selectedSubordinate.id);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to add custom task.');
    } finally {
      setSavingTask(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !selectedSubordinate) return;
    if (!formData.title.trim()) {
      setFormError('Task title is required.');
      return;
    }

    setSavingTask(true);
    setFormError(null);
    setConflictWarning(null);

    try {
      const res = await api.updateEmployeeTask(activeTask.id, {
        title: formData.title.trim(),
        purpose: formData.purpose.trim() || undefined,
        instructions: formData.instructions.trim() || undefined,
        day: Number(formData.day),
        priority: formData.priority,
        estimatedDuration: Number(formData.estimatedDuration),
        slaHours: Number(formData.slaHours),
        resourceLinks: formData.resourceLinks
          ? formData.resourceLinks.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
        expectedVersion: activeTask.version,
      });

      if (res.success) {
        showSuccess(`Task "${formData.title}" updated successfully.`);
        setIsEditModalOpen(false);
        await fetchSubordinateTasks(selectedSubordinate.id);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('updated by another manager')) {
        setConflictWarning(err.message);
      } else {
        setFormError(err.message || 'Failed to update task.');
      }
    } finally {
      setSavingTask(false);
    }
  };

  const handleToggleArchive = async (task: JourneyTask) => {
    if (!selectedSubordinate) return;
    const isArchived = task.managementStatus === 'ARCHIVED';
    const actionLabel = isArchived ? 'restore' : 'archive';

    if (!confirm(`Are you sure you want to ${actionLabel} "${task.title}"?`)) {
      return;
    }

    try {
      const res = isArchived
        ? await api.restoreEmployeeTask(task.id)
        : await api.archiveEmployeeTask(task.id);

      if (res.success) {
        showSuccess(`Task "${task.title}" ${isArchived ? 'restored' : 'archived'}.`);
        await fetchSubordinateTasks(selectedSubordinate.id);
      }
    } catch (err: any) {
      alert(err.message || `Failed to ${actionLabel} task.`);
    }
  };

  const handleResetToDefault = async (task: JourneyTask) => {
    if (!selectedSubordinate) return;
    if (!confirm(`Reset "${task.title}" back to the authoritative departmental default template?`)) {
      return;
    }

    try {
      const res = await api.resetEmployeeTaskToDefault(task.id);
      if (res.success) {
        showSuccess(`Task "${task.title}" reset to default.`);
        await fetchSubordinateTasks(selectedSubordinate.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reset task.');
    }
  };

  const handleReorder = async (taskId: string, direction: 'UP' | 'DOWN') => {
    if (!selectedSubordinate) return;
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index < 0) return;
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === tasks.length - 1) return;

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const reordered = [...tasks];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Optimistic UI update
    setTasks(reordered);

    try {
      const orderedIds = reordered.map((t) => t.id);
      const res = await api.reorderEmployeeTasks(orderedIds);
      if (!res.success) {
        await fetchSubordinateTasks(selectedSubordinate.id);
      }
    } catch (err: any) {
      console.error('Reorder error:', err);
      await fetchSubordinateTasks(selectedSubordinate.id);
    }
  };

  const handleOpenHistory = async (task: JourneyTask) => {
    setActiveTask(task);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await api.getTaskAuditHistory(task.id);
      if (res.success) {
        setAuditHistory(res.history || []);
      }
    } catch (err: any) {
      console.error('Error fetching audit history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scope Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isManager
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-teal-50 text-teal-700 border border-teal-200'
              }`}
            >
              {isManager ? 'MANAGER WORKSPACE' : 'LEAD WORKSPACE'}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {isManager
                ? 'Full Authority Scope: Leads & Associates Across Department'
                : 'Direct Reports Scope: Assigned Associates Only'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Role-Based Task Management & Hierarchical Control
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl font-medium">
            Tailor first-week onboarding task plans for individual team members. Customizations modify only the selected employee’s plan while preserving template defaults and audit traceability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            disabled={!selectedSubordinate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Task</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Subordinate Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Role pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">Role Filter:</span>
            <button
              onClick={() => setSubordinateFilterRole('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                subordinateFilterRole === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({subordinates.length})
            </button>
            {isManager && (
              <button
                onClick={() => setSubordinateFilterRole('LEAD')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  subordinateFilterRole === 'LEAD'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Leads ({subordinates.filter((s) => s.roleLevel?.toLowerCase() === 'lead' || s.role === 'LEAD').length})
              </button>
            )}
            <button
              onClick={() => setSubordinateFilterRole('ASSOCIATE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                subordinateFilterRole === 'ASSOCIATE'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Associates ({subordinates.filter((s) => s.roleLevel?.toLowerCase() === 'associate' || s.role === 'ASSOCIATE').length})
            </button>
          </div>

          {/* Search + Dropdown */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search subordinate..."
                value={subordinateSearch}
                onChange={(e) => setSubordinateSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-purple-500 text-slate-800 w-full"
              />
            </div>

            <select
              value={selectedSubordinate?.id || ''}
              onChange={(e) => {
                const found = subordinates.find((s) => s.id === e.target.value);
                if (found) setSelectedSubordinate(found);
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 min-w-[240px]"
            >
              {filteredSubordinates.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.roleLevel || sub.role}) · {sub.team || sub.departmentName || 'Team'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Subordinate Profile Card */}
        {selectedSubordinate && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                {selectedSubordinate.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-slate-900">{selectedSubordinate.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      (selectedSubordinate.roleLevel || selectedSubordinate.role).toLowerCase().includes('lead')
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {selectedSubordinate.roleLevel || selectedSubordinate.role}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {selectedSubordinate.positionTitle || selectedSubordinate.title || 'Team Member'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex gap-3 flex-wrap mt-0.5">
                  <span>ID: <code className="font-mono font-bold text-slate-700">{selectedSubordinate.id}</code></span>
                  <span>Email: <strong className="text-slate-700">{selectedSubordinate.email}</strong></span>
                  {selectedSubordinate.team && (
                    <span>Team: <strong className="text-slate-700">{selectedSubordinate.team}</strong></span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Tasks</div>
                <div className="text-lg font-black text-slate-900">{tasks.length} total</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active</div>
                <div className="text-lg font-black text-emerald-600">
                  {tasks.filter((t) => t.managementStatus !== 'ARCHIVED').length}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Archived</div>
                <div className="text-lg font-black text-slate-400">
                  {tasks.filter((t) => t.managementStatus === 'ARCHIVED').length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Day Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">Day Filter:</span>
            {(['ALL', 1, 2, 3, 4, 5] as const).map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedDay === day
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {day === 'ALL' ? 'All Days' : `Day ${day}`}
              </button>
            ))}
          </div>

          {/* Status & Priority dropdowns + search */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="ACTIVE">Active Tasks Only</option>
              <option value="ARCHIVED">Archived Tasks Only</option>
              <option value="ALL">All Statuses</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 w-44"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {loadingTasks ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading subordinate task plan...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-black text-slate-800 mb-1">No tasks match current filters</h4>
            <p className="text-xs text-slate-500">Try changing the Day, Status, or Priority filter.</p>
          </div>
        ) : (
          filteredTasks.map((task, idx) => {
            const isArchived = task.managementStatus === 'ARCHIVED';
            const isCustom = task.originType === 'CUSTOM' || task.isCustom;
            const isModified = task.originType === 'MODIFIED' || task.isModified;

            const priorityBadge =
              task.priority === 'CRITICAL'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : task.priority === 'HIGH'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : task.priority === 'LOW'
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : 'bg-blue-50 text-blue-700 border-blue-200';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs space-y-3 ${
                  isArchived
                    ? 'border-slate-200 bg-slate-50/70 opacity-75'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    {/* Header Chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-900 text-white">
                        Day {task.day || 1}
                      </span>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${priorityBadge}`}>
                        {task.priority || 'MEDIUM'}
                      </span>

                      {/* Origin Badge */}
                      {isCustom ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Custom Task
                        </span>
                      ) : isModified ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                          Modified by {task.managedByRole || 'Manager'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                          Default Template
                        </span>
                      )}

                      {/* Archived Badge */}
                      {isArchived && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                          Archived
                        </span>
                      )}

                      {/* Execution State */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          task.state === 'DONE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : task.state === 'AVAILABLE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.state}
                      </span>

                      {task.version && (
                        <span className="text-[10px] font-mono text-slate-400">
                          v{task.version}
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-bold text-slate-900 ${isArchived ? 'line-through text-slate-500' : ''}`}>
                      {task.title}
                    </h4>

                    {task.purpose && (
                      <p className="text-xs text-slate-600 leading-relaxed">{task.purpose}</p>
                    )}

                    {task.instructions && (
                      <p className="text-xs text-slate-500 line-clamp-2">{task.instructions}</p>
                    )}

                    {/* Resources */}
                    {task.resourceLinks && task.resourceLinks.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-400">Resources:</span>
                        {task.resourceLinks.map((link, lidx) => (
                          <a
                            key={lidx}
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 hover:text-purple-800 underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {link.length > 35 ? link.slice(0, 35) + '...' : link}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                    {/* Reorder Buttons */}
                    <button
                      onClick={() => handleReorder(task.id, 'UP')}
                      title="Move task up"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleReorder(task.id, 'DOWN')}
                      title="Move task down"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEditModal(task)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-purple-300 hover:text-purple-600 bg-white text-slate-700 text-xs font-bold transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Archive / Restore */}
                    <button
                      onClick={() => handleToggleArchive(task)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        isArchived
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isArchived ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archive</span>
                        </>
                      )}
                    </button>

                    {/* Reset to Default */}
                    {isModified && (
                      <button
                        onClick={() => handleResetToDefault(task)}
                        title="Reset to authoritative template default"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    )}

                    {/* History */}
                    <button
                      onClick={() => handleOpenHistory(task)}
                      title="View change history & audit trail"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD CUSTOM TASK MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Add Custom Onboarding Task</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Assigning to: <span className="font-bold text-slate-800">{selectedSubordinate?.name}</span> ({selectedSubordinate?.roleLevel || selectedSubordinate?.role})
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Set up staging deployment access"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Day (1–5)
                  </label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={d}>
                        Day {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Est Duration (min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Purpose / Outcome Summary
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Why this task matters and what outcome is expected"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Step-by-Step Instructions & Verification Criteria
                </label>
                <textarea
                  rows={3}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Provide detailed instructions and definition of done..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Resource Links (one per line)
                </label>
                <textarea
                  rows={2}
                  value={formData.resourceLinks}
                  onChange={(e) => setFormData({ ...formData, resourceLinks: e.target.value })}
                  placeholder="https://docs.company.internal/guide&#10;https://github.com/org/repo"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 text-slate-800 outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2"
                >
                  {savingTask && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Custom Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {isEditModalOpen && activeTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit Task Definition</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Version: <code className="font-mono font-bold text-slate-700">v{activeTask.version || 1}</code> · Assignee: <strong className="text-slate-800">{selectedSubordinate?.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {conflictWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{conflictWarning}</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (selectedSubordinate) {
                      await fetchSubordinateTasks(selectedSubordinate.id);
                      setIsEditModalOpen(false);
                    }
                  }}
                  className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold"
                >
                  Reload Latest Version
                </button>
              </div>
            )}

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Day (1–5)
                  </label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={d}>
                        Day {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Est Duration (min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Purpose / Outcome Summary
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Step-by-Step Instructions & Verification Criteria
                </label>
                <textarea
                  rows={3}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Resource Links (one per line)
                </label>
                <textarea
                  rows={2}
                  value={formData.resourceLinks}
                  onChange={(e) => setFormData({ ...formData, resourceLinks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 text-slate-800 outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center gap-2"
                >
                  {savingTask && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT HISTORY MODAL */}
      {isHistoryModalOpen && activeTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900">Task Audit Trail & Change Log</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {activeTask.title} · Current Version: <code className="font-mono font-bold text-slate-700">v{activeTask.version || 1}</code>
                </p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-2">
              {loadingHistory ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-6 h-6 text-purple-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">Retrieving audit trail...</p>
                </div>
              ) : auditHistory.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No previous modifications recorded. This task is currently using its original template state.
                </div>
              ) : (
                auditHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.modifiedByName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                          {item.modifiedByRole}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {item.action}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">{item.summary}</p>

                    {item.previousValue && item.newValue && (
                      <div className="mt-2 text-[11px] font-mono grid grid-cols-2 gap-2 bg-white p-2 rounded-lg border border-slate-200">
                        <div className="text-rose-600 truncate">
                          - {item.previousValue}
                        </div>
                        <div className="text-emerald-600 truncate">
                          + {item.newValue}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
