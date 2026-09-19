import { Response } from 'express';
import fs from 'fs';
import prisma from '../db';
import { AuthRequest } from '../middleware/auth';
import { calculateTicketSla } from '../services/slaService';
import { notifyTicketStakeholders, createNotification } from '../services/notificationService';
import { logAuditEvent } from '../utils/auditLogger';
import {
  determineStaffAllocation,
  applyTicketAllocation,
  AutoAllocationResult,
} from '../services/ticketAllocationService';

// Helper to generate unique human-readable ticket number
async function generateTicketNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const count = await prisma.ticket.count();
  const sequence = String(count + 1001).padStart(4, '0');
  return `TKT-${currentYear}-${sequence}`;
}

export async function listTickets(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      search,
      status,
      priority,
      categoryId,
      departmentId,
      assignedAgentId,
      source,
      slaStatus,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    // 1. Role-Based Scoping
    if (req.user?.role === 'CUSTOMER') {
      let customerId = req.user.customerId;
      if (!customerId && req.user.userId) {
        const cust = await prisma.customer.findFirst({
          where: {
            OR: [
              { userId: req.user.userId },
              { email: req.user.email },
            ],
          },
        });
        if (cust) customerId = cust.id;
      }

      where.OR = [
        ...(customerId ? [{ customerId }] : []),
        { createdById: req.user.userId },
        ...(req.user.email ? [{ customer: { email: req.user.email } }] : []),
      ];
    } else if (req.user?.role === 'AGENT') {
      // Default: Agent can view tickets in their department or assigned to them
      if (req.query.scope === 'assigned_to_me') {
        where.assignedAgentId = req.user.userId;
      }
    } else if (req.user?.role === 'MANAGER' && req.user.departmentId) {
      if (req.query.scope === 'my_department') {
        where.departmentId = req.user.departmentId;
      }
    } else if (req.user?.role === 'TELECALLER') {
      if (req.query.scope === 'created_by_me') {
        where.createdById = req.user.userId;
      }
    }

    // 2. Multi-field Filtering
    if (status) {
      const s = String(status).trim();
      const lower = s.toLowerCase();
      if (lower === 'active') {
        where.status = { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'] };
      } else if (lower === 'open') {
        where.status = { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'ESCALATED', 'REOPENED'] };
      } else if (lower === 'resolved' || lower === 'closed') {
        where.status = { in: ['RESOLVED', 'CLOSED'] };
      } else if (s.includes(',')) {
        where.status = { in: s.split(',').map((x) => x.trim().toUpperCase()) };
      } else {
        where.status = s.toUpperCase();
      }
    }
    if (priority) {
      where.priority = (priority as string).toUpperCase();
    }
    if (categoryId) {
      where.categoryId = categoryId as string;
    }
    if (departmentId) {
      where.departmentId = departmentId as string;
    }
    if (assignedAgentId) {
      where.assignedAgentId = assignedAgentId === 'unassigned' ? null : (assignedAgentId as string);
    }
    if (source) {
      where.source = (source as string).toUpperCase();
    }
    if (slaStatus) {
      const sla = String(slaStatus).trim();
      const lowerSla = sla.toLowerCase();
      if (lowerSla === 'critical' || lowerSla === 'alert' || lowerSla === 'alerts' || lowerSla === 'warning') {
        where.slaStatus = { in: ['WARNING_NEAR_BREACH', 'BREACHED'] };
      } else if (sla.includes(',')) {
        where.slaStatus = { in: sla.split(',').map((x) => x.trim().toUpperCase()) };
      } else {
        where.slaStatus = sla.toUpperCase();
      }
    }

    // 3. Text Search (Ticket #, Subject, Customer Name, Email, Phone)
    if (search) {
      const q = (search as string).trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { ticketNumber: { contains: q } },
            { subject: { contains: q } },
            { description: { contains: q } },
            { customer: { name: { contains: q } } },
            { customer: { phone: { contains: q } } },
            { customer: { email: { contains: q } } },
          ],
        },
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'resolutionDueAt') {
      orderBy.resolutionDueAt = sortOrder === 'asc' ? 'asc' : 'desc';
    } else if (sortBy === 'priority') {
      orderBy.priority = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = sortOrder === 'asc' ? 'asc' : 'desc';
    }

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          customer: true,
          category: true,
          subcategory: true,
          department: true,
          assignedAgent: {
            select: { id: true, fullName: true, email: true, role: true },
          },
          creator: {
            select: { id: true, fullName: true, role: true },
          },
          feedback: true,
          _count: {
            select: {
              messages: true,
              internalNotes: true,
              attachments: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      tickets,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to list tickets', error: error.message });
  }
}

export async function checkDuplicateTicket(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { customerId: providedCustomerId, categoryId, subcategoryId, subject } = req.body;

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      res.json({ success: true, hasDuplicate: false, duplicates: [] });
      return;
    }

    let customerId = providedCustomerId;
    if (req.user?.role === 'CUSTOMER') {
      if (req.user.customerId) {
        customerId = req.user.customerId;
      } else {
        const cust = await prisma.customer.findFirst({ where: { userId: req.user.userId } });
        if (cust) customerId = cust.id;
      }
    } else if (!customerId) {
      const cust = await prisma.customer.findFirst({ where: { userId: req.user!.userId } });
      if (cust) customerId = cust.id;
    }

    if (!customerId) {
      res.json({ success: true, hasDuplicate: false, duplicates: [] });
      return;
    }

    const activeTickets = await prisma.ticket.findMany({
      where: {
        customerId,
        status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'ESCALATED'] },
      },
      include: {
        category: true,
        subcategory: true,
        department: true,
        assignedAgent: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (activeTickets.length === 0) {
      res.json({ success: true, hasDuplicate: false, duplicates: [] });
      return;
    }

    const queryClean = subject.toLowerCase().trim();
    const queryTokens = queryClean
      .split(/[\s,._\-:;!?]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3);

    const matches = activeTickets.filter((ticket) => {
      const sameCategory = categoryId && ticket.categoryId === categoryId;
      const sameSubcategory = subcategoryId && ticket.subcategoryId === subcategoryId;

      const ticketSubjectLower = ticket.subject.toLowerCase();
      const directSubstring = ticketSubjectLower.includes(queryClean) || queryClean.includes(ticketSubjectLower);

      const ticketTokens = ticketSubjectLower
        .split(/[\s,._\-:;!?]+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 3);

      const commonTokens = queryTokens.filter((token) => ticketTokens.includes(token));
      const overlapRatio = queryTokens.length > 0 ? commonTokens.length / queryTokens.length : 0;

      const techKeywords = ['vpn', 'password', 'login', 'lockout', 'locked', 'invoice', 'billing', 'charge', 'crash', 'error', 'wifi', 'network', 'outlook', 'email', 'license', 'hardware', 'laptop'];
      const hasSharedTechKeyword = commonTokens.some((t) => techKeywords.includes(t));

      if (directSubstring) return true;
      if (overlapRatio >= 0.5 && commonTokens.length >= 2) return true;
      if (sameCategory && (hasSharedTechKeyword || sameSubcategory)) return true;

      return false;
    });

    res.json({
      success: true,
      hasDuplicate: matches.length > 0,
      duplicates: matches.slice(0, 3),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to check duplicate tickets', error: error.message });
  }
}

export async function createTicket(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      customerId: providedCustomerId,
      categoryId,
      subcategoryId,
      departmentId: providedDeptId,
      subject,
      description,
      priority = 'MEDIUM',
      source: providedSource,
      callSummary,
      assignedAgentId,
      initialMessage,
      watchers: providedWatchers,
    } = req.body;

    // Robust input validation
    if (!subject || typeof subject !== 'string' || subject.trim().length < 5) {
      res.status(400).json({ success: false, message: 'Please enter a clear subject with at least 5 characters.' });
      return;
    }
    if (subject.trim().length > 200) {
      res.status(400).json({ success: false, message: 'Subject cannot exceed 200 characters.' });
      return;
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      res.status(400).json({ success: false, message: 'Please provide an issue description with at least 10 characters.' });
      return;
    }
    if (!categoryId) {
      res.status(400).json({ success: false, message: 'Please select an issue category.' });
      return;
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { department: true },
    });
    if (!category) {
      res.status(400).json({ success: false, message: 'Invalid category specified.' });
      return;
    }

    // Verify subcategory if provided
    if (subcategoryId) {
      const sub = await prisma.subcategory.findFirst({
        where: { id: subcategoryId, categoryId },
      });
      if (!sub) {
        res.status(400).json({ success: false, message: 'Selected subcategory is invalid for this category.' });
        return;
      }
    }

    let customerId = providedCustomerId;
    let source = providedSource || 'CUSTOMER_PORTAL';

    // If customer is creating, enforce customer ownership
    if (req.user?.role === 'CUSTOMER') {
      if (!req.user.customerId) {
        // Find or create customer profile for this user
        let cust = await prisma.customer.findFirst({ where: { userId: req.user.userId } });
        if (!cust) {
          cust = await prisma.customer.create({
            data: {
              userId: req.user.userId,
              name: req.user.email.split('@')[0],
              email: req.user.email,
              phone: 'Not provided',
            },
          });
        }
        customerId = cust.id;
      } else {
        customerId = req.user.customerId;
      }
      source = 'CUSTOMER_PORTAL';
    } else if (req.user?.role === 'TELECALLER') {
      source = providedSource || 'TELECALLER';
    }

    // If internal staff (Admin, Manager, Agent) is raising a ticket for themselves without selecting a customer
    if (!customerId) {
      let cust = await prisma.customer.findFirst({ where: { userId: req.user!.userId } });
      if (!cust) {
        cust = await prisma.customer.create({
          data: {
            userId: req.user!.userId,
            name: req.user!.email.split('@')[0],
            email: req.user!.email,
            phone: 'Internal Staff',
          },
        });
      }
      customerId = cust.id;
    }

    // Derive Department from Category if not explicitly provided
    const departmentId = providedDeptId || category.departmentId;

    // Generate unique Ticket ID
    const ticketNumber = await generateTicketNumber();

    // Calculate SLA deadlines
    const sla = await calculateTicketSla(priority, categoryId);

    // Automatic Staff Allocation:
    // Route to appropriate department staff/specialist based on role hierarchy and workload balancing
    let finalAssignedAgentId = assignedAgentId || null;
    let allocationDetails: AutoAllocationResult | null = null;

    if (!finalAssignedAgentId && departmentId) {
      allocationDetails = await determineStaffAllocation(departmentId, categoryId, priority);
      if (allocationDetails) {
        finalAssignedAgentId = allocationDetails.agentId;
      }
    }

    const initialStatus = finalAssignedAgentId ? 'ASSIGNED' : 'NEW';

    // Parse and validate CC / Watchers
    let watchersJson: string | null = null;
    if (Array.isArray(providedWatchers) && providedWatchers.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validWatchers = Array.from(
        new Set(
          providedWatchers
            .map((w: any) => String(w).trim().toLowerCase())
            .filter((w: string) => emailRegex.test(w) && w !== req.user?.email.toLowerCase())
        )
      );
      if (validWatchers.length > 0) {
        watchersJson = JSON.stringify(validWatchers);
      }
    }

    const ticketData: any = {
      ticketNumber,
      customerId,
      createdById: req.user!.userId,
      source,
      categoryId,
      subcategoryId: subcategoryId || null,
      departmentId,
      assignedAgentId: finalAssignedAgentId,
      subject: subject.trim(),
      description: description.trim(),
      callSummary: callSummary ? callSummary.trim() : null,
      priority,
      status: initialStatus,
      slaRuleId: sla.slaRuleId,
      firstResponseDueAt: sla.firstResponseDueAt,
      resolutionDueAt: sla.resolutionDueAt,
      slaStatus: sla.slaStatus,
      watchers: watchersJson,
    };

    const ticket = await prisma.ticket.create({
      data: ticketData,
      include: {
        customer: true,
        category: true,
        subcategory: true,
        department: true,
        assignedAgent: true,
      },
    });

    // Create initial message in thread
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: req.user!.userId,
        senderType: req.user!.role,
        message: initialMessage || description,
      },
    });

    // Record assignment history if assigned
    if (finalAssignedAgentId) {
      await prisma.ticketAssignment.create({
        data: {
          ticketId: ticket.id,
          assignedById: req.user!.userId,
          assignedToId: finalAssignedAgentId,
          reason: allocationDetails
            ? allocationDetails.reason
            : 'Initial assignment upon creation',
        },
      });

      // Dispatch specific assignment notification to the allocated staff
      if (allocationDetails) {
        await createNotification({
          userId: finalAssignedAgentId,
          ticketId: ticket.id,
          title: `🎯 Ticket Auto-Allocated: ${ticket.ticketNumber}`,
          message: `Ticket ${ticket.ticketNumber} ("${ticket.subject}") has been automatically allocated to you based on your role and department workload (${allocationDetails.departmentName || 'Support'}). Priority: ${ticket.priority}.`,
          type: 'ASSIGNMENT',
        });
      }
    }

    // Record status history
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        changedById: req.user!.userId,
        oldStatus: 'NONE',
        newStatus: initialStatus,
        reason: allocationDetails
          ? `Ticket created & auto-allocated to ${allocationDetails.agentName}`
          : 'Ticket created',
      },
    });

    // Record SLA history
    await prisma.slaHistory.create({
      data: {
        ticketId: ticket.id,
        eventType: 'DEADLINE_SET',
        fromLevel: 0,
        toLevel: 0,
        details: `Initial SLA calculated for ${priority} priority. Resolution due at: ${sla.resolutionDueAt.toISOString()}`,
      },
    });

    // Log Audit Event
    await logAuditEvent({
      userId: req.user!.userId,
      ticketId: ticket.id,
      action: 'TICKET_CREATED',
      entityType: 'Ticket',
      entityId: ticket.id,
      details: {
        ticketNumber: ticket.ticketNumber,
        priority,
        categoryId,
        source,
        assignedAgentId: finalAssignedAgentId,
        autoAllocated: Boolean(allocationDetails),
        allocationReason: allocationDetails?.reason,
      },
      req,
    });

    // Notify stakeholders
    await notifyTicketStakeholders({
      ticketId: ticket.id,
      actorId: req.user!.userId,
      title: `🎫 New Ticket Created: ${ticket.ticketNumber}`,
      message: `Ticket "${ticket.subject}" created by ${req.user!.email} [${priority}]${allocationDetails ? ` and auto-allocated to ${allocationDetails.agentName}` : ''}.`,
      type: 'STATUS_CHANGE',
    });

    res.status(201).json({ success: true, ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create ticket', error: error.message });
  }
}

export async function getTicketById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const isCustomer = req.user?.role === 'CUSTOMER';

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: true,
        category: true,
        subcategory: true,
        department: {
          include: { manager: true },
        },
        assignedAgent: {
          select: { id: true, fullName: true, email: true, role: true, phone: true },
        },
        creator: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, fullName: true, role: true, email: true },
            },
            attachments: true,
          },
        },
        // Customers MUST NOT receive internal notes
        internalNotes: isCustomer
          ? false
          : {
              orderBy: { createdAt: 'desc' },
              include: {
                author: {
                  select: { id: true, fullName: true, role: true },
                },
                attachments: true,
              },
            },
        attachments: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploader: {
              select: { id: true, fullName: true, role: true },
            },
          },
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedBy: { select: { fullName: true } },
            assignedTo: { select: { fullName: true } },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { fullName: true, role: true } },
          },
        },
        slaHistory: {
          orderBy: { createdAt: 'desc' },
        },
        feedback: true,
      },
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    res.json({ success: true, ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch ticket details', error: error.message });
  }
}

export async function updateTicketStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { status: newStatus, reason, resolutionNotes } = req.body;

    const validStatuses = [
      'NEW',
      'ASSIGNED',
      'IN_PROGRESS',
      'WAITING_FOR_CUSTOMER',
      'ESCALATED',
      'RESOLVED',
      'REOPENED',
      'CLOSED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(newStatus)) {
      res.status(400).json({ success: false, message: `Invalid status: ${newStatus}` });
      return;
    }

    const currentTicket = await prisma.ticket.findUnique({ where: { id } });
    if (!currentTicket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    const updateData: any = {
      status: newStatus,
    };

    const now = new Date();

    // Handle First Response timestamp
    if (newStatus === 'IN_PROGRESS' && !currentTicket.firstRespondedAt) {
      updateData.firstRespondedAt = now;
    }

    // Handle Resolution
    if (newStatus === 'RESOLVED') {
      updateData.resolvedAt = now;
      if (resolutionNotes) {
        updateData.resolutionNotes = resolutionNotes;
      }
    }

    // Handle Closure
    if (newStatus === 'CLOSED') {
      updateData.closedAt = now;
    }

    // Handle Reopen
    if (newStatus === 'REOPENED') {
      updateData.reopenCount = currentTicket.reopenCount + 1;
      updateData.resolvedAt = null;
      updateData.status = 'IN_PROGRESS'; // Transition back to active work
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: { customer: true, assignedAgent: true },
    });

    // Record Status History
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: id,
        changedById: req.user!.userId,
        oldStatus: currentTicket.status,
        newStatus: updateData.status,
        reason: reason || resolutionNotes || `Status transitioned to ${updateData.status}`,
      },
    });

    // Log Audit Event
    await logAuditEvent({
      userId: req.user!.userId,
      ticketId: id,
      action: 'TICKET_STATUS_CHANGED',
      entityType: 'Ticket',
      entityId: id,
      details: { oldStatus: currentTicket.status, newStatus: updateData.status, reason },
      req,
    });

    // Notify stakeholders
    await notifyTicketStakeholders({
      ticketId: id,
      actorId: req.user!.userId,
      title: `Status Changed: ${currentTicket.ticketNumber}`,
      message: `Status updated from ${currentTicket.status} to ${updateData.status}.`,
      type: 'STATUS_CHANGE',
    });

    res.json({ success: true, ticket: updatedTicket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
}

export async function assignTicket(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { assignedAgentId, departmentId, reason } = req.body;

    const currentTicket = await prisma.ticket.findUnique({ where: { id } });
    if (!currentTicket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    const updateData: any = {};
    if (assignedAgentId !== undefined) {
      updateData.assignedAgentId = assignedAgentId || null;
      if (assignedAgentId && currentTicket.status === 'NEW') {
        updateData.status = 'ASSIGNED';
      }
    }
    if (departmentId) {
      updateData.departmentId = departmentId;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: { assignedAgent: true, department: true },
    });

    if (assignedAgentId) {
      await prisma.ticketAssignment.create({
        data: {
          ticketId: id,
          assignedById: req.user!.userId,
          assignedToId: assignedAgentId,
          reason: reason || 'Reassigned by team leader/admin',
        },
      });
    }

    await logAuditEvent({
      userId: req.user!.userId,
      ticketId: id,
      action: 'TICKET_ASSIGNED',
      entityType: 'Ticket',
      entityId: id,
      details: { assignedAgentId, departmentId, reason },
      req,
    });

    await notifyTicketStakeholders({
      ticketId: id,
      actorId: req.user!.userId,
      title: `Assignment Update: ${currentTicket.ticketNumber}`,
      message: `Ticket assigned to ${updatedTicket.assignedAgent?.fullName || 'Unassigned'}.`,
      type: 'ASSIGNMENT',
    });

    res.json({ success: true, ticket: updatedTicket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to assign ticket', error: error.message });
  }
}

export async function autoAllocateTicket(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { department: true, category: true },
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    const deptId = ticket.departmentId || ticket.category?.departmentId;
    if (!deptId) {
      res.status(400).json({ success: false, message: 'Ticket has no associated department for allocation' });
      return;
    }

    const allocation = await determineStaffAllocation(deptId, ticket.categoryId || undefined, ticket.priority);
    if (!allocation) {
      res.status(400).json({ success: false, message: 'No available staff or project handlers found for allocation' });
      return;
    }

    const updatedTicket = await applyTicketAllocation(ticket.id, req.user!.userId, allocation);

    await logAuditEvent({
      userId: req.user!.userId,
      ticketId: id,
      action: 'TICKET_AUTO_ALLOCATED',
      entityType: 'Ticket',
      entityId: id,
      details: {
        assignedAgentId: allocation.agentId,
        autoAllocated: true,
        reason: allocation.reason,
      },
      req,
    });

    res.json({
      success: true,
      ticket: updatedTicket,
      allocation,
      message: `Successfully allocated to ${allocation.agentName}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to auto-allocate ticket', error: error.message });
  }
}

export async function bulkUpdateTickets(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { ticketIds, status, assignedAgentId, reason } = req.body;

    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      res.status(400).json({ success: false, message: 'Array of ticketIds is required' });
      return;
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (assignedAgentId !== undefined) {
      updateData.assignedAgentId = assignedAgentId || null;
      if (assignedAgentId && status === undefined) {
        updateData.status = 'ASSIGNED';
      }
    }

    const now = new Date();
    if (status === 'RESOLVED') {
      updateData.resolvedAt = now;
      updateData.resolutionNotes = reason || 'Batch resolved by support staff';
    } else if (status === 'CLOSED') {
      updateData.closedAt = now;
    }

    // Execute bulk update
    const result = await prisma.ticket.updateMany({
      where: { id: { in: ticketIds } },
      data: updateData,
    });

    // Record assignments or status history for each ticket
    for (const tid of ticketIds) {
      if (assignedAgentId) {
        await prisma.ticketAssignment.create({
          data: {
            ticketId: tid,
            assignedById: req.user!.userId,
            assignedToId: assignedAgentId,
            reason: reason || 'Batch reassignment by administrator/manager',
          },
        });
      }
      if (status) {
        await prisma.ticketStatusHistory.create({
          data: {
            ticketId: tid,
            changedById: req.user!.userId,
            oldStatus: 'BATCH_UPDATE',
            newStatus: status,
            reason: reason || `Batch update to ${status}`,
          },
        });
      }
    }

    await logAuditEvent({
      userId: req.user!.userId,
      action: 'TICKETS_BATCH_UPDATED',
      entityType: 'Ticket',
      entityId: ticketIds[0],
      details: { count: result.count, updateData, reason },
      req,
    });

    res.json({
      success: true,
      count: result.count,
      message: `Successfully updated ${result.count} tickets.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to batch update tickets', error: error.message });
  }
}

export async function updateTicketPriority(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { priority } = req.body;

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validPriorities.includes(priority)) {
      res.status(400).json({ success: false, message: 'Invalid priority.' });
      return;
    }

    const currentTicket = await prisma.ticket.findUnique({ where: { id } });
    if (!currentTicket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    // Recalculate SLA based on new priority
    const sla = await calculateTicketSla(priority, currentTicket.categoryId, currentTicket.createdAt);

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        priority,
        slaRuleId: sla.slaRuleId,
        firstResponseDueAt: sla.firstResponseDueAt,
        resolutionDueAt: sla.resolutionDueAt,
        slaStatus: sla.slaStatus,
      },
    });

    await prisma.slaHistory.create({
      data: {
        ticketId: id,
        eventType: 'DEADLINE_SET',
        fromLevel: currentTicket.escalationLevel,
        toLevel: currentTicket.escalationLevel,
        details: `Priority updated to ${priority}. SLA adjusted.`,
      },
    });

    await logAuditEvent({
      userId: req.user!.userId,
      ticketId: id,
      action: 'PRIORITY_CHANGED',
      entityType: 'Ticket',
      entityId: id,
      details: { oldPriority: currentTicket.priority, newPriority: priority },
      req,
    });

    res.json({ success: true, ticket: updatedTicket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update priority', error: error.message });
  }
}

export async function escalateTicket(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { reason, targetLevel = 1 } = req.body;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'ESCALATED',
        escalationLevel: Math.min(2, Math.max(1, targetLevel)),
      },
    });

    await prisma.slaHistory.create({
      data: {
        ticketId: id,
        eventType: 'MANUAL_ESCALATED',
        fromLevel: ticket.escalationLevel,
        toLevel: updatedTicket.escalationLevel,
        details: reason || 'Manual escalation initiated.',
      },
    });

    await logAuditEvent({
      userId: req.user!.userId,
      ticketId: id,
      action: 'TICKET_ESCALATED_MANUAL',
      entityType: 'Ticket',
      entityId: id,
      details: { fromLevel: ticket.escalationLevel, toLevel: updatedTicket.escalationLevel, reason },
      req,
    });

    await notifyTicketStakeholders({
      ticketId: id,
      actorId: req.user!.userId,
      title: `🔺 Ticket Escalated: ${ticket.ticketNumber}`,
      message: `Ticket escalated to Level ${updatedTicket.escalationLevel}. Reason: ${reason || 'Immediate attention needed.'}`,
      type: 'ESCALATION',
    });

    res.json({ success: true, ticket: updatedTicket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to escalate ticket', error: error.message });
  }
}

export async function addMessage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const ticketId = req.params.id as string;
    const { message } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
      return;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    const senderType = req.user!.role;
    const newMsg = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: req.user!.userId,
        senderType,
        message: message.trim(),
        isCustomerVisible: true,
      },
      include: {
        sender: {
          select: { id: true, fullName: true, role: true, email: true },
        },
        attachments: true,
      },
    });

    // Auto-advance status based on conversation flow:
    if (senderType === 'CUSTOMER' && ticket.status === 'WAITING_FOR_CUSTOMER') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' },
      });
      await prisma.ticketStatusHistory.create({
        data: {
          ticketId,
          changedById: req.user!.userId,
          oldStatus: 'WAITING_FOR_CUSTOMER',
          newStatus: 'IN_PROGRESS',
          reason: 'Customer replied with additional information',
        },
      });
    } else if (['AGENT', 'MANAGER', 'ADMIN'].includes(senderType)) {
      // If agent has replied, record firstRespondedAt
      if (!ticket.firstRespondedAt) {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { firstRespondedAt: new Date() },
        });
      }
    }

    await notifyTicketStakeholders({
      ticketId,
      actorId: req.user!.userId,
      title: `💬 New Reply: ${ticket.ticketNumber}`,
      message: `${req.user!.email}: ${message.slice(0, 100)}`,
      type: 'NEW_REPLY',
    });

    res.status(201).json({ success: true, message: newMsg });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to post message', error: error.message });
  }
}

export async function addInternalNote(req: AuthRequest, res: Response): Promise<void> {
  try {
    const ticketId = req.params.id as string;
    const { note } = req.body;

    if (!note || !note.trim()) {
      res.status(400).json({ success: false, message: 'Internal note text cannot be empty.' });
      return;
    }

    if (req.user?.role === 'CUSTOMER') {
      res.status(403).json({ success: false, message: 'Customers cannot add internal notes.' });
      return;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    const internalNote = await prisma.internalNote.create({
      data: {
        ticketId,
        authorId: req.user!.userId,
        note: note.trim(),
      },
      include: {
        author: {
          select: { id: true, fullName: true, role: true },
        },
        attachments: true,
      },
    });

    await logAuditEvent({
      userId: req.user!.userId,
      ticketId,
      action: 'INTERNAL_NOTE_ADDED',
      entityType: 'Ticket',
      entityId: ticketId,
      details: { noteLength: note.length },
      req,
    });

    res.status(201).json({ success: true, note: internalNote });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to add internal note', error: error.message });
  }
}

export async function submitFeedback(req: AuthRequest, res: Response): Promise<void> {
  try {
    const ticketId = req.params.id as string;
    const { rating, feedbackText } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
      return;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    const feedback = await prisma.customerFeedback.upsert({
      where: { ticketId },
      update: {
        rating: parseInt(rating, 10),
        feedbackText: feedbackText || null,
      },
      create: {
        ticketId,
        customerId: ticket.customerId,
        rating: parseInt(rating, 10),
        feedbackText: feedbackText || null,
      },
    });

    await logAuditEvent({
      userId: req.user?.userId,
      ticketId,
      action: 'CUSTOMER_FEEDBACK_SUBMITTED',
      entityType: 'Ticket',
      entityId: ticketId,
      details: { rating, feedbackLength: feedbackText?.length || 0 },
      req,
    });

    res.status(201).json({ success: true, feedback });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to submit feedback', error: error.message });
  }
}

export async function uploadAttachment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const ticketId = req.params.id as string;
    const { messageId, internalNoteId } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded.' });
      return;
    }

    try {
      const attachment = await prisma.attachment.create({
        data: {
          ticketId,
          messageId: messageId || null,
          internalNoteId: internalNoteId || null,
          uploaderId: req.user!.userId,
          fileName: file.filename,
          originalName: file.originalname,
          filePath: `/uploads/${file.filename}`,
          fileSize: file.size,
          mimeType: file.mimetype,
        },
      });

      res.status(201).json({ success: true, attachment });
    } catch (dbErr: any) {
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkErr) {
          console.error('Failed to unlink failed attachment file:', unlinkErr);
        }
      }
      throw dbErr;
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to upload attachment', error: error.message });
  }
}

export async function uploadAttachmentsBatch(req: AuthRequest, res: Response): Promise<void> {
  try {
    const ticketId = req.params.id as string;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No files provided.' });
      return;
    }

    const createdAttachments = [];
    const failedFiles: { name: string; error: string }[] = [];

    for (const file of files) {
      try {
        const att = await prisma.attachment.create({
          data: {
            ticketId,
            uploaderId: req.user!.userId,
            fileName: file.filename,
            originalName: file.originalname,
            filePath: `/uploads/${file.filename}`,
            fileSize: file.size,
            mimeType: file.mimetype,
          },
        });
        createdAttachments.push(att);
      } catch (err: any) {
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkErr) {
            console.error('Failed to unlink failed batch file:', unlinkErr);
          }
        }
        failedFiles.push({ name: file.originalname, error: err.message });
      }
    }

    res.status(201).json({
      success: true,
      attachments: createdAttachments,
      failedFiles: failedFiles.length > 0 ? failedFiles : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to batch upload attachments', error: error.message });
  }
}

