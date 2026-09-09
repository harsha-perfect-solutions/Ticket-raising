import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean up existing records in reverse dependency order
  await prisma.customerFeedback.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.slaHistory.deleteMany();
  await prisma.ticketStatusHistory.deleteMany();
  await prisma.ticketAssignment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.internalNote.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.slaRule.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('password123', salt);

  // 2. Create Departments
  const techSupportDept = await prisma.department.create({
    data: {
      name: 'Technical Support',
      description: 'Handles software bugs, system integrations, and application issues.',
      isActive: true,
    },
  });

  const billingDept = await prisma.department.create({
    data: {
      name: 'Billing & Payments',
      description: 'Handles subscriptions, invoices, refunds, and payment gateway issues.',
      isActive: true,
    },
  });

  const customerSuccessDept = await prisma.department.create({
    data: {
      name: 'Customer Success & Account',
      description: 'Handles account onboarding, plan upgrades, and feature requests.',
      isActive: true,
    },
  });

  // 3. Create Categories & Subcategories
  const catSoftwareBug = await prisma.category.create({
    data: {
      name: 'Software Glitch & Bug',
      departmentId: techSupportDept.id,
      defaultPriority: 'HIGH',
      isActive: true,
      subcategories: {
        create: [
          { name: 'UI / Display Issue' },
          { name: 'Data Sync Error' },
          { name: 'Crash / Server Error 500' },
        ],
      },
    },
    include: { subcategories: true },
  });

  const catBilling = await prisma.category.create({
    data: {
      name: 'Billing Inquiry & Invoices',
      departmentId: billingDept.id,
      defaultPriority: 'MEDIUM',
      isActive: true,
      subcategories: {
        create: [
          { name: 'Duplicate Charge' },
          { name: 'Invoice Request' },
          { name: 'Payment Gateway Failure' },
        ],
      },
    },
    include: { subcategories: true },
  });

  const catAccount = await prisma.category.create({
    data: {
      name: 'Account Access & Security',
      departmentId: customerSuccessDept.id,
      defaultPriority: 'CRITICAL',
      isActive: true,
      subcategories: {
        create: [
          { name: 'Locked Out / 2FA Reset' },
          { name: 'Password Reset Failure' },
          { name: 'Role Permission Issue' },
        ],
      },
    },
    include: { subcategories: true },
  });

  // 4. Create Configurable SLA Rules
  await prisma.slaRule.createMany({
    data: [
      {
        priority: 'CRITICAL',
        firstResponseMinutes: 15,
        resolutionMinutes: 60, // 1 hour
        warnBeforeMinutes: 15,
        autoEscalateMinutes: 30,
        isActive: true,
      },
      {
        priority: 'HIGH',
        firstResponseMinutes: 60,
        resolutionMinutes: 240, // 4 hours
        warnBeforeMinutes: 45,
        autoEscalateMinutes: 120,
        isActive: true,
      },
      {
        priority: 'MEDIUM',
        firstResponseMinutes: 120,
        resolutionMinutes: 480, // 8 hours
        warnBeforeMinutes: 90,
        autoEscalateMinutes: 240,
        isActive: true,
      },
      {
        priority: 'LOW',
        firstResponseMinutes: 240,
        resolutionMinutes: 1440, // 24 hours
        warnBeforeMinutes: 180,
        autoEscalateMinutes: 720,
        isActive: true,
      },
    ],
  });

  // 5. Create Key Users for All 5 Roles
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@supportpro.com',
      passwordHash: defaultPassword,
      fullName: 'Alex Vance (Admin)',
      phone: '+1 555-0100',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@supportpro.com',
      passwordHash: defaultPassword,
      fullName: 'Sarah Jenkins (Tech Lead / Manager)',
      phone: '+1 555-0101',
      role: 'MANAGER',
      departmentId: techSupportDept.id,
      isActive: true,
    },
  });
  // Update department manager
  await prisma.department.update({
    where: { id: techSupportDept.id },
    data: { managerId: managerUser.id },
  });

  const agentUser1 = await prisma.user.create({
    data: {
      email: 'agent@supportpro.com',
      passwordHash: defaultPassword,
      fullName: 'David Miller (Senior Agent)',
      phone: '+1 555-0102',
      role: 'AGENT',
      departmentId: techSupportDept.id,
      isActive: true,
    },
  });

  const agentUser2 = await prisma.user.create({
    data: {
      email: 'agent2@supportpro.com',
      passwordHash: defaultPassword,
      fullName: 'Elena Rostova (Billing Agent)',
      phone: '+1 555-0103',
      role: 'AGENT',
      departmentId: billingDept.id,
      isActive: true,
    },
  });

  const telecallerUser = await prisma.user.create({
    data: {
      email: 'telecaller@supportpro.com',
      passwordHash: defaultPassword,
      fullName: 'Marcus Brody (Inbound Telecaller)',
      phone: '+1 555-0104',
      role: 'TELECALLER',
      isActive: true,
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@acme.com',
      passwordHash: defaultPassword,
      fullName: 'Robert Chen (Customer)',
      phone: '+1 555-0199',
      role: 'CUSTOMER',
      isActive: true,
    },
  });

  // 6. Create Customer Profiles
  const customer1 = await prisma.customer.create({
    data: {
      userId: customerUser.id,
      name: 'Robert Chen',
      email: 'customer@acme.com',
      phone: '+1 555-0199',
      company: 'Acme Global Logistics',
      address: '742 Evergreen Terrace, Springfield',
      notes: 'Enterprise Tier Customer with SLA Tier 1 Contract.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Samantha Ray',
      email: 'samantha.ray@fintechcorp.io',
      phone: '+1 555-0245',
      company: 'Fintech Corp',
      address: '100 Financial Way, New York, NY',
      notes: 'High volume payment processing client.',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Michael Scott',
      email: 'm.scott@dundermifflin.com',
      phone: '+1 555-0382',
      company: 'Dunder Mifflin Paper Co.',
      address: '1725 Slough Ave, Scranton, PA',
      notes: 'Regional sales manager, frequent caller for portal training.',
    },
  });

  // 7. Seed Diverse Realistic Tickets
  const now = new Date();

  // Ticket 1: In Progress with Live SLA
  const tkt1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-1001',
      customerId: customer1.id,
      createdById: customerUser.id,
      source: 'CUSTOMER_PORTAL',
      categoryId: catSoftwareBug.id,
      subcategoryId: catSoftwareBug.subcategories[1]?.id,
      departmentId: techSupportDept.id,
      assignedAgentId: agentUser1.id,
      subject: 'Data sync failure between ERP and Inventory module',
      description: 'Since 8:00 AM today, new orders processed in the portal are not syncing with our warehouse inventory module. Error message is: SYNC_TIMEOUT_504.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      firstResponseDueAt: new Date(now.getTime() + 45 * 60000),
      firstRespondedAt: new Date(now.getTime() - 15 * 60000),
      resolutionDueAt: new Date(now.getTime() + 180 * 60000),
      slaStatus: 'WITHIN_SLA',
      escalationLevel: 0,
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: tkt1.id,
      senderId: customerUser.id,
      senderType: 'CUSTOMER',
      message: 'Hello, our warehouse staff is halted because order synchronization is throwing 504 timeouts. Please prioritize!',
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: tkt1.id,
      senderId: agentUser1.id,
      senderType: 'AGENT',
      message: 'Hello Robert, I have acknowledged this high-priority ticket. I am inspecting the queue logs right now and restarting the sync worker daemon.',
    },
  });

  await prisma.internalNote.create({
    data: {
      ticketId: tkt1.id,
      authorId: agentUser1.id,
      note: 'INTERNAL: The Redis job queue was clogged with 14,000 unhandled webhook payloads from yesterday’s bulk upload. Draining the queue safely.',
    },
  });

  await prisma.ticketStatusHistory.create({
    data: {
      ticketId: tkt1.id,
      changedById: agentUser1.id,
      oldStatus: 'NEW',
      newStatus: 'IN_PROGRESS',
      reason: 'Agent began investigating Redis queue sync.',
    },
  });

  // Ticket 2: Created by Telecaller with Call Summary
  const tkt2 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-1002',
      customerId: customer2.id,
      createdById: telecallerUser.id,
      source: 'TELECALLER',
      categoryId: catBilling.id,
      subcategoryId: catBilling.subcategories[0]?.id,
      departmentId: billingDept.id,
      assignedAgentId: agentUser2.id,
      subject: 'Duplicate subscription charge on Corporate Mastercard',
      description: 'Customer called in stating invoice #INV-8891 was billed twice on Feb 28 and March 1st.',
      callSummary: 'Incoming Call: 4m 12s duration. Caller Samantha Ray was polite but urgent. Verified last 4 digits of card (9182). Promised resolution within 4 business hours.',
      priority: 'MEDIUM',
      status: 'WAITING_FOR_CUSTOMER',
      firstResponseDueAt: new Date(now.getTime() + 90 * 60000),
      firstRespondedAt: new Date(now.getTime() - 30 * 60000),
      resolutionDueAt: new Date(now.getTime() + 300 * 60000),
      slaStatus: 'WITHIN_SLA',
      escalationLevel: 0,
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: tkt2.id,
      senderId: telecallerUser.id,
      senderType: 'TELECALLER',
      message: 'Ticket logged via Customer Care Call Desk. Customer requested credit memo or reversal.',
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: tkt2.id,
      senderId: agentUser2.id,
      senderType: 'AGENT',
      message: 'Hi Samantha, we found the redundant transaction batch from Stripe. Could you please confirm if you would prefer an instant account credit or a direct bank refund?',
    },
  });

  await prisma.internalNote.create({
    data: {
      ticketId: tkt2.id,
      authorId: agentUser2.id,
      note: 'INTERNAL: Stripe charge ID ch_3N82b992 is pending void. Awaiting customer confirmation before issuing Stripe refund API call.',
    },
  });

  // Ticket 3: Critical SLA Warning / Escalated Ticket
  const tkt3 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-1003',
      customerId: customer3.id,
      createdById: telecallerUser.id,
      source: 'PHONE',
      categoryId: catAccount.id,
      subcategoryId: catAccount.subcategories[0]?.id,
      departmentId: techSupportDept.id,
      assignedAgentId: agentUser1.id,
      subject: 'Executive account 2FA lockout after phone upgrade',
      description: 'Regional director Michael Scott lost access to his Google Authenticator app during phone transfer. Cannot log in to approve pending contracts.',
      callSummary: 'Caller urgently needs access reset before board meeting. Identity verified via security question & employee ID verification.',
      priority: 'CRITICAL',
      status: 'ESCALATED',
      firstResponseDueAt: new Date(now.getTime() - 10 * 60000),
      firstRespondedAt: new Date(now.getTime() - 5 * 60000),
      resolutionDueAt: new Date(now.getTime() + 10 * 60000), // Near breach (10 mins left)
      slaStatus: 'WARNING_NEAR_BREACH',
      escalationLevel: 1, // Escalated to manager
    },
  });

  await prisma.slaHistory.create({
    data: {
      ticketId: tkt3.id,
      eventType: 'AUTO_ESCALATED',
      fromLevel: 0,
      toLevel: 1,
      details: 'SLA threshold reached 75% without resolution. Escalated to Manager Sarah Jenkins.',
    },
  });

  await prisma.internalNote.create({
    data: {
      ticketId: tkt3.id,
      authorId: managerUser.id,
      note: 'INTERNAL [MANAGER ESCALATION]: I am reviewing the 2FA override request. Verified security tokens. Preparing manual SMS recovery dispatch.',
    },
  });

  // Ticket 4: Resolved Ticket with Customer Feedback
  const tkt4 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-1004',
      customerId: customer1.id,
      createdById: customerUser.id,
      source: 'CUSTOMER_PORTAL',
      categoryId: catSoftwareBug.id,
      subcategoryId: catSoftwareBug.subcategories[0]?.id,
      departmentId: techSupportDept.id,
      assignedAgentId: agentUser1.id,
      subject: 'Export to PDF button generates blank page on Safari 17',
      description: 'When clicking Export Monthly Report on Safari macOS, a 0-byte PDF was downloaded.',
      priority: 'MEDIUM',
      status: 'CLOSED',
      resolvedAt: new Date(now.getTime() - 86400000 * 2),
      closedAt: new Date(now.getTime() - 86400000),
      resolutionNotes: 'Updated the canvas rasterizer polyfill for Webkit/Safari engine. Deployed patch v2.4.1.',
      slaStatus: 'WITHIN_SLA',
      escalationLevel: 0,
    },
  });

  await prisma.customerFeedback.create({
    data: {
      ticketId: tkt4.id,
      customerId: customer1.id,
      rating: 5,
      feedbackText: 'David resolved this extremely fast and even followed up to make sure our monthly reports were clean. Excellent support!',
    },
  });

  // 8. Create In-App Notifications for Demo
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        ticketId: tkt3.id,
        title: 'Critical Ticket Escalated',
        message: 'Ticket TKT-2026-1003 has been escalated to Level 1 due to SLA threshold warning.',
        type: 'ESCALATION',
        isRead: false,
      },
      {
        userId: managerUser.id,
        ticketId: tkt3.id,
        title: 'Escalation Assigned: Executive Account 2FA',
        message: 'Ticket TKT-2026-1003 has escalated into your team queue. Resolution due in <15 mins.',
        type: 'SLA_WARNING',
        isRead: false,
      },
      {
        userId: agentUser1.id,
        ticketId: tkt1.id,
        title: 'New Customer Reply on TKT-2026-1001',
        message: 'Robert Chen responded on Data sync failure ticket.',
        type: 'NEW_REPLY',
        isRead: false,
      },
      {
        userId: customerUser.id,
        ticketId: tkt1.id,
        title: 'Support Agent Assigned',
        message: 'David Miller has been assigned to your ticket TKT-2026-1001 and is investigating.',
        type: 'ASSIGNMENT',
        isRead: false,
      },
    ],
  });

  // 9. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: customerUser.id,
        ticketId: tkt1.id,
        action: 'TICKET_CREATED',
        entityType: 'Ticket',
        entityId: tkt1.id,
        details: JSON.stringify({ priority: 'HIGH', category: 'Software Glitch & Bug' }),
      },
      {
        userId: telecallerUser.id,
        ticketId: tkt2.id,
        action: 'TELECALLER_LOGGED_TICKET',
        entityType: 'Ticket',
        entityId: tkt2.id,
        details: JSON.stringify({ customer: 'Samantha Ray', callDuration: '4m 12s' }),
      },
      {
        userId: managerUser.id,
        ticketId: tkt3.id,
        action: 'TICKET_ESCALATED',
        entityType: 'Ticket',
        entityId: tkt3.id,
        details: JSON.stringify({ reason: 'Near SLA breach auto-escalate trigger', level: 1 }),
      },
    ],
  });

  console.log('✅ Database seeded successfully with demo users, roles, and tickets!');
  console.log('---------------------------------------------------------');
  console.log('Default Password for all seeded users: password123');
  console.log('1. Admin:       admin@supportpro.com');
  console.log('2. Manager:     manager@supportpro.com');
  console.log('3. Agent:       agent@supportpro.com');
  console.log('4. Telecaller:  telecaller@supportpro.com');
  console.log('5. Customer:    customer@acme.com');
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
