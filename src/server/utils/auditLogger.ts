import prisma from '../db';
import { Request } from 'express';

interface AuditLogParams {
  userId?: string | null;
  ticketId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any> | string;
  req?: Request;
}

export async function logAuditEvent({
  userId,
  ticketId,
  action,
  entityType,
  entityId,
  details,
  req,
}: AuditLogParams): Promise<void> {
  try {
    const ipAddress = req?.ip || req?.socket.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers['user-agent'] || 'system';
    const detailsString = typeof details === 'object' ? JSON.stringify(details) : details;

    await prisma.auditLog.create({
      data: {
        userId: userId || (req as any)?.user?.userId || null,
        ticketId: ticketId || null,
        action,
        entityType,
        entityId,
        ipAddress: String(ipAddress),
        userAgent: String(userAgent).slice(0, 255),
        details: detailsString,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
