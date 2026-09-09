import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db';
import { AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../utils/auditLogger';

// 1. Departments
export async function listDepartments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { members: true, tickets: true, categories: true },
        },
      },
    });
    res.json({ success: true, departments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to list departments', error: error.message });
  }
}

export async function createDepartment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, description, managerId } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Department name is required.' });
      return;
    }

    const dept = await prisma.department.create({
      data: {
        name,
        description: description || null,
        managerId: managerId || null,
      },
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'DEPARTMENT_CREATED',
      entityType: 'Department',
      entityId: dept.id,
      details: { name },
      req,
    });

    res.status(201).json({ success: true, department: dept });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create department', error: error.message });
  }
}

// 2. Categories & Subcategories
export async function listCategories(req: AuthRequest, res: Response): Promise<void> {
  try {
    const categories = await prisma.category.findMany({
      include: {
        department: true,
        subcategories: true,
        _count: { select: { tickets: true } },
      },
    });
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to list categories', error: error.message });
  }
}

export async function createCategory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, departmentId, defaultPriority = 'MEDIUM', subcategories = [] } = req.body;
    if (!name || !departmentId) {
      res.status(400).json({ success: false, message: 'Category name and department are required.' });
      return;
    }

    const category = await prisma.category.create({
      data: {
        name,
        departmentId,
        defaultPriority,
        subcategories: {
          create: subcategories.map((s: string) => ({ name: s })),
        },
      },
      include: { subcategories: true },
    });

    res.status(201).json({ success: true, category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create category', error: error.message });
  }
}

// 3. Configurable SLA Rules
export async function listSlaRules(req: AuthRequest, res: Response): Promise<void> {
  try {
    const rules = await prisma.slaRule.findMany({
      orderBy: { firstResponseMinutes: 'asc' },
      include: { category: true },
    });
    res.json({ success: true, rules });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to list SLA rules', error: error.message });
  }
}

export async function updateSlaRule(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { firstResponseMinutes, resolutionMinutes, warnBeforeMinutes, autoEscalateMinutes, isActive } = req.body;

    const rule = await prisma.slaRule.update({
      where: { id },
      data: {
        firstResponseMinutes: firstResponseMinutes !== undefined ? parseInt(firstResponseMinutes, 10) : undefined,
        resolutionMinutes: resolutionMinutes !== undefined ? parseInt(resolutionMinutes, 10) : undefined,
        warnBeforeMinutes: warnBeforeMinutes !== undefined ? parseInt(warnBeforeMinutes, 10) : undefined,
        autoEscalateMinutes: autoEscalateMinutes !== undefined ? parseInt(autoEscalateMinutes, 10) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'SLA_RULE_UPDATED',
      entityType: 'SLARule',
      entityId: id,
      details: req.body,
      req,
    });

    res.json({ success: true, rule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update SLA rule', error: error.message });
  }
}

// 4. Users Management
export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { role, departmentId } = req.query;
    const where: any = {};
    if (role) where.role = role as string;
    if (departmentId) where.departmentId = departmentId as string;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        departmentId: true,
        department: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedTickets: true,
            createdTickets: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to list users', error: error.message });
  }
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password, fullName, phone, role, departmentId } = req.body;
    if (!email || !password || !fullName || !role) {
      res.status(400).json({ success: false, message: 'Email, password, fullName, and role are required.' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName,
        phone: phone || null,
        role,
        departmentId: departmentId || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        departmentId: true,
      },
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      details: { role, departmentId },
      req,
    });

    res.status(201).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
}

export async function getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { ticketId, limit = '50' } = req.query;
    const where: any = {};
    if (ticketId) where.ticketId = ticketId as string;

    const logs = await prisma.auditLog.findMany({
      where,
      take: Math.min(100, parseInt(limit as string, 10)),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
        ticket: { select: { id: true, ticketNumber: true, subject: true } },
      },
    });

    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error.message });
  }
}
