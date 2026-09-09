import React from 'react';
import { TicketPriority } from '../../types';
import { Flame, AlertCircle, AlertOctagon, CheckCircle } from 'lucide-react';

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '', size = 'md' }) => {
  const configs: Record<
    TicketPriority,
    { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    CRITICAL: {
      label: 'Critical',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: Flame,
    },
    HIGH: {
      label: 'High',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: AlertOctagon,
    },
    MEDIUM: {
      label: 'Medium',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: AlertCircle,
    },
    LOW: {
      label: 'Low',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle,
    },
  };

  const config = configs[priority] || configs.MEDIUM;
  const Icon = config.icon;

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs font-semibold px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-lg border ${config.bg} ${config.text} ${config.border} ${sizeClass} ${className}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};
