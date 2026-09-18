import React from 'react';
import { Customer } from '../../types';
import { RaiseTicketForm } from '../tickets/RaiseTicketForm';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated?: (ticketId: string) => void;
  preSelectedCustomer?: Customer | null;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onTicketCreated,
  preSelectedCustomer = null,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        <div className="overflow-y-auto flex-1">
          <RaiseTicketForm
            isModal={true}
            onClose={onClose}
            preSelectedCustomer={preSelectedCustomer}
            onNavigate={(page, ticketId) => {
              if (ticketId && onTicketCreated) {
                onTicketCreated(ticketId);
              }
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default NewTicketModal;
