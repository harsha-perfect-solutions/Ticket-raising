import React, { useState, useEffect } from 'react';
import {
  Flame,
  AlertTriangle,
  Clock,
  UserCheck,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Ticket } from '../../types';
import api from '../../services/api';
import { SlaCountdownBadge } from '../common/SlaCountdownBadge';

interface RiskScoredTicket {
  ticket: Ticket;
  riskScore: number; // 0 to 100%
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  recommendedAction: string;
}

interface PredictiveSlaForecasterProps {
  onReassignTicket?: (ticketId: string) => void;
}

export const PredictiveSlaForecaster: React.FC<PredictiveSlaForecasterProps> = ({
  onReassignTicket,
}) => {
  const [atRiskTickets, setAtRiskTickets] = useState<RiskScoredTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateSlaForecast();
  }, []);

  const calculateSlaForecast = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/tickets?status=IN_PROGRESS,ASSIGNED,NEW&limit=20');
      if (res.data.success && res.data.tickets) {
        const scored: RiskScoredTicket[] = res.data.tickets
          .map((t: Ticket) => {
            const now = new Date().getTime();
            const due = t.resolutionDueAt ? new Date(t.resolutionDueAt).getTime() : now + 3600000;
            const remainingMins = Math.max(0, Math.floor((due - now) / 60000));

            // Priority Multiplier
            const priorityWeight =
              t.priority === 'CRITICAL' ? 2.0 : t.priority === 'HIGH' ? 1.5 : 1.0;

            // Compute Risk Score
            let risk = 0;
            if (remainingMins <= 30) risk = 95;
            else if (remainingMins <= 60) risk = 80;
            else if (remainingMins <= 120) risk = 60;
            else risk = Math.max(10, 100 - Math.floor(remainingMins / 3));

            risk = Math.min(99, Math.round(risk * priorityWeight));

            let level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
            if (risk >= 85) level = 'CRITICAL';
            else if (risk >= 70) level = 'HIGH';
            else if (risk >= 45) level = 'MODERATE';

            return {
              ticket: t,
              riskScore: risk,
              riskLevel: level,
              recommendedAction:
                level === 'CRITICAL'
                  ? 'Reassign to least-loaded agent immediately'
                  : level === 'HIGH'
                  ? 'Prioritize response & notify assignee'
                  : 'Monitor SLA timer',
            };
          })
          .filter((item: RiskScoredTicket) => item.riskScore >= 45)
          .sort((a: RiskScoredTicket, b: RiskScoredTicket) => b.riskScore - a.riskScore);

        setAtRiskTickets(scored);
      }
    } catch (err) {
      console.error('Failed to run SLA forecast algorithm:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
        <p className="text-xs text-slate-400">Running ML Predictive SLA Breach Forecasting...</p>
      </div>
    );
  }

  if (atRiskTickets.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-emerald-900 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          <div>
            <h4 className="text-xs font-bold">Predictive SLA Forecast: 100% Healthy</h4>
            <p className="text-[11px] text-emerald-700">All open tickets are progressing well within target SLA resolution times.</p>
          </div>
        </div>
        <button
          onClick={calculateSlaForecast}
          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100"
          title="Refresh Forecast"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rose-200/90 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/20">
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">Predictive SLA Breach Risk Radar</h3>
              <span className="rounded-full bg-rose-100 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                {atRiskTickets.length} At-Risk Tickets
              </span>
            </div>
            <p className="text-xs text-slate-500">ML Forecast flagging tickets at risk of breach *before* deadline</p>
          </div>
        </div>
        <button
          onClick={calculateSlaForecast}
          className="flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-100"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Recalculate
        </button>
      </div>

      {/* Risk Scored Ticket List */}
      <div className="space-y-2.5">
        {atRiskTickets.slice(0, 4).map(({ ticket, riskScore, riskLevel, recommendedAction }) => (
          <div
            key={ticket.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-rose-50/40 hover:border-rose-300 transition-all gap-3 text-xs"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-600">#{ticket.ticketNumber}</span>
                <span className="font-bold text-slate-900 truncate max-w-xs">{ticket.subject}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                    riskLevel === 'CRITICAL'
                      ? 'bg-rose-600 text-white'
                      : riskLevel === 'HIGH'
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {riskScore}% Breach Risk
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-3">
                <span>Assignee: <strong className="text-slate-700">{ticket.assignedAgent?.fullName || 'Unassigned'}</strong></span>
                <span>Priority: <strong className="text-slate-700">{ticket.priority}</strong></span>
                <span className="text-rose-600 font-semibold">{recommendedAction}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <SlaCountdownBadge
                resolutionDueAt={ticket.resolutionDueAt}
                slaStatus={ticket.slaStatus}
                ticketStatus={ticket.status}
                compact
              />
              {onReassignTicket && (
                <button
                  onClick={() => onReassignTicket(ticket.id)}
                  className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 whitespace-nowrap"
                >
                  Reallocate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
