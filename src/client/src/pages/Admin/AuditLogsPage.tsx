import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { AuditLog } from '../../types';
import { ScrollText, RefreshCw, Download, ArrowRight, Shield, User, Clock, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

const ACTION_COLOR_MAP: Record<string, string> = {
  TICKET_CREATED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TICKET_STATUS_CHANGED: 'bg-blue-50 text-blue-700 border-blue-200',
  TICKET_ASSIGNED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  TICKET_ESCALATED: 'bg-rose-50 text-rose-700 border-rose-200',
  SLA_BREACH_TRIGGERED: 'bg-rose-50 text-rose-700 border-rose-200',
  SLA_WARNING_TRIGGERED: 'bg-amber-50 text-amber-700 border-amber-200',
  NOTE_ADDED: 'bg-slate-50 text-slate-700 border-slate-200',
  USER_LOGGED_IN: 'bg-teal-50 text-teal-700 border-teal-200',
  USER_CREATED: 'bg-purple-50 text-purple-700 border-purple-200',
  USER_UPDATED: 'bg-blue-50 text-blue-700 border-blue-200',
  CUSTOMER_CREATED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SLA_RULE_CREATED: 'bg-purple-50 text-purple-700 border-purple-200',
  SLA_RULE_UPDATED: 'bg-blue-50 text-blue-700 border-blue-200',
  SLA_RULE_DELETED: 'bg-rose-50 text-rose-700 border-rose-200',
  DEPARTMENT_CREATED: 'bg-purple-50 text-purple-700 border-purple-200',
  DEPARTMENT_DELETED: 'bg-rose-50 text-rose-700 border-rose-200',
  CATEGORY_CREATED: 'bg-purple-50 text-purple-700 border-purple-200',
  CATEGORY_DELETED: 'bg-rose-50 text-rose-700 border-rose-200',
};

function formatActionTitle(action: string): string {
  const customMap: Record<string, string> = {
    TICKET_STATUS_CHANGED: 'Status Changed',
    TICKET_CREATED: 'Ticket Created',
    TICKET_ASSIGNED: 'Ticket Assigned',
    TICKET_ESCALATED: 'Ticket Escalated',
    TICKET_RESOLVED: 'Ticket Resolved',
    SLA_BREACH_TRIGGERED: 'SLA Breached',
    SLA_WARNING_TRIGGERED: 'SLA Warning',
    NOTE_ADDED: 'Note Added',
    USER_LOGGED_IN: 'User Sign In',
    USER_CREATED: 'User Provisioned',
    USER_UPDATED: 'User Updated',
    CUSTOMER_CREATED: 'Customer Registered',
    SLA_RULE_CREATED: 'SLA Policy Created',
    SLA_RULE_UPDATED: 'SLA Policy Updated',
    SLA_RULE_DELETED: 'SLA Policy Deleted',
    DEPARTMENT_CREATED: 'Department Added',
    DEPARTMENT_DELETED: 'Department Removed',
    CATEGORY_CREATED: 'Category Added',
    CATEGORY_DELETED: 'Category Removed',
  };

  if (customMap[action]) return customMap[action];
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEnumValue(val: any): string {
  if (val === null || val === undefined) return 'None';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'number') return String(val);
  if (typeof val !== 'string') return String(val);

  const customVals: Record<string, string> = {
    IN_PROGRESS: 'In Progress',
    WAITING_FOR_CUSTOMER: 'Waiting for Customer',
    NEW: 'New',
    OPEN: 'Open',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
    ESCALATED: 'Escalated',
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical',
    AGENT: 'Support Agent',
    TELECALLER: 'Telecaller',
    MANAGER: 'Manager / Team Lead',
    ADMIN: 'Administrator',
    CUSTOMER: 'Customer',
  };

  if (customVals[val]) return customVals[val];
  return val
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatKeyLabel(key: string): string {
  const customKeys: Record<string, string> = {
    oldStatus: 'Previous Status',
    previousStatus: 'Previous Status',
    newStatus: 'New Status',
    assignedAgentName: 'Assigned Agent',
    departmentName: 'Department',
    firstResponseMinutes: 'First Response Target',
    resolutionMinutes: 'Resolution Deadline',
    warnBeforeMinutes: 'Near-Breach Alert',
    autoEscalateMinutes: 'Auto-Escalation Threshold',
    role: 'Assigned Role',
    reason: 'Reason',
    note: 'Internal Note',
    callSummary: 'Call Summary',
    subject: 'Subject',
    priority: 'Priority',
  };

  if (customKeys[key]) return customKeys[key];
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const HumanReadableDetails: React.FC<{ details?: string | null; ticketNumber?: string }> = ({
  details,
  ticketNumber,
}) => {
  if (!details || details.trim() === '' || details === '{}') {
    return <span className="text-slate-400 italic">No additional details recorded</span>;
  }

  // Try parsing JSON
  let parsed: Record<string, any> | null = null;
  try {
    if (details.trim().startsWith('{') || details.trim().startsWith('[')) {
      parsed = JSON.parse(details);
    }
  } catch {
    parsed = null;
  }

  // If plain text (not JSON)
  if (!parsed || typeof parsed !== 'object') {
    return (
      <span className="text-slate-700 font-medium leading-relaxed">
        {details.replace(/[{}"]/g, '')}
      </span>
    );
  }

  // Array of items
  if (Array.isArray(parsed)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {parsed.map((item, idx) => (
          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
            {formatEnumValue(item)}
          </span>
        ))}
      </div>
    );
  }

  // Specific high-frequency pattern: Status Transition
  const oldStatus = parsed.oldStatus || parsed.previousStatus;
  const newStatus = parsed.newStatus || parsed.status;
  if (oldStatus && newStatus) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap font-medium text-slate-800 text-xs">
          <span>Moved from</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
            {formatEnumValue(oldStatus)}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
            {formatEnumValue(newStatus)}
          </span>
        </div>
        {parsed.reason && (
          <p className="text-[11px] text-slate-500 font-normal">
            <span className="font-semibold text-slate-600">Reason:</span> {parsed.reason}
          </p>
        )}
      </div>
    );
  }

  // Specific pattern: Ticket Escalated or Breached
  if (parsed.reason && !oldStatus) {
    return (
      <div className="space-y-0.5">
        <span className="text-xs text-slate-800 font-medium">
          {ticketNumber ? `Ticket ${ticketNumber}: ` : ''}
          {parsed.reason}
        </span>
        {parsed.escalatedToRole && (
          <div className="text-[11px] text-slate-500">
            Escalated to: <strong>{formatEnumValue(parsed.escalatedToRole)}</strong>
          </div>
        )}
      </div>
    );
  }

  // General Object: Filter out raw UUIDs/IDs and display clean key-value pairs
  const visibleEntries = Object.entries(parsed).filter(([key, val]) => {
    if (val === null || val === undefined || val === '') return false;
    // Don't show raw technical IDs if names or higher-level keys exist
    if (['id', 'userId', 'entityId', 'ticketId', 'actorId', '_id'].includes(key)) return false;
    if (key.endsWith('Id') && typeof val === 'string' && val.length > 15) return false;
    return true;
  });

  if (visibleEntries.length === 0) {
    // If only IDs existed, display a clean fallback instead of raw JSON
    return <span className="text-slate-500 font-medium">Configuration updated successfully</span>;
  }

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {visibleEntries.map(([key, val]) => (
        <div
          key={key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px]"
        >
          <span className="font-semibold text-slate-600">{formatKeyLabel(key)}:</span>
          <span className="font-bold text-slate-900">{formatEnumValue(val)}</span>
        </div>
      ))}
    </div>
  );
};

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAuditLogs({ limit: 100 });
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Entity Type', 'Ticket Number', 'Details'];
    const rows = logs.map((l) => [
      `"${new Date(l.createdAt).toLocaleString()}"`,
      `"${(l.user?.fullName || 'System Event').replace(/"/g, '""')}"`,
      `"${l.user?.role || 'SYSTEM'}"`,
      `"${formatActionTitle(l.action)}"`,
      `"${l.entityType || ''}"`,
      `"${l.ticket?.ticketNumber || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <Breadcrumbs items={[{ label: 'Audit Activity Trail' }]} />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-sm">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Audit & Compliance Trail</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Human-readable record of ticket transitions, team assignments, SLA breaches, and administrative updates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            title="Export audit records to CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export to CSV</span>
          </button>
          <button
            onClick={loadLogs}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors shadow-sm"
            title="Refresh Audit Trail"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Activity Timeline</h3>
          <span className="text-xs text-slate-500 font-semibold">{logs.length} events logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3.5 px-4 whitespace-nowrap">Timestamp</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Actor</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Action</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Entity / Target</th>
                <th className="py-3.5 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badgeColor = ACTION_COLOR_MAP[log.action] || 'bg-slate-50 text-slate-700 border-slate-200';
                  const dateObj = new Date(log.createdAt);
                  const formattedDate = dateObj.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                        <div className="font-semibold text-slate-800">{formattedDate}</div>
                        <div className="text-[10px] text-slate-400">{formattedTime}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{log.user?.fullName || 'System Automation'}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{formatEnumValue(log.user?.role || 'SYSTEM')}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-md border font-bold text-[11px] ${badgeColor}`}>
                          {formatActionTitle(log.action)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {log.ticket ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-blue-600">{log.ticket.ticketNumber}</span>
                            {log.ticket.subject && (
                              <span className="text-[11px] text-slate-400 truncate max-w-[12rem]">{log.ticket.subject}</span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {log.entityType || 'General'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <HumanReadableDetails details={log.details} ticketNumber={log.ticket?.ticketNumber} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
