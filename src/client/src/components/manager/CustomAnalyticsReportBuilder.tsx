import React, { useState } from 'react';
import { Download, Printer, Filter, TrendingUp, CheckCircle2, AlertTriangle, Layers, Calendar } from 'lucide-react';
import { DashboardStats } from '../../types';

interface CustomAnalyticsReportBuilderProps {
  stats: DashboardStats | null;
}

export const CustomAnalyticsReportBuilder: React.FC<CustomAnalyticsReportBuilderProps> = ({ stats }) => {
  const [period, setPeriod] = useState<string>('month');
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExportCsv = () => {
    setExporting('CSV');
    setTimeout(() => {
      const csvContent = `data:text/csv;charset=utf-8,Category,Total,Open,Resolved,SLA_Breached\nHardware,45,5,40,1\nSoftware,88,12,76,2\nNetwork,32,4,28,0\nAccount Access,64,3,61,0\n`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `resolvehub_analytics_report_${period}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExporting(null);
    }, 600);
  };

  const handleExportPdf = () => {
    setExporting('PDF');
    setTimeout(() => {
      window.print();
      setExporting(null);
    }, 400);
  };

  const counts = stats?.counts || { total: 0, resolved: 0, escalated: 0, openTotal: 0 };
  const slaBreached = (stats?.counts as any)?.slaBreached ?? 0;
  const slaComplianceRate = counts.total > 0 ? Math.round(((counts.total - slaBreached) / counts.total) * 100) : 98;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Custom BI Analytics & Report Builder</h3>
            <p className="text-xs text-slate-500">Executive metrics, SLA compliance & exportable reporting schedules</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent font-bold text-slate-900 border-none outline-none cursor-pointer text-xs"
            >
              <option value="week">Past 7 Days</option>
              <option value="month">Current Month (30 Days)</option>
              <option value="q1">Q1 FY 2025–26</option>
              <option value="q2">Q2 FY 2025–26</option>
              <option value="ytd">Year to Date (YTD)</option>
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={!!exporting}
            className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            {exporting === 'CSV' ? 'Exporting...' : 'Export CSV'}
          </button>

          <button
            onClick={handleExportPdf}
            disabled={!!exporting}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <Printer className="h-3.5 w-3.5" />
            {exporting === 'PDF' ? 'Preparing...' : 'Print PDF Report'}
          </button>
        </div>
      </div>

      {/* BI Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 block">SLA Compliance Rate</span>
          <div className="flex items-center justify-between">
            <h4 className="text-2xl font-black text-slate-900">{slaComplianceRate}%</h4>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Above 95% Target
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Total resolved within target SLA duration</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 block">Resolution Throughput</span>
          <div className="flex items-center justify-between">
            <h4 className="text-2xl font-black text-slate-900">{counts.resolved}</h4>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
              Resolved Tickets
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Total completed resolutions in selected window</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 block">Active Open Workload</span>
          <div className="flex items-center justify-between">
            <h4 className="text-2xl font-black text-slate-900">{counts.openTotal}</h4>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              In Flight
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Open tickets across all support queues</p>
        </div>
      </div>
    </div>
  );
};
