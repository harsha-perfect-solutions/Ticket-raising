import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { SlaRule } from '../../types';
import { Sliders, CheckCircle2, Save } from 'lucide-react';
import { PriorityBadge } from '../../components/common/PriorityBadge';

export const SlaConfigPage: React.FC = () => {
  const [rules, setRules] = useState<SlaRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SlaRule>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getSlaRules();
      if (res.data.success) {
        setRules(res.data.rules);
      }
    } catch (err) {
      console.error(err);
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
        setSuccessMessage('SLA Thresholds updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        setEditingRuleId(null);
        await loadRules();
      }
    } catch (err) {
      console.error('Failed to update SLA rule', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
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
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
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
            4 Active Policies
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3.5 px-4">Priority Level</th>
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
                      <PriorityBadge priority={rule.priority} />
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
                            className="w-20 px-2.5 py-1 bg-white border border-blue-500 rounded-lg text-xs text-slate-900"
                          />
                          <span className="text-slate-500">mins</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-800">
                          {rule.firstResponseMinutes} mins ({Math.round(rule.firstResponseMinutes / 60 * 10) / 10}h)
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
                            className="w-20 px-2.5 py-1 bg-white border border-blue-500 rounded-lg text-xs text-slate-900"
                          />
                          <span className="text-slate-500">mins</span>
                        </div>
                      ) : (
                        <span className="font-bold text-blue-600">
                          {rule.resolutionMinutes} mins ({Math.round(rule.resolutionMinutes / 60 * 10) / 10} hours)
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
                            className="w-20 px-2.5 py-1 bg-white border border-blue-500 rounded-lg text-xs text-slate-900"
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
                            className="w-20 px-2.5 py-1 bg-white border border-blue-500 rounded-lg text-xs text-slate-900"
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
                            onClick={() => setEditingRuleId(null)}
                            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSave(rule.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(rule)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-[#2563eb] text-slate-700 hover:text-white font-semibold transition-colors"
                        >
                          Edit Policy
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
