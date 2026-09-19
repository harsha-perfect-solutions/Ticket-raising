import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Ticket as TicketIcon,
  FolderTree,
  Users,
  ScrollText,
  Flame,
  ArrowRight,
  X,
} from 'lucide-react';
import { UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onNavigate?: (page: string, ticketId?: string) => void;
}

interface SearchDestination {
  id: string;
  title: string;
  description: string;
  path: string;
  keywords: string[];
  roles: UserRole[];
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const SEARCH_DESTINATIONS: SearchDestination[] = [
  // CUSTOMER Destinations
  {
    id: 'customer-raise',
    title: 'Raise a Ticket',
    description: 'Create and submit a new support request',
    path: '/customer/raise-ticket',
    keywords: ['raise a ticket', 'raise ticket', 'new ticket', 'create ticket', 'submit', 'incident', 'issue', 'request'],
    roles: ['CUSTOMER'],
    icon: PlusCircle,
    badge: 'Action',
  },
  {
    id: 'customer-tickets',
    title: 'My Tickets',
    description: 'View and track all your active and submitted tickets',
    path: '/customer/tickets',
    keywords: ['my tickets', 'view tickets', 'list', 'track', 'requests', 'ticket history', 'history', 'my requests'],
    roles: ['CUSTOMER'],
    icon: TicketIcon,
    badge: 'Queue',
  },
  {
    id: 'customer-dashboard',
    title: 'Customer Dashboard',
    description: 'Overview of requests, SLA tracking and active incidents',
    path: '/customer/dashboard',
    keywords: ['dashboard', 'customer dashboard', 'home', 'overview', 'summary', 'profile'],
    roles: ['CUSTOMER'],
    icon: Home,
    badge: 'Portal',
  },

  // TELECALLER Destinations
  {
    id: 'telecaller-dashboard',
    title: 'Telecaller Dashboard',
    description: 'Inbound caller metrics, desk activity and queue stats',
    path: '/telecaller/dashboard',
    keywords: ['dashboard', 'telecaller dashboard', 'home', 'overview', 'calls'],
    roles: ['TELECALLER'],
    icon: Home,
    badge: 'Console',
  },
  {
    id: 'telecaller-raise',
    title: 'Raise Ticket',
    description: 'Quickly log and dispatch a new support ticket',
    path: '/telecaller/raise-ticket',
    keywords: ['raise ticket', 'raise a ticket', 'create ticket', 'new ticket', 'dispatch'],
    roles: ['TELECALLER'],
    icon: PlusCircle,
    badge: 'Action',
  },
  {
    id: 'telecaller-desk-customer',
    title: 'Customer Search',
    description: 'Rapid customer phone number and account lookup',
    path: '/telecaller/desk',
    keywords: ['customer', 'customer search', 'phone', 'lookup', 'find customer', 'caller', 'account'],
    roles: ['TELECALLER', 'ADMIN', 'MANAGER'],
    icon: User,
    badge: 'Rapid Desk',
  },
  {
    id: 'telecaller-desk-log',
    title: 'Log Call',
    description: 'Record inbound telephone call and customer verification',
    path: '/telecaller/desk',
    keywords: ['log call', 'call', 'inbound', 'telecaller desk', 'phone call', 'desk'],
    roles: ['TELECALLER', 'ADMIN', 'MANAGER'],
    icon: Headphones,
    badge: 'Desk',
  },
  {
    id: 'telecaller-tickets',
    title: 'Ticket Queue',
    description: 'Tickets logged by you and full system queue',
    path: '/telecaller/tickets',
    keywords: ['ticket queue', 'tickets', 'queue', 'all tickets', 'logged'],
    roles: ['TELECALLER'],
    icon: TicketIcon,
    badge: 'Queue',
  },

  // AGENT Destinations
  {
    id: 'agent-dashboard',
    title: 'Agent Dashboard',
    description: 'Overview of assigned workbench, workload & metrics',
    path: '/agent/dashboard',
    keywords: ['dashboard', 'agent dashboard', 'home', 'overview', 'metrics'],
    roles: ['AGENT'],
    icon: Home,
    badge: 'Workbench',
  },
  {
    id: 'agent-all-tickets',
    title: 'All Tickets Queue',
    description: 'Browse all tickets across support queues',
    path: '/agent/tickets',
    keywords: ['all tickets', 'tickets', 'queue', 'all queue', 'system queue'],
    roles: ['AGENT'],
    icon: TicketIcon,
    badge: 'Queue',
  },
  {
    id: 'agent-my-tickets',
    title: 'Assigned Tickets',
    description: 'Tickets assigned to you for investigation and resolution',
    path: '/agent/tickets?scope=assigned_to_me',
    keywords: ['my tickets', 'assigned', 'assigned tickets', 'mine', 'assigned to me'],
    roles: ['AGENT'],
    icon: UserCheck,
    badge: 'Assigned',
  },
  {
    id: 'agent-escalated',
    title: 'Escalated Tickets',
    description: 'Tickets with breached SLA or priority escalation',
    path: '/agent/tickets?slaStatus=BREACHED',
    keywords: ['escalated', 'escalated tickets', 'breach', 'sla breach', 'urgent', 'critical'],
    roles: ['AGENT'],
    icon: Flame,
    badge: 'Urgent',
  },
  {
    id: 'agent-raise',
    title: 'Raise Ticket',
    description: 'Submit an incident report or service request',
    path: '/agent/raise-ticket',
    keywords: ['raise ticket', 'new ticket', 'create ticket'],
    roles: ['AGENT'],
    icon: PlusCircle,
    badge: 'Action',
  },

  // MANAGER Destinations
  {
    id: 'manager-dashboard',
    title: 'Manager Dashboard',
    description: 'Department KPIs, team resolution speeds & CSAT',
    path: '/manager/dashboard',
    keywords: ['dashboard', 'manager dashboard', 'home', 'team performance', 'metrics'],
    roles: ['MANAGER'],
    icon: Home,
    badge: 'Console',
  },
  {
    id: 'manager-team-perf',
    title: 'Team Performance',
    description: 'Department workload balancing and agent throughput',
    path: '/manager/dashboard',
    keywords: ['team performance', 'performance', 'agents', 'workload', 'csat'],
    roles: ['MANAGER'],
    icon: UserCheck,
    badge: 'Metrics',
  },
  {
    id: 'manager-escalations',
    title: 'Escalated Tickets',
    description: 'Manage critical escalations and breach alerts',
    path: '/manager/tickets?slaStatus=BREACHED',
    keywords: ['escalations', 'escalated', 'urgent', 'sla breach', 'critical'],
    roles: ['MANAGER'],
    icon: Flame,
    badge: 'Urgent',
  },
  {
    id: 'manager-sla',
    title: 'SLA Monitoring',
    description: 'Track real-time SLA deadlines and breach risks',
    path: '/manager/tickets?slaStatus=BREACHED',
    keywords: ['sla', 'sla monitoring', 'deadlines', 'breach'],
    roles: ['MANAGER'],
    icon: Sliders,
    badge: 'SLA',
  },
  {
    id: 'manager-tickets',
    title: 'Tickets Queue',
    description: 'View department ticket queue and dispatch',
    path: '/manager/tickets',
    keywords: ['tickets', 'all tickets', 'queue', 'department queue'],
    roles: ['MANAGER'],
    icon: TicketIcon,
    badge: 'Queue',
  },
  {
    id: 'manager-depts',
    title: 'Departments & Categories',
    description: 'View departments, teams, categories and routing',
    path: '/manager/departments-categories',
    keywords: ['departments', 'categories', 'depts & categories', 'teams'],
    roles: ['MANAGER'],
    icon: FolderTree,
    badge: 'Settings',
  },
  {
    id: 'manager-users',
    title: 'User Management',
    description: 'View support staff, agents and user accounts',
    path: '/manager/users',
    keywords: ['users', 'user management', 'agents', 'staff'],
    roles: ['MANAGER'],
    icon: Users,
    badge: 'Directory',
  },
  {
    id: 'manager-audit',
    title: 'Audit Activity Trail',
    description: 'Compliance history, assignment audit and status changes',
    path: '/manager/audit-logs',
    keywords: ['audit', 'audit activity trail', 'logs', 'compliance'],
    roles: ['MANAGER'],
    icon: ScrollText,
    badge: 'Compliance',
  },
  {
    id: 'manager-telecaller',
    title: 'Telecaller Desk',
    description: 'Inbound telecaller operations and caller lookup',
    path: '/manager/telecaller-desk',
    keywords: ['telecaller desk', 'telecaller', 'desk', 'calls'],
    roles: ['MANAGER'],
    icon: Headphones,
    badge: 'Desk',
  },
  {
    id: 'manager-raise',
    title: 'Raise Ticket',
    description: 'Create an incident report or service ticket',
    path: '/manager/raise-ticket',
    keywords: ['raise ticket', 'create ticket', 'new ticket'],
    roles: ['MANAGER'],
    icon: PlusCircle,
    badge: 'Action',
  },

  // ADMIN Destinations
  {
    id: 'admin-dashboard',
    title: 'Admin Dashboard',
    description: 'Executive analytics, organization stats & system health',
    path: '/admin/dashboard',
    keywords: ['dashboard', 'admin dashboard', 'home', 'overview', 'reports', 'analytics'],
    roles: ['ADMIN'],
    icon: Home,
    badge: 'Admin',
  },
  {
    id: 'admin-tickets',
    title: 'Tickets Queue',
    description: 'All system tickets, bulk batch actions and CSV exports',
    path: '/admin/tickets',
    keywords: ['tickets', 'all tickets', 'tickets queue', 'queue', 'browse tickets'],
    roles: ['ADMIN'],
    icon: TicketIcon,
    badge: 'Queue',
  },
  {
    id: 'admin-raise',
    title: 'Admin Raise Ticket',
    description: 'Create a new ticket with automatic staff allocation',
    path: '/admin/raise-ticket',
    keywords: ['raise ticket', 'admin raise ticket', 'create ticket', 'new ticket', 'raise a ticket'],
    roles: ['ADMIN'],
    icon: PlusCircle,
    badge: 'Action',
  },
  {
    id: 'admin-users',
    title: 'User Management',
    description: 'Manage users, roles, password resets and account status',
    path: '/admin/users',
    keywords: ['user management', 'users', 'roles', 'accounts', 'agents', 'passwords'],
    roles: ['ADMIN'],
    icon: Users,
    badge: 'Admin',
  },
  {
    id: 'admin-sla',
    title: 'SLA Rule Engine',
    description: 'Category-based SLA targets, resolution windows & escalation rules',
    path: '/admin/sla-rules',
    keywords: ['sla rule engine', 'sla', 'rules', 'policies', 'deadlines', 'escalation'],
    roles: ['ADMIN'],
    icon: Sliders,
    badge: 'Engine',
  },
  {
    id: 'admin-depts',
    title: 'Departments & Categories',
    description: 'Department taxonomy, subcategories and automated routing',
    path: '/admin/departments-categories',
    keywords: ['departments', 'categories', 'depts', 'departments & categories'],
    roles: ['ADMIN'],
    icon: FolderTree,
    badge: 'Config',
  },
  {
    id: 'admin-audit',
    title: 'Audit Activity Trail',
    description: 'Security audit logs, system events and exportable trails',
    path: '/admin/audit-logs',
    keywords: ['audit', 'audit activity trail', 'logs', 'compliance', 'security'],
    roles: ['ADMIN'],
    icon: ScrollText,
    badge: 'Audit',
  },
  {
    id: 'admin-telecaller',
    title: 'Telecaller Desk',
    description: 'Rapid inbound call triage and customer verification desk',
    path: '/admin/telecaller-desk',
    keywords: ['telecaller desk', 'telecaller', 'desk', 'calls', 'inbound'],
    roles: ['ADMIN'],
    icon: Headphones,
    badge: 'Desk',
  },
];

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { user, logout, switchDemoRole, demoAccounts } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const currentRole = (user?.role || 'AGENT') as UserRole;

  // Compute prioritized, role-aware search results
  const searchResults = useMemo(() => {
    const q = navSearch.trim().toLowerCase();
    if (!q) return [];

    // Filter by current role only
    const roleItems = SEARCH_DESTINATIONS.filter((item) =>
      item.roles.includes(currentRole)
    );

    const scored = roleItems
      .map((item) => {
        const titleLower = item.title.toLowerCase();
        let score = 0;

        // 1. Exact Title match
        if (titleLower === q) {
          score += 1000;
        } else if (titleLower.startsWith(q)) {
          score += 500;
        } else if (titleLower.includes(q)) {
          score += 200;
        }

        // 2. Keywords match
        for (const kw of item.keywords) {
          const kwLower = kw.toLowerCase();
          if (kwLower === q) {
            score += 400;
          } else if (kwLower.startsWith(q)) {
            score += 150;
          } else if (kwLower.includes(q) || q.includes(kwLower)) {
            score += 80;
          }
        }

        // 3. Description match
        if (item.description.toLowerCase().includes(q)) {
          score += 30;
        }

        return { item, score };
      })
      .filter((res) => res.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((res) => res.item);

    // If query matches a ticket pattern (e.g. TKT-...), inject a direct jump option
    if (/^tkt/i.test(q)) {
      const ticketId = q.toUpperCase();
      const ticketJumpItem: SearchDestination = {
        id: 'direct-ticket-jump',
        title: `Open Ticket ${ticketId}`,
        description: `Direct jump to ticket details for ${ticketId}`,
        path: `/${currentRole.toLowerCase()}/tickets/${ticketId}`,
        keywords: [q],
        roles: [currentRole],
        icon: TicketIcon,
        badge: 'Direct Jump',
      };
      return [ticketJumpItem, ...scored];
    }

    return scored;
  }, [navSearch, currentRole]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
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

  const handleSelectDestination = (destination: SearchDestination) => {
    setIsSearchOpen(false);
    setNavSearch('');
    if (onNavigate) {
      onNavigate(destination.id);
    }
    navigate(destination.path);
  };

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

  const CurrentRoleIcon = roleIcons[currentRole] || User;

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 lg:px-8 flex items-center justify-between shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      {/* Role-Aware Search Bar */}
      <div className="flex-1 max-w-md hidden md:block" ref={searchContainerRef}>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search pages & actions... ⌘K"
            value={navSearch}
            onFocus={() => {
              if (navSearch.trim()) setIsSearchOpen(true);
            }}
            onChange={(e) => {
              setNavSearch(e.target.value);
              setIsSearchOpen(true);
              setSelectedSearchIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (searchResults.length > 0) {
                  setSelectedSearchIndex((prev) => (prev + 1) % searchResults.length);
                }
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (searchResults.length > 0) {
                  setSelectedSearchIndex((prev) =>
                    prev <= 0 ? searchResults.length - 1 : prev - 1
                  );
                }
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (searchResults.length > 0) {
                  const target =
                    selectedSearchIndex >= 0 && selectedSearchIndex < searchResults.length
                      ? searchResults[selectedSearchIndex]
                      : searchResults[0];
                  handleSelectDestination(target);
                }
              } else if (e.key === 'Escape') {
                setIsSearchOpen(false);
              }
            }}
            className="w-full pl-10 pr-16 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <div className="absolute right-3 top-2 flex items-center gap-1.5">
            {navSearch.trim() && (
              <button
                type="button"
                onClick={() => {
                  setNavSearch('');
                  setIsSearchOpen(false);
                }}
                className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
                setIsSearchOpen(true);
              }}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors cursor-pointer"
              title="Press ⌘K or Ctrl+K to focus search"
            >
              ⌘K
            </button>
          </div>

          {/* Search Results Dropdown */}
          {isSearchOpen && navSearch.trim() && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-fade-in divide-y divide-slate-100">
              <div className="px-3.5 py-2 bg-slate-50 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Pages & Actions ({searchResults.length})
                </span>
                <span className="text-[10px] text-slate-400">
                  Role: <span className="font-bold text-slate-600">{currentRole}</span>
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    <Search className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No matching pages or actions</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No accessible destinations for &ldquo;{navSearch}&rdquo; in {currentRole} portal.
                    </p>
                  </div>
                ) : (
                  searchResults.map((item, idx) => {
                    const Icon = item.icon;
                    const isSelected = idx === selectedSearchIndex;
                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setSelectedSearchIndex(idx)}
                        onClick={() => handleSelectDestination(item)}
                        className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`p-2 rounded-lg border shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs truncate text-slate-900">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <ArrowRight
                          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                            isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'
                          }`}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
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
