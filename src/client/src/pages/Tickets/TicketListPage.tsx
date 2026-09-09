import React, { useState, useEffect, useCallback } from 'react';
import { ticketApi, adminApi } from '../../services/api';
import { Ticket, Department, Category, TicketPriority, TicketStatus, SlaStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { SlaCountdownBadge } from '../../components/common/SlaCountdownBadge';

interface TicketListPageProps {
  onNavigate: (page: string, ticketId?: string) => void;
  onOpenNewTicket: () => void;
}

export const TicketListPage: React.FC<TicketListPageProps> = ({ onNavigate, onOpenNewTicket }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [slaStatus, setSlaStatus] = useState<string>('');
  const [scope, setScope] = useState<string>(
    user?.role === 'AGENT' ? 'assigned_to_me' : user?.role === 'TELECALLER' ? 'created_by_me' : ''
  );
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadFilterOptions = async () => {
    try {
      const [deptRes, catRes] = await Promise.all([
        adminApi.getDepartments(),
        adminApi.getCategories(),
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.departments);
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (departmentId) params.departmentId = departmentId;
      if (categoryId) params.categoryId = categoryId;
      if (slaStatus) params.slaStatus = slaStatus;
      if (scope) params.scope = scope;

      const res = await ticketApi.list(params);
      if (res.data.success) {
        setTickets(res.data.tickets);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, status, priority, departmentId, categoryId, slaStatus, scope, sortBy, sortOrder]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setDepartmentId('');
    setCategoryId('');
    setSlaStatus('');
    setScope('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Ticket Queue Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              {pagination.total} Tickets
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Multi-field searching, SLA deadline tracking, status transitions & assignment dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTickets()}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors shadow-sm"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenNewTicket}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Raise New Ticket</span>
          </button>
        </div>
      </div>

      {/* Scope Presets Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200/80">
        <button
          onClick={() => {
            setScope('');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            scope === ''
              ? 'bg-[#2563eb] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          All System Tickets
        </button>

        {['ADMIN', 'MANAGER', 'AGENT'].includes(user?.role || '') && (
          <button
            onClick={() => {
              setScope('assigned_to_me');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              scope === 'assigned_to_me'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Assigned to Me
          </button>
        )}

        {user?.role === 'MANAGER' && (
          <button
            onClick={() => {
              setScope('my_department');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              scope === 'my_department'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            My Department Queue
          </button>
        )}

        {['ADMIN', 'TELECALLER'].includes(user?.role || '') && (
          <button
            onClick={() => {
              setScope('created_by_me');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              scope === 'created_by_me'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Created / Logged by Me
          </button>
        )}

        {/* Quick SLA Breach Filter Button */}
        <button
          onClick={() => {
            setSlaStatus(slaStatus === 'BREACHED' ? '' : 'BREACHED');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            slaStatus === 'BREACHED'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>SLA Breached Only</span>
        </button>
      </div>

      {/* Multi-Filter Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Main Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search Ticket #, subject, customer name, email, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full pl-10 pr-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
              <option value="ESCALATED">Escalated</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">🔴 Critical (1h)</option>
              <option value="HIGH">🟠 High (4h)</option>
              <option value="MEDIUM">🟡 Medium (8h)</option>
              <option value="LOW">🟢 Low (24h)</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters indicator */}
        {(search || status || priority || departmentId || categoryId || slaStatus) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Active filters applied</span>
            <button
              onClick={resetFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold"
            >
              Reset All Filters ✕
            </button>
          </div>
        )}
      </div>

      {/* Ticket Queue Data Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3.5 px-4">Ticket ID</th>
                <th className="py-3.5 px-4">Subject & Issue</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Agent</th>
                <th className="py-3.5 px-4">SLA Countdown</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading tickets...</span>
                    </div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="font-bold text-slate-700">No matching tickets found</p>
                      <p className="text-[11px]">Try adjusting your search criteria or create a new ticket.</p>
                      <button
                        onClick={resetFilters}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-bold"
                      >
                        Clear Active Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onNavigate('ticket-details', t.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-black text-blue-600 tracking-tight whitespace-nowrap">
                      {t.ticketNumber}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {t.subject}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {t.category?.name} • {t.department?.name}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{t.customer?.name}</div>
                      <div className="text-[11px] text-slate-400">{t.customer?.phone}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={t.priority} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={t.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {t.assignedAgent ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-[10px] text-white flex items-center justify-center font-bold">
                            {t.assignedAgent.fullName.charAt(0)}
                          </div>
                          <span className="text-slate-700 font-medium">{t.assignedAgent.fullName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SlaCountdownBadge
                        resolutionDueAt={t.resolutionDueAt}
                        slaStatus={t.slaStatus}
                        ticketStatus={t.status}
                        resolvedAt={t.resolvedAt}
                      />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('ticket-details', t.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#2563eb] text-slate-600 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{tickets.length}</span> of{' '}
            <span className="font-bold text-slate-800">{pagination.total}</span> tickets
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-slate-600 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page <span className="font-bold text-slate-800">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-800">{pagination.totalPages || 1}</span>
            </span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-slate-600 transition-colors shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
