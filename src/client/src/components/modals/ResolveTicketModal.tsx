import React, { useState } from 'react';
import { ticketApi } from '../../services/api';
import { CheckCircle2, X } from 'lucide-react';

interface ResolveTicketModalProps {
  isOpen: boolean;
  ticketId: string;
  ticketNumber: string;
  onClose: () => void;
  onResolved: () => void;
}

export const ResolveTicketModal: React.FC<ResolveTicketModalProps> = ({
  isOpen,
  ticketId,
  ticketNumber,
  onClose,
  onResolved,
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      setError('Please provide resolution details for the customer and audit record.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await ticketApi.updateStatus(ticketId, {
        status: 'RESOLVED',
        resolutionNotes: resolutionNotes.trim(),
        reason: 'Issue resolved by support team',
      });
      if (res.data.success) {
        onResolved();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resolve ticket.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Resolve Ticket {ticketNumber}</h3>
              <p className="text-xs text-slate-500">Complete investigation & provide customer explanation</p>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Resolution Summary & Fix Details <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe the root cause and the specific resolution applied (e.g. Cleared Redis webhook queue, refreshed auth tokens)..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
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
              className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
            >
              {isLoading ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
