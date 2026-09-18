import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ticketApi } from '../../services/api';
import { Ticket } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  UserCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Flame,
  ArrowRight,
  PlusCircle,
  Headphones,
  Check,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { SlaCountdownBadge } from '../../components/common/SlaCountdownBadge';

export const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignedTickets, setAssignedTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [assignedRes, allRes] = await Promise.all([
        ticketApi.list({ limit: 20, scope: 'assigned_to_me' }),
        ticketApi.list({ limit: 10 }),
      ]);
      if (assignedRes.data.success) setAssignedTickets(assignedRes.data.tickets);
      if (allRes.data.success) setAllTickets(allRes.data.tickets);
    } catch (err) {
      console.error('Failed to load agent dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const criticalAssigned = assignedTickets.filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH');
  const inProgressAssigned = assignedTickets.filter((t) => t.status === 'IN_PROGRESS');
  const waitingCustomer = assignedTickets.filter((t) => t.status === 'WAITING_FOR_CUSTOMER');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Agent Workbench Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              Agent Workbench
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Welcome back, {user?.fullName || 'Support Agent'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Department: <span className="font-semibold text-slate-700">{user?.department?.name || 'Technical Support'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/agent/raise-ticket"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Raise Ticket</span>
          </Link>

          <Link
            to="/agent/tickets"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            All Queue
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">My Assigned Tickets</p>
            <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{assignedTickets.length}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">High / Critical Urgency</p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{criticalAssigned.length}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">In Active Resolution</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{inProgressAssigned.length}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Waiting on Customer</p>
            <h3 className="text-2xl font-extrabold text-purple-600 mt-1">{waitingCustomer.length}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Headphones className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table: Assigned to Me */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Assigned Tickets Queue</h2>
            <p className="text-xs text-slate-500">Tickets currently assigned to your workbench for investigation and resolution</p>
          </div>
          <Link
            to="/agent/tickets"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Full Queue</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading workbench tickets...</p>
          </div>
        ) : assignedTickets.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Your assigned workbench is clear!</h3>
            <p className="text-xs text-slate-500 mt-1">
              You have no pending assigned tickets. Check the unassigned queue to take on new tasks.
            </p>
            <Link
              to="/agent/tickets"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Browse All Queue
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Ticket ID</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">SLA Countdown</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignedTickets.slice(0, 10).map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/agent/tickets/${t.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-600">
                      {t.ticketNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800 line-clamp-1 max-w-xs">{t.subject}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{t.category?.name}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-700">{t.customer?.name}</p>
                      <p className="text-[11px] text-slate-400">{t.customer?.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={t.status} />
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
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                        <span>Work on</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;
