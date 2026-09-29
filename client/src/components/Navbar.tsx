import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { AppNotification } from '../types/index.js';
import {
  Zap,
  LayoutDashboard,
  GitBranch,
  Compass,
  BookOpen,
  Users,
  CheckSquare,
  Shield,
  Bell,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      // quiet fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'My Start', path: '/dashboard', icon: LayoutDashboard, roles: ['EMPLOYEE'] },
    { label: 'HR Control Center', path: '/hr', icon: Users, roles: ['HR_ADMIN', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'] },
    { label: 'My Actions', path: '/owner', icon: CheckSquare, roles: ['TASK_OWNER', 'HR_ADMIN', 'COMPANY_ADMIN'] },
    { label: 'RippleView™', path: '/rippleview', icon: GitBranch, roles: ['EMPLOYEE', 'HR_ADMIN', 'TASK_OWNER', 'COMPANY_ADMIN'] },
    { label: 'Pre-Join Readiness', path: '/pre-join', icon: Shield, roles: ['HR_ADMIN', 'EMPLOYEE', 'COMPANY_ADMIN'] },
    { label: 'Knowledge Base', path: '/knowledge', icon: BookOpen, roles: ['EMPLOYEE', 'HR_ADMIN', 'TASK_OWNER', 'COMPANY_ADMIN'] },
    { label: 'Admin Setup', path: '/admin', icon: Zap, roles: ['COMPANY_ADMIN', 'PLATFORM_ADMIN'] },
  ];

  const visibleLinks = navLinks.filter((l) => !user || l.roles.includes(user.role));

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-[33px] z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
                  START SMART
                </span>
                <span className="hidden md:block text-[11px] text-slate-500 font-medium -mt-1">
                  Your first week. Without the maze.
                </span>
              </div>
            </Link>

            {/* Nav items */}
            {user && (
              <div className="hidden md:flex items-center space-x-1">
                {visibleLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                        <span className="font-semibold text-sm text-slate-800">In-App Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-3.5 hover:bg-slate-50 transition-colors text-xs ${
                                !n.isRead ? 'bg-indigo-50/40 border-l-4 border-indigo-500' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-slate-800">{n.title}</span>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Chip */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</div>
                    <div className="text-[11px] text-slate-500 capitalize">{user.role.replace('_', ' ').toLowerCase()}</div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
                >
                  Explore Demo
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
