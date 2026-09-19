import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, Sparkles, AlertCircle, Layers } from 'lucide-react';
import api from '../../services/api';

interface GridRow {
  id: string;
  phone: string;
  callerName: string;
  categoryId: string;
  subject: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notes: string;
  status: 'IDLE' | 'SAVING' | 'SAVED' | 'ERROR';
  error?: string;
}

interface RapidGridLoggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchCompleted?: () => void;
}

export const RapidGridLoggingModal: React.FC<RapidGridLoggingModalProps> = ({
  isOpen,
  onClose,
  onBatchCompleted,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [rows, setRows] = useState<GridRow[]>([
    {
      id: 'row-1',
      phone: '9876543210',
      callerName: 'Priya Sharma',
      categoryId: '',
      subject: 'Password reset request',
      priority: 'MEDIUM',
      notes: 'Caller requested corporate portal password reset',
      status: 'IDLE',
    },
    {
      id: 'row-2',
      phone: '9123456789',
      callerName: 'Amit Verma',
      categoryId: '',
      subject: 'VPN disconnect issue',
      priority: 'HIGH',
      notes: 'Frequent remote disconnects during peak hours',
      status: 'IDLE',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSummary, setSubmitSummary] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      if (res.data.success && res.data.categories?.length > 0) {
        const cats = res.data.categories;
        setCategories(cats);
        // Default unassigned rows to first category
        setRows((prev) =>
          prev.map((r) => (r.categoryId ? r : { ...r, categoryId: cats[0].id }))
        );
      }
    } catch (err) {
      console.error('Failed to load categories for grid', err);
    }
  };

  if (!isOpen) return null;

  const handleAddRow = () => {
    const newRow: GridRow = {
      id: `row-${Date.now()}-${Math.random()}`,
      phone: '',
      callerName: '',
      categoryId: categories[0]?.id || '',
      subject: '',
      priority: 'MEDIUM',
      notes: '',
      status: 'IDLE',
    };
    setRows([...rows, newRow]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof GridRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value, status: 'IDLE', error: undefined } : r))
    );
  };

  const handleBatchSubmit = async () => {
    // Validate rows
    const validatedRows = rows.map((r) => {
      if (!r.phone || !/^[0-9]{10}$/.test(r.phone.trim())) {
        return { ...r, status: 'ERROR' as const, error: '10-digit phone required' };
      }
      if (!r.subject || r.subject.trim().length < 4) {
        return { ...r, status: 'ERROR' as const, error: 'Valid subject required' };
      }
      return r;
    });

    setRows(validatedRows);

    if (validatedRows.some((r) => r.status === 'ERROR')) {
      return;
    }

    setIsSubmitting(true);
    setSubmitSummary(null);
    let successCount = 0;

    for (const r of validatedRows) {
      try {
        setRows((prev) =>
          prev.map((item) => (item.id === r.id ? { ...item, status: 'SAVING' } : item))
        );

        // First find or create customer
        const custRes = await api.get(`/customers/search?query=${encodeURIComponent(r.phone.trim())}`);
        let customerId = custRes.data.customers?.[0]?.id;

        if (!customerId) {
          const createCust = await api.post('/customers', {
            name: r.callerName.trim() || `Caller ${r.phone}`,
            phone: r.phone.trim(),
            email: `caller.${r.phone}@customer.supportpro.com`,
          });
          customerId = createCust.data.customer.id;
        }

        // Create ticket
        await api.post('/tickets', {
          customerId,
          categoryId: r.categoryId || categories[0]?.id,
          subject: r.subject.trim(),
          description: r.notes.trim() || r.subject.trim(),
          priority: r.priority,
          source: 'TELECALLER',
        });

        successCount++;
        setRows((prev) =>
          prev.map((item) => (item.id === r.id ? { ...item, status: 'SAVED' } : item))
        );
      } catch (err: any) {
        setRows((prev) =>
          prev.map((item) =>
            item.id === r.id
              ? { ...item, status: 'ERROR', error: err.response?.data?.message || 'Save failed' }
              : item
          )
        );
      }
    }

    setIsSubmitting(false);
    setSubmitSummary(`Successfully batch-logged ${successCount} of ${rows.length} call tickets!`);
    if (onBatchCompleted) onBatchCompleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-5xl h-[620px] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Rapid Grid Ticket Logging</h3>
              <p className="text-xs text-slate-400">High-velocity spreadsheet entry for bulk call center queries</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Banner */}
        {submitSummary && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3 text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {submitSummary}
          </div>
        )}

        {/* Grid Table Container */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-2 w-10">#</th>
                <th className="py-2.5 px-2 w-36">Mobile (10 Digits)</th>
                <th className="py-2.5 px-2 w-36">Caller Name</th>
                <th className="py-2.5 px-2 w-44">Category</th>
                <th className="py-2.5 px-2">Issue Subject</th>
                <th className="py-2.5 px-2 w-28">Priority</th>
                <th className="py-2.5 px-2 w-48">Notes</th>
                <th className="py-2.5 px-2 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2 px-2 text-slate-400 font-mono font-bold">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={row.phone}
                      onChange={(e) =>
                        handleUpdateRow(row.id, 'phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))
                      }
                      placeholder="10-digit number"
                      className={`w-full rounded-lg border px-2.5 py-1.5 font-mono text-xs focus:outline-none ${
                        row.error && !/^[0-9]{10}$/.test(row.phone)
                          ? 'border-rose-500 bg-rose-50 text-rose-900'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white'
                      }`}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={row.callerName}
                      onChange={(e) => handleUpdateRow(row.id, 'callerName', e.target.value)}
                      placeholder="Caller name"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <select
                      value={row.categoryId}
                      onChange={(e) => handleUpdateRow(row.id, 'categoryId', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-2 py-1.5 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={row.subject}
                      onChange={(e) => handleUpdateRow(row.id, 'subject', e.target.value)}
                      placeholder="Brief issue subject..."
                      className={`w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none ${
                        row.error && !row.subject
                          ? 'border-rose-500 bg-rose-50 text-rose-900'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white'
                      }`}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <select
                      value={row.priority}
                      onChange={(e) => handleUpdateRow(row.id, 'priority', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-2 py-1.5 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={row.notes}
                      onChange={(e) => handleUpdateRow(row.id, 'notes', e.target.value)}
                      placeholder="Quick notes..."
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    {row.status === 'SAVED' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                    ) : row.status === 'SAVING' ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={rows.length === 1}
                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/60">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Plus className="h-4 w-4 text-indigo-600" /> Add Row
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-400"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleBatchSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2 text-xs font-bold text-white shadow-md hover:from-amber-600 hover:to-orange-700 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {isSubmitting ? 'Submitting Batch...' : `Submit All Batch Tickets (${rows.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
