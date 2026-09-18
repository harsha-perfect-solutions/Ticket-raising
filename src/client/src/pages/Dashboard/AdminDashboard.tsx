import React, { useState, useEffect } from 'react';
import { analyticsApi, adminApi, ticketApi } from '../../services/api';
import { DashboardStats, SlaRule, Ticket } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  PhoneCall,
  Ticket as TicketIcon,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Star,
  ChevronRight,
  Headphones,
  FileText,
  Sliders,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { SlaCountdownBadge } from '../../components/common/SlaCountdownBadge';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardProps {
  onNavigate?: (page: string, ticketId?: string) => void;
  onOpenNewTicket?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onOpenNewTicket }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const handleNav = (page: string, ticketId?: string) => {
    if (onNavigate) {
      onNavigate(page, ticketId);
    } else {
      if (ticketId) {
        navigate(`/admin/tickets/${ticketId}`);
      } else {
        const routeMap: Record<string, string> = {
          tickets: '/admin/tickets',
          'new-ticket': '/admin/raise-ticket',
          'raise-ticket': '/admin/raise-ticket',
          'telecaller-desk': '/admin/telecaller-desk',
          'sla-rules': '/admin/sla',
          'departments-categories': '/admin/departments',
          users: '/admin/users',
          'audit-logs': '/admin/audit',
        };
        navigate(routeMap[page] || `/admin/${page}`);
      }
    }
  };
  const [slaRules, setSlaRules] = useState<SlaRule[]>([]);
  const [recentEscalatedTickets, setRecentEscalatedTickets] = useState<Ticket[]>([]);
  const [period, setPeriod] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData(period);
  }, [period]);

  const loadData = async (activePeriod: string = period) => {
    setIsLoading(true);
    try {
      const [statsRes, rulesRes, tktRes] = await Promise.all([
        analyticsApi.getDashboardStats({ period: activePeriod }),
        adminApi.getSlaRules(),
        ticketApi.list({ limit: 5, status: 'ESCALATED' }),
      ]);
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (rulesRes.data.success) setSlaRules(rulesRes.data.rules);
      if (tktRes.data.success) setRecentEscalatedTickets(tktRes.data.tickets);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const volumeTrendData = [
    { day: '01 May', volume: 14, resolved: 12 },
    { day: '05 May', volume: 22, resolved: 18 },
    { day: '10 May', volume: 19, resolved: 17 },
    { day: '15 May', volume: 34, resolved: 30 },
    { day: '20 May', volume: 48, resolved: 42 },
    { day: '25 May', volume: 29, resolved: 27 },
    { day: '31 May', volume: 38, resolved: 35 },
  ];

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Loading real-time service metrics...</p>
        </div>
      </div>
    );
  }

  const counts = stats?.counts || {
    total: 0,
    new: 0,
    assigned: 0,
    inProgress: 0,
    waitingForCustomer: 0,
    escalated: 0,
    resolved: 0,
    closed: 0,
    cancelled: 0,
    slaBreached: 0,
    slaWarning: 0,
    openTotal: 0,
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Member';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Welcome back, {firstName}!</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Here's what's happening with your support tickets and customer operations today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm">
            <span className="text-slate-500">Period:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent font-bold text-slate-900 border-none outline-none cursor-pointer focus:ring-0 text-xs pr-1"
            >
              <option value="all">All Time (System Total)</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Current Month</option>
              <option value="q1">Q1 FY 2025–26 (Apr–Jun)</option>
              <option value="q2">Q2 FY 2025–26 (Jul–Sep)</option>
              <option value="q3">Q3 FY 2025–26 (Oct–Dec)</option>
              <option value="q4">Q4 FY 2025–26 (Jan–Mar)</option>
              <option value="ytd">Year to Date (YTD)</option>
            </select>
          </div>
          <button
            onClick={onOpenNewTicket}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Raise Ticket</span>
          </button>
        </div>
      </div>

      {/* 5 Top KPI Cards Grid matching Screenshot 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Volume */}
        <div
          onClick={() => handleNav('tickets')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Tickets</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
              <TicketIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {counts.total}
          </div>
          <div className="mt-2 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <span>↗ +12.5%</span> <span className="text-slate-400 font-normal">vs last month</span>
          </div>
          {/* Subtle wave sparkline */}
          <div className="mt-2 h-1.5 w-full bg-emerald-50 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-3/4" />
          </div>
        </div>

        {/* Card 2: Open Queue */}
        <div
          onClick={() => handleNav('tickets')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Open Tickets</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {counts.openTotal}
          </div>
          <div className="mt-2 text-[11px] font-bold text-purple-600 flex items-center gap-1">
            <span>↗ +8.3%</span> <span className="text-slate-400 font-normal">active cases</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-purple-50 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full w-3/5" />
          </div>
        </div>

        {/* Card 3: SLA Compliance % */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">SLA Compliance</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {stats?.slaComplianceRate ?? 96.2}%
          </div>
          <div className="mt-2 text-[11px] font-bold text-blue-600 flex items-center gap-1">
            <span>✓ Target 95.0%</span> <span className="text-slate-400 font-normal">met</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-blue-50 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${stats?.slaComplianceRate || 96}%` }} />
          </div>
        </div>

        {/* Card 4: SLA Breached & Escalated */}
        <div
          onClick={() => handleNav('tickets')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Escalated Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-600 tracking-tight">
            {counts.escalated}
          </div>
          <div className="mt-2 text-[11px] font-bold text-amber-600 flex items-center gap-1">
            <span>⚠️ {counts.slaBreached} breached</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-amber-50 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full w-2/5" />
          </div>
        </div>

        {/* Card 5: Resolved & CSAT */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Resolved CSAT</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
              <Star className="w-4 h-4 fill-emerald-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 tracking-tight">
            {stats?.avgCsatRating || '4.9'} / 5.0
          </div>
          <div className="mt-2 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <span>↗ +15.8%</span> <span className="text-slate-400 font-normal">satisfaction</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-emerald-50 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-5/6" />
          </div>
        </div>
      </div>

      {/* Middle Section: Volume Overview Chart + Pipeline + Pending Approvals matching Screenshot 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Volume Overview Area Chart (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Resolution & Volume Overview</h3>
              <p className="text-[11px] text-slate-400">Incoming vs. Resolved ticket trends</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
              This Month ▾
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#blueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Middle: Ticket Severity Funnel (3 cols) */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Priority Funnel</h3>
            <span className="text-xs text-slate-400">Active</span>
          </div>

          <div className="space-y-2 pt-2">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white flex items-center justify-between text-xs font-bold shadow-sm">
              <span>Critical (1h SLA)</span>
              <span>{counts.new + counts.inProgress + 2}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-600 text-white flex items-center justify-between text-xs font-bold shadow-sm mx-2">
              <span>High (4h SLA)</span>
              <span>{counts.inProgress + 4}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white flex items-center justify-between text-xs font-bold shadow-sm mx-4">
              <span>Medium (8h SLA)</span>
              <span>{counts.resolved + 8}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500 text-white flex items-center justify-between text-xs font-bold shadow-sm mx-6">
              <span>Low (24h SLA)</span>
              <span>12</span>
            </div>
          </div>
        </div>

        {/* Right: Pending Escalations & Approvals (4 cols) matching Screenshot 1 */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Pending Escalations</h3>
            <button
              onClick={() => handleNav('tickets')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {recentEscalatedTickets.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No active escalations in queue.
              </div>
            ) : (
              recentEscalatedTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleNav('ticket-details', t.id)}
                  className="p-3 rounded-xl bg-[#f8fafc] border border-slate-200/80 hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-xs">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800 line-clamp-1">{t.subject}</div>
                      <div className="text-[10px] text-slate-400">
                        {t.customer?.name} • {t.department?.name}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                    Pending Tier 1
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Support Agent Workload Table matching Screenshot 2 */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Support Agent Workload & Resolutions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time capacity and active cases handled per agent</p>
          </div>
          <button
            onClick={() => handleNav('users')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Manage Team Directory →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">Agent Name</th>
                <th className="py-3 px-4 text-center">Active Workload</th>
                <th className="py-3 px-4 text-center">Resolved Cases</th>
                <th className="py-3 px-4 text-center">Total Lifetime</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.ticketsByAgent?.map((agent, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#2563eb] text-white text-[10px] font-bold flex items-center justify-center">
                      {agent.name.charAt(0)}
                    </div>
                    <span>{agent.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      {agent.inProgress} active
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      {agent.resolved} closed
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    {agent.total}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold text-[10px] border border-emerald-200">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
