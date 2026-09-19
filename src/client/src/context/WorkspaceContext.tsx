import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface WorkspaceTenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  tier: 'ENTERPRISE' | 'FINTECH' | 'HEALTHCARE' | 'STANDARD';
  storageQuotaMb: number;
  usedStorageMb: number;
  activeTickets: number;
  complianceStandard: string;
  isIsolatedSchema: boolean;
  createdAt: string;
}

interface WorkspaceContextType {
  currentWorkspace: WorkspaceTenant;
  workspaces: WorkspaceTenant[];
  switchWorkspace: (workspaceId: string) => void;
  isLoading: boolean;
  refreshWorkspaces: () => Promise<void>;
}

const DEFAULT_WORKSPACES: WorkspaceTenant[] = [
  {
    id: 'ws-acme-corp',
    name: 'Acme Corp Global',
    slug: 'acme-corp',
    domain: 'acme.resolvehub.io',
    tier: 'ENTERPRISE',
    storageQuotaMb: 51200,
    usedStorageMb: 4210,
    activeTickets: 28,
    complianceStandard: 'SOC2 Type II & ISO 27001',
    isIsolatedSchema: true,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'ws-apex-fin',
    name: 'Apex Financial Services',
    slug: 'apex-fin',
    domain: 'apexfin.resolvehub.io',
    tier: 'FINTECH',
    storageQuotaMb: 102400,
    usedStorageMb: 12450,
    activeTickets: 42,
    complianceStandard: 'PCI-DSS v4.0 & GDPR',
    isIsolatedSchema: true,
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'ws-nova-health',
    name: 'Nova Health Systems',
    slug: 'nova-health',
    domain: 'novahealth.resolvehub.io',
    tier: 'HEALTHCARE',
    storageQuotaMb: 76800,
    usedStorageMb: 8910,
    activeTickets: 19,
    complianceStandard: 'HIPAA & HITECH Compliant',
    isIsolatedSchema: true,
    createdAt: '2026-02-20T00:00:00Z',
  },
];

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceTenant[]>(() => {
    const saved = localStorage.getItem('resolvehub_workspaces') || localStorage.getItem('omnidesk_workspaces');
    return saved ? JSON.parse(saved) : DEFAULT_WORKSPACES;
  });

  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceTenant>(() => {
    const savedId = localStorage.getItem('resolvehub_active_workspace_id') || localStorage.getItem('omnidesk_active_workspace_id');
    const match = DEFAULT_WORKSPACES.find((w) => w.id === savedId);
    return match || DEFAULT_WORKSPACES[0];
  });

  const [isLoading, setIsLoading] = useState(false);

  const refreshWorkspaces = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/workspaces');
      if (res.data.success && res.data.workspaces) {
        setWorkspaces(res.data.workspaces);
        localStorage.setItem('resolvehub_workspaces', JSON.stringify(res.data.workspaces));
        if (res.data.currentWorkspace) {
          const match = res.data.workspaces.find((w: WorkspaceTenant) => w.id === currentWorkspace.id);
          if (match) setCurrentWorkspace(match);
        }
      }
    } catch (err) {
      console.warn('Workspace sync failed, using cached tenants', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshWorkspaces();
  }, []);

  const switchWorkspace = (workspaceId: string) => {
    const target = workspaces.find((w) => w.id === workspaceId);
    if (target) {
      setCurrentWorkspace(target);
      localStorage.setItem('resolvehub_active_workspace_id', target.id);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        switchWorkspace,
        isLoading,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
