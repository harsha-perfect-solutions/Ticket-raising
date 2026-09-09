import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { AdminDashboard } from './pages/Dashboard/AdminDashboard';
import { TelecallerDesk } from './pages/Telecaller/TelecallerDesk';
import { TicketListPage } from './pages/Tickets/TicketListPage';
import { TicketDetailsPage } from './pages/Tickets/TicketDetailsPage';
import { SlaConfigPage } from './pages/Admin/SlaConfigPage';
import { DepartmentsCategoriesPage } from './pages/Admin/DepartmentsCategoriesPage';
import { UserManagementPage } from './pages/Admin/UserManagementPage';
import { AuditLogsPage } from './pages/Admin/AuditLogsPage';
import { NewTicketModal } from './components/modals/NewTicketModal';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  const handleNavigate = (page: string, ticketId?: string) => {
    if (ticketId) {
      setSelectedTicketId(ticketId);
      setCurrentPage('ticket-details');
    } else {
      if (page === 'new-ticket') {
        setShowNewTicketModal(true);
        return;
      }
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Loading SupportPro Enterprise...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onNavigateToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onNavigateToRegister={() => setAuthView('register')} />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 flex flex-col font-sans">
      <Navbar onNavigate={handleNavigate} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-h-[calc(100vh-4rem)] bg-[#f4f7fb]">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && (
              <AdminDashboard
                onNavigate={handleNavigate}
                onOpenNewTicket={() => setShowNewTicketModal(true)}
              />
            )}

            {currentPage === 'telecaller-desk' && (
              <TelecallerDesk onNavigate={handleNavigate} />
            )}

            {currentPage === 'tickets' && (
              <TicketListPage
                onNavigate={handleNavigate}
                onOpenNewTicket={() => setShowNewTicketModal(true)}
              />
            )}

            {currentPage === 'ticket-details' && selectedTicketId && (
              <TicketDetailsPage ticketId={selectedTicketId} onNavigate={handleNavigate} />
            )}

            {currentPage === 'sla-rules' && <SlaConfigPage />}

            {currentPage === 'departments-categories' && <DepartmentsCategoriesPage />}

            {currentPage === 'users' && <UserManagementPage />}

            {currentPage === 'audit-logs' && <AuditLogsPage />}
          </div>
        </main>
      </div>

      {showNewTicketModal && (
        <NewTicketModal
          isOpen={showNewTicketModal}
          onClose={() => setShowNewTicketModal(false)}
          onTicketCreated={(newId) => {
            handleNavigate('ticket-details', newId);
          }}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainLayout />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
