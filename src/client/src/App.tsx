import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { NotFoundPage } from './pages/NotFoundPage';

// Dashboards
import { AdminDashboard } from './pages/Dashboard/AdminDashboard';
import { CustomerDashboard } from './pages/Dashboard/CustomerDashboard';
import { TelecallerDashboard } from './pages/Dashboard/TelecallerDashboard';
import { AgentDashboard } from './pages/Dashboard/AgentDashboard';
import { ManagerDashboard } from './pages/Dashboard/ManagerDashboard';

// Modules & Pages
import { TelecallerDesk } from './pages/Telecaller/TelecallerDesk';
import { TicketListPage } from './pages/Tickets/TicketListPage';
import { TicketDetailsPage } from './pages/Tickets/TicketDetailsPage';
import { RaiseTicketPage } from './pages/Tickets/RaiseTicketPage';
import { SlaConfigPage } from './pages/Admin/SlaConfigPage';
import { DepartmentsCategoriesPage } from './pages/Admin/DepartmentsCategoriesPage';
import { UserManagementPage } from './pages/Admin/UserManagementPage';
import { AuditLogsPage } from './pages/Admin/AuditLogsPage';

// Main Application Shell for authenticated pages
const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-h-[calc(100vh-4rem)] bg-[#f4f7fb]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// Root Redirect helper
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Starting SupportPro Enterprise...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />;
};

// Auth Route helper
const PublicAuthRoute: React.FC<{ component: 'login' | 'register' }> = ({ component }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />;
  }

  return component === 'login' ? (
    <LoginPage onNavigateToRegister={() => navigate('/register')} />
  ) : (
    <RegisterPage onNavigateToLogin={() => navigate('/login')} />
  );
};

// Generic Role-Aware Redirect
const RoleRedirect: React.FC<{ subpath: string }> = ({ subpath }) => {
  const { user } = useAuth();
  const prefix = user?.role ? user.role.toLowerCase() : 'customer';
  return <Navigate to={`/${prefix}/${subpath}`} replace />;
};

const TicketRedirect: React.FC = () => {
  const { user } = useAuth();
  const { ticketId } = useParams();
  const prefix = user?.role ? user.role.toLowerCase() : 'customer';
  return <Navigate to={`/${prefix}/tickets/${ticketId}`} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicAuthRoute component="login" />} />
      <Route path="/register" element={<PublicAuthRoute component="register" />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Authenticated Application Shell Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* Customer Portal */}
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/tickets"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <TicketListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/all-tickets"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <TicketListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/tickets/:ticketId"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <TicketDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/raise-ticket"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <RaiseTicketPage />
            </ProtectedRoute>
          }
        />

        {/* Telecaller Workspace */}
        <Route
          path="/telecaller/dashboard"
          element={
            <ProtectedRoute allowedRoles={['TELECALLER']}>
              <TelecallerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/telecaller/desk"
          element={
            <ProtectedRoute allowedRoles={['TELECALLER', 'ADMIN', 'MANAGER']}>
              <TelecallerDesk />
            </ProtectedRoute>
          }
        />
        <Route
          path="/telecaller/telecaller-desk"
          element={
            <ProtectedRoute allowedRoles={['TELECALLER', 'ADMIN', 'MANAGER']}>
              <TelecallerDesk />
            </ProtectedRoute>
          }
        />
        <Route
          path="/telecaller/tickets"
          element={
            <ProtectedRoute allowedRoles={['TELECALLER']}>
              <TicketListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/telecaller/tickets/:ticketId"
          element={
            <ProtectedRoute allowedRoles={['TELECALLER']}>
              <TicketDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/telecaller/raise-ticket"
          element={
            <ProtectedRoute allowedRoles={['TELECALLER']}>
              <RaiseTicketPage />
            </ProtectedRoute>
          }
        />

        {/* Agent Workbench */}
        <Route
          path="/agent/dashboard"
          element={
            <ProtectedRoute allowedRoles={['AGENT']}>
              <AgentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent/tickets"
          element={
            <ProtectedRoute allowedRoles={['AGENT']}>
              <TicketListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent/tickets/:ticketId"
          element={
            <ProtectedRoute allowedRoles={['AGENT']}>
              <TicketDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent/raise-ticket"
          element={
            <ProtectedRoute allowedRoles={['AGENT']}>
              <RaiseTicketPage />
            </ProtectedRoute>
          }
        />

        {/* Manager Console */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/tickets"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <TicketListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/tickets/:ticketId"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <TicketDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/raise-ticket"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <RaiseTicketPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/telecaller-desk"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <TelecallerDesk />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/departments-categories"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <DepartmentsCategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/users"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/escalations"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <TicketListPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Command Center */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tickets"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <TicketListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tickets/:ticketId"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <TicketDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/raise-ticket"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <RaiseTicketPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/telecaller-desk"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <TelecallerDesk />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sla-rules"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <SlaConfigPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sla"
          element={<Navigate to="/admin/sla-rules" replace />}
        />
        <Route
          path="/admin/departments-categories"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DepartmentsCategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={<Navigate to="/admin/departments-categories" replace />}
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={<Navigate to="/admin/audit-logs" replace />}
        />

        {/* Generic shortcut redirects for convenience */}
        <Route path="/dashboard" element={<RoleRedirect subpath="dashboard" />} />
        <Route path="/tickets" element={<RoleRedirect subpath="tickets" />} />
        <Route path="/all-tickets" element={<RoleRedirect subpath="tickets" />} />
        <Route path="/tickets/:ticketId" element={<TicketRedirect />} />
        <Route path="/raise-ticket" element={<RoleRedirect subpath="raise-ticket" />} />
        <Route path="/telecaller-desk" element={<RoleRedirect subpath="telecaller-desk" />} />
      </Route>

      {/* 404 Catch-All Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
