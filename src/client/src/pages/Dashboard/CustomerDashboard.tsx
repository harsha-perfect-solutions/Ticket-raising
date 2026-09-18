import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ticketApi } from '../../services/api';
import { Ticket } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronRight,
  Shield,
  LifeBuoy,
  ArrowRight,
  Search,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { SlaCountdownBadge } from '../../components/common/SlaCountdownBadge';

export const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const res = await ticketApi.list({ limit: 10 });
      if (res.data.success) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      console.error('Failed to load customer tickets', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'].includes(t.status)).length;
  const resolvedTickets = tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length;
  const nearBreachTickets = tickets.filter((t) => t.slaStatus === 'WARNING_NEAR_BREACH' || t.slaStatus === 'BREACHED').length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" />
            Customer Self-Service Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {user?.fullName || 'Valued Customer'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed">
            Need assistance or have an issue? Raise a support ticket and our engineering and support teams will resolve it within guaranteed SLA windows.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/customer/raise-ticket"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise a Support Ticket</span>
            </Link>

            <Link
              to="/customer/tickets"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/30 hover:bg-blue-500/40 text-white font-semibold text-xs transition-colors backdrop-blur-md"
            >
              <FileText className="w-4 h-4" />
              <span>View My Tickets ({totalTickets})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Requests</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalTickets}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Active / In Progress</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{openTickets}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Resolved & Closed</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{resolvedTickets}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">SLA Critical Alerts</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{nearBreachTickets}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Tickets Table Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Support Requests</h2>
            <p className="text-xs text-slate-500">Track real-time progress and engineer updates on your tickets</p>
          </div>
          <Link
            to="/customer/tickets"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading your tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No support tickets found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't submitted any tickets yet. Click below to raise your first request.
            </p>
            <Link
              to="/customer/raise-ticket"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise First Ticket</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Ticket ID</th>
                  <th className="px-5 py-3">Subject & Department</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Resolution Due</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.slice(0, 5).map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/customer/tickets/${t.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-600">
                      {t.ticketNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800 line-clamp-1 max-w-xs">{t.subject}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{t.category?.name} • {t.department?.name}</p>
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
                        <span>Track</span>
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

export default CustomerDashboard;
