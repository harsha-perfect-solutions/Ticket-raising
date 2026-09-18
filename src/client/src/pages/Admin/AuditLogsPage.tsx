import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { AuditLog } from '../../types';
import { ScrollText, RefreshCw, Download } from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

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
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Entity Type', 'Ticket Number', 'Details'];
    const rows = logs.map((l) => [
      `"${new Date(l.createdAt).toISOString()}"`,
      `"${(l.user?.fullName || 'System').replace(/"/g, '""')}"`,
      `"${l.user?.role || 'SYSTEM'}"`,
      `"${l.action}"`,
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
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Audit Trail Logs' }]} />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-sm">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Compliance & Audit Trail Explorer</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Immutable activity records for ticket transitions, reassignments, internal notes, and SLA status changes.
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
          <h3 className="text-sm font-bold text-slate-900">System Action Timeline</h3>
          <span className="text-xs text-slate-500 font-semibold">{logs.length} events logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Details / Diff</th>
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
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.user?.fullName || 'System Event'}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{log.user?.role || 'SYSTEM'}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {log.ticket ? (
                        <span className="font-bold text-blue-600">{log.ticket.ticketNumber}</span>
                      ) : (
                        <span>{log.entityType}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate text-[11px]">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
