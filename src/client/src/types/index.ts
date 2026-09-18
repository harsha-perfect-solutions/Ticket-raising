export type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT' | 'TELECALLER' | 'CUSTOMER';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_CUSTOMER'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'REOPENED'
  | 'CLOSED'
  | 'CANCELLED';

export type SlaStatus = 'WITHIN_SLA' | 'WARNING_NEAR_BREACH' | 'BREACHED';

export type TicketSource = 'CUSTOMER_PORTAL' | 'TELECALLER' | 'EMAIL' | 'PHONE';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  departmentId?: string | null;
  department?: Department | null;
  customerId?: string | null;
  isActive?: boolean;
  avatarUrl?: string | null;
}

export interface Customer {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  tickets?: Ticket[];
  _count?: {
    tickets: number;
  };
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  managerId?: string | null;
  manager?: User | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    members: number;
    tickets: number;
    categories: number;
  };
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  departmentId: string;
  department?: Department;
  defaultPriority: TicketPriority;
  isActive: boolean;
  subcategories?: Subcategory[];
  _count?: {
    tickets: number;
  };
}

export interface SlaRule {
  id: string;
  priority: TicketPriority;
  categoryId?: string | null;
  category?: Category | null;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  warnBeforeMinutes: number;
  autoEscalateMinutes: number;
  isActive: boolean;
}

export interface Attachment {
  id: string;
  ticketId: string;
  messageId?: string | null;
  internalNoteId?: string | null;
  uploaderId: string;
  uploader?: User;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  sender: User;
  senderType: string;
  message: string;
  isCustomerVisible: boolean;
  createdAt: string;
  attachments?: Attachment[];
}

export interface InternalNote {
  id: string;
  ticketId: string;
  authorId: string;
  author: User;
  note: string;
  createdAt: string;
  attachments?: Attachment[];
}

export interface TicketAssignment {
  id: string;
  ticketId: string;
  assignedById: string;
  assignedBy: { fullName: string };
  assignedToId: string;
  assignedTo: { fullName: string };
  reason?: string | null;
  createdAt: string;
}

export interface TicketStatusHistory {
  id: string;
  ticketId: string;
  changedById: string;
  changedBy: { fullName: string; role: string };
  oldStatus: string;
  newStatus: string;
  reason?: string | null;
  createdAt: string;
}

export interface SlaHistory {
  id: string;
  ticketId: string;
  eventType: string;
  fromLevel: number;
  toLevel: number;
  details?: string | null;
  createdAt: string;
}

export interface CustomerFeedback {
  id: string;
  ticketId: string;
  customerId: string;
  rating: number;
  feedbackText?: string | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customer: Customer;
  createdById: string;
  creator: User;
  source: TicketSource;
  categoryId: string;
  category: Category;
  subcategoryId?: string | null;
  subcategory?: Subcategory | null;
  departmentId: string;
  department: Department;
  assignedAgentId?: string | null;
  assignedAgent?: User | null;
  subject: string;
  description: string;
  callSummary?: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  slaRuleId?: string | null;
  slaRule?: SlaRule | null;
  firstResponseDueAt?: string | null;
  firstRespondedAt?: string | null;
  resolutionDueAt?: string | null;
  slaStatus: SlaStatus;
  escalationLevel: number;
  reopenCount: number;
  resolvedAt?: string | null;
  closedAt?: string | null;
  resolutionNotes?: string | null;
  watchers?: string[];
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
  internalNotes?: InternalNote[];
  attachments?: Attachment[];
  assignments?: TicketAssignment[];
  statusHistory?: TicketStatusHistory[];
  slaHistory?: SlaHistory[];
  feedback?: CustomerFeedback | null;
  _count?: {
    messages: number;
    internalNotes: number;
    attachments: number;
  };
}

export interface Notification {
  id: string;
  userId: string;
  ticketId?: string | null;
  ticket?: {
    id: string;
    ticketNumber: string;
    subject: string;
    status: TicketStatus;
    priority: TicketPriority;
  } | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: { id: string; fullName: string; email: string; role: string } | null;
  ticketId?: string | null;
  ticket?: { id: string; ticketNumber: string; subject: string } | null;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  counts: {
    total: number;
    new: number;
    assigned: number;
    inProgress: number;
    waitingForCustomer: number;
    escalated: number;
    resolved: number;
    closed: number;
    cancelled: number;
    slaBreached: number;
    slaWarning: number;
    openTotal: number;
  };
  avgResponseTimeMinutes: number;
  avgResolutionTimeHours: string;
  slaComplianceRate: number;
  avgCsatRating: string;
  feedbackCount: number;
  ticketsByCategory: { name: string; count: number }[];
  ticketsByPriority: { priority: string; count: number }[];
  ticketsByDepartment: { name: string; count: number }[];
  ticketsByAgent: { name: string; total: number; resolved: number; inProgress: number }[];
}

export interface KBArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  readTimeMinutes: number;
  content: string;
}

export interface TicketTemplate {
  id: string;
  name: string;
  categoryKeyword: string;
  subcategoryKeyword?: string;
  defaultSubject: string;
  descriptionPrompt: string;
  priority: TicketPriority;
}

export interface FileAttachmentItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  error?: string;
}
