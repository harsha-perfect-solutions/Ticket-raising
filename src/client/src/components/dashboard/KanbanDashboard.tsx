import React, { useState, useEffect } from 'react';
import {
  Kanban,
  Search,
  RefreshCw,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  User,
  ArrowUpRight,
  Tag,
} from 'lucide-react';
import { ticketApi } from '../../services/api';
import { Ticket, TicketStatus, TicketPriority } from '../../types';

interface KanbanDashboardProps {
  onNavigateTicket?: (ticketId: string) => void;
  onRaiseTicket?: () => void;
}

const KANBAN_COLUMNS: { key: TicketStatus; label: string; badgeColor: string; headerBg: string; borderColor: string }[] = [
  { key: 'NEW', label: 'New / Incoming', badgeColor: 'bg-blue-100 text-blue-700 border-blue-200', headerBg: 'bg-blue-50/80', borderColor: 'border-blue-200' },
  { key: 'IN_PROGRESS', label: 'In Progress', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200', headerBg: 'bg-amber-50/80', borderColor: 'border-amber-200' },
  { key: 'WAITING_FOR_CUSTOMER', label: 'Waiting Customer', badgeColor: 'bg-purple-100 text-purple-700 border-purple-200', headerBg: 'bg-purple-50/80', borderColor: 'border-purple-200' },
  { key: 'ESCALATED', label: 'Escalated SLA', badgeColor: 'bg-rose-100 text-rose-700 border-rose-200', headerBg: 'bg-rose-50/80', borderColor: 'border-rose-200' },
  { key: 'RESOLVED', label: 'Resolved / Closed', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200', headerBg: 'bg-emerald-50/80', borderColor: 'border-emerald-200' },
];

const PRIORITY_STYLES: Record<TicketPriority, { bg: string; text: string }> = {
  CRITICAL: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'CRITICAL' },
  HIGH: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'HIGH' },
  MEDIUM: { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'MEDIUM' },
  LOW: { bg: 'bg-slate-50 text-slate-600 border-slate-200', text: 'LOW' },
};

export const KanbanDashboard: React.FC<KanbanDashboardProps> = ({
  onNavigateTicket,
  onRaiseTicket,
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await ticketApi.list({ limit: 100 });
      if (res.data.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to fetch Kanban tickets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    setUpdatingId(ticketId);
    try {
      const res = await ticketApi.updateStatus(ticketId, { status: newStatus });
      if (res.data.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error('Failed to update ticket status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      (ticket.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.ticketNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.creator?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const getNextStatus = (current: TicketStatus): TicketStatus | null => {
    if (current === 'NEW') return 'IN_PROGRESS';
    if (current === 'IN_PROGRESS') return 'WAITING_FOR_CUSTOMER';
    if (current === 'WAITING_FOR_CUSTOMER') return 'RESOLVED';
    if (current === 'ESCALATED') return 'IN_PROGRESS';
    return null;
  };

  const getPrevStatus = (current: TicketStatus): TicketStatus | null => {
    if (current === 'IN_PROGRESS') return 'NEW';
    if (current === 'WAITING_FOR_CUSTOMER') return 'IN_PROGRESS';
    if (current === 'RESOLVED') return 'IN_PROGRESS';
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Kanban className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Kanban Operations Board</h2>
              <p className="text-xs text-slate-500">Interactive visual ticket workflow & status transitions</p>
            </div>
          </div>
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">🔴 Critical Only</option>
            <option value="HIGH">🟠 High Only</option>
            <option value="MEDIUM">🔵 Medium Only</option>
            <option value="LOW">⚪ Low Only</option>
          </select>

          {/* Refresh */}
          <button
            onClick={fetchTickets}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh Board"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Raise Ticket */}
          {onRaiseTicket && (
            <button
              onClick={onRaiseTicket}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" /> Create Ticket
            </button>
          )}
        </div>
      </div>

      {/* Board Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {KANBAN_COLUMNS.map((col) => {
          const count = filteredTickets.filter((t) => t.status === col.key).length;
          return (
            <div key={col.key} className={`rounded-xl p-3 border ${col.borderColor} ${col.headerBg} flex items-center justify-between`}>
              <span className="text-xs font-bold text-slate-700">{col.label}</span>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${col.badgeColor}`}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Kanban Board 5-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => {
          const colTickets = filteredTickets.filter((t) => t.status === column.key);

          return (
            <div
              key={column.key}
              className={`flex flex-col rounded-2xl border ${column.borderColor} bg-slate-50/60 p-3 min-h-[550px] shadow-sm space-y-3`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-200/80">
                <span className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${column.badgeColor.split(' ')[0]}`} />
                  {column.label}
                </span>
                <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {colTickets.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[700px] pr-0.5">
                {colTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/50">
                    <p className="text-xs font-medium">No tickets</p>
                  </div>
                ) : (
                  colTickets.map((ticket) => {
                    const pStyle = PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.LOW;
                    const prevStatus = getPrevStatus(ticket.status);
                    const nextStatus = getNextStatus(ticket.status);
                    const isUpdating = updatingId === ticket.id;

                    return (
                      <div
                        key={ticket.id}
                        className={`group relative rounded-xl bg-white p-3.5 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all space-y-2.5 ${
                          isUpdating ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {/* Top Line: Ticket Number & Priority */}
                        <div className="flex items-center justify-between">
                          <span
                            onClick={() => onNavigateTicket && onNavigateTicket(ticket.id)}
                            className="text-[11px] font-mono font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            {ticket.ticketNumber}
                            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pStyle.bg}`}>
                            {pStyle.text}
                          </span>
                        </div>

                        {/* Title / Subject */}
                        <h4
                          onClick={() => onNavigateTicket && onNavigateTicket(ticket.id)}
                          className="text-xs font-bold text-slate-800 line-clamp-2 hover:text-indigo-600 cursor-pointer leading-snug"
                        >
                          {ticket.subject}
                        </h4>

                        {/* Metadata Pills */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                          {ticket.category && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                              <Tag className="h-2.5 w-2.5" />
                              {ticket.category.name}
                            </span>
                          )}
                          {ticket.department && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                              {ticket.department.name}
                            </span>
                          )}
                        </div>

                        {/* Footer: User & Quick Transitions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-[9px]">
                              {ticket.creator?.fullName?.charAt(0) || 'U'}
                            </div>
                            <span className="truncate max-w-[90px] text-[10px] font-medium text-slate-600">
                              {ticket.creator?.fullName || 'Customer'}
                            </span>
                          </div>

                          {/* Transition Actions */}
                          <div className="flex items-center gap-1">
                            {prevStatus && (
                              <button
                                onClick={() => handleUpdateStatus(ticket.id, prevStatus)}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                title={`Move to ${prevStatus}`}
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {nextStatus && (
                              <button
                                onClick={() => handleUpdateStatus(ticket.id, nextStatus)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold transition-colors"
                                title={`Advance to ${nextStatus}`}
                              >
                                Next <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
