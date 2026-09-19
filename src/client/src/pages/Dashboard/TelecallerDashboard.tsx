import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ticketApi } from '../../services/api';
import { Ticket } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  PhoneCall,
  Search,
  UserPlus,
  PlusCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Headphones,
  ArrowRight,
  ShieldCheck,
  User,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SlaCountdownBadge } from '../../components/common/SlaCountdownBadge';
import { PhoneLink } from '../../components/common/ContactActions';

export const TelecallerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentLoggedTickets, setRecentLoggedTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await ticketApi.list({ limit: 10, source: 'TELECALLER' });
      if (res.data.success) {
        setRecentLoggedTickets(res.data.tickets);
      }
    } catch (err) {
      console.error('Failed to load telecaller dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Telecaller Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Headphones className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Telecaller Operations Desk
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Inbound Call & Customer Dispatch Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Operator: <span className="font-semibold text-slate-700">{user?.fullName}</span> • Rapid Caller Verification & Incident Dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/telecaller/desk"
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Open Call Desk</span>
          </Link>

          <Link
            to="/telecaller/raise-ticket"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Call & Ticket</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/telecaller/desk')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') navigate('/telecaller/desk'); }}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 group-hover:text-amber-600 transition-colors">Inbound Calls Handled</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">28</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => navigate('/telecaller/tickets?source=TELECALLER')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') navigate('/telecaller/tickets?source=TELECALLER'); }}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 group-hover:text-amber-600 transition-colors">Tickets Dispatched</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{recentLoggedTickets.length}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => navigate('/telecaller/desk')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') navigate('/telecaller/desk'); }}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 group-hover:text-amber-600 transition-colors">Avg Verification Speed</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">1m 12s</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => navigate('/telecaller/desk')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') navigate('/telecaller/desk'); }}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 group-hover:text-purple-600 transition-colors">Identity Match Rate</p>
            <h3 className="text-2xl font-extrabold text-purple-600 mt-1">98.2%</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Launchpad to Telecaller Desk */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold">Rapid Customer Lookup Desk</h3>
          <p className="text-xs text-amber-100 mt-1 max-w-xl">
            Search customers by phone number, email, or name to instantly pull their dossier, past ticket history, and log inbound service calls.
          </p>
        </div>
        <Link
          to="/telecaller/desk"
          className="px-5 py-2.5 rounded-xl bg-white text-amber-700 hover:bg-amber-50 font-bold text-xs shadow-sm flex items-center gap-2 shrink-0 transition-all"
        >
          <Search className="w-4 h-4" />
          <span>Launch Call Desk</span>
        </Link>
      </div>

      {/* Recent Dispatches Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Call Inquiries & Dispatches</h2>
            <p className="text-xs text-slate-500">Tickets created via inbound phone call handling</p>
          </div>
          <Link
            to="/telecaller/tickets"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>All Queue</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Ticket ID</th>
                <th className="px-5 py-3">Caller & Company</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Routed Department</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLoggedTickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/telecaller/tickets/${t.id}`)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono font-bold text-blue-600">{t.ticketNumber}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-800">{t.customer?.name}</p>
                    {t.customer?.phone && (
                      <div className="mt-0.5">
                        <PhoneLink phone={t.customer?.phone} className="text-[11px] text-slate-500 font-normal" />
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <p className="font-semibold text-slate-800 truncate">{t.subject}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{t.callSummary || t.description}</p>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">{t.department?.name}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/telecaller/tickets/${t.id}`);
                      }}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                    >
                      View
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

export default TelecallerDashboard;
