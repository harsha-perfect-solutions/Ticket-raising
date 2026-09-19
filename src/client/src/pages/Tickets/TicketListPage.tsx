import React, { useState, useEffect, useCallback } from 'react';
import { ticketApi, adminApi } from '../../services/api';
import { Ticket, Department, Category, TicketPriority, TicketStatus, SlaStatus, User } from '../../types';
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
  Download,
  CheckSquare,
  Square,
  CheckCircle,
  Play,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { SlaCountdownBadge } from '../../components/common/SlaCountdownBadge';

import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PhoneLink } from '../../components/common/ContactActions';

interface TicketListPageProps {
  onNavigate?: (page: string, ticketId?: string) => void;
  onOpenNewTicket?: () => void;
}

export const TicketListPage: React.FC<TicketListPageProps> = ({ onNavigate, onOpenNewTicket }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const rolePrefix = user?.role ? user.role.toLowerCase() : 'customer';

  const handleOpenTicket = (ticketId: string) => {
    if (onNavigate) {
      onNavigate('ticket-details', ticketId);
    } else {
      navigate(`/${rolePrefix}/tickets/${ticketId}`);
    }
  };

  const handleRaiseTicket = () => {
    if (onOpenNewTicket) {
      onOpenNewTicket();
    } else {
      navigate(`/${rolePrefix}/raise-ticket`);
    }
  };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [batchAgentId, setBatchAgentId] = useState<string>('');

  // Filter States initialized with searchParams or role default
  const paramScope = searchParams.get('scope');
  const initialScope =
    paramScope !== null
      ? paramScope === 'all'
        ? ''
        : paramScope
      : user?.role === 'AGENT'
      ? 'assigned_to_me'
      : user?.role === 'TELECALLER'
      ? 'created_by_me'
      : '';

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState<string>(searchParams.get('status') || '');
  const [priority, setPriority] = useState<string>(searchParams.get('priority') || '');
  const [departmentId, setDepartmentId] = useState<string>(searchParams.get('departmentId') || '');
  const [categoryId, setCategoryId] = useState<string>(searchParams.get('categoryId') || '');
  const [slaStatus, setSlaStatus] = useState<string>(searchParams.get('slaStatus') || '');
  const [scope, setScope] = useState<string>(initialScope);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Keep state synchronized if URL search params change externally
  useEffect(() => {
    const s = searchParams.get('scope');
    if (s !== null) {
      setScope(s === 'all' ? '' : s);
    } else {
      setScope(initialScope);
    }
    const st = searchParams.get('status');
    setStatus(st !== null ? st : '');
    const p = searchParams.get('priority');
    setPriority(p !== null ? p : '');
    const dept = searchParams.get('departmentId');
    setDepartmentId(dept !== null ? dept : '');
    const cat = searchParams.get('categoryId');
    setCategoryId(cat !== null ? cat : '');
    const sla = searchParams.get('slaStatus');
    setSlaStatus(sla !== null ? sla : '');
    const q = searchParams.get('search');
    setSearch(q !== null ? q : '');
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchParams]);

  const loadFilterOptions = async () => {
    try {
      const calls: Promise<any>[] = [
        adminApi.getDepartments(),
        adminApi.getCategories(),
      ];
      if (['ADMIN', 'MANAGER'].includes(user?.role || '')) {
        calls.push(adminApi.getUsers({ role: 'AGENT' }));
      }
      const [deptRes, catRes, userRes] = await Promise.all(calls);
      if (deptRes?.data?.success) setDepartments(deptRes.data.departments);
      if (catRes?.data?.success) setCategories(catRes.data.categories);
      if (userRes?.data?.success) setAgents(userRes.data.users);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
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
      const paramSource = searchParams.get('source');
      if (paramSource) params.source = paramSource;
      const paramAgentId = searchParams.get('assignedAgentId');
      if (paramAgentId) params.assignedAgentId = paramAgentId;

      const res = await ticketApi.list(params);
      if (res.data.success) {
        setTickets(res.data.tickets);
        setPagination(res.data.pagination);
        setError(null);
      } else {
        setError('Unable to load tickets. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to fetch tickets', err);
      setError(err?.response?.data?.message || 'Unable to load tickets. Please try again.');
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
    setSelectedIds([]);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const isAllSelected = tickets.length > 0 && tickets.every((t) => selectedIds.includes(t.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tickets.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCsv = () => {
    if (tickets.length === 0) return;
    const headers = [
      'Ticket Number',
      'Subject',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Priority',
      'Status',
      'Department',
      'Category',
      'Assigned Agent',
      'SLA Status',
      'Created At',
      'Resolution Due',
    ];
    const rows = tickets.map((t) => [
      `"${t.ticketNumber}"`,
      `"${(t.subject || '').replace(/"/g, '""')}"`,
      `"${(t.customer?.name || '').replace(/"/g, '""')}"`,
      `"${t.customer?.email || ''}"`,
      `"${t.customer?.phone || ''}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${(t.department?.name || '').replace(/"/g, '""')}"`,
      `"${(t.category?.name || '').replace(/"/g, '""')}"`,
      `"${(t.assignedAgent?.fullName || 'Unassigned').replace(/"/g, '""')}"`,
      `"${t.slaStatus}"`,
      `"${new Date(t.createdAt).toISOString()}"`,
      `"${t.resolutionDueAt ? new Date(t.resolutionDueAt).toISOString() : ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tickets_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBulkUpdate = async (statusUpdate?: TicketStatus, agentUpdate?: string | null) => {
    if (selectedIds.length === 0) return;
    setIsBatchUpdating(true);
    try {
      const res = await ticketApi.batchUpdate({
        ticketIds: selectedIds,
        status: statusUpdate,
        assignedAgentId: agentUpdate,
        reason: `Bulk action performed by ${user?.fullName || user?.role}`,
      });
      if (res.data.success) {
        setSelectedIds([]);
        setBatchAgentId('');
        await fetchTickets();
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update selected tickets');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Dynamic Breadcrumbs with History-Safe Back Button */}
      <Breadcrumbs
        items={[{ label: 'Ticket Queue Management' }]}
        backLabel="Back to Dashboard"
        fallbackBackUrl={`/${rolePrefix}/dashboard`}
      />

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

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={tickets.length === 0}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            title="Export filtered tickets to CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => fetchTickets()}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors shadow-sm"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleRaiseTicket}
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
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete('scope');
              return next;
            });
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              <option value="active">Active / In Progress</option>
              <option value="open">Open (Active & Escalated)</option>
              <option value="NEW">New</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
              <option value="ESCALATED">Escalated</option>
              <option value="resolved">Resolved & Closed</option>
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

      {/* Bulk Action Bar (when tickets are selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white font-black text-xs flex items-center justify-center shadow-sm">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold text-slate-200">tickets selected</span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-[11px] text-slate-400 hover:text-white underline ml-1 cursor-pointer"
            >
              Deselect All
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkUpdate('IN_PROGRESS')}
              disabled={isBatchUpdating}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Mark In Progress</span>
            </button>

            <button
              onClick={() => handleBulkUpdate('RESOLVED')}
              disabled={isBatchUpdating}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Batch Resolve</span>
            </button>

            <button
              onClick={() => handleBulkUpdate('CLOSED')}
              disabled={isBatchUpdating}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Batch Close</span>
            </button>

            {['ADMIN', 'MANAGER'].includes(user?.role || '') && agents.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <select
                  value={batchAgentId}
                  onChange={(e) => setBatchAgentId(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 text-white border border-slate-700 text-xs focus:outline-none"
                >
                  <option value="">Reassign to Agent...</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.fullName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (batchAgentId) handleBulkUpdate(undefined, batchAgentId);
                  }}
                  disabled={!batchAgentId || isBatchUpdating}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ticket Queue Data Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3.5 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-blue-600 focus:outline-none"
                    title={isAllSelected ? 'Deselect All' : 'Select All on page'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
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
              {error ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="max-w-md mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3">
                      <div className="flex items-center justify-center gap-2 text-rose-700 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                      <p className="text-[11px] text-rose-600">
                        Unable to load ticket records. Please check your connection or retry.
                      </p>
                      <button
                        type="button"
                        onClick={() => fetchTickets()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading tickets...</span>
                    </div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
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
                tickets.map((t) => {
                  const isSelected = selectedIds.includes(t.id);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => handleOpenTicket(t.id)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors group ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td
                        className="py-3.5 px-3 text-center"
                        onClick={(e) => handleToggleSelect(t.id, e)}
                      >
                        <button
                          type="button"
                          className="text-slate-400 hover:text-blue-600 focus:outline-none"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

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
                        {t.customer?.phone && (
                          <div className="mt-0.5">
                            <PhoneLink phone={t.customer?.phone} className="text-[11px] text-slate-500 font-normal" />
                          </div>
                        )}
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
                            handleOpenTicket(t.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#2563eb] text-slate-600 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
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
