import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { AppNotification } from '../types/index.js';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: string[];
}

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Poll notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      // quiet fail on background poll
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowNotifications(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Role-based Navigation Items
  const navItems: NavItem[] = [
    {
      label: 'My Journey',
      path: '/dashboard',
      icon: 'explore',
      roles: ['EMPLOYEE'],
    },
    {
      label: 'HR Command',
      path: '/hr',
      icon: 'analytics',
      roles: ['HR_ADMIN', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'],
    },
    {
      label: 'Owner Actions',
      path: '/owner',
      icon: 'assignment_turned_in',
      roles: ['TASK_OWNER', 'HR_ADMIN', 'COMPANY_ADMIN'],
    },
    {
      label: 'Access Map',
      path: '/rippleview',
      icon: 'hub',
      roles: ['EMPLOYEE', 'HR_ADMIN', 'TASK_OWNER', 'COMPANY_ADMIN'],
    },
    {
      label: 'People & Support',
      path: '/knowledge',
      icon: 'support_agent',
      roles: ['EMPLOYEE', 'HR_ADMIN', 'TASK_OWNER', 'COMPANY_ADMIN'],
    },
    {
      label: 'Pre-Join',
      path: '/pre-join',
      icon: 'verified_user',
      roles: ['HR_ADMIN', 'EMPLOYEE', 'COMPANY_ADMIN'],
    },
    {
      label: 'Admin Setup',
      path: '/admin',
      icon: 'admin_panel_settings',
      roles: ['COMPANY_ADMIN', 'PLATFORM_ADMIN'],
    },
  ];

  const visibleLinks = navItems.filter((item) => !user || item.roles.includes(user.role));

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-[32px] sm:top-[34px] z-40 w-full bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/40 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* LEFT: StartSmart Brand & Company Identifier */}
          <div className="flex items-center gap-4 lg:gap-8">
            <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm shadow-xs transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-lg leading-none" aria-hidden="true">
                  hub
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-headline-sm font-bold tracking-tight text-on-surface text-base leading-none">
                    StartSmart
                  </span>
                  <span className="hidden xl:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary/10 text-primary uppercase tracking-wider">
                    v1.0
                  </span>
                </div>
                {user?.company?.name && (
                  <span className="text-[11px] text-on-surface-variant font-medium leading-tight truncate max-w-[160px] sm:max-w-xs">
                    {user.company.name}
                  </span>
                )}
              </div>
            </Link>

            {/* CENTER: Primary Navigation (Desktop) */}
            {user && (
              <nav
                aria-label="Main Navigation"
                className="hidden md:flex items-center gap-1 lg:gap-2 ml-2"
              >
                {visibleLinks.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-label-md transition-all duration-150 ${
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold shadow-2xs'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] leading-none ${
                          isActive ? 'text-primary' : 'text-on-surface-variant'
                        }`}
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <a
                  href="/index.html"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-label-md text-primary bg-primary/5 hover:bg-primary/10 transition-all duration-150 border border-primary/20"
                  title="Open Enterprise Gateway & AI Copilot"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                    launch
                  </span>
                  <span>Gateway Portal ↗</span>
                </a>
              </nav>
            )}
          </div>

          {/* RIGHT: Notifications, User Profile & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Notification Bell Dropdown */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                    title="Notifications"
                    aria-label={`Notifications (${unreadCount} unread)`}
                    aria-expanded={showNotifications}
                  >
                    <span className="material-symbols-outlined text-xl leading-none" aria-hidden="true">
                      notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Panel */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest rounded-xl shadow-stitch-drawer border border-outline-variant/40 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/20">
                        <div className="flex items-center gap-2">
                          <span className="text-label-lg font-bold text-on-surface">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/10">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-on-surface-variant flex flex-col items-center gap-1.5">
                            <span className="material-symbols-outlined text-2xl text-on-surface-variant/40">
                              notifications_paused
                            </span>
                            <span>No notifications right now</span>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => !n.isRead && handleMarkOneRead(n.id)}
                              className={`p-3.5 hover:bg-surface-container-low transition-colors cursor-pointer text-xs ${
                                !n.isRead ? 'bg-primary/5 border-l-2 border-primary' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`font-semibold ${!n.isRead ? 'text-primary' : 'text-on-surface'}`}>
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-on-surface-variant/70 font-mono whitespace-nowrap">
                                  {new Date(n.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-on-surface-variant text-[11px] mt-1 leading-relaxed">
                                {n.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-surface-container-high transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
                    aria-label="User Menu"
                    aria-expanded={showUserMenu}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center shadow-xs">
                      {getInitials(user.name)}
                    </div>
                    <div className="hidden lg:block leading-tight">
                      <div className="text-xs font-semibold text-on-surface truncate max-w-[130px]">
                        {user.name}
                      </div>
                      <div className="text-[10px] font-mono text-on-surface-variant uppercase">
                        {user.role.replace('_', ' ').toLowerCase()}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant hidden lg:inline-block leading-none">
                      expand_more
                    </span>
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest rounded-xl shadow-stitch-drawer border border-outline-variant/40 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-3 border-b border-outline-variant/20">
                        <div className="text-sm font-bold text-on-surface leading-snug">
                          {user.name}
                        </div>
                        <div className="text-xs text-on-surface-variant truncate font-mono mt-0.5">
                          {user.email}
                        </div>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-surface-container-high text-primary">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                          {user.role.replace('_', ' ')}
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-on-surface hover:bg-surface-container-low transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-on-surface-variant">
                            explore
                          </span>
                          <span>My Journey Board</span>
                        </Link>
                        <Link
                          to="/knowledge"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-on-surface hover:bg-surface-container-low transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-on-surface-variant">
                            contact_support
                          </span>
                          <span>Help & Mentors</span>
                        </Link>
                      </div>

                      <div className="border-t border-outline-variant/20 pt-1 mt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                        >
                          <span className="material-symbols-outlined text-base text-rose-600">
                            logout
                          </span>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Hamburger Toggle */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors focus:outline-none"
                  aria-label="Toggle navigation menu"
                >
                  <span className="material-symbols-outlined text-2xl leading-none">
                    {mobileMenuOpen ? 'close' : 'menu'}
                  </span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="btn-secondary-outline text-xs px-3.5 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="btn-primary-gradient text-xs px-3.5 py-1.5"
                >
                  Launch Demo
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* MOBILE NAVIGATION COLLAPSIBLE ACCORDION */}
        {user && mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-outline-variant/20 animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col gap-1">
              {visibleLinks.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg leading-none">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="border-t border-outline-variant/20 my-2 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    logout
                  </span>
                  <span>Sign Out</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
