import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ticketApi, adminApi, customerApi } from '../../services/api';
import { Category, Customer, TicketPriority, TicketSource } from '../../types';
import {
  X,
  PlusCircle,
  AlertCircle,
  PhoneCall,
  Search,
  User,
  Paperclip,
} from 'lucide-react';
import { NewCustomerModal } from './NewCustomerModal';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: (ticketId: string) => void;
  preSelectedCustomer?: Customer | null;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onTicketCreated,
  preSelectedCustomer = null,
}) => {
  const { user } = useAuth();
  const isCustomer = user?.role === 'CUSTOMER';
  const isTelecaller = user?.role === 'TELECALLER';

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [callSummary, setCallSummary] = useState('');
  const [source, setSource] = useState<TicketSource>(isCustomer ? 'CUSTOMER_PORTAL' : isTelecaller ? 'TELECALLER' : 'PHONE');

  // Customer search state
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(preSelectedCustomer);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  // File upload state
  const [attachment, setAttachment] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (preSelectedCustomer) {
        setSelectedCustomer(preSelectedCustomer);
      }
    }
  }, [isOpen, preSelectedCustomer]);

  const loadCategories = async () => {
    try {
      const res = await adminApi.getCategories();
      if (res.data.success && res.data.categories.length > 0) {
        setCategories(res.data.categories);
        setSelectedCategory(res.data.categories[0].id);
        setPriority(res.data.categories[0].defaultPriority || 'MEDIUM');
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubcategory('');
    const matched = categories.find((c) => c.id === catId);
    if (matched?.defaultPriority) {
      setPriority(matched.defaultPriority);
    }
  };

  const handleCustomerSearch = async (query: string) => {
    setCustomerSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearchingCustomer(true);
    try {
      const res = await customerApi.search(query);
      if (res.data.success) {
        setSearchResults(res.data.customers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || !selectedCategory) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isCustomer && !selectedCustomer) {
      setError('Please select or register a customer for this ticket.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload: any = {
        categoryId: selectedCategory,
        subcategoryId: selectedSubcategory || undefined,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        source,
        callSummary: callSummary.trim() || undefined,
      };

      if (!isCustomer && selectedCustomer) {
        payload.customerId = selectedCustomer.id;
      }

      const res = await ticketApi.create(payload);
      if (res.data.success) {
        const newTicketId = res.data.ticket.id;

        if (attachment) {
          const formData = new FormData();
          formData.append('file', attachment);
          await ticketApi.uploadAttachment(newTicketId, formData);
        }

        onTicketCreated(newTicketId);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isCustomer ? 'Submit a Support Request' : 'Raise / Log Support Ticket'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTelecaller ? 'Log customer phone call or inquiry' : 'Instant routing to specialized support queue'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Selection (For Telecaller, Agent, Admin) */}
            {!isCustomer && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    Customer Information <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                  >
                    + Register New Customer
                  </button>
                </div>

                {selectedCustomer ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{selectedCustomer.name}</div>
                      <div className="text-slate-500">
                        {selectedCustomer.phone} • {selectedCustomer.email} • {selectedCustomer.company || 'Individual'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-slate-600 hover:text-rose-600 text-xs font-bold px-2.5 py-1 rounded bg-white border border-slate-200"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search customer by name, phone, or email..."
                      value={customerSearchQuery}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    {searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {searchResults.map((cust) => (
                          <div
                            key={cust.id}
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setSearchResults([]);
                              setCustomerSearchQuery('');
                            }}
                            className="p-2.5 text-xs hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{cust.name}</div>
                              <div className="text-slate-500 text-[11px]">
                                {cust.phone} • {cust.email}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Select</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category & Department <span className="text-rose-600">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.department?.name || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subcategory</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                >
                  <option value="">General Issue</option>
                  {currentCategoryObj?.subcategories?.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority & Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                >
                  <option value="CRITICAL">🔴 Critical (1 Hour SLA)</option>
                  <option value="HIGH">🟠 High (4 Hours SLA)</option>
                  <option value="MEDIUM">🟡 Medium (8 Hours SLA)</option>
                  <option value="LOW">🟢 Low (24 Hours SLA)</option>
                </select>
              </div>

              {!isCustomer && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ticket Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as TicketSource)}
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="TELECALLER">Telecaller Desk</option>
                    <option value="PHONE">Inbound Phone Call</option>
                    <option value="EMAIL">Customer Email</option>
                    <option value="CUSTOMER_PORTAL">Customer Portal</option>
                  </select>
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subject / Issue Title <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cannot process credit card payment for Order #4491"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Issue Description & Context <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Provide detailed information regarding the problem, error codes, and steps to reproduce..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>

            {/* Telecaller Call Summary */}
            {isTelecaller && (
              <div>
                <label className="block text-xs font-semibold text-amber-800 mb-1.5 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                  Telecaller Call Log & Verification Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Inbound call duration 3m 45s. Verified caller identity. Customer requested callback on +1 555-0199."
                  value={callSummary}
                  onChange={(e) => setCallSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-amber-500 resize-none"
                />
              </div>
            )}

            {/* File Attachment Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Attachment (Screenshots, PDFs, Documents)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 transition-colors shadow-sm">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  <span>{attachment ? attachment.name : 'Choose File (Max 15MB)'}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setAttachment(e.target.files[0]);
                    }}
                  />
                </label>
                {attachment && (
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
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
                className="px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-[#2563eb] hover:bg-[#1d4ed8] shadow-sm transition-all"
              >
                {isLoading ? 'Creating Ticket...' : 'Submit & Route Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showNewCustomerModal && (
        <NewCustomerModal
          isOpen={showNewCustomerModal}
          onClose={() => setShowNewCustomerModal(false)}
          onCustomerCreated={(newCust) => {
            setSelectedCustomer(newCust);
            setShowNewCustomerModal(false);
          }}
        />
      )}
    </>
  );
};
