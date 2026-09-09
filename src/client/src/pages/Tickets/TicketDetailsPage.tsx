import React, { useState, useEffect } from 'react';
import { ticketApi, adminApi } from '../../services/api';
import { Ticket, User, TicketStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  MessageSquare,
  Lock,
  Clock,
  ScrollText,
  AlertTriangle,
  CheckCircle2,
  Paperclip,
  Send,
  Building,
  Phone,
  Mail,
  MapPin,
  Download,
  Star,
  PhoneCall,
  RotateCcw,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { SlaCountdownBadge } from '../../components/common/SlaCountdownBadge';
import { ResolveTicketModal } from '../../components/modals/ResolveTicketModal';
import { EscalateModal } from '../../components/modals/EscalateModal';
import { CustomerFeedbackModal } from '../../components/modals/CustomerFeedbackModal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

interface TicketDetailsPageProps {
  ticketId: string;
  onNavigate: (page: string, ticketId?: string) => void;
}

export const TicketDetailsPage: React.FC<TicketDetailsPageProps> = ({ ticketId, onNavigate }) => {
  const { user } = useAuth();
  const isCustomer = user?.role === 'CUSTOMER';
  const isStaff = ['ADMIN', 'MANAGER', 'AGENT', 'TELECALLER'].includes(user?.role || '');

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'conversation' | 'internalNotes' | 'slaTimeline' | 'auditTrail'>(
    'conversation'
  );

  // Message & Note Input states
  const [replyMessage, setReplyMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSendingNote, setIsSendingNote] = useState(false);

  // Modals state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);
  const [showReopenConfirmModal, setShowReopenConfirmModal] = useState(false);

  // Attachment upload state
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  useEffect(() => {
    loadTicket();
    if (isStaff) {
      loadAgents();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    setIsLoading(true);
    try {
      const res = await ticketApi.getById(ticketId);
      if (res.data.success) {
        setTicket(res.data.ticket);
      }
    } catch (err) {
      console.error('Failed to load ticket details', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const res = await adminApi.getUsers({ role: 'AGENT' });
      if (res.data.success) {
        setAgents(res.data.users);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() && !attachmentFile) return;

    setIsSendingMessage(true);
    try {
      if (replyMessage.trim()) {
        await ticketApi.addMessage(ticketId, replyMessage.trim());
      }
      if (attachmentFile) {
        const formData = new FormData();
        formData.append('file', attachmentFile);
        await ticketApi.uploadAttachment(ticketId, formData);
        setAttachmentFile(null);
      }
      setReplyMessage('');
      await loadTicket();
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSendInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNote.trim()) return;

    setIsSendingNote(true);
    try {
      await ticketApi.addInternalNote(ticketId, internalNote.trim());
      setInternalNote('');
      await loadTicket();
    } catch (err) {
      console.error('Failed to add internal note', err);
    } finally {
      setIsSendingNote(false);
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    try {
      await ticketApi.assign(ticketId, {
        assignedAgentId: agentId || null,
        reason: 'Reassigned via ticket details workbench',
      });
      await loadTicket();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (newStatus === 'RESOLVED') {
      setShowResolveModal(true);
      return;
    }
    if (newStatus === 'CLOSED') {
      setShowCloseConfirmModal(true);
      return;
    }
    if (newStatus === 'REOPENED') {
      setShowReopenConfirmModal(true);
      return;
    }
    if (newStatus === 'ESCALATED') {
      setShowEscalateModal(true);
      return;
    }

    try {
      await ticketApi.updateStatus(ticketId, { status: newStatus });
      await loadTicket();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmClose = async () => {
    try {
      await ticketApi.updateStatus(ticketId, { status: 'CLOSED', reason: 'Customer or Agent confirmed closure' });
      setShowCloseConfirmModal(false);
      await loadTicket();
      if (isCustomer) {
        setShowFeedbackModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmReopen = async () => {
    try {
      await ticketApi.updateStatus(ticketId, { status: 'REOPENED', reason: 'Customer requested reinvestigation' });
      setShowReopenConfirmModal(false);
      await loadTicket();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Loading ticket dossier & conversation...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p>Ticket not found or access denied.</p>
        <button
          onClick={() => onNavigate('tickets')}
          className="mt-3 px-4 py-2 bg-[#2563eb] text-white rounded-xl text-xs font-bold"
        >
          Back to Tickets Queue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb & Quick Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('tickets')}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors shadow-sm"
            title="Back to List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-lg font-black text-blue-600 tracking-tight">{ticket.ticketNumber}</span>
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
              {ticket.escalationLevel > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5" /> Tier {ticket.escalationLevel} Escalation
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-slate-900 mt-1">{ticket.subject}</h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <SlaCountdownBadge
            resolutionDueAt={ticket.resolutionDueAt}
            slaStatus={ticket.slaStatus}
            ticketStatus={ticket.status}
            resolvedAt={ticket.resolvedAt}
          />

          {/* Quick Staff Transition Actions */}
          {isStaff && !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(ticket.status) && (
            <>
              {ticket.status === 'NEW' && (
                <button
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-sm"
                >
                  Start Work
                </button>
              )}

              {ticket.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleStatusChange('WAITING_FOR_CUSTOMER')}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-all"
                >
                  Waiting on Customer
                </button>
              )}

              <button
                onClick={() => setShowEscalateModal(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all"
              >
                Escalate
              </button>

              <button
                onClick={() => setShowResolveModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Resolve Ticket</span>
              </button>
            </>
          )}

          {/* Customer / Resolved Actions */}
          {ticket.status === 'RESOLVED' && (
            <>
              <button
                onClick={() => setShowCloseConfirmModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Confirm & Close
              </button>

              <button
                onClick={() => setShowReopenConfirmModal(true)}
                className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 text-xs font-bold transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen ({ticket.reopenCount})</span>
              </button>
            </>
          )}

          {/* Customer Feedback Prompt */}
          {['RESOLVED', 'CLOSED'].includes(ticket.status) && isCustomer && (
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1"
            >
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{ticket.feedback ? 'Update Review' : 'Rate Support'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Column Dossier (4 cols) & Right Column Tabs/Thread (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dossier & Metadata (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Customer Profile Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Dossier</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                Source: {ticket.source}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2563eb] text-white font-bold flex items-center justify-center text-base shadow-sm">
                {ticket.customer?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{ticket.customer?.name}</h3>
                <p className="text-xs text-slate-500">{ticket.customer?.company || 'Direct Customer'}</p>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-bold text-slate-900">{ticket.customer?.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{ticket.customer?.email}</span>
              </div>
              {ticket.customer?.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{ticket.customer?.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Metadata & Assignment Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3 text-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block pb-2 border-b border-slate-100">
              Routing & Assignment
            </span>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-bold text-slate-800">{ticket.department?.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-slate-800">{ticket.category?.name}</span>
              </div>

              {ticket.subcategory && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Subcategory:</span>
                  <span className="font-bold text-slate-800">{ticket.subcategory?.name}</span>
                </div>
              )}

              {/* Assigned Agent Selector */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-slate-500 mb-1.5 font-semibold">Assigned Support Agent:</label>
                {isStaff ? (
                  <select
                    value={ticket.assignedAgentId || ''}
                    onChange={(e) => handleAssignAgent(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="">-- Unassigned (Department Queue) --</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.fullName} ({agent.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-bold text-slate-800">
                    {ticket.assignedAgent?.fullName || 'Assigned to Support Team'}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Created At:</span>
                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Telecaller Call Summary (If logged by Telecaller) */}
          {ticket.callSummary && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <PhoneCall className="w-4 h-4 text-amber-600" />
                <span>Telecaller Call Log & Verification</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{ticket.callSummary}</p>
            </div>
          )}

          {/* Resolution Details Box (If Resolved or Closed) */}
          {ticket.resolutionNotes && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Resolution Details</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{ticket.resolutionNotes}</p>
              {ticket.resolvedAt && (
                <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                  Resolved on {new Date(ticket.resolvedAt).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* Customer Feedback Card (If exists) */}
          {ticket.feedback && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  Customer CSAT Review
                </span>
                <span className="text-xs font-extrabold text-amber-700">{ticket.feedback.rating} / 5 Stars</span>
              </div>
              {ticket.feedback.feedbackText && (
                <p className="text-xs text-slate-700 italic">"{ticket.feedback.feedbackText}"</p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Tabbed Workbench & Conversation Thread (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          {/* Tabs Navigation Bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('conversation')}
              className={`py-3.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'conversation'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Customer Conversation ({ticket.messages?.length || 0})</span>
            </button>

            {/* Internal notes tab strictly hidden from customer */}
            {isStaff && (
              <button
                onClick={() => setActiveTab('internalNotes')}
                className={`py-3.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === 'internalNotes'
                    ? 'border-amber-500 text-amber-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Internal Staff Notes ({ticket.internalNotes?.length || 0})</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('slaTimeline')}
              className={`py-3.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'slaTimeline'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>SLA & Escalation History</span>
            </button>

            {isStaff && (
              <button
                onClick={() => setActiveTab('auditTrail')}
                className={`py-3.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === 'auditTrail'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ScrollText className="w-4 h-4" />
                <span>Audit Activity Trail</span>
              </button>
            )}
          </div>

          {/* TAB 1: Customer Conversation Thread */}
          {activeTab === 'conversation' && (
            <div className="flex-1 flex flex-col justify-between p-5 space-y-4">
              {/* Message List */}
              <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
                {ticket.messages?.map((msg) => {
                  const isSenderMe = msg.senderId === user?.id;
                  const isAgent = ['AGENT', 'MANAGER', 'ADMIN'].includes(msg.senderType);

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 text-xs ${isSenderMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 space-y-2 shadow-sm ${
                          isSenderMe
                            ? 'bg-[#2563eb] text-white rounded-br-none'
                            : isAgent
                            ? 'bg-blue-50/70 text-slate-800 border border-blue-200 rounded-bl-none'
                            : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[11px] opacity-80 pb-1 border-b border-black/10">
                          <span className="font-bold">{msg.sender?.fullName || 'Support Desk'}</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                        {/* Attachments preview */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="pt-2 space-y-1">
                            {msg.attachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.filePath}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/10 hover:bg-black/20 text-xs font-semibold text-slate-900 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                <span>{att.originalName} ({Math.round(att.fileSize / 1024)} KB)</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              {!['CLOSED', 'CANCELLED'].includes(ticket.status) && (
                <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="relative">
                    <textarea
                      rows={3}
                      placeholder={
                        isCustomer
                          ? 'Reply to support agent with additional details or questions...'
                          : 'Type your official customer-visible response...'
                      }
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="w-full p-3 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 transition-colors shadow-sm">
                        <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                        <span>{attachmentFile ? attachmentFile.name : 'Attach File'}</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) setAttachmentFile(e.target.files[0]);
                          }}
                        />
                      </label>
                      {attachmentFile && (
                        <button
                          type="button"
                          onClick={() => setAttachmentFile(null)}
                          className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingMessage || (!replyMessage.trim() && !attachmentFile)}
                      className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-40 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingMessage ? 'Sending...' : 'Send Message'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Internal Staff Collaboration Notes */}
          {activeTab === 'internalNotes' && isStaff && (
            <div className="flex-1 flex flex-col justify-between p-5 space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Internal Staff Collaboration:</strong> Notes added here are strictly private to internal team members and are never visible to customers.
                </span>
              </div>

              {/* Notes List */}
              <div className="space-y-3 overflow-y-auto max-h-[420px] pr-2">
                {ticket.internalNotes?.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No internal notes logged on this ticket yet.
                  </div>
                ) : (
                  ticket.internalNotes?.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200 space-y-1.5 text-xs shadow-sm"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-bold text-amber-800">
                          {n.author?.fullName} ({n.author?.role})
                        </span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{n.note}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Input */}
              <form onSubmit={handleSendInternalNote} className="pt-3 border-t border-slate-100 space-y-3">
                <textarea
                  rows={3}
                  placeholder="Type an internal note (e.g. backend diagnostic results, database logs, manager advice)..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="w-full p-3 bg-[#f8fafc] border border-amber-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSendingNote || !internalNote.trim()}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isSendingNote ? 'Saving...' : 'Add Internal Note'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: SLA & Escalation History */}
          {activeTab === 'slaTimeline' && (
            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">First Response Deadline:</span>
                  <span className="font-bold text-slate-800 ml-2">
                    {ticket.firstResponseDueAt ? new Date(ticket.firstResponseDueAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Resolution Deadline:</span>
                  <span className="font-bold text-slate-800 ml-2">
                    {ticket.resolutionDueAt ? new Date(ticket.resolutionDueAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {ticket.slaHistory?.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No SLA events logged.</div>
                ) : (
                  ticket.slaHistory?.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 rounded-xl bg-[#f8fafc] border border-slate-200 flex items-start gap-3 text-xs"
                    >
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{h.eventType.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-slate-400">{new Date(h.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">{h.details}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Audit Activity Trail */}
          {activeTab === 'auditTrail' && isStaff && (
            <div className="p-5 space-y-3 overflow-y-auto max-h-[500px]">
              {ticket.statusHistory?.map((sh) => (
                <div
                  key={sh.id}
                  className="p-3 rounded-xl bg-[#f8fafc] border border-slate-200 flex items-start justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">
                      Status changed from <span className="text-amber-700">{sh.oldStatus}</span> →{' '}
                      <span className="text-emerald-700">{sh.newStatus}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">{sh.reason}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <span className="font-bold text-slate-700">{sh.changedBy?.fullName}</span>
                    <div className="text-slate-400 text-[10px]">{new Date(sh.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Modals */}
      {showResolveModal && (
        <ResolveTicketModal
          isOpen={showResolveModal}
          ticketId={ticket.id}
          ticketNumber={ticket.ticketNumber}
          onClose={() => setShowResolveModal(false)}
          onResolved={() => loadTicket()}
        />
      )}

      {showEscalateModal && (
        <EscalateModal
          isOpen={showEscalateModal}
          ticketId={ticket.id}
          ticketNumber={ticket.ticketNumber}
          currentLevel={ticket.escalationLevel}
          onClose={() => setShowEscalateModal(false)}
          onEscalated={() => loadTicket()}
        />
      )}

      {showFeedbackModal && (
        <CustomerFeedbackModal
          isOpen={showFeedbackModal}
          ticketId={ticket.id}
          ticketNumber={ticket.ticketNumber}
          onClose={() => setShowFeedbackModal(false)}
          onFeedbackSubmitted={() => loadTicket()}
        />
      )}

      {showCloseConfirmModal && (
        <ConfirmationModal
          isOpen={showCloseConfirmModal}
          title="Confirm Ticket Closure"
          message="Are you satisfied with the resolution provided for this ticket? Closing the ticket marks it finalized."
          confirmText="Yes, Close Ticket"
          onClose={() => setShowCloseConfirmModal(false)}
          onConfirm={handleConfirmClose}
        />
      )}

      {showReopenConfirmModal && (
        <ConfirmationModal
          isOpen={showReopenConfirmModal}
          title="Reopen Support Ticket"
          message="Reopening this ticket will notify the support team that further assistance is required and return it to active investigation queue."
          confirmText="Reopen Ticket"
          isDestructive
          onClose={() => setShowReopenConfirmModal(false)}
          onConfirm={handleConfirmReopen}
        />
      )}
    </div>
  );
};
