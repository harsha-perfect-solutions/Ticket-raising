import React, { useState, useEffect } from 'react';
import { SlaStatus, TicketStatus } from '../../types';
import { Timer, AlertOctagon, CheckCircle2, Flame } from 'lucide-react';

interface SlaCountdownBadgeProps {
  resolutionDueAt?: string | null;
  slaStatus: SlaStatus;
  ticketStatus: TicketStatus;
  resolvedAt?: string | null;
  className?: string;
  compact?: boolean;
}

export const SlaCountdownBadge: React.FC<SlaCountdownBadgeProps> = ({
  resolutionDueAt,
  slaStatus,
  ticketStatus,
  resolvedAt,
  className = '',
  compact = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isBreached, setIsBreached] = useState<boolean>(slaStatus === 'BREACHED');
  const [isWarning, setIsWarning] = useState<boolean>(slaStatus === 'WARNING_NEAR_BREACH');

  const isComplete = ['RESOLVED', 'CLOSED', 'CANCELLED'].includes(ticketStatus);

  useEffect(() => {
    if (!resolutionDueAt || isComplete) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const due = new Date(resolutionDueAt).getTime();
      const diff = due - now;

      if (diff <= 0) {
        setIsBreached(true);
        setIsWarning(false);
        const overdueMinutes = Math.abs(Math.floor(diff / 60000));
        if (overdueMinutes < 60) {
          setTimeLeft(`Breached by ${overdueMinutes}m`);
        } else {
          const overdueHours = Math.floor(overdueMinutes / 60);
          const remainingMins = overdueMinutes % 60;
          setTimeLeft(`Breached by ${overdueHours}h ${remainingMins}m`);
        }
      } else {
        const totalMinutes = Math.floor(diff / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const seconds = Math.floor((diff % 60000) / 1000);

        if (totalMinutes <= 30) {
          setIsWarning(true);
        } else {
          setIsWarning(false);
        }

        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m left`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s left`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [resolutionDueAt, isComplete, slaStatus]);

  if (isComplete) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>SLA Met</span>
      </span>
    );
  }

  if (!resolutionDueAt) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200 ${className}`}
      >
        <Timer className="w-3.5 h-3.5 text-slate-400" />
        <span>No SLA</span>
      </span>
    );
  }

  if (isBreached) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse ${className}`}
      >
        <Flame className="w-3.5 h-3.5 text-rose-600" />
        <span>{compact ? 'Breached' : timeLeft || 'SLA Breached'}</span>
      </span>
    );
  }

  if (isWarning) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 ${className}`}
      >
        <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
        <span>{compact ? 'Warning' : timeLeft || 'SLA Warning'}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
    >
      <Timer className="w-3.5 h-3.5 text-blue-600" />
      <span>{timeLeft || 'Calculating...'}</span>
    </span>
  );
};
