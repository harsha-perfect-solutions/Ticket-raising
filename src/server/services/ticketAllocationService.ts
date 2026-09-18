import prisma from '../db';
import { logAuditEvent } from '../utils/auditLogger';
import { createNotification } from './notificationService';

export interface AllocationCandidate {
  id: string;
  fullName: string;
  email: string;
  role: string;
  departmentId: string | null;
  activeTicketCount: number;
  lastAssignedAt?: Date | null;
}

export interface AutoAllocationResult {
  agentId: string;
  agentName: string;
  agentRole: string;
  departmentName?: string;
  reason: string;
}

/**
 * Automatically determine the best staff member to allocate a ticket to
 * based on Department routing, Role hierarchy, and Least-Loaded workload balancing.
 */
export async function determineStaffAllocation(
  departmentId: string,
  categoryId?: string,
  priority: string = 'MEDIUM'
): Promise<AutoAllocationResult | null> {
  try {
    // 1. Fetch Department and verify
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        manager: { select: { id: true, fullName: true, email: true, role: true, isActive: true } },
      },
    });

    const deptName = department?.name || 'Support Department';

    // 2. Query all active AGENT members in this specific department
    const deptAgents = await prisma.user.findMany({
      where: {
        departmentId,
        role: 'AGENT',
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        departmentId: true,
      },
    });

    if (deptAgents.length > 0) {
      // Calculate active ticket workload for each agent in this department
      const scoredAgents = await Promise.all(
        deptAgents.map(async (agent) => {
          const activeCount = await prisma.ticket.count({
            where: {
              assignedAgentId: agent.id,
              status: { in: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_CUSTOMER', 'ESCALATED'] },
            },
          });

          // Also get most recent assignment to break ties via round-robin
          const lastAssignment = await prisma.ticketAssignment.findFirst({
            where: { assignedToId: agent.id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          });

          return {
            ...agent,
            activeTicketCount: activeCount,
            lastAssignedAt: lastAssignment?.createdAt || new Date(0),
          };
        })
      );

      // Sort: 1) Lowest active ticket count first, 2) Least recently assigned first
      scoredAgents.sort((a, b) => {
        if (a.activeTicketCount !== b.activeTicketCount) {
          return a.activeTicketCount - b.activeTicketCount;
        }
        return a.lastAssignedAt.getTime() - b.lastAssignedAt.getTime();
      });

      const bestAgent = scoredAgents[0];
      return {
        agentId: bestAgent.id,
        agentName: bestAgent.fullName,
        agentRole: bestAgent.role,
        departmentName: deptName,
        reason: `Auto-allocated to ${bestAgent.fullName} (${deptName} specialist, currently handling ${bestAgent.activeTicketCount} active tickets)`,
      };
    }

    // 3. Department has no active agents -> Fallback to Department Manager / Team Lead
    if (department?.manager && department.manager.isActive) {
      const activeCount = await prisma.ticket.count({
        where: {
          assignedAgentId: department.manager.id,
          status: { in: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_CUSTOMER', 'ESCALATED'] },
        },
      });

      return {
        agentId: department.manager.id,
        agentName: department.manager.fullName,
        agentRole: department.manager.role,
        departmentName: deptName,
        reason: `Auto-allocated to Department Lead ${department.manager.fullName} (${deptName} manager oversight, ${activeCount} active tickets)`,
      };
    }

    // 4. No staff in department -> Fallback to general organization AGENT pool (Least-Loaded)
    const allOrgAgents = await prisma.user.findMany({
      where: {
        role: 'AGENT',
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        departmentId: true,
        department: { select: { name: true } },
      },
    });

    if (allOrgAgents.length > 0) {
      const scoredOrgAgents = await Promise.all(
        allOrgAgents.map(async (agent) => {
          const activeCount = await prisma.ticket.count({
            where: {
              assignedAgentId: agent.id,
              status: { in: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_CUSTOMER', 'ESCALATED'] },
            },
          });
          return {
            ...agent,
            activeTicketCount: activeCount,
          };
        })
      );

      scoredOrgAgents.sort((a, b) => a.activeTicketCount - b.activeTicketCount);
      const chosenAgent = scoredOrgAgents[0];

      return {
        agentId: chosenAgent.id,
        agentName: chosenAgent.fullName,
        agentRole: chosenAgent.role,
        departmentName: chosenAgent.department?.name || 'General Support',
        reason: `Auto-allocated to ${chosenAgent.fullName} (General Support agent pool, ${chosenAgent.activeTicketCount} active tickets)`,
      };
    }

    // 5. Ultimate fallback: Any active Manager or Admin
    const fallbackStaff = await prisma.user.findFirst({
      where: {
        role: { in: ['MANAGER', 'ADMIN'] },
        isActive: true,
      },
      select: { id: true, fullName: true, role: true },
    });

    if (fallbackStaff) {
      return {
        agentId: fallbackStaff.id,
        agentName: fallbackStaff.fullName,
        agentRole: fallbackStaff.role,
        departmentName: deptName,
        reason: `Auto-allocated to ${fallbackStaff.fullName} (Escalation / Admin handler)`,
      };
    }

    return null;
  } catch (error) {
    console.error('Error determining staff allocation:', error);
    return null;
  }
}

/**
 * Apply automatic allocation to an existing ticket, recording status history,
 * assignment trail, audit logs, and dispatching real-time notifications.
 */
export async function applyTicketAllocation(
  ticketId: string,
  actorUserId: string,
  allocation: AutoAllocationResult
) {
  try {
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedAgentId: allocation.agentId,
        status: 'ASSIGNED',
      },
      include: {
        assignedAgent: true,
        department: true,
        category: true,
        customer: true,
      },
    });

    // 1. Create Ticket Assignment Record
    await prisma.ticketAssignment.create({
      data: {
        ticketId: ticketId,
        assignedById: actorUserId,
        assignedToId: allocation.agentId,
        reason: allocation.reason,
      },
    });

    // 2. Create Status History Record
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticketId,
        changedById: actorUserId,
        oldStatus: 'NEW',
        newStatus: 'ASSIGNED',
        reason: allocation.reason,
      },
    });

    // 3. Send Notification to the allocated agent
    await createNotification({
      userId: allocation.agentId,
      ticketId: ticketId,
      title: `Ticket Allocated: ${updatedTicket.ticketNumber}`,
      message: `You have been allocated ticket ${updatedTicket.ticketNumber} ("${updatedTicket.subject}") in ${allocation.departmentName || 'Support'}. Priority: ${updatedTicket.priority}.`,
      type: 'ASSIGNMENT',
    });

    return updatedTicket;
  } catch (error) {
    console.error(`Failed to apply allocation to ticket ${ticketId}:`, error);
    throw error;
  }
}
