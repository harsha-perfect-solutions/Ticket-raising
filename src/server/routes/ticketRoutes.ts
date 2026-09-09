import { Router } from 'express';
import {
  listTickets,
  createTicket,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  updateTicketPriority,
  escalateTicket,
  addMessage,
  addInternalNote,
  submitFeedback,
  uploadAttachment,
} from '../controllers/ticketController';
import { authenticate, requireRoles, checkTicketAccess } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

// 1. List & Create Tickets
router.get('/', listTickets);
router.post('/', createTicket);

// 2. Ticket Details & Scoped Operations
router.get('/:id', checkTicketAccess, getTicketById);
router.patch('/:id/status', checkTicketAccess, updateTicketStatus);
router.patch('/:id/assign', requireRoles('ADMIN', 'MANAGER', 'AGENT'), assignTicket);
router.patch('/:id/priority', requireRoles('ADMIN', 'MANAGER'), updateTicketPriority);
router.post('/:id/escalate', requireRoles('ADMIN', 'MANAGER', 'AGENT'), escalateTicket);

// 3. Conversation & Collaboration
router.post('/:id/messages', checkTicketAccess, addMessage);
router.post('/:id/internal-notes', requireRoles('ADMIN', 'MANAGER', 'AGENT', 'TELECALLER'), addInternalNote);
router.post('/:id/attachments', checkTicketAccess, upload.single('file'), uploadAttachment);

// 4. Customer Feedback
router.post('/:id/feedback', checkTicketAccess, submitFeedback);

export default router;
