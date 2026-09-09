import React, { useState } from 'react';
import { ticketApi } from '../../services/api';
import { AlertTriangle, X } from 'lucide-react';

interface EscalateModalProps {
  isOpen: boolean;
  ticketId: string;
  ticketNumber: string;
  currentLevel: number;
  onClose: () => void;
  onEscalated: () => void;
}

export const EscalateModal: React.FC<EscalateModalProps> = ({
  isOpen,
  ticketId,
  ticketNumber,
  currentLevel,
  onClose,
  onEscalated,
}) => {
  const [reason, setReason] = useState('');
  const [targetLevel, setTargetLevel] = useState<number>(Math.min(2, currentLevel + 1));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a justification for escalating this ticket.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await ticketApi.escalate(ticketId, {
        reason: reason.trim(),
        targetLevel,
      });
      if (res.data.success) {
        onEscalated();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to escalate ticket.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Escalate Ticket {ticketNumber}</h3>
              <p className="text-xs text-slate-500">Request managerial intervention or senior escalation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Escalation Tier</label>
            <select
              value={targetLevel}
              onChange={(e) => setTargetLevel(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500"
            >
              <option value={1}>Tier 1: Team Leader / Department Manager</option>
              <option value={2}>Tier 2: System Administrator & Executive Support</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Escalation Reason & Bottleneck <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Detail why standard resolution was obstructed (e.g. Requires database admin privilege, customer SLA critical)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all"
            >
              {isLoading ? 'Escalating...' : 'Trigger Escalation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
