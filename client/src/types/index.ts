export type TaskState = 'AVAILABLE' | 'WAITING' | 'LOCKED' | 'DONE';
export type JourneyHealth = 'FLOWING' | 'DETOURING' | 'STALLED';
export type UserRole = 'EMPLOYEE' | 'HR_ADMIN' | 'TASK_OWNER' | 'COMPANY_ADMIN' | 'PLATFORM_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title?: string;
  company: {
    id: string;
    name: string;
    emailDomain: string;
  };
  employeeProfileId?: string;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  department?: { id: string; name: string };
  location?: { id: string; name: string };
  role?: { id: string; title: string };
  managerName?: string;
  managerEmail?: string;
  buddyName?: string;
  buddyEmail?: string;
  workMode: string;
  joiningDate: string;
  preJoinStatus: string;
}

export interface JourneyTask {
  id: string;
  journeyId: string;
  companyId: string;
  title: string;
  purpose?: string | null;
  instructions?: string | null;
  category: string;
  state: TaskState;
  required: boolean;
  ownerGroupId?: string | null;
  ownerGroup?: { id: string; name: string; code: string } | null;
  assignedUser?: { id: string; name: string; email: string } | null;
  slaHours: number;
  dueAt?: string | null;
  completedAt?: string | null;
  completedBy?: string | null;
  stillNotWorkingReason?: string | null;
  delayReason?: string | null;
  orderIndex: number;
  prerequisiteIds?: string[];
  downstreamIds?: string[];
  notes?: Array<{
    id: string;
    authorName: string;
    authorRole: string;
    note: string;
    createdAt: string;
  }>;
}

export interface Blocker {
  id: string;
  journeyId: string;
  rootTaskId: string;
  affectedTaskId: string;
  status: 'ACTIVE' | 'RESOLVED' | 'ESCALATED';
  rootCauseSummary: string;
  responsibleOwnerGroupId?: string | null;
  responsibleOwnerGroup?: { id: string; name: string };
  rootTask?: JourneyTask;
  affectedTask?: JourneyTask;
  detectedAt: string;
  resolvedAt?: string | null;
  nudgedCount: number;
  lastNudgedAt?: string | null;
}

export interface JourneyStats {
  total: number;
  done: number;
  available: number;
  waiting: number;
  locked: number;
}

export interface JourneyData {
  id: string;
  name: string;
  health: JourneyHealth;
  startDate: string;
  stats: JourneyStats;
  nextMove: JourneyTask | null;
  tasks: JourneyTask[];
  activeBlockers: Blocker[];
  dependencies: Array<{ id: string; journeyTaskId: string; dependsOnTaskId: string }>;
}

export interface SideQuest {
  id: string;
  title: string;
  purpose?: string | null;
  instructions?: string | null;
  category: string;
  slaHours: number;
  state: TaskState;
  reason: string;
}

export interface BlockerAnalysis {
  affectedTaskId: string;
  affectedTaskTitle: string;
  rootBlockerId: string;
  rootBlockerTitle: string;
  responsibleOwnerGroupId: string | null;
  responsibleOwnerGroupName: string | null;
  waitingSince: string | null;
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

export interface AIUnstickResponse {
  answer: string;
  matchedTaskId?: string;
  matchedTaskTitle?: string;
  diagnosis?: BlockerAnalysis;
  citedSources: Array<{
    id: string;
    title: string;
    sourceUrl?: string | null;
    excerpt: string;
  }>;
  suggestedAction: string;
  requiresHumanHandoff: boolean;
  handoffTarget?: string;
  isAiGrounded: boolean;
  aiProvider?: string;
  aiModel?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedTaskId?: string;
  relatedBlockerId?: string;
}
