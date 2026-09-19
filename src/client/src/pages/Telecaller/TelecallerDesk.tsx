import React, { useState, useEffect } from 'react';
import { customerApi, ticketApi } from '../../services/api';
import { Customer, Ticket } from '../../types';
import {
  PhoneCall,
  Search,
  UserPlus,
  Ticket as TicketIcon,
  Building,
  Mail,
  Phone,
  MapPin,
  History,
  PlusCircle,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { SlaCountdownBadge } from '../../components/common/SlaCountdownBadge';
import { NewCustomerModal } from '../../components/modals/NewCustomerModal';
import { NewTicketModal } from '../../components/modals/NewTicketModal';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { useNavigate } from 'react-router-dom';
import { PhoneLink, EmailLink, LocationLink } from '../../components/common/ContactActions';
import { useAuth } from '../../context/AuthContext';

import { WebRTCSoftphone } from '../../components/telecaller/WebRTCSoftphone';
import { CallTranscriber } from '../../components/telecaller/CallTranscriber';
import { RapidGridLoggingModal } from '../../components/telecaller/RapidGridLoggingModal';
import { Layers } from 'lucide-react';

interface TelecallerDeskProps {
  onNavigate?: (page: string, ticketId?: string) => void;
}

export const TelecallerDesk: React.FC<TelecallerDeskProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rolePrefix = user?.role ? user.role.toLowerCase() : 'telecaller';

  const handleOpenTicket = (ticketId: string) => {
    if (onNavigate) {
      onNavigate('ticket-details', ticketId);
    } else {
      navigate(`/${rolePrefix}/tickets/${ticketId}`);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDetails, setCustomerDetails] = useState<{ customer: Customer; stats: any } | null>(null);
  const [myLoggedTickets, setMyLoggedTickets] = useState<Ticket[]>([]);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showRapidGridModal, setShowRapidGridModal] = useState(false);

  useEffect(() => {
    loadMyLoggedTickets();
    handleSearch('');
  }, []);

  const loadMyLoggedTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await ticketApi.list({ scope: 'created_by_me', limit: 10 });
      if (res.data.success) {
        setMyLoggedTickets(res.data.tickets);
      }
    } catch (err) {
      console.error('Failed to load telecaller tickets', err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      const res = await customerApi.search(query);
      if (res.data.success) {
        setSearchResults(res.data.customers);
        if (!selectedCustomer && res.data.customers.length > 0) {
          selectCustomer(res.data.customers[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectCustomer = async (cust: Customer) => {
    setSelectedCustomer(cust);
    setIsLoadingCustomer(true);
    try {
      const res = await customerApi.getById(cust.id);
      if (res.data.success) {
        setCustomerDetails(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Rapid Telecaller Desk' }]} />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-sm">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Telecaller Rapid Service Desk</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Inbound & Outbound
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant customer lookup by phone, call verification, and direct ticket creation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRapidGridModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Layers className="w-4 h-4" />
            <span>⚡ Rapid Grid Logging</span>
          </button>
          <button
            onClick={() => setShowNewCustomerModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>+ Register Caller</span>
          </button>
          <button
            onClick={() => setShowNewTicketModal(true)}
            disabled={!selectedCustomer}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Call & Raise Ticket</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Customer Search & Profile (Left) + Caller Past Tickets (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Fast Customer Lookup & Selected Profile (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Customer Search Box */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-800">Instant Customer Verification</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search 10-digit phone, email, or name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Quick Customer Results List */}
            <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-100">
              {searchResults.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                return (
                  <div
                    key={cust.id}
                    onClick={() => selectCustomer(cust)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-200 text-blue-800'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{cust.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{cust.phone}</span> • <span>{cust.company || 'Individual'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                      {cust._count?.tickets || 0} tickets
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Call Speech Transcriber */}
          <CallTranscriber />

          {/* Selected Customer Profile Dossier */}
          {selectedCustomer && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#2563eb] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedCustomer.name}</h3>
                    <span className="text-[11px] text-slate-500">Verified Customer Profile</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewTicketModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all"
                >
                  + New Ticket
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <PhoneLink
                    phone={selectedCustomer.phone}
                    className="font-bold text-slate-900 hover:text-blue-600 text-xs"
                    iconClassName="w-4 h-4 text-amber-600 shrink-0"
                  />
                </div>
                <div className="flex items-center gap-2.5">
                  <EmailLink
                    email={selectedCustomer.email}
                    className="text-slate-700 hover:text-blue-600 text-xs"
                    iconClassName="w-4 h-4 text-blue-600 shrink-0"
                  />
                </div>
                {selectedCustomer.company && (
                  <div className="flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{selectedCustomer.company}</span>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex items-center gap-2.5">
                    <LocationLink
                      location={selectedCustomer.address}
                      className="text-slate-700 hover:text-blue-600 text-xs"
                      iconClassName="w-4 h-4 text-rose-600 shrink-0"
                    />
                  </div>
                )}
                {selectedCustomer.notes && (
                  <div className="p-3 rounded-xl bg-[#f8fafc] border border-slate-200 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-800 block mb-0.5">Account Notes:</span>
                    {selectedCustomer.notes}
                  </div>
                )}
              </div>

              {/* Customer Lifetime Ticket Stats */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="text-lg font-bold text-slate-800">
                    {customerDetails?.stats?.totalTickets || 0}
                  </div>
                  <div className="text-[10px] text-slate-500">Total Tickets</div>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60">
                  <div className="text-lg font-bold text-amber-700">
                    {customerDetails?.stats?.openTickets || 0}
                  </div>
                  <div className="text-[10px] text-amber-700">Open Issues</div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/60">
                  <div className="text-lg font-bold text-emerald-700">
                    {customerDetails?.stats?.resolvedTickets || 0}
                  </div>
                  <div className="text-[10px] text-emerald-700">Resolved</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Customer Ticket History + Telecaller's Logged Tickets (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Past Ticket History */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                {selectedCustomer ? `${selectedCustomer.name}'s Ticket History` : 'Customer Ticket History'}
              </h3>
              <span className="text-xs text-slate-500">
                {customerDetails?.customer.tickets?.length || 0} recorded
              </span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {!selectedCustomer ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Select a customer on the left to review their complete ticket history
                </div>
              ) : customerDetails?.customer.tickets?.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No previous tickets found for this caller
                </div>
              ) : (
                customerDetails?.customer.tickets?.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => handleOpenTicket(ticket.id)}
                    className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200/80 hover:border-blue-400 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-blue-600 text-xs">{ticket.ticketNumber}</span>
                          <PriorityBadge priority={ticket.priority} size="sm" />
                          <StatusBadge status={ticket.status} size="sm" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1.5 group-hover:text-blue-600 transition-colors">
                          {ticket.subject}
                        </h4>
                      </div>
                      <SlaCountdownBadge
                        resolutionDueAt={ticket.resolutionDueAt}
                        slaStatus={ticket.slaStatus}
                        ticketStatus={ticket.status}
                        compact
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Dept: {ticket.department?.name || 'Technical Support'}</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Telecaller's Recently Logged Queue */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-amber-600" />
                Tickets You Recently Logged
              </h3>
              <button
                onClick={() => onNavigate ? onNavigate('tickets') : navigate(`/${rolePrefix}/tickets`)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                View Full Queue →
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {myLoggedTickets.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  You have not raised any tickets in this session yet.
                </div>
              ) : (
                myLoggedTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleOpenTicket(t.id)}
                    className="p-3 rounded-xl bg-[#f8fafc] border border-slate-200/80 hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">{t.ticketNumber}</span>
                        <span className="text-slate-800 font-semibold">{t.customer?.name}</span>
                        <StatusBadge status={t.status} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{t.subject}</p>
                    </div>
                    <SlaCountdownBadge
                      resolutionDueAt={t.resolutionDueAt}
                      slaStatus={t.slaStatus}
                      ticketStatus={t.status}
                      compact
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNewCustomerModal && (
        <NewCustomerModal
          isOpen={showNewCustomerModal}
          onClose={() => setShowNewCustomerModal(false)}
          onCustomerCreated={(newCust) => {
            setSelectedCustomer(newCust);
            selectCustomer(newCust);
            setShowNewCustomerModal(false);
          }}
          initialPhone={searchQuery}
        />
      )}

      {showNewTicketModal && (
        <NewTicketModal
          isOpen={showNewTicketModal}
          onClose={() => setShowNewTicketModal(false)}
          onTicketCreated={(newId) => {
            loadMyLoggedTickets();
            if (selectedCustomer) selectCustomer(selectedCustomer);
            handleOpenTicket(newId);
          }}
          preSelectedCustomer={selectedCustomer}
        />
      )}

      {showRapidGridModal && (
        <RapidGridLoggingModal
          isOpen={showRapidGridModal}
          onClose={() => setShowRapidGridModal(false)}
          onBatchCompleted={() => {
            loadMyLoggedTickets();
            setShowRapidGridModal(false);
          }}
        />
      )}

      {/* Floating WebRTC CTI Softphone */}
      <WebRTCSoftphone
        onCustomerSelected={(phone) => {
          handleSearch(phone);
        }}
        onCallStarted={(phone) => {
          handleSearch(phone);
        }}
      />
    </div>
  );
};
