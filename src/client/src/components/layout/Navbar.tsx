import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  Sparkles,
  Shield,
  UserCheck,
  Headphones,
  User,
  Search,
  HelpCircle,
  Home,
  Sliders,
  Layers,
  PlusCircle,
} from 'lucide-react';
import { UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onNavigate?: (page: string, ticketId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { user, logout, switchDemoRole, demoAccounts } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [navSearch, setNavSearch] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setShowRoleSwitcher(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
    ADMIN: Shield,
    MANAGER: Layers,
    AGENT: UserCheck,
    TELECALLER: Headphones,
    CUSTOMER: User,
  };

  const roleColors: Record<UserRole, string> = {
    ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
    MANAGER: 'bg-purple-50 text-purple-700 border-purple-200',
    AGENT: 'bg-blue-50 text-blue-700 border-blue-200',
    TELECALLER: 'bg-amber-50 text-amber-700 border-amber-200',
    CUSTOMER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const currentRole = (user?.role || 'AGENT') as UserRole;
  const CurrentRoleIcon = roleIcons[currentRole] || User;

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 lg:px-8 flex items-center justify-between shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      {/* Search Bar matching screenshot */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search anything... ⌘K"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && navSearch.trim()) {
                if (onNavigate) onNavigate('tickets');
                navigate(`/${currentRole.toLowerCase()}/tickets`);
              }
            }}
            className="w-full pl-10 pr-12 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <button
            type="button"
            onClick={() => {
              searchInputRef.current?.focus();
              searchInputRef.current?.select();
            }}
            className="absolute right-3 top-2.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors cursor-pointer"
            title="Press ⌘K or Ctrl+K to focus search"
          >
            ⌘K
          </button>
        </div>
      </div>

      {/* Center / Right Action Controls */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Quick Raise Ticket Action */}
        <button
          onClick={() => {
            if (onNavigate) onNavigate('raise-ticket');
            navigate(`/${currentRole.toLowerCase()}/raise-ticket`);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
          title="Raise a Support Ticket"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Raise Ticket</span>
        </button>

        {/* Quick Demo Persona Switcher */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f8fafc] hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-sm"
          >
            <div className={`p-1 rounded-md border ${roleColors[currentRole]}`}>
              <CurrentRoleIcon className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Perspective</div>
              <div className="font-bold text-slate-800 text-xs mt-0.5 leading-none">{user?.role}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-800">Switch Demo Perspective</p>
                <p className="text-[11px] text-slate-400">Instant testing for all 5 user roles</p>
              </div>

              {(['ADMIN', 'MANAGER', 'AGENT', 'TELECALLER', 'CUSTOMER'] as UserRole[]).map((role) => {
                const Icon = roleIcons[role];
                const isActive = user?.role === role;
                const matchAcc = demoAccounts.find((a) => a.role === role);

                return (
                  <button
                    key={role}
                    onClick={() => {
                      switchDemoRole(role);
                      setShowRoleSwitcher(false);
                      if (onNavigate) onNavigate('dashboard');
                      navigate(`/${role.toLowerCase()}/dashboard`);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg border ${roleColors[role]}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-800">{role}</div>
                        <div className="text-[10px] text-slate-400">{matchAcc?.fullName || role}</div>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Center Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-[#f8fafc] hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors shadow-sm"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl p-0 z-50 overflow-hidden animate-fade-in">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">In-App Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.ticketId) {
                          if (onNavigate) onNavigate('ticket-details', n.ticketId);
                          navigate(`/${currentRole.toLowerCase()}/tickets/${n.ticketId}`);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 ${
                        !n.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold ${!n.isRead ? 'text-blue-700' : 'text-slate-800'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Home / Help icon */}
        <button
          onClick={() => {
            if (onNavigate) onNavigate('dashboard');
            navigate(`/${currentRole.toLowerCase()}/dashboard`);
          }}
          className="p-2.5 rounded-xl bg-[#f8fafc] hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors hidden sm:block shadow-sm"
          title="Dashboard Home"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
