import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ticketApi, analyticsApi, adminApi } from '../../services/api';
import { Ticket, DashboardStats } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Layers,
  AlertTriangle,
  Flame,
  Users,
  Clock,
  TrendingUp,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { SlaCountdownBadge } from '../../components/common/SlaCountdownBadge';

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [escalatedTickets, setEscalatedTickets] = useState<Ticket[]>([]);
  const [teamTickets, setTeamTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, escRes, teamRes] = await Promise.all([
        analyticsApi.getDashboardStats(),
        ticketApi.list({ limit: 5, status: 'ESCALATED' }),
        ticketApi.list({ limit: 10, scope: 'my_department' }),
      ]);
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (escRes.data.success) setEscalatedTickets(escRes.data.tickets);
      if (teamRes.data.success) setTeamTickets(teamRes.data.tickets);
    } catch (err) {
      console.error('Failed to load manager dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  const counts = stats?.counts || {
    total: 0,
    new: 0,
    assigned: 0,
    inProgress: 0,
    waitingForCustomer: 0,
    escalated: 0,
    resolved: 0,
    closed: 0,
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Manager Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 uppercase tracking-wider">
              Management & Escalation Desk
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {user?.department?.name || 'Operations'} Leadership Portal
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manager: <span className="font-semibold text-slate-700">{user?.fullName}</span> • Workload Balance & SLA Compliance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/manager/raise-ticket"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Raise Ticket</span>
          </Link>

          <Link
            to="/manager/tickets"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Team Queue
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/manager/tickets?scope=my_department')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') navigate('/manager/tickets?scope=my_department'); }}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 group-hover:text-purple-600 transition-colors">Total Department Tickets</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{counts.total}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => navigate('/manager/tickets?status=ESCALATED')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') navigate('/manager/tickets?status=ESCALATED'); }}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 group-hover:text-rose-600 transition-colors">Escalated Tickets</p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{counts.escalated}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => navigate('/manager/tickets?slaStatus=BREACHED')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') navigate('/manager/tickets?slaStatus=BREACHED'); }}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 group-hover:text-emerald-600 transition-colors">SLA Compliance Rate</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">94.8%</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => navigate('/manager/tickets?status=NEW')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') navigate('/manager/tickets?status=NEW'); }}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 group-hover:text-amber-600 transition-colors">Unassigned Backlog</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{counts.new}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Escalated Tickets Attention Section */}
      <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-900">Critical & Escalated Incidents Requiring Review</h2>
              <p className="text-xs text-rose-700/80">Tickets flagged by the auto-escalation worker or manual escalation</p>
            </div>
          </div>
          <Link
            to="/manager/tickets?status=ESCALATED"
            className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1"
          >
            <span>View All Escalations</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {escalatedTickets.length === 0 ? (
          <div className="p-6 text-center text-xs text-rose-600 bg-white/60 rounded-2xl border border-rose-100 font-medium">
            ✓ No tickets are currently escalated or in SLA breach!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {escalatedTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => navigate(`/manager/tickets/${t.id}`)}
                className="p-4 rounded-2xl bg-white border border-rose-200 hover:border-rose-300 shadow-sm cursor-pointer transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-blue-600">{t.ticketNumber}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase tracking-wider">
                      Level {t.escalationLevel || 1} Escalated
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{t.subject}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 text-[11px]">Assigned: {t.assignedAgent?.fullName || 'Unassigned'}</span>
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Queue Preview */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Department Queue Overview</h2>
            <p className="text-xs text-slate-500">Live feed of active tickets routed to your team</p>
          </div>
          <Link
            to="/manager/tickets"
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <span>Full Team Queue</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Ticket ID</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Assigned Agent</th>
                <th className="px-5 py-3">SLA Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamTickets.slice(0, 6).map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/manager/tickets/${t.id}`)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono font-bold text-blue-600">{t.ticketNumber}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-800 line-clamp-1 max-w-xs">{t.subject}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{t.category?.name}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-slate-700">
                      {t.assignedAgent?.fullName || <span className="text-amber-600 font-bold">Unassigned</span>}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <SlaCountdownBadge
                      resolutionDueAt={t.resolutionDueAt}
                      slaStatus={t.slaStatus}
                      ticketStatus={t.status}
                      resolvedAt={t.resolvedAt}
                    />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/manager/tickets/${t.id}`);
                      }}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                    >
                      Review
                    </button>
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

export default ManagerDashboard;
