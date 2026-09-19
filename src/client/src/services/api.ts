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
  Attachment,
  KBArticle,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token to all outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('supportpro_token') || sessionStorage.getItem('supportpro_token');
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
      sessionStorage.removeItem('supportpro_token');
      sessionStorage.removeItem('supportpro_user');
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
  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message: string; resetToken?: string }>('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/reset-password', data),
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
  autoAllocate: (id: string) =>
    api.post<{ success: boolean; ticket: Ticket; allocation: any; message: string }>(`/tickets/${id}/auto-allocate`),
  updatePriority: (id: string, priority: TicketPriority) =>
    api.patch<{ success: boolean; ticket: Ticket }>(`/tickets/${id}/priority`, { priority }),
  escalate: (id: string, data: { reason?: string; targetLevel?: number }) =>
    api.post<{ success: boolean; ticket: Ticket }>(`/tickets/${id}/escalate`, data),
  addMessage: (id: string, message: string) =>
    api.post<{ success: boolean; message: any }>(`/tickets/${id}/messages`, { message }),
  addInternalNote: (id: string, note: string) =>
    api.post<{ success: boolean; note: any }>(`/tickets/${id}/internal-notes`, { note }),
  checkDuplicate: (data: { customerId?: string; categoryId?: string; subcategoryId?: string; subject: string; description?: string }) =>
    api.post<{ success: boolean; hasDuplicate: boolean; duplicates: Ticket[] }>('/tickets/check-duplicate', data),
  submitFeedback: (id: string, data: { rating: number; feedbackText?: string }) =>
    api.post<{ success: boolean; feedback: any }>(`/tickets/${id}/feedback`, data),
  uploadAttachment: (ticketId: string, formData: FormData) =>
    api.post<{ success: boolean; attachment: Attachment }>(`/tickets/${ticketId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadAttachmentsBatch: (ticketId: string, formData: FormData) =>
    api.post<{ success: boolean; attachments: Attachment[]; failedFiles?: { name: string; error: string }[] }>(
      `/tickets/${ticketId}/attachments/batch`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    ),
  batchUpdate: (data: { ticketIds: string[]; status?: TicketStatus; assignedAgentId?: string | null; reason?: string }) =>
    api.patch<{ success: boolean; count: number; message: string }>('/tickets/batch', data),
};

export const kbApi = {
  search: (params?: { q?: string; category?: string }) =>
    api.get<{ success: boolean; articles: KBArticle[] }>('/kb/search', { params }),
  getArticle: (id: string) =>
    api.get<{ success: boolean; article: KBArticle }>(`/kb/articles/${id}`),
};

export const adminApi = {
  getDepartments: () => api.get<{ success: boolean; departments: Department[] }>('/admin/departments'),
  createDepartment: (data: Partial<Department>) => api.post<{ success: boolean; department: Department }>('/admin/departments', data),
  deleteDepartment: (id: string) => api.delete<{ success: boolean; message: string }>(`/admin/departments/${id}`),
  getCategories: () => api.get<{ success: boolean; categories: Category[] }>('/admin/categories'),
  createCategory: (data: any) => api.post<{ success: boolean; category: Category }>('/admin/categories', data),
  deleteCategory: (id: string) => api.delete<{ success: boolean; message: string }>(`/admin/categories/${id}`),
  getSlaRules: () => api.get<{ success: boolean; rules: SlaRule[] }>('/admin/sla-rules'),
  createSlaRule: (data: any) => api.post<{ success: boolean; rule: SlaRule; message: string }>('/admin/sla-rules', data),
  updateSlaRule: (id: string, data: Partial<SlaRule>) => api.put<{ success: boolean; rule: SlaRule }>(`/admin/sla-rules/${id}`, data),
  deleteSlaRule: (id: string) => api.delete<{ success: boolean; message: string }>(`/admin/sla-rules/${id}`),
  getUsers: (params?: any) => api.get<{ success: boolean; users: User[] }>('/admin/users', { params }),
  createUser: (data: any) => api.post<{ success: boolean; user: User }>('/admin/users', data),
  updateUser: (id: string, data: any) => api.put<{ success: boolean; user: User; message: string }>(`/admin/users/${id}`, data),
  toggleUserStatus: (id: string) => api.patch<{ success: boolean; user: User; message: string }>(`/admin/users/${id}/toggle-status`),
  deleteUser: (id: string) => api.delete<{ success: boolean; message: string; deactivated?: boolean }>(`/admin/users/${id}`),
  resetUserPassword: (id: string, newPassword?: string) => api.post<{ success: boolean; message: string }>(`/admin/users/${id}/reset-password`, { newPassword }),
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
