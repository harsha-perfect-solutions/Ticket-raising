import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Building,
  BookOpen,
  FileText,
  Clock,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Ticket } from '../../types';
import api from '../../services/api';
import { PhoneLink, EmailLink } from '../common/ContactActions';

interface SplitScreenWorkbenchProps {
  ticket: Ticket;
}

export const SplitScreenWorkbench: React.FC<SplitScreenWorkbenchProps> = ({ ticket }) => {
  const [customerTickets, setCustomerTickets] = useState<Ticket[]>([]);
  const [kbArticles, setKbArticles] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (ticket.customerId) {
      loadCustomerHistory();
    }
    loadRelatedKb();
  }, [ticket]);

  const loadCustomerHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.get(`/tickets?search=${encodeURIComponent(ticket.customer?.phone || ticket.customer?.name || '')}`);
      if (res.data.success) {
        setCustomerTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load customer ticket history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadRelatedKb = async () => {
    try {
      const res = await api.get(`/kb/search?q=${encodeURIComponent(ticket.subject)}`);
      if (res.data.success) {
        setKbArticles(res.data.articles || []);
      }
    } catch (err) {
      console.error('Failed to load KB solutions:', err);
    }
  };

  return (
    <div className="h-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-5 overflow-y-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Side-by-Side Reference Panel</h4>
            <p className="text-[10px] text-slate-500">Customer history & matching KB articles</p>
          </div>
        </div>
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          Dual Workbench
        </span>
      </div>

      {/* Customer Profile Dossier */}
      {ticket.customer && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs">
                {ticket.customer.name.charAt(0)}
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">{ticket.customer.name}</h5>
                <span className="text-[10px] text-slate-500">{ticket.customer.company || 'Individual Requester'}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              Verified
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <PhoneLink phone={ticket.customer.phone} className="font-bold text-slate-900 dark:text-slate-200 text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <EmailLink email={ticket.customer.email} className="text-slate-700 dark:text-slate-300 text-xs" />
            </div>
          </div>
        </div>
      )}

      {/* Customer Ticket History List */}
      <div className="space-y-2">
        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
          <span>Customer Past Tickets ({customerTickets.length})</span>
          <span className="text-[10px] font-normal text-slate-400">Recent requests</span>
        </h5>

        {isLoadingHistory ? (
          <p className="py-4 text-center text-xs text-slate-400">Loading history...</p>
        ) : customerTickets.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {customerTickets.slice(0, 5).map((t) => (
              <a
                key={t.id}
                href={`/agent/tickets/${t.id}`}
                className="block rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">#{t.ticketNumber}</span>
                  <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {t.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-800 dark:text-slate-200 truncate">{t.subject}</p>
              </a>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-slate-400">No previous tickets logged.</p>
        )}
      </div>

      {/* Related Knowledge Base Articles */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
          <span>Suggested KB Solutions</span>
        </h5>

        {kbArticles.length > 0 ? (
          <div className="space-y-2">
            {kbArticles.slice(0, 3).map((art) => (
              <div key={art.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-950/40 text-xs space-y-1">
                <h6 className="font-bold text-slate-900 dark:text-white">{art.title}</h6>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{art.summary}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-slate-400">No matching KB solutions found.</p>
        )}
      </div>
    </div>
  );
};
