import React from 'react';
import { TicketStatus } from '../../types';
import {
  Sparkles,
  UserCheck,
  PlayCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Archive,
  XCircle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const configs: Record<
    TicketStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    NEW: {
      label: 'New',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200/80',
      icon: Sparkles,
    },
    ASSIGNED: {
      label: 'Assigned',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200/80',
      icon: UserCheck,
    },
    IN_PROGRESS: {
      label: 'In Progress',
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200/80',
      icon: PlayCircle,
    },
    WAITING_FOR_CUSTOMER: {
      label: 'Waiting for Customer',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200/80',
      icon: Clock,
    },
    ESCALATED: {
      label: 'Escalated',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200/80',
      icon: AlertTriangle,
    },
    RESOLVED: {
      label: 'Resolved',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200/80',
      icon: CheckCircle2,
    },
    REOPENED: {
      label: 'Reopened',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200/80',
      icon: RotateCcw,
    },
    CLOSED: {
      label: 'Closed',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      icon: Archive,
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-zinc-100',
      text: 'text-zinc-500',
      border: 'border-zinc-200',
      icon: XCircle,
    },
  };

  const config = configs[status] || configs.NEW;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} ${className}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};
