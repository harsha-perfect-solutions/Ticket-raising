import React from 'react';
import { RaiseTicketForm } from '../../components/tickets/RaiseTicketForm';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { useAuth } from '../../context/AuthContext';

interface RaiseTicketPageProps {
  onNavigate?: (page: string, ticketId?: string) => void;
}

export const RaiseTicketPage: React.FC<RaiseTicketPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const rolePrefix = user?.role ? user.role.toLowerCase() : 'customer';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Dynamic Breadcrumbs with History-Safe Back Button */}
      <Breadcrumbs
        items={[{ label: 'Raise Support Ticket' }]}
        backLabel="Back to Dashboard"
        fallbackBackUrl={`/${rolePrefix}/dashboard`}
      />
      <RaiseTicketForm isModal={false} onNavigate={onNavigate} />
    </div>
  );
};

export default RaiseTicketPage;
