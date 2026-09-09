import prisma from '../db';
import { createNotification } from './notificationService';
import { logAuditEvent } from '../utils/auditLogger';

export interface SlaCalculationResult {
  slaRuleId: string | null;
  firstResponseDueAt: Date;
  resolutionDueAt: Date;
  slaStatus: string;
}

export async function calculateTicketSla(
  priority: string,
  categoryId?: string | null,
  baseDate: Date = new Date()
): Promise<SlaCalculationResult> {
  // Find specific rule by category & priority or global rule by priority
  let rule = null;
  if (categoryId) {
    rule = await prisma.slaRule.findFirst({
      where: { priority, categoryId, isActive: true },
    });
  }

  if (!rule) {
    rule = await prisma.slaRule.findFirst({
      where: { priority, isActive: true },
    });
  }

  // Fallback defaults if no rule configured in DB
  const defaultMinutesByPriority: Record<string, { resp: number; res: number }> = {
    CRITICAL: { resp: 15, res: 60 },
    HIGH: { resp: 60, res: 240 },
    MEDIUM: { resp: 120, res: 480 },
    LOW: { resp: 240, res: 1440 },
  };

  const defaults = defaultMinutesByPriority[priority] || defaultMinutesByPriority['MEDIUM'];
  const firstResponseMinutes = rule ? rule.firstResponseMinutes : defaults.resp;
  const resolutionMinutes = rule ? rule.resolutionMinutes : defaults.res;

  const firstResponseDueAt = new Date(baseDate.getTime() + firstResponseMinutes * 60000);
  const resolutionDueAt = new Date(baseDate.getTime() + resolutionMinutes * 60000);

  return {
    slaRuleId: rule ? rule.id : null,
    firstResponseDueAt,
    resolutionDueAt,
    slaStatus: 'WITHIN_SLA',
  };
}

export async function checkAndProcessSlaBreaches(): Promise<{
  checkedCount: number;
  warnedCount: number;
  breachedCount: number;
  escalatedCount: number;
}> {
  const activeTickets = await prisma.ticket.findMany({
    where: {
      status: {
        notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'],
      },
    },
    include: {
      slaRule: true,
      assignedAgent: true,
      department: { include: { manager: true } },
    },
  });

  const now = new Date();
  let warnedCount = 0;
  let breachedCount = 0;
  let escalatedCount = 0;

  for (const ticket of activeTickets) {
    if (!ticket.resolutionDueAt) continue;

    const warnThresholdMinutes = ticket.slaRule?.warnBeforeMinutes ?? 30;
    const warnThresholdMs = warnThresholdMinutes * 60000;
    const timeRemainingMs = ticket.resolutionDueAt.getTime() - now.getTime();

    // 1. Check for Near Breach Warning (time remaining <= warnBeforeMinutes and not already breached or warned)
    if (
      timeRemainingMs > 0 &&
      timeRemainingMs <= warnThresholdMs &&
      ticket.slaStatus === 'WITHIN_SLA'
    ) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { slaStatus: 'WARNING_NEAR_BREACH' },
      });

      await prisma.slaHistory.create({
        data: {
          ticketId: ticket.id,
          eventType: 'NEAR_BREACH_WARNING',
          fromLevel: ticket.escalationLevel,
          toLevel: ticket.escalationLevel,
          details: `Resolution SLA is within ${Math.round(timeRemainingMs / 60000)} minutes of deadline.`,
        },
      });

      if (ticket.assignedAgentId) {
        await createNotification({
          userId: ticket.assignedAgentId,
          ticketId: ticket.id,
          title: `⚠️ SLA Warning: ${ticket.ticketNumber}`,
          message: `Ticket "${ticket.subject}" has less than ${Math.round(timeRemainingMs / 60000)} minutes remaining before SLA breach.`,
          type: 'SLA_WARNING',
        });
      }

      warnedCount++;
    }

    // 2. Check for SLA Breach (Deadline has passed)
    const isResolutionBreached = now.getTime() > ticket.resolutionDueAt.getTime();
    const isFirstResponseBreached =
      !ticket.firstRespondedAt &&
      ticket.firstResponseDueAt &&
      now.getTime() > ticket.firstResponseDueAt.getTime();

    if ((isResolutionBreached || isFirstResponseBreached) && ticket.slaStatus !== 'BREACHED') {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { slaStatus: 'BREACHED' },
      });

      await prisma.slaHistory.create({
        data: {
          ticketId: ticket.id,
          eventType: 'SLA_BREACHED',
          fromLevel: ticket.escalationLevel,
          toLevel: ticket.escalationLevel,
          details: isResolutionBreached
            ? 'Resolution deadline passed without ticket closure.'
            : 'First response deadline missed.',
        },
      });

      await logAuditEvent({
        ticketId: ticket.id,
        action: 'SLA_BREACHED',
        entityType: 'Ticket',
        entityId: ticket.id,
        details: { isResolutionBreached, isFirstResponseBreached },
      });

      // Notify agent, manager, and all admins
      if (ticket.assignedAgentId) {
        await createNotification({
          userId: ticket.assignedAgentId,
          ticketId: ticket.id,
          title: `🚨 SLA Breached: ${ticket.ticketNumber}`,
          message: `Ticket "${ticket.subject}" has exceeded its SLA time limit!`,
          type: 'SLA_BREACH',
        });
      }

      if (ticket.department?.managerId) {
        await createNotification({
          userId: ticket.department.managerId,
          ticketId: ticket.id,
          title: `🚨 Team SLA Breach: ${ticket.ticketNumber}`,
          message: `Ticket in ${ticket.department.name} has breached SLA. Assigned to: ${ticket.assignedAgent?.fullName || 'Unassigned'}.`,
          type: 'SLA_BREACH',
        });
      }

      breachedCount++;

      // 3. Auto Escalation on Breach
      if (ticket.escalationLevel === 0 && ticket.status !== 'ESCALATED') {
        const nextLevel = 1; // Escalate to manager
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'ESCALATED',
            escalationLevel: nextLevel,
          },
        });

        await prisma.slaHistory.create({
          data: {
            ticketId: ticket.id,
            eventType: 'AUTO_ESCALATED',
            fromLevel: 0,
            toLevel: nextLevel,
            details: 'Automatic escalation to Team Manager triggered by SLA breach.',
          },
        });

        await logAuditEvent({
          ticketId: ticket.id,
          action: 'AUTO_ESCALATED',
          entityType: 'Ticket',
          entityId: ticket.id,
          details: { fromLevel: 0, toLevel: nextLevel, reason: 'SLA breach' },
        });

        if (ticket.department?.managerId) {
          await createNotification({
            userId: ticket.department.managerId,
            ticketId: ticket.id,
            title: `🔺 Auto-Escalation: ${ticket.ticketNumber}`,
            message: `Ticket "${ticket.subject}" automatically escalated to your manager queue.`,
            type: 'ESCALATION',
          });
        }

        escalatedCount++;
      }
    }
  }

  return {
    checkedCount: activeTickets.length,
    warnedCount,
    breachedCount,
    escalatedCount,
  };
}
