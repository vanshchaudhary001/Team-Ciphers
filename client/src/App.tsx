import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import { DemoSwitcherBar } from './components/DemoSwitcherBar.js';
import { Navbar } from './components/Navbar.js';
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { EmployeeDashboard } from './pages/EmployeeDashboard.js';
import { TaskDetailPage } from './pages/TaskDetailPage.js';
import { RippleViewPage } from './pages/RippleViewPage.js';
import { HRControlCenter } from './pages/HRControlCenter.js';
import { OwnerDashboard } from './pages/OwnerDashboard.js';
import { PreJoinReadinessPage } from './pages/PreJoinReadinessPage.js';
import { KnowledgePage } from './pages/KnowledgePage.js';
import { AdminPage } from './pages/AdminPage.js';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-xs font-semibold text-slate-400">Verifying session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'PLATFORM_ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 p-12 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          This area requires role: {allowedRoles.join(' or ')}. Switch your persona using the top switcher bar.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DemoSwitcherBar />
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Employee Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/me" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/tasks/:id"
            element={
              <ProtectedRoute>
                <TaskDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rippleview"
            element={
              <ProtectedRoute>
                <RippleViewPage />
              </ProtectedRoute>
            }
          />

          {/* HR Control Center */}
          <Route
            path="/hr"
            element={
              <ProtectedRoute allowedRoles={['HR_ADMIN', 'COMPANY_ADMIN', 'PLATFORM_ADMIN']}>
                <HRControlCenter />
              </ProtectedRoute>
            }
          />

          {/* Task Owner Dashboard */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={['TASK_OWNER', 'HR_ADMIN', 'COMPANY_ADMIN', 'PLATFORM_ADMIN']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Pre-Join Readiness */}
          <Route
            path="/pre-join"
            element={
              <ProtectedRoute>
                <PreJoinReadinessPage />
              </ProtectedRoute>
            }
          />

          {/* Knowledge & Human Help */}
          <Route
            path="/knowledge"
            element={
              <ProtectedRoute>
                <KnowledgePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Setup */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['COMPANY_ADMIN', 'PLATFORM_ADMIN']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
