import React, { useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  Position,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '../lib/api.js';
import { JourneyData, JourneyTask } from '../types/index.js';
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  Lock,
  PlayCircle,
  Sparkles,
  Info,
  X,
  ExternalLink,
  ChevronRight,
  LifeBuoy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UnstickModal } from '../components/UnstickModal.js';

// Custom Task Node Component for React Flow
const TaskCustomNode = ({ data }: { data: any }) => {
  const isDone = data.state === 'DONE';
  const isWaiting = data.state === 'WAITING';
  const isLocked = data.state === 'LOCKED';
  const isAvailable = data.state === 'AVAILABLE';
  const isRootBlocker = data.isRootBlocker;

  let bgClass = 'bg-white border-slate-300 text-slate-800';
  let badgeClass = 'bg-slate-100 text-slate-700';

  if (isDone) {
    bgClass = 'bg-emerald-50/90 border-emerald-400 text-emerald-950 shadow-emerald-100';
    badgeClass = 'bg-emerald-600 text-white';
  } else if (isWaiting) {
    bgClass = isRootBlocker
      ? 'bg-amber-50 border-amber-500 text-amber-950 ring-4 ring-amber-300/50 shadow-lg'
      : 'bg-amber-50/70 border-amber-300 text-amber-900';
    badgeClass = 'bg-amber-600 text-white';
  } else if (isAvailable) {
    bgClass = 'bg-indigo-50 border-indigo-400 text-indigo-950 shadow-indigo-100 ring-2 ring-indigo-200';
    badgeClass = 'bg-indigo-600 text-white';
  } else if (isLocked) {
    bgClass = 'bg-slate-50 border-slate-300 text-slate-500 opacity-90';
    badgeClass = 'bg-slate-400 text-white';
  }

  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 shadow-sm min-w-[220px] max-w-[260px] transition-all cursor-pointer hover:scale-105 ${bgClass} ${
        isRootBlocker ? 'pulsing-blocker-node' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-slate-400" />

      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${badgeClass}`}>
          {isRootBlocker ? '⚠️ ROOT BLOCKER' : data.state}
        </span>
        {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        {isWaiting && <Clock className="w-4 h-4 text-amber-600" />}
        {isLocked && <Lock className="w-4 h-4 text-slate-400" />}
        {isAvailable && <PlayCircle className="w-4 h-4 text-indigo-600" />}
      </div>

      <div className="font-bold text-xs leading-snug line-clamp-2">{data.title}</div>

      <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
        <span className="truncate">{data.ownerGroup || 'Self-Service'}</span>
        {data.orderIndex && <span className="text-[10px] text-slate-400 font-mono">#{data.orderIndex}</span>}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-slate-400" />
    </div>
  );
};

export const RippleViewPage: React.FC = () => {
  const navigate = useNavigate();
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [selectedTask, setSelectedTask] = useState<JourneyTask | null>(null);
  const [isUnstickOpen, setIsUnstickOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchJourney = async () => {
    try {
      const res = await api.getJourney();
      if (res.success) {
        setJourneyData(res.journey);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, []);

  const nodeTypes = useMemo(() => ({ taskNode: TaskCustomNode }), []);

  // Construct React Flow nodes and edges from real database task graph
  const { nodes, edges } = useMemo(() => {
    if (!journeyData) return { nodes: [], edges: [] };

    const tasks = journeyData.tasks;
    const dependencies = journeyData.dependencies;
    const activeBlockers = journeyData.activeBlockers || [];
    const rootBlockerIds = new Set(activeBlockers.map((b) => b.rootTaskId));

    // Layout configuration
    // Primary chain in center column (x = 320), independent tasks in side column (x = 650)
    const primaryChainTitles = [
      'Laptop Provisioning',
      'VPN',
      'GitHub',
      'Repository',
      'Development Environment',
      'First Coding Task',
    ];

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    let mainY = 50;
    let sideY = 50;

    tasks.forEach((t) => {
      const isPrimary = primaryChainTitles.some((k) => t.title.toLowerCase().includes(k.toLowerCase()));
      let x = isPrimary ? 280 : 660;
      let y = isPrimary ? mainY : sideY;

      if (isPrimary) mainY += 120;
      else sideY += 120;

      flowNodes.push({
        id: t.id,
        type: 'taskNode',
        position: { x, y },
        data: {
          id: t.id,
          title: t.title,
          state: t.state,
          purpose: t.purpose,
          ownerGroup: t.ownerGroup?.name,
          orderIndex: t.orderIndex,
          isRootBlocker: rootBlockerIds.has(t.id),
          task: t,
        },
      });
    });

    dependencies.forEach((dep) => {
      const isBlockedEdge = rootBlockerIds.has(dep.dependsOnTaskId);
      flowEdges.push({
        id: `e-${dep.dependsOnTaskId}-${dep.journeyTaskId}`,
        source: dep.dependsOnTaskId,
        target: dep.journeyTaskId,
        animated: isBlockedEdge,
        style: {
          stroke: isBlockedEdge ? '#f59e0b' : '#94a3b8',
          strokeWidth: isBlockedEdge ? 2.5 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isBlockedEdge ? '#f59e0b' : '#94a3b8',
        },
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [journeyData]);

  const onNodeClick = (_: any, node: Node) => {
    setSelectedTask((node.data as any)?.task as JourneyTask);
  };

  const activeBlocker = journeyData?.activeBlockers?.[0];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-100">
      {/* Top Impact Banner */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-2xs z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <AlertOctagon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base text-slate-900 tracking-tight">
                RippleView™ Live Dependency Graph
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                DAG Engine
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive visualization of prerequisites, root blockers, and downstream affected chains.
            </p>
          </div>
        </div>

        {/* Dynamic Impact Metric */}
        {activeBlocker ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <div>
              <span className="font-bold text-amber-900">Active Root Blocker: </span>
              <span className="text-amber-800 font-semibold">{activeBlocker.rootCauseSummary}</span>
            </div>
            <button
              onClick={() => setIsUnstickOpen(true)}
              className="ml-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-2xs flex items-center gap-1"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              UNSTICK
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            All prerequisites flowing smoothly!
          </div>
        )}

        {/* Graph Legend */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" /> Root Blocker / Waiting
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500" /> Available Now
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300" /> Locked Prerequisite
          </span>
        </div>
      </div>

      {/* Main Flow Canvas & Side Drawer */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="#cbd5e1" gap={20} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node: any) => {
              if (node.data.state === 'DONE') return '#10b981';
              if (node.data.isRootBlocker) return '#f59e0b';
              if (node.data.state === 'AVAILABLE') return '#6366f1';
              return '#cbd5e1';
            }}
          />
        </ReactFlow>

        {/* Selected Task Details Drawer */}
        {selectedTask && (
          <div className="absolute top-4 right-4 w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4 animate-in slide-in-from-right duration-200 z-20 max-h-[90%] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span
                className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                  selectedTask.state === 'DONE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedTask.state === 'WAITING'
                    ? 'bg-amber-100 text-amber-800'
                    : selectedTask.state === 'AVAILABLE'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {selectedTask.state}
              </span>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 leading-snug">{selectedTask.title}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {selectedTask.purpose || selectedTask.instructions || 'No description provided.'}
              </p>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="font-semibold text-slate-800">{selectedTask.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Responsible Owner:</span>
                <span className="font-semibold text-slate-800">
                  {selectedTask.ownerGroup?.name || 'Assigned to Joiner'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Target SLA:</span>
                <span className="font-semibold text-slate-800">{selectedTask.slaHours} hours</span>
              </div>
            </div>

            {/* Actions in drawer */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => navigate(`/tasks/${selectedTask.id}`)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>View Full Task Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {selectedTask.state === 'LOCKED' && (
                <button
                  onClick={() => setIsUnstickOpen(true)}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>Diagnose Blocker with UNSTICK</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Persistent UNSTICK Modal */}
      <UnstickModal
        isOpen={isUnstickOpen}
        onClose={() => {
          setIsUnstickOpen(false);
          fetchJourney();
        }}
        defaultTaskId={selectedTask?.id}
      />
    </div>
  );
};
