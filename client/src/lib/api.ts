const API_BASE = '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('startsmart_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('startsmart_token', token);
  } else {
    localStorage.removeItem('startsmart_token');
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Network error occurred');
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password?: string }) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ ...credentials, password: credentials.password || 'demo1234' }),
    }),
  demoSwitch: (email: string) =>
    request('/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  getMe: () => request('/auth/me'),
  logout: () => {
    setAuthToken(null);
    return request('/auth/logout', { method: 'POST' });
  },

  // Employee Journey
  getJourney: () => request('/me/journey'),
  getSideQuests: () => request('/me/sidequests'),
  getTask: (id: string) => request(`/tasks/${id}`),
  completeTask: (id: string) => request(`/tasks/${id}/complete`, { method: 'POST' }),
  reportTaskIssue: (id: string, reason: string) =>
    request(`/tasks/${id}/still-not-working`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // UNSTICK & AI
  analyzeUnstick: (params: { taskId?: string; query?: string; category?: string }) =>
    request('/unstick/analyze', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  nudgeBlocker: (blockerId: string, reason?: string) =>
    request(`/blockers/${blockerId}/nudge`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  escalateBlocker: (blockerId: string, reason?: string) =>
    request(`/blockers/${blockerId}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  askAI: (question: string, taskId?: string) =>
    request('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, taskId }),
    }),

  // HR Control Center
  getHrDashboard: () => request('/hr/dashboard'),
  getHrEmployees: (filters?: { department?: string; health?: string; search?: string }) => {
    const q = new URLSearchParams(filters as any).toString();
    return request(`/hr/employees${q ? `?${q}` : ''}`);
  },
  getHrEmployeeDetail: (id: string) => request(`/hr/employees/${id}`),
  createJoiner: (joinerData: any) =>
    request('/hr/joiners', {
      method: 'POST',
      body: JSON.stringify(joinerData),
    }),
  getPreJoinReadiness: () => request('/hr/pre-join-readiness'),
  getKnowledgeGaps: () => request('/hr/knowledge-gaps'),
  createDocTaskFromGap: (gapId: string) =>
    request(`/hr/knowledge-gaps/${gapId}/documentation-task`, { method: 'POST' }),

  // Task Owner
  getOwnerActions: () => request('/owner/actions'),
  approveOwnerTask: (id: string) =>
    request(`/owner/tasks/${id}/approve`, { method: 'POST' }),
  delayOwnerTask: (id: string, reason: string, newEtaHours?: number) =>
    request(`/owner/tasks/${id}/delay`, {
      method: 'POST',
      body: JSON.stringify({ reason, newEtaHours }),
    }),
  reassignOwnerTask: (id: string, targetUserId: string) =>
    request(`/owner/tasks/${id}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    }),
  addOwnerTaskNote: (id: string, note: string) =>
    request(`/owner/tasks/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  // Knowledge & Human Help
  getKnowledgeSources: () => request('/ai/knowledge'),
  submitHelpRequest: (data: { targetType: string; subject: string; message: string; urgency?: string }) =>
    request('/help/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getHelpRequests: () => request('/help/requests'),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id: string) => request(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),

  // Admin
  getCompanyInfo: () => request('/admin/company'),
  validateTemplateGraph: (tasks: any[]) =>
    request('/admin/templates/validate', {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    }),
  resetDemoData: () => request('/admin/reset-demo', { method: 'POST' }),

  // Organizational Structure & Hierarchy APIs (Authoritative Source of Truth)
  getOrgDepartments: () => request('/org/departments'),
  getOrgPositions: (params?: { departmentId?: string; departmentCode?: string; roleLevel?: string; search?: string; limit?: string }) => {
    const q = new URLSearchParams((params || {}) as any).toString();
    return request(`/org/positions${q ? `?${q}` : ''}`);
  },
  getOrgHierarchy: () => request('/org/hierarchy'),
  getExecutiveOverview: () => request('/org/executive-overview'),
  getTeamOverview: () => request('/org/team-overview'),

  // 5 Structured Datasets API
  getDatasetEmployees: () => request('/employees'),
  getDatasetEmployee: (id: string) => request(`/employees/${id}`),
  getDatasetTasks: (employeeId: string) => request(`/employees/${employeeId}/tasks`),
  getDatasetProgress: (employeeId: string) => request(`/employees/${employeeId}/progress`),
  getDatasetResources: (employeeId: string) => request(`/employees/${employeeId}/resources`),
  getDatasetContacts: () => request('/contacts'),
  updateDatasetProgress: (progressId: string, status: string, completedDate?: string) =>
    request(`/progress/${progressId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, completedDate }),
    }),
  createDatasetTask: (taskData: any) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),
  getDatasetDashboard: (id: string) => request(`/employees/${id}/dashboard`),
};
