import React, { useState } from 'react';
import {
  Building2,
  Plus,
  ShieldCheck,
  HardDrive,
  Ticket as TicketIcon,
  CheckCircle2,
  ExternalLink,
  Layers,
  Database,
  Lock,
  Search,
  Server,
  AlertCircle,
} from 'lucide-react';
import { useWorkspace, WorkspaceTenant } from '../../context/WorkspaceContext';
import { api } from '../../services/api';

export const WorkspaceIsolationPage: React.FC = () => {
  const { currentWorkspace, workspaces, switchWorkspace, refreshWorkspaces } = useWorkspace();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tier, setTier] = useState<'ENTERPRISE' | 'FINTECH' | 'HEALTHCARE' | 'STANDARD'>('ENTERPRISE');
  const [storageQuotaGb, setStorageQuotaGb] = useState('50');
  const [complianceStandard, setComplianceStandard] = useState('SOC2 Type II & ISO 27001');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/workspaces', {
        name: name.trim(),
        slug: slug.trim(),
        tier,
        storageQuotaMb: Number(storageQuotaGb) * 1024,
        complianceStandard,
      });
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        await refreshWorkspaces();
        setTimeout(() => {
          setShowCreateModal(false);
          setSuccessMsg(null);
          setName('');
          setSlug('');
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to create workspace', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWorkspaces = workspaces.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              <Database className="w-3.5 h-3.5" /> Multi-Tenant Workspace Isolation
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Enterprise Tenant Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Row-level security boundaries & isolated schemas across enterprise client organizations
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Tenant</span>
        </button>
      </div>

      {/* Isolation Architecture Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Cryptographic Tenant Segregation Active</h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Each workspace routes queries through dedicated tenant schemas with zero cross-tenant memory leakage.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-white/10 text-emerald-400 border border-emerald-500/30">
            HIPAA • SOC2 • PCI-DSS
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search enterprise tenant or subdomain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          {filteredWorkspaces.length} Active Enterprise Tenant(s)
        </span>
      </div>

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredWorkspaces.map((ws) => {
          const isActive = ws.id === currentWorkspace.id;
          const usagePercent = Math.min(100, Math.round((ws.usedStorageMb / ws.storageQuotaMb) * 100));

          return (
            <div
              key={ws.id}
              className={`rounded-3xl bg-white p-6 shadow-sm border transition-all space-y-4 ${
                isActive ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-md' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{ws.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{ws.domain}</p>
                  </div>
                </div>
                {isActive && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Current Active
                  </span>
                )}
              </div>

              {/* Compliance & Isolation Pills */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Tier:</span>
                  <span className="font-bold text-slate-800">{ws.tier}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Compliance:</span>
                  <span className="font-semibold text-slate-700">{ws.complianceStandard}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Schema Status:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Segregated
                  </span>
                </div>
              </div>

              {/* Storage Quota Bar */}
              <div className="space-y-1 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Storage Quota</span>
                  <span className="font-mono font-bold text-slate-700">
                    {(ws.usedStorageMb / 1024).toFixed(1)} / {(ws.storageQuotaMb / 1024).toFixed(0)} GB ({usagePercent}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${usagePercent > 80 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                    style={{ width: `${Math.max(5, usagePercent)}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => switchWorkspace(ws.id)}
                  disabled={isActive}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {isActive ? 'Active Workspace' : 'Switch to Tenant'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Provision Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Provision Isolated Tenant</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {successMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p>{successMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleCreateWorkspace} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zenith Global Technologies"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tenant Slug (Subdomain)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. zenith-global"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tier</label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    >
                      <option value="ENTERPRISE">Enterprise</option>
                      <option value="FINTECH">FinTech (PCI-DSS)</option>
                      <option value="HEALTHCARE">Healthcare (HIPAA)</option>
                      <option value="STANDARD">Standard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Storage Quota (GB)</label>
                    <input
                      type="number"
                      value={storageQuotaGb}
                      onChange={(e) => setStorageQuotaGb(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Compliance Framework</label>
                  <input
                    type="text"
                    value={complianceStandard}
                    onChange={(e) => setComplianceStandard(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
                  >
                    {isSubmitting ? 'Provisioning...' : 'Provision Workspace'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
