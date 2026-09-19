import { Request, Response, NextFunction } from 'express';

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

export const WORKSPACE_TENANTS: WorkspaceTenant[] = [
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

export interface TenantRequest extends Request {
  workspace?: WorkspaceTenant;
}

export function tenantIsolationMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  const workspaceHeader = (req.headers['x-workspace-id'] as string) || 'ws-acme-corp';
  const found = WORKSPACE_TENANTS.find((w) => w.id === workspaceHeader || w.slug === workspaceHeader);
  req.workspace = found || WORKSPACE_TENANTS[0];
  next();
}
