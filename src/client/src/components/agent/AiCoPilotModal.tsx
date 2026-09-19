import React, { useState } from 'react';
import { Sparkles, X, Check, Copy, FileText, Zap, ShieldCheck } from 'lucide-react';
import { Ticket } from '../../types';

interface AiCoPilotModalProps {
  isOpen: boolean;
  ticket: Ticket;
  onClose: () => void;
  onApplyResponse: (responseText: string) => void;
}

export const AiCoPilotModal: React.FC<AiCoPilotModalProps> = ({
  isOpen,
  ticket,
  onClose,
  onApplyResponse,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categoryName = ticket.category?.name || 'General Support';
  const customerName = ticket.customer?.name || 'Customer';

  const aiTemplates = [
    {
      id: 'tmpl-diag',
      title: '🛠️ Diagnostic & Troubleshooting Steps',
      badge: 'Recommended',
      content: `Hello ${customerName},\n\nThank you for reaching out regarding "${ticket.subject}". To help us diagnose and resolve this issue swiftly, please perform the following initial steps:\n\n1. Verify network connectivity and test logging into the service portal.\n2. Clear browser cache/cookies or test in Incognito mode.\n3. If an error screen appears, note the exact error code or timestamp.\n\nPlease reply with your results so we can proceed with targeted assistance.`,
    },
    {
      id: 'tmpl-info',
      title: '🔍 Request Logs & Error Screenshots',
      badge: 'Information',
      content: `Hello ${customerName},\n\nWe are investigating your request for "${ticket.subject}". Could you please attach the following details to this thread?\n\n• Screenshot of the error code or message\n• Device Model & Operating System (e.g. Windows 11, macOS)\n• Approximate time the issue occurred\n\nOnce attached, our support specialists will analyze the diagnostics immediately.`,
    },
    {
      id: 'tmpl-[#resolve]',
      title: '🎯 Resolution Verification & Sign-Off',
      badge: 'Resolution',
      content: `Hello ${customerName},\n\nWe have applied a fix for your ticket regarding "${ticket.subject}".\n\nResolution Details: Configuration updated and service verified against standard SLA operating procedures.\n\nPlease test on your end and let us know if everything is working as expected. If all is resolved, no further action is needed. Thank you for choosing ResolveHub powered by HPS(OPC) Pvt. Ltd.!`,
    },
    {
      id: 'tmpl-esc',
      title: '⚡ Level-2 Escalation Handover Note',
      badge: 'Internal Note',
      content: `[L2 ESCALATION HANDOVER]\n\n• Ticket ID: #${ticket.ticketNumber}\n• Issue Summary: ${ticket.subject}\n• Category: ${categoryName} (${ticket.priority} Priority)\n• L1 Diagnostic Performed: Basic account verification completed. Issue escalated to Level-2 Engineering for backend log inspection.`,
    },
  ];

  const handleSelectTemplate = (text: string, id: string) => {
    onApplyResponse(text);
    setCopiedId(id);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">AI Co-Pilot & Smart Canned Replies</h3>
              <p className="text-xs text-indigo-100">Contextual response drafts for Ticket #{ticket.ticketNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[480px]">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select a smart AI resolution draft below to auto-populate your reply text box:
          </p>

          <div className="space-y-3">
            {aiTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl.content, tmpl.id)}
                className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-2">
                    {tmpl.title}
                  </h4>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {tmpl.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono whitespace-pre-line line-clamp-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  {tmpl.content}
                </p>
                <div className="flex justify-end pt-1">
                  <span className="text-xs font-bold text-indigo-600 group-hover:underline flex items-center gap-1">
                    {copiedId === tmpl.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
                    Apply Draft to Response →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
