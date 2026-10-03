export type TaskState = 'AVAILABLE' | 'WAITING' | 'LOCKED' | 'DONE';
export type JourneyHealth = 'FLOWING' | 'DETOURING' | 'STALLED';
export type UserRole =
  | 'ASSOCIATE'
  | 'LEAD'
  | 'MANAGER'
  | 'CEO'
  | 'EMPLOYEE'
  | 'HR_ADMIN'
  | 'TASK_OWNER'
  | 'COMPANY_ADMIN'
  | 'PLATFORM_ADMIN';

export type RoleLevel = 'Associate' | 'Lead' | 'Manager' | 'CEO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLevel?: RoleLevel | string;
  employeeId?: string;
  departmentId?: string;
  departmentName?: string;
  branch?: string;
  subBranch?: string;
  team?: string;
  positionId?: string;
  positionTitle?: string;
  title?: string;
  accountStatus?: string;
  company: {
    id: string;
    name: string;
    emailDomain: string;
  };
  employeeProfileId?: string;
}

export interface OrgPositionNode {
  id: string;
  roleLevel: 'Associate' | 'Lead' | 'Manager';
  roleTier: string;
  title: string;
  fullTitle: string;
  isCeo: boolean;
  hierarchyPath: string;
}

export interface OrgTeamNode {
  name: string;
  positions: OrgPositionNode[];
}

export interface OrgSubBranchNode {
  name: string;
  teams: OrgTeamNode[];
}

export interface OrgBranchNode {
  name: string;
  subBranches: OrgSubBranchNode[];
}

export interface OrgDepartment {
  id: string;
  code: string;
  name: string;
  deptNumber?: number;
  branches?: OrgBranchNode[];
}

export interface OrgPosition {
  id: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  branch: string;
  subBranch: string;
  team: string;
  roleLevel: 'Associate' | 'Lead' | 'Manager';
  roleTier: string;
  title: string;
  fullTitle: string;
  isExecutive: boolean;
  isCeo: boolean;
  hierarchyPath: string;
}

export interface ExecutiveMetrics {
  totalWorkforce: number;
  activeOnboardings: number;
  totalDepartments: number;
  totalAuthoritativePositions: number;
  overallCompletionRate: number;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  availableTasks: number;
  cohortHealth: {
    FLOWING: number;
    DETOURING: number;
    STALLED: number;
  };
  roleDistribution: {
    associate: number;
    lead: number;
    manager: number;
    executive: number;
  };
  activeBlockersCount: number;
}

export interface DepartmentSummary {
  id: string;
  code: string;
  name: string;
  totalPositions: number;
  headcount: number;
  activeJoiners: number;
  completionRate: number;
  health: 'FLOWING' | 'DETOURING' | 'STALLED';
}

export interface TeamMemberSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLevel: string;
  title: string;
  team: string;
  branch: string;
  employeeId?: string;
  preJoinStatus: string;
  health: 'FLOWING' | 'DETOURING' | 'STALLED';
  progress: number;
  completedTasks: number;
  totalTasks: number;
  activeBlockers: Blocker[];
}

export interface TeamOverviewResponse {
  teamName: string;
  departmentId?: string;
  memberCount: number;
  members: TeamMemberSummary[];
  teamBlockers: Blocker[];
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
  employeeId?: string;
  branch?: string;
  subBranch?: string;
  team?: string;
  roleLevel?: string;
  positionId?: string;
  positionTitle?: string;
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
