import prisma from '../db';
import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

export interface CreateNotificationParams {
  userId: string;
  ticketId?: string | null;
  title: string;
  message: string;
  type: 'STATUS_CHANGE' | 'NEW_REPLY' | 'SLA_WARNING' | 'SLA_BREACH' | 'ASSIGNMENT' | 'ESCALATION';
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        ticketId: params.ticketId || null,
        title: params.title,
        message: params.message,
        type: params.type,
      },
    });

    if (ioInstance) {
      ioInstance.to(`user_${params.userId}`).emit('notification', notification);
      if (params.ticketId) {
        ioInstance.to(`ticket_${params.ticketId}`).emit('ticket_updated', {
          ticketId: params.ticketId,
          type: params.type,
          title: params.title,
        });
      }
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

export async function notifyTicketStakeholders({
  ticketId,
  actorId,
  title,
  message,
  type,
  includeCustomer = true,
}: {
  ticketId: string;
  actorId: string;
  title: string;
  message: string;
  type: CreateNotificationParams['type'];
  includeCustomer?: boolean;
}) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        assignedAgent: true,
        department: {
          include: { manager: true },
        },
      },
    });

    if (!ticket) return;

    const userIdsToNotify = new Set<string>();

    // Notify assigned agent if not the actor
    if (ticket.assignedAgentId && ticket.assignedAgentId !== actorId) {
      userIdsToNotify.add(ticket.assignedAgentId);
    }

    // Notify department manager if not the actor
    if (ticket.department?.managerId && ticket.department.managerId !== actorId) {
      userIdsToNotify.add(ticket.department.managerId);
    }

    // Notify ticket creator if not the actor
    if (ticket.createdById && ticket.createdById !== actorId) {
      userIdsToNotify.add(ticket.createdById);
    }

    // Notify customer user if applicable
    if (includeCustomer && ticket.customer?.userId && ticket.customer.userId !== actorId) {
      userIdsToNotify.add(ticket.customer.userId);
    }

    for (const userId of userIdsToNotify) {
      await createNotification({
        userId,
        ticketId,
        title,
        message,
        type,
      });
    }
  } catch (error) {
    console.error('Failed to notify ticket stakeholders:', error);
  }
}
