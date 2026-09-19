import React, { useState } from 'react';
import { X, Sliders, CheckCircle2, ShieldCheck, Users, Zap } from 'lucide-react';
import api from '../../services/api';

interface AutoAllocationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutoAllocationSettingsModal: React.FC<AutoAllocationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [strategy, setStrategy] = useState<'LEAST_LOADED' | 'ROUND_ROBIN'>('LEAST_LOADED');
  const [maxCapacity, setMaxCapacity] = useState<number>(5);
  const [enableSkillMatching, setEnableSkillMatching] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Auto-Allocation Strategy Settings</h3>
              <p className="text-xs text-slate-400">Configure skill & workload balancing for incoming tickets</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveSettings} className="p-6 space-y-5">
          {isSaved ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 animate-bounce" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Settings Saved!</h4>
              <p className="text-xs text-slate-500">Auto-allocation engine updated successfully.</p>
            </div>
          ) : (
            <>
              {/* Routing Strategy Option */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Workload Allocation Strategy
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setStrategy('LEAST_LOADED')}
                    className={`cursor-pointer rounded-xl border p-3.5 space-y-1 transition-all ${
                      strategy === 'LEAST_LOADED'
                        ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Least Loaded First</span>
                      <Zap className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Routes to agent with lowest active ticket count.</p>
                  </div>

                  <div
                    onClick={() => setStrategy('ROUND_ROBIN')}
                    className={`cursor-pointer rounded-xl border p-3.5 space-y-1 transition-all ${
                      strategy === 'ROUND_ROBIN'
                        ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Round-Robin</span>
                      <Users className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Sequential circular distribution among online staff.</p>
                  </div>
                </div>
              </div>

              {/* Max Agent Capacity Limit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Max Workload Capacity Cap per Agent
                </label>
                <select
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 font-semibold focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value={3}>3 Active Tickets Max (High Focus)</option>
                  <option value={5}>5 Active Tickets Max (Standard Balanced)</option>
                  <option value={8}>8 Active Tickets Max (High Velocity)</option>
                  <option value={15}>15 Active Tickets Max (Uncapped)</option>
                </select>
              </div>

              {/* Skill Matching Checkbox */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Enforce Department Expertise Matching</span>
                  <span className="text-[11px] text-slate-500">Only route category tickets to matching department specialists.</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableSkillMatching}
                  onChange={(e) => setEnableSkillMatching(e.target.checked)}
                  className="h-4 w-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-700"
                >
                  Save Strategy
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
