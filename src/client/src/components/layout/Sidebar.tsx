import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  PhoneCall,
  PlusCircle,
  Sliders,
  FolderTree,
  Users,
  ScrollText,
  ChevronRight,
  Zap,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface SidebarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const role = user?.role || 'AGENT';
  const rolePrefix = role.toLowerCase();

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: string[];
    badge?: string;
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MANAGER', 'AGENT', 'TELECALLER', 'CUSTOMER'],
    },
    {
      id: 'telecaller-desk',
      label: 'Telecaller Desk',
      icon: PhoneCall,
      roles: ['ADMIN', 'MANAGER', 'TELECALLER'],
      badge: 'Rapid',
    },
    {
      id: 'tickets',
      label: role === 'CUSTOMER' ? 'My Tickets' : 'All Tickets Queue',
      icon: TicketIcon,
      roles: ['ADMIN', 'MANAGER', 'AGENT', 'TELECALLER', 'CUSTOMER'],
    },
    {
      id: 'raise-ticket',
      label: 'Raise a Ticket',
      icon: PlusCircle,
      roles: ['ADMIN', 'MANAGER', 'AGENT', 'TELECALLER', 'CUSTOMER'],
    },
    {
      id: 'sla-rules',
      label: 'SLA Rule Engine',
      icon: Sliders,
      roles: ['ADMIN'],
    },
    {
      id: 'departments-categories',
      label: 'Depts & Categories',
      icon: FolderTree,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      id: 'audit-logs',
      label: 'Audit Activity Trail',
      icon: ScrollText,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      id: 'workspaces',
      label: 'Tenant Workspaces',
      icon: Building2,
      roles: ['ADMIN', 'MANAGER'],
      badge: 'Isolated',
    },
    {
      id: 'security',
      label: 'Antivirus & Security',
      icon: ShieldCheck,
      roles: ['ADMIN'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 p-4 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto shadow-[1px_0_4px_0_rgba(0,0,0,0.01)]">
      <div className="space-y-6">
        {/* Brand Header */}
        <div
          onClick={() => {
            if (onNavigate) onNavigate('dashboard');
            navigate(`/${rolePrefix}/dashboard`);
          }}
          className="cursor-pointer flex items-center gap-3 px-1 py-0.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-all ring-2 ring-blue-500/15">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="font-black text-slate-900 text-base tracking-tight leading-tight flex items-center gap-1">
              <span>Resolve</span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Hub</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5 truncate tracking-tight">
              powered by <span className="font-semibold text-slate-700">HPS(OPC) Pvt. Ltd.</span>
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const targetPath = `/${rolePrefix}/${item.id}`;
            const isActive =
              location.pathname === targetPath ||
              (item.id === 'tickets' && location.pathname.startsWith(`/${rolePrefix}/tickets`)) ||
              currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (onNavigate) onNavigate(item.id);
                  navigate(targetPath);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#eef2ff] text-[#2563eb] font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#2563eb]' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-colors ${
                      isActive ? 'text-[#2563eb]' : 'text-slate-300 group-hover:text-slate-400'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* User Dossier Card at Bottom */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="p-3 rounded-2xl bg-[#f8fafc] border border-slate-200/80 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="font-bold text-xs text-slate-800 truncate leading-tight">
                {user?.fullName || 'Active User'}
              </div>
              <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                {user?.role === 'ADMIN'
                  ? 'System Administrator'
                  : user?.role === 'MANAGER'
                  ? 'Team Lead / Manager'
                  : user?.role === 'AGENT'
                  ? 'Support Specialist'
                  : user?.role === 'TELECALLER'
                  ? 'Inbound Telecaller'
                  : 'Customer Account'}
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
              Online
            </span>
          </div>

          <button
            onClick={logout}
            type="button"
            aria-label="Sign out"
            title="Sign out of ResolveHub"
            className="w-full pt-2 border-t border-slate-200/60 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors py-1 rounded-lg hover:bg-rose-50/70 group cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition-colors" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Brand Footnote */}
        <div className="pt-2 text-center select-none">
          <p className="text-[10px] text-slate-400 font-medium tracking-tight">
            ResolveHub &bull; <span className="text-slate-500">HPS(OPC) Pvt. Ltd.</span>
          </p>
        </div>
      </div>
    </aside>
  );
};
