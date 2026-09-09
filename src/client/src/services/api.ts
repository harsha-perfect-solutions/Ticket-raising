import axios from 'axios';
import {
  User,
  Customer,
  Department,
  Category,
  SlaRule,
  Ticket,
  Notification,
  AuditLog,
  DashboardStats,
  TicketStatus,
  TicketPriority,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token to all outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('supportpro_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthenticated errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('supportpro_token');
      localStorage.removeItem('supportpro_user');
      // Redirect to login if unauthenticated
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post<{ success: boolean; token: string; user: User }>('/auth/login', data),
  register: (data: any) => api.post<{ success: boolean; token: string; user: User }>('/auth/register', data),
  getMe: () => api.get<{ success: boolean; user: User }>('/auth/me'),
  getDemoAccounts: () => api.get<{ success: boolean; accounts: User[] }>('/auth/demo-accounts'),
  switchDemo: (userId: string) => api.post<{ success: boolean; token: string; user: User }>('/auth/switch-demo', { userId }),
};

export const customerApi = {
  search: (q: string) => api.get<{ success: boolean; customers: Customer[] }>(`/customers/search?q=${encodeURIComponent(q)}`),
  create: (data: Partial<Customer>) => api.post<{ success: boolean; customer: Customer }>('/customers', data),
  getById: (id: string) => api.get<{ success: boolean; customer: Customer; stats: any }>(`/customers/${id}`),
};

export const ticketApi = {
  list: (params?: any) => api.get<{ success: boolean; tickets: Ticket[]; pagination: any }>('/tickets', { params }),
  create: (data: any) => api.post<{ success: boolean; ticket: Ticket }>('/tickets', data),
  getById: (id: string) => api.get<{ success: boolean; ticket: Ticket }>(`/tickets/${id}`),
  updateStatus: (id: string, data: { status: TicketStatus; reason?: string; resolutionNotes?: string }) =>
    api.patch<{ success: boolean; ticket: Ticket }>(`/tickets/${id}/status`, data),
  assign: (id: string, data: { assignedAgentId?: string | null; departmentId?: string; reason?: string }) =>
    api.patch<{ success: boolean; ticket: Ticket }>(`/tickets/${id}/assign`, data),
  updatePriority: (id: string, priority: TicketPriority) =>
    api.patch<{ success: boolean; ticket: Ticket }>(`/tickets/${id}/priority`, { priority }),
  escalate: (id: string, data: { reason?: string; targetLevel?: number }) =>
    api.post<{ success: boolean; ticket: Ticket }>(`/tickets/${id}/escalate`, data),
  addMessage: (id: string, message: string) =>
    api.post<{ success: boolean; message: any }>(`/tickets/${id}/messages`, { message }),
  addInternalNote: (id: string, note: string) =>
    api.post<{ success: boolean; note: any }>(`/tickets/${id}/internal-notes`, { note }),
  submitFeedback: (id: string, data: { rating: number; feedbackText?: string }) =>
    api.post<{ success: boolean; feedback: any }>(`/tickets/${id}/feedback`, data),
  uploadAttachment: (ticketId: string, formData: FormData) =>
    api.post<{ success: boolean; attachment: any }>(`/tickets/${ticketId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const adminApi = {
  getDepartments: () => api.get<{ success: boolean; departments: Department[] }>('/admin/departments'),
  createDepartment: (data: Partial<Department>) => api.post<{ success: boolean; department: Department }>('/admin/departments', data),
  getCategories: () => api.get<{ success: boolean; categories: Category[] }>('/admin/categories'),
  createCategory: (data: any) => api.post<{ success: boolean; category: Category }>('/admin/categories', data),
  getSlaRules: () => api.get<{ success: boolean; rules: SlaRule[] }>('/admin/sla-rules'),
  updateSlaRule: (id: string, data: Partial<SlaRule>) => api.put<{ success: boolean; rule: SlaRule }>(`/admin/sla-rules/${id}`, data),
  getUsers: (params?: any) => api.get<{ success: boolean; users: User[] }>('/admin/users', { params }),
  createUser: (data: any) => api.post<{ success: boolean; user: User }>('/admin/users', data),
  getAuditLogs: (params?: any) => api.get<{ success: boolean; logs: AuditLog[] }>('/admin/audit-logs', { params }),
};

export const analyticsApi = {
  getDashboardStats: (params?: any) => api.get<{ success: boolean; stats: DashboardStats }>('/analytics/dashboard', { params }),
};

export const notificationApi = {
  list: () => api.get<{ success: boolean; notifications: Notification[]; unreadCount: number }>('/notifications'),
  markRead: (id: string) => api.patch<{ success: boolean }>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ success: boolean }>('/notifications/mark-all-read'),
};

export default api;
