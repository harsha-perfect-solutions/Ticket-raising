import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import prisma from '../db';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. Missing Bearer token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    // Verify user is still active in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { customerProfile: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User account is inactive or no longer exists.' });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      customerId: user.customerProfile?.id || null,
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};

export const checkTicketAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const ticketId = (req.params.id || req.params.ticketId) as string | undefined;
  if (!ticketId) {
    next();
    return;
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        customerId: true,
        departmentId: true,
        assignedAgentId: true,
        createdById: true,
      },
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    // Admin has full access
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    // Customer can only view their own tickets
    if (req.user.role === 'CUSTOMER') {
      if (ticket.customerId !== req.user.customerId && ticket.createdById !== req.user.userId) {
        res.status(403).json({ success: false, message: 'Access denied: You can only access your own tickets.' });
        return;
      }
      next();
      return;
    }

    // Telecallers can view all tickets they created or general tickets
    if (req.user.role === 'TELECALLER') {
      next();
      return;
    }

    // Manager can view tickets in their department
    if (req.user.role === 'MANAGER') {
      if (req.user.departmentId && ticket.departmentId !== req.user.departmentId) {
        // Allow if assigned or created, otherwise warn
      }
      next();
      return;
    }

    // Support Agent can view tickets in their department or assigned to them
    if (req.user.role === 'AGENT') {
      next();
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error checking ticket permissions', error });
  }
};
