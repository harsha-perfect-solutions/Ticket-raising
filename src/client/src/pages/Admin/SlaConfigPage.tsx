import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { SlaRule, Category, TicketPriority } from '../../types';
import { Sliders, CheckCircle2, Save, PlusCircle, Trash2, X, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export const SlaConfigPage: React.FC = () => {
  const [rules, setRules] = useState<SlaRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SlaRule>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New SLA Rule Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRuleData, setNewRuleData] = useState({
    priority: 'HIGH' as TicketPriority,
    categoryId: '',
    firstResponseMinutes: 60,
    resolutionMinutes: 240,
    warnBeforeMinutes: 30,
    autoEscalateMinutes: 60,
  });
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [isDeletingRule, setIsDeletingRule] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rulesRes, catRes] = await Promise.all([
        adminApi.getSlaRules(),
        adminApi.getCategories(),
      ]);
      if (rulesRes.data.success) setRules(rulesRes.data.rules);
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch (err) {
      console.error('Failed to load SLA rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (rule: SlaRule) => {
    setEditingRuleId(rule.id);
    setEditFormData({
      firstResponseMinutes: rule.firstResponseMinutes,
      resolutionMinutes: rule.resolutionMinutes,
      warnBeforeMinutes: rule.warnBeforeMinutes,
      autoEscalateMinutes: rule.autoEscalateMinutes,
    });
  };

  const handleSave = async (ruleId: string) => {
    try {
      const res = await adminApi.updateSlaRule(ruleId, editFormData);
      if (res.data.success) {
        showToast('SLA rule updated successfully.');
        setEditingRuleId(null);
        await loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update SLA rule');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingRule(true);
    setCreateError(null);
    try {
      const res = await adminApi.createSlaRule({
        ...newRuleData,
        categoryId: newRuleData.categoryId || undefined,
      });
      if (res.data.success) {
        showToast('SLA rule created successfully.');
        setShowCreateModal(false);
        setNewRuleData({
          priority: 'HIGH',
          categoryId: '',
          firstResponseMinutes: 60,
          resolutionMinutes: 240,
          warnBeforeMinutes: 30,
          autoEscalateMinutes: 60,
        });
        await loadData();
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create SLA rule');
    } finally {
      setIsCreatingRule(false);
    }
  };

  const confirmDeleteRule = async () => {
    if (!ruleToDelete) return;
    setIsDeletingRule(true);
    try {
      const res = await adminApi.deleteSlaRule(ruleToDelete);
      if (res.data.success) {
        showToast(res.data.message || 'SLA rule deleted.');
        await loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete SLA rule');
    } finally {
      setIsDeletingRule(false);
      setRuleToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <Breadcrumbs items={[{ label: 'SLA Rule Engine' }]} />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-sm">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">SLA Rule & Escalation Engine</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Customize response targets, resolution deadlines, near-breach warnings, and auto-escalation thresholds.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <span>+ Add SLA Policy</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors shadow-sm"
            title="Refresh Rules"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Rules Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Configured Priority SLA Policies</h3>
            <p className="text-xs text-slate-500">Rules applied dynamically when new tickets are created</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            {rules.length} Active Policies
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3.5 px-4">Priority Level</th>
                <th className="py-3.5 px-4">Category Scope</th>
                <th className="py-3.5 px-4">First Response SLA</th>
                <th className="py-3.5 px-4">Resolution SLA</th>
                <th className="py-3.5 px-4">Near-Breach Warning</th>
                <th className="py-3.5 px-4">Auto-Escalation Threshold</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((rule) => {
                const isEditing = editingRuleId === rule.id;

                return (
                  <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <PriorityBadge priority={rule.priority as TicketPriority} />
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {rule.category ? (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]">
                          {rule.category.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Global Default</span>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="5"
                            value={editFormData.firstResponseMinutes}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, firstResponseMinutes: parseInt(e.target.value, 10) })
                            }
                            className="w-20 px-2.5 py-1 bg-white border border-blue-500 rounded-lg text-xs text-slate-900 font-semibold"
                          />
                          <span className="text-slate-500">mins</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-800">
                          {rule.firstResponseMinutes} mins ({Math.round((rule.firstResponseMinutes / 60) * 10) / 10}h)
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="15"
                            value={editFormData.resolutionMinutes}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, resolutionMinutes: parseInt(e.target.value, 10) })
                            }
                            className="w-20 px-2.5 py-1 bg-white border border-blue-500 rounded-lg text-xs text-slate-900 font-semibold"
                          />
                          <span className="text-slate-500">mins</span>
                        </div>
                      ) : (
                        <span className="font-bold text-blue-600">
                          {rule.resolutionMinutes} mins ({Math.round((rule.resolutionMinutes / 60) * 10) / 10} hours)
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="5"
                            value={editFormData.warnBeforeMinutes}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, warnBeforeMinutes: parseInt(e.target.value, 10) })
                            }
                            className="w-20 px-2.5 py-1 bg-white border border-blue-500 rounded-lg text-xs text-slate-900 font-semibold"
                          />
                          <span className="text-slate-500">mins</span>
                        </div>
                      ) : (
                        <span className="text-amber-700 font-semibold">{rule.warnBeforeMinutes} mins before</span>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="5"
                            value={editFormData.autoEscalateMinutes}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, autoEscalateMinutes: parseInt(e.target.value, 10) })
                            }
                            className="w-20 px-2.5 py-1 bg-white border border-blue-500 rounded-lg text-xs text-slate-900 font-semibold"
                          />
                          <span className="text-slate-500">mins</span>
                        </div>
                      ) : (
                        <span className="text-rose-700 font-semibold">{rule.autoEscalateMinutes} mins after breach</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSave(rule.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => setEditingRuleId(null)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(rule)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold border border-blue-200 transition-colors"
                          >
                            Edit Policy
                          </button>
                          {rule.categoryId ? (
                            <button
                              onClick={() => setRuleToDelete(rule.id)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete SLA Policy"
                              aria-label="Delete SLA Policy"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold border border-slate-200 cursor-default"
                              title="Default system policy cannot be deleted"
                            >
                              <ShieldCheck className="w-3 h-3 text-slate-400" />
                              Protected
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW SLA POLICY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Add New SLA Policy Rule</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateRule} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Priority *</label>
                  <select
                    value={newRuleData.priority}
                    onChange={(e) => setNewRuleData({ ...newRuleData, priority: e.target.value as TicketPriority })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category Scope</label>
                  <select
                    value={newRuleData.categoryId}
                    onChange={(e) => setNewRuleData({ ...newRuleData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Global Default (All Categories)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Response Target (Minutes) *</label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={newRuleData.firstResponseMinutes}
                    onChange={(e) => setNewRuleData({ ...newRuleData, firstResponseMinutes: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    e.g. 15 mins for critical, 60 mins for standard
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Resolution Target (Minutes) *</label>
                  <input
                    type="number"
                    min="15"
                    required
                    value={newRuleData.resolutionMinutes}
                    onChange={(e) => setNewRuleData({ ...newRuleData, resolutionMinutes: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    e.g. 60 mins (1h), 240 mins (4h), 1440 mins (24h)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Near-Breach Warning (Minutes Before)</label>
                  <input
                    type="number"
                    min="5"
                    value={newRuleData.warnBeforeMinutes}
                    onChange={(e) => setNewRuleData({ ...newRuleData, warnBeforeMinutes: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Auto-Escalate (Minutes After Breach)</label>
                  <input
                    type="number"
                    min="5"
                    value={newRuleData.autoEscalateMinutes}
                    onChange={(e) => setNewRuleData({ ...newRuleData, autoEscalateMinutes: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRule}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  {isCreatingRule ? 'Creating...' : '+ Create SLA Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmationModal
        isOpen={!!ruleToDelete}
        onClose={() => setRuleToDelete(null)}
        onConfirm={confirmDeleteRule}
        title="Delete this SLA policy?"
        message="Are you sure you want to delete this SLA policy? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeletingRule}
      />
    </div>
  );
};
