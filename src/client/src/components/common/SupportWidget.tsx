import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Search,
  BookOpen,
  Send,
  Sparkles,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  FileText,
  HelpCircle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface KBArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
}

export const SupportWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'track' | 'create'>('search');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Track Ticket State
  const [trackNumber, setTrackNumber] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<any | null>(null);
  const [isTrackLoading, setIsTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  // Quick Ticket Form State
  const [quickSubject, setQuickSubject] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Auto-search KB articles when typing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setArticles([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/kb/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.data.success) {
          setArticles(res.data.articles || []);
        }
      } catch (err) {
        console.error('Widget KB search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTrackTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackNumber.trim()) return;

    setIsTrackLoading(true);
    setTrackError('');
    setTrackedTicket(null);

    try {
      const res = await api.get(`/tickets?search=${encodeURIComponent(trackNumber.trim())}`);
      const found = res.data.tickets?.find(
        (t: any) => t.ticketNumber.toLowerCase() === trackNumber.trim().toLowerCase()
      ) || res.data.tickets?.[0];

      if (found) {
        setTrackedTicket(found);
      } else {
        setTrackError('No ticket found with that reference number.');
      }
    } catch (err: any) {
      setTrackError('Unable to fetch ticket details.');
    } finally {
      setIsTrackLoading(false);
    }
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSubject.trim() || !quickDescription.trim()) return;

    setIsCreating(true);
    setCreateSuccess(null);

    try {
      // Get categories to grab first valid categoryId
      const catRes = await api.get('/admin/categories');
      const firstCatId = catRes.data.categories?.[0]?.id || '';

      const res = await api.post('/tickets', {
        subject: quickSubject,
        description: quickDescription,
        categoryId: firstCatId,
        priority: 'MEDIUM',
        source: 'CUSTOMER_PORTAL',
      });

      if (res.data.success) {
        setCreateSuccess(res.data.ticket.ticketNumber);
        setQuickSubject('');
        setQuickDescription('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit quick request.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Widget Toggle Launcher */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl hover:scale-105 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition-all duration-300"
          aria-label="Open Quick Support Launcher"
        >
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
          </span>
          <MessageSquare className="h-6 w-6 transition-transform group-hover:rotate-12" />
        </button>
      )}

      {/* Expanded Widget Container */}
      {isOpen && (
        <div className="flex flex-col w-96 max-w-[calc(100vw-2rem)] h-[520px] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scaleUp">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">ResolveHub Assistant</h3>
                <p className="text-[11px] text-indigo-100 opacity-90">powered by HPS(OPC) Pvt. Ltd.</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="Close widget"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-1">
            <button
              onClick={() => { setActiveTab('search'); setSelectedArticle(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                activeTab === 'search'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              Search KB
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                activeTab === 'track'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Track Status
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              Quick Help
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* TAB 1: Search KB */}
            {activeTab === 'search' && (
              <div className="space-y-4">
                {selectedArticle ? (
                  <div className="space-y-3 animate-fadeIn">
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      ← Back to results
                    </button>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedArticle.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {selectedArticle.content}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for answers (e.g. VPN, Password)..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      />
                    </div>

                    {isSearching ? (
                      <p className="py-6 text-center text-xs text-slate-400">Searching Knowledge Base...</p>
                    ) : articles.length > 0 ? (
                      <div className="space-y-2">
                        {articles.map((art) => (
                          <div
                            key={art.id}
                            onClick={() => setSelectedArticle(art)}
                            className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold text-slate-900 dark:text-white">
                                {art.title}
                              </h5>
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                              {art.summary}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : searchQuery ? (
                      <div className="py-8 text-center">
                        <HelpCircle className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No articles matched your search.</p>
                        <button
                          onClick={() => setActiveTab('create')}
                          className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          Submit a ticket instead →
                        </button>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400">
                        <BookOpen className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-xs">Type a keyword above to find instant answers.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB 2: Track Ticket */}
            {activeTab === 'track' && (
              <div className="space-y-4">
                <form onSubmit={handleTrackTicket} className="space-y-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Ticket Reference #</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={trackNumber}
                      onChange={(e) => setTrackNumber(e.target.value)}
                      placeholder="e.g. TCK-2026-1001"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono uppercase text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={isTrackLoading}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Track
                    </button>
                  </div>
                </form>

                {isTrackLoading && (
                  <p className="py-6 text-center text-xs text-slate-400">Searching ticket system...</p>
                )}

                {trackError && (
                  <p className="rounded-xl bg-red-50 p-3 text-center text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
                    {trackError}
                  </p>
                )}

                {trackedTicket && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 bg-slate-50 dark:bg-slate-950/50">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        #{trackedTicket.ticketNumber}
                      </span>
                      <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 uppercase">
                        {trackedTicket.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h5 className="text-xs font-semibold text-slate-900 dark:text-white">
                      {trackedTicket.subject}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {trackedTicket.description}
                    </p>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                      <span>Priority: {trackedTicket.priority}</span>
                      <a
                        href={`/customer/tickets/${trackedTicket.id}`}
                        className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        View Full Thread <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Quick Contact */}
            {activeTab === 'create' && (
              <div className="space-y-4">
                {createSuccess ? (
                  <div className="py-8 text-center space-y-3">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 animate-bounce" />
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Ticket Created!</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Reference: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">#{createSuccess}</span>
                    </p>
                    <button
                      onClick={() => setCreateSuccess(null)}
                      className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Submit another query
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleQuickCreate} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Subject</label>
                      <input
                        type="text"
                        required
                        value={quickSubject}
                        onChange={(e) => setQuickSubject(e.target.value)}
                        placeholder="Brief summary of your issue..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Description</label>
                      <textarea
                        required
                        rows={4}
                        value={quickDescription}
                        onChange={(e) => setQuickDescription(e.target.value)}
                        placeholder="Provide details so our team can assist..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-xs font-bold text-white shadow-md hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
                    >
                      {isCreating ? 'Submitting...' : 'Submit Support Ticket'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Footer Branding */}
          <div className="py-2 px-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center text-[10px] text-slate-400 select-none">
            ResolveHub &bull; powered by <span className="font-semibold text-slate-600 dark:text-slate-300">HPS(OPC) Pvt. Ltd.</span>
          </div>
        </div>
      )}
    </div>
  );
};
