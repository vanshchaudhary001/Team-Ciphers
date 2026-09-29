import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

export interface TaskNode {
  id: string;
  title: string;
  state: 'AVAILABLE' | 'WAITING' | 'LOCKED' | 'DONE';
  required: boolean;
  ownerGroupId?: string | null;
  prerequisiteIds: string[];
  downstreamIds: string[];
  slaHours?: number;
  dueAt?: Date | null;
  completedAt?: Date | null;
  delayReason?: string | null;
}

export interface GraphValidationResult {
  valid: boolean;
  cycle?: string[];
  error?: string;
}

export interface BlockerAnalysis {
  affectedTaskId: string;
  affectedTaskTitle: string;
  rootBlockerId: string;
  rootBlockerTitle: string;
  responsibleOwnerGroupId: string | null;
  responsibleOwnerGroupName: string | null;
  waitingSince: Date | null;
  waitingHours: number;
  downstreamImpactCount: number;
  impactedTasks: Array<{ id: string; title: string; state: string }>;
  suggestedAction: string;
  availableSideQuests: Array<{
    id: string;
    title: string;
    purpose?: string | null;
    category: string;
    slaHours: number;
  }>;
}

/**
 * Validates a dependency graph for cycles using DFS
 */
export function detectCycle(
  tasks: Array<{ id: string; title: string; prerequisiteIds: string[] }>
): GraphValidationResult {
  const adj = new Map<string, string[]>();
  const idToTitle = new Map<string, string>();

  for (const t of tasks) {
    idToTitle.set(t.id, t.title);
    if (!adj.has(t.id)) adj.set(t.id, []);
    for (const pre of t.prerequisiteIds) {
      if (!adj.has(pre)) adj.set(pre, []);
      adj.get(pre)!.push(t.id); // pre -> t.id (pre must finish before t.id)
    }
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const currentPath: string[] = [];

  function dfs(u: string): string[] | null {
    visited.add(u);
    inStack.add(u);
    currentPath.push(idToTitle.get(u) || u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (!visited.has(v)) {
        const cycle = dfs(v);
        if (cycle) return cycle;
      } else if (inStack.has(v)) {
        const cycleStartIndex = currentPath.findIndex((p) => p === (idToTitle.get(v) || v));
        return currentPath.slice(cycleStartIndex).concat(idToTitle.get(v) || v);
      }
    }

    inStack.delete(u);
    currentPath.pop();
    return null;
  }

  for (const t of tasks) {
    if (!visited.has(t.id)) {
      const cycle = dfs(t.id);
      if (cycle) {
        return {
          valid: false,
          cycle,
          error: `Circular dependency detected: ${cycle.join(' -> ')}`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Finds all downstream dependent task IDs (direct and indirect)
 */
export function findDownstreamTaskIds(
  rootTaskId: string,
  dependencies: Array<{ journeyTaskId: string; dependsOnTaskId: string }>
): string[] {
  // dependsOnTaskId -> list of journeyTaskId
  const forwardAdj = new Map<string, string[]>();
  for (const dep of dependencies) {
    if (!forwardAdj.has(dep.dependsOnTaskId)) {
      forwardAdj.set(dep.dependsOnTaskId, []);
    }
    forwardAdj.get(dep.dependsOnTaskId)!.push(dep.journeyTaskId);
  }

  const visited = new Set<string>();
  const queue = [rootTaskId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const dependents = forwardAdj.get(curr) || [];
    for (const depId of dependents) {
      if (!visited.has(depId)) {
        visited.add(depId);
        queue.push(depId);
      }
    }
  }

  return Array.from(visited);
}

/**
 * Finds all upstream prerequisite task IDs (direct and indirect)
 */
export function findUpstreamTaskIds(
  taskId: string,
  dependencies: Array<{ journeyTaskId: string; dependsOnTaskId: string }>
): string[] {
  // journeyTaskId -> list of dependsOnTaskId
  const backwardAdj = new Map<string, string[]>();
  for (const dep of dependencies) {
    if (!backwardAdj.has(dep.journeyTaskId)) {
      backwardAdj.set(dep.journeyTaskId, []);
    }
    backwardAdj.get(dep.journeyTaskId)!.push(dep.dependsOnTaskId);
  }

  const visited = new Set<string>();
  const queue = [taskId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const prereqs = backwardAdj.get(curr) || [];
    for (const preId of prereqs) {
      if (!visited.has(preId)) {
        visited.add(preId);
        queue.push(preId);
      }
    }
  }

  return Array.from(visited);
}

/**
 * Traces the dependency tree upstream to find the earliest uncompleted required blocker.
 */
export function findRootBlocker(
  taskId: string,
  tasksMap: Map<string, { id: string; title: string; state: string; required: boolean; ownerGroupId?: string | null }>,
  dependencies: Array<{ journeyTaskId: string; dependsOnTaskId: string }>
): { rootTaskId: string; rootTaskTitle: string; ownerGroupId?: string | null } | null {
  const target = tasksMap.get(taskId);
  if (!target) return null;

  // If the task itself is WAITING or has an owner group and is incomplete, it could be the blocker
  // If it is LOCKED, we search upstream
  const backwardAdj = new Map<string, string[]>();
  for (const dep of dependencies) {
    if (!backwardAdj.has(dep.journeyTaskId)) {
      backwardAdj.set(dep.journeyTaskId, []);
    }
    backwardAdj.get(dep.journeyTaskId)!.push(dep.dependsOnTaskId);
  }

  // BFS upstream to find the earliest incomplete prerequisite (a task whose own prerequisites are all DONE)
  const queue = [taskId];
  const visited = new Set<string>([taskId]);
  let candidateRoot: { rootTaskId: string; rootTaskTitle: string; ownerGroupId?: string | null } | null = null;

  while (queue.length > 0) {
    const currId = queue.shift()!;
    const prereqs = backwardAdj.get(currId) || [];

    const incompletePrereqs = prereqs.filter((pId) => {
      const p = tasksMap.get(pId);
      return p && p.state !== 'DONE';
    });

    if (incompletePrereqs.length === 0) {
      // currId has no incomplete prereqs!
      // If currId != taskId, then currId is the root blocker that stalled the chain!
      const currTask = tasksMap.get(currId);
      if (currTask && currTask.state !== 'DONE') {
        candidateRoot = {
          rootTaskId: currTask.id,
          rootTaskTitle: currTask.title,
          ownerGroupId: currTask.ownerGroupId,
        };
        break;
      }
    } else {
      for (const pId of incompletePrereqs) {
        if (!visited.has(pId)) {
          visited.add(pId);
          queue.push(pId);
        }
      }
    }
  }

  if (!candidateRoot && target.state !== 'DONE') {
    candidateRoot = {
      rootTaskId: target.id,
      rootTaskTitle: target.title,
      ownerGroupId: target.ownerGroupId,
    };
  }

  return candidateRoot;
}

/**
 * Calculates new states for all tasks in a journey deterministically and persists updates.
 */
export async function recalculateJourney(journeyId: string) {
  return await prisma.$transaction(async (tx) => {
    const journey = await tx.journey.findUnique({
      where: { id: journeyId },
      include: {
        tasks: {
          include: {
            ownerGroup: true,
          },
        },
      },
    });

    if (!journey) {
      throw new Error(`Journey not found: ${journeyId}`);
    }

    const dependencies = await tx.journeyTaskDependency.findMany({
      where: {
        journeyTask: { journeyId },
      },
    });

    const tasksMap = new Map(journey.tasks.map((t) => [t.id, t]));
    const prereqMap = new Map<string, string[]>(); // taskId -> list of prerequisite taskIds
    for (const dep of dependencies) {
      if (!prereqMap.has(dep.journeyTaskId)) {
        prereqMap.set(dep.journeyTaskId, []);
      }
      prereqMap.get(dep.journeyTaskId)!.push(dep.dependsOnTaskId);
    }

    const updatedTasks: Array<{ id: string; newState: string; oldState: string }> = [];

    // Recompute state for each task
    for (const task of journey.tasks) {
      if (task.state === 'DONE') {
        continue; // DONE state is preserved unless explicitly reopened
      }

      const prereqIds = prereqMap.get(task.id) || [];
      const allPrereqsDone = prereqIds.every((preId) => {
        const pre = tasksMap.get(preId);
        return pre && pre.state === 'DONE';
      });

      let calculatedState = 'LOCKED';
      if (allPrereqsDone) {
        // If it requires external owner approval or fulfillment and is assigned to an owner group
        // that is not just self-service employee, and not yet approved:
        if (task.ownerGroupId) {
          calculatedState = 'WAITING';
        } else {
          calculatedState = 'AVAILABLE';
        }
      } else {
        calculatedState = 'LOCKED';
      }

      if (task.state !== calculatedState) {
        await tx.journeyTask.update({
          where: { id: task.id },
          data: { state: calculatedState },
        });
        updatedTasks.push({ id: task.id, oldState: task.state, newState: calculatedState });
        task.state = calculatedState;
      }
    }

    // Now recalculate Journey Health
    const activeTasks = journey.tasks;
    const availableCount = activeTasks.filter((t) => t.state === 'AVAILABLE').length;
    const waitingCount = activeTasks.filter((t) => t.state === 'WAITING').length;
    const lockedCount = activeTasks.filter((t) => t.state === 'LOCKED').length;

    let newHealth = 'FLOWING';
    if (waitingCount > 0 || lockedCount > 0) {
      if (availableCount > 0) {
        newHealth = 'DETOURING'; // Main path has blockers, but SideQuests/available work exists!
      } else {
        newHealth = 'STALLED'; // 0 available tasks, completely stuck
      }
    } else {
      newHealth = 'FLOWING';
    }

    if (journey.health !== newHealth) {
      await tx.journey.update({
        where: { id: journeyId },
        data: { health: newHealth },
      });
    }

    // Refresh blockers table: resolve blockers whose root task is now DONE
    const activeBlockers = await tx.blocker.findMany({
      where: { journeyId, status: 'ACTIVE' },
    });

    for (const bl of activeBlockers) {
      const rootT = tasksMap.get(bl.rootTaskId);
      if (rootT && rootT.state === 'DONE') {
        await tx.blocker.update({
          where: { id: bl.id },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            resolutionNote: `Prerequisite "${rootT.title}" completed successfully. Downstream tasks unlocked.`,
          },
        });
      }
    }

    return {
      journeyId,
      health: newHealth,
      updatedTasks,
      stats: {
        total: activeTasks.length,
        done: activeTasks.filter((t) => t.state === 'DONE').length,
        available: availableCount,
        waiting: waitingCount,
        locked: lockedCount,
      },
    };
  });
}

/**
 * Performs comprehensive UNSTICK root blocker diagnosis for an affected task
 */
export async function diagnoseBlocker(
  taskId: string,
  userReason?: string
): Promise<BlockerAnalysis> {
  const task = await prisma.journeyTask.findUnique({
    where: { id: taskId },
    include: {
      journey: {
        include: {
          tasks: {
            include: { ownerGroup: true },
          },
        },
      },
      ownerGroup: true,
    },
  });

  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  const journeyId = task.journeyId;
  const dependencies = await prisma.journeyTaskDependency.findMany({
    where: { journeyTask: { journeyId } },
  });

  const tasksMap = new Map(
    task.journey.tasks.map((t) => [
      t.id,
      {
        id: t.id,
        title: t.title,
        state: t.state,
        required: t.required,
        ownerGroupId: t.ownerGroupId,
      },
    ])
  );

  // Identify root blocker
  const root = findRootBlocker(taskId, tasksMap, dependencies);
  const rootTaskId = root ? root.rootTaskId : task.id;
  const rootTask = task.journey.tasks.find((t) => t.id === rootTaskId) || task;

  // Calculate downstream impact
  const downstreamIds = findDownstreamTaskIds(rootTaskId, dependencies);
  const impactedTasks = task.journey.tasks
    .filter((t) => downstreamIds.includes(t.id) && t.id !== rootTaskId)
    .map((t) => ({ id: t.id, title: t.title, state: t.state }));

  // Find SideQuests: tasks that are AVAILABLE and do NOT depend on rootTaskId
  const availableSideQuests = task.journey.tasks
    .filter((t) => {
      if (t.state !== 'AVAILABLE') return false;
      if (t.id === rootTaskId || t.id === taskId) return false;
      // Must NOT be in downstream impact of rootTaskId
      if (downstreamIds.includes(t.id)) return false;
      return true;
    })
    .map((t) => ({
      id: t.id,
      title: t.title,
      purpose: t.purpose,
      category: t.category,
      slaHours: t.slaHours,
    }));

  // Calculate waiting hours from created/updated timestamp
  const waitingSince = rootTask.updatedAt || rootTask.createdAt;
  const waitingHours = Math.max(1, Math.round((Date.now() - new Date(waitingSince).getTime()) / (1000 * 60 * 60)));

  // Record or update active Blocker record in database
  const existingBlocker = await prisma.blocker.findFirst({
    where: {
      journeyId,
      rootTaskId,
      status: 'ACTIVE',
    },
  });

  if (!existingBlocker) {
    await prisma.blocker.create({
      data: {
        journeyId,
        companyId: task.companyId,
        rootTaskId,
        affectedTaskId: taskId,
        status: 'ACTIVE',
        rootCauseSummary: `Task "${task.title}" is ${task.state.toLowerCase()} waiting for "${rootTask.title}" approval from ${rootTask.ownerGroup?.name || 'Assigned Owner'}.`,
        responsibleOwnerGroupId: rootTask.ownerGroupId,
      },
    });
  }

  // Audit log entry
  await prisma.auditLog.create({
    data: {
      companyId: task.companyId,
      action: 'UNSTICK_ANALYZED',
      entityType: 'JourneyTask',
      entityId: taskId,
      reason: userReason || 'User requested blocker diagnosis',
      metadata: JSON.stringify({
        rootBlocker: rootTask.title,
        ownerGroup: rootTask.ownerGroup?.name,
        impactCount: impactedTasks.length,
      }),
    },
  });

  let suggestedAction = `Request an update or send a nudge to ${rootTask.ownerGroup?.name || 'the task owner'}.`;
  if (rootTask.ownerGroup?.name?.includes('IT')) {
    suggestedAction = `Nudge IT Operations regarding "${rootTask.title}". Meanwhile, continue with recommended SideQuests.`;
  }

  return {
    affectedTaskId: taskId,
    affectedTaskTitle: task.title,
    rootBlockerId: rootTaskId,
    rootBlockerTitle: rootTask.title,
    responsibleOwnerGroupId: rootTask.ownerGroupId,
    responsibleOwnerGroupName: rootTask.ownerGroup?.name || 'Responsible Team',
    waitingSince,
    waitingHours,
    downstreamImpactCount: impactedTasks.length,
    impactedTasks,
    suggestedAction,
    availableSideQuests,
  };
}
