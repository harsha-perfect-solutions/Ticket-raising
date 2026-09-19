import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  ChevronDown,
  Check,
  ShieldCheck,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useWorkspace, WorkspaceTenant } from '../../context/WorkspaceContext';

export const WorkspaceSwitcher: React.FC = () => {
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTierBadge = (tier: WorkspaceTenant['tier']) => {
    switch (tier) {
      case 'FINTECH':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'HEALTHCARE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-sm"
        title="Switch Isolated Tenant Workspace"
      >
        <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider leading-none">
            Tenant Workspace
          </div>
          <div className="font-bold text-slate-800 text-xs mt-0.5 leading-none truncate max-w-[130px]">
            {currentWorkspace.name}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-fade-in space-y-1">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Tenant Workspaces</span>
              <span className="text-[10px] text-emerald-600 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Segregated DB
              </span>
            </p>
            <p className="text-[11px] text-slate-400">Multi-tenant schema isolated environments</p>
          </div>

          <div className="space-y-1 pt-1">
            {workspaces.map((ws) => {
              const isActive = ws.id === currentWorkspace.id;

              return (
                <button
                  key={ws.id}
                  onClick={() => {
                    switchWorkspace(ws.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start justify-between p-2.5 rounded-xl text-left transition-colors ${
                    isActive ? 'bg-indigo-50/80 border border-indigo-200/80' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 truncate">{ws.name}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${getTierBadge(ws.tier)}`}>
                        {ws.tier}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono truncate">{ws.domain}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Compliance: <span className="font-semibold text-slate-600">{ws.complianceStandard}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
