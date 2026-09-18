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
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      res.status(400).json({ success: false, message: 'Department name is required.' });
      return;
    }

    if (trimmedName.length > 100) {
      res.status(400).json({ success: false, message: 'Department name must be 100 characters or fewer.' });
      return;
    }

    // Case-insensitive duplicate check
    const allDepts = await prisma.department.findMany({ select: { name: true } });
    if (allDepts.some((d) => d.name.toLowerCase() === trimmedName.toLowerCase())) {
      res.status(400).json({ success: false, message: 'A department with this name already exists.' });
      return;
    }

    const dept = await prisma.department.create({
      data: {
        name: trimmedName,
        description: description ? description.trim() : null,
        managerId: managerId || null,
      },
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'DEPARTMENT_CREATED',
      entityType: 'Department',
      entityId: dept.id,
      details: { name: trimmedName, description },
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
    const trimmedName = typeof name === 'string' ? name.trim() : '';

    if (!trimmedName || !departmentId) {
      res.status(400).json({ success: false, message: 'Category name and department are required.' });
      return;
    }

    if (trimmedName.length > 100) {
      res.status(400).json({ success: false, message: 'Category name must be 100 characters or fewer.' });
      return;
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const priority = validPriorities.includes(defaultPriority) ? defaultPriority : 'MEDIUM';

    // Verify department exists
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      res.status(400).json({ success: false, message: 'Selected department does not exist.' });
      return;
    }

    // Duplicate check under same department (case-insensitive)
    const existingCats = await prisma.category.findMany({
      where: { departmentId },
      select: { name: true },
    });
    if (existingCats.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      res.status(400).json({
        success: false,
        message: 'A category with this name already exists in this department.',
      });
      return;
    }

    // Clean subcategories array
    const cleanSubcats = Array.isArray(subcategories)
      ? subcategories
          .map((s: any) => (typeof s === 'string' ? s.trim() : ''))
          .filter((s: string) => s.length > 0)
      : [];

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        departmentId,
        defaultPriority: priority,
        subcategories: {
          create: cleanSubcats.map((s: string) => ({ name: s })),
        },
      },
      include: { subcategories: true, department: true },
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'CATEGORY_CREATED',
      entityType: 'Category',
      entityId: category.id,
      details: { name: trimmedName, departmentId, defaultPriority: priority, subcategories: cleanSubcats },
      req,
    });

    res.status(201).json({ success: true, category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create category', error: error.message });
  }
}

export async function deleteDepartment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const ticketsCount = await prisma.ticket.count({ where: { departmentId: id } });
    if (ticketsCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete department with ${ticketsCount} active tickets. Reassign tickets first.`,
      });
      return;
    }
    await prisma.subcategory.deleteMany({ where: { category: { departmentId: id } } });
    await prisma.category.deleteMany({ where: { departmentId: id } });
    await prisma.department.delete({ where: { id } });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'DEPARTMENT_DELETED',
      entityType: 'Department',
      entityId: id,
      details: { departmentId: id },
      req,
    });

    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete department', error: error.message });
  }
}

export async function deleteCategory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const ticketsCount = await prisma.ticket.count({ where: { categoryId: id } });
    if (ticketsCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category with ${ticketsCount} linked tickets. Reassign or resolve them first.`,
      });
      return;
    }
    await prisma.subcategory.deleteMany({ where: { categoryId: id } });
    await prisma.slaRule.deleteMany({ where: { categoryId: id } });
    await prisma.category.delete({ where: { id } });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'CATEGORY_DELETED',
      entityType: 'Category',
      entityId: id,
      details: { categoryId: id },
      req,
    });

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message });
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
    const id = req.params.id as string;
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

export async function createSlaRule(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { priority, categoryId, firstResponseMinutes, resolutionMinutes, warnBeforeMinutes, autoEscalateMinutes } = req.body;
    if (!priority) {
      res.status(400).json({ success: false, message: 'Priority is required.' });
      return;
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validPriorities.includes(priority)) {
      res.status(400).json({ success: false, message: `Invalid priority. Valid options: ${validPriorities.join(', ')}` });
      return;
    }

    const existing = await prisma.slaRule.findFirst({
      where: {
        priority,
        categoryId: categoryId || null,
      },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: `An SLA rule for ${priority} priority ${categoryId ? 'under this category' : 'at default level'} already exists.`,
      });
      return;
    }

    const rule = await prisma.slaRule.create({
      data: {
        priority,
        categoryId: categoryId || null,
        firstResponseMinutes: parseInt(firstResponseMinutes || 60, 10),
        resolutionMinutes: parseInt(resolutionMinutes || 240, 10),
        warnBeforeMinutes: parseInt(warnBeforeMinutes || 30, 10),
        autoEscalateMinutes: parseInt(autoEscalateMinutes || 15, 10),
        isActive: true,
      },
      include: { category: true },
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'SLA_RULE_CREATED',
      entityType: 'SLARule',
      entityId: rule.id,
      details: req.body,
      req,
    });

    res.status(201).json({ success: true, rule, message: 'SLA rule created successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create SLA rule', error: error.message });
  }
}

export async function deleteSlaRule(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const rule = await prisma.slaRule.findUnique({
      where: { id },
      include: { _count: { select: { tickets: true } } },
    });

    if (!rule) {
      res.status(404).json({ success: false, message: 'SLA rule not found' });
      return;
    }

    if (rule._count.tickets > 0) {
      await prisma.slaRule.update({
        where: { id },
        data: { isActive: false },
      });
      res.json({ success: true, message: 'SLA rule is assigned to existing tickets; deactivated instead of deleted.' });
      return;
    }

    await prisma.slaRule.delete({ where: { id } });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'SLA_RULE_DELETED',
      entityType: 'SLARule',
      entityId: id,
      details: { priority: rule.priority },
      req,
    });

    res.json({ success: true, message: 'SLA rule deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete SLA rule', error: error.message });
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

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { fullName, phone, role, departmentId, isActive } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (role !== undefined) updateData.role = role;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        departmentId: true,
        department: true,
        isActive: true,
      },
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: id,
      details: { updatedFields: req.body, userEmail: user.email },
      req,
    });

    res.json({ success: true, user: updatedUser, message: 'User updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
}

export async function toggleUserStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.id === req.user?.userId) {
      res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, fullName: true, isActive: true, role: true },
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: user.isActive ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
      entityType: 'User',
      entityId: id,
      details: { email: user.email, newState: !user.isActive },
      req,
    });

    res.json({
      success: true,
      user: updatedUser,
      message: `User account ${updatedUser.isActive ? 'activated' : 'suspended'} successfully.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to toggle user status', error: error.message });
  }
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assignedTickets: true, createdTickets: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.id === req.user?.userId) {
      res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
      return;
    }

    // If user has historical tickets, deactivate safely instead of breaking foreign keys
    if (user._count.assignedTickets > 0 || user._count.createdTickets > 0) {
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      await logAuditEvent({
        userId: req.user?.userId,
        action: 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: id,
        details: { reason: 'User has associated tickets; suspended instead of deleted', email: user.email },
        req,
      });

      res.json({
        success: true,
        deactivated: true,
        message: 'User has associated tickets and cannot be permanently removed. The account was safely deactivated.',
      });
      return;
    }

    await prisma.user.delete({ where: { id } });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: id,
      details: { email: user.email },
      req,
    });

    res.json({ success: true, message: 'User deleted permanently.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
}

export async function resetUserPassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { newPassword } = req.body;
    const passwordToSet = newPassword && newPassword.trim() ? newPassword.trim() : 'Password123!';

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordToSet, salt);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'USER_PASSWORD_RESET',
      entityType: 'User',
      entityId: id,
      details: { email: user.email },
      req,
    });

    res.json({
      success: true,
      message: `Password reset successfully. Default password: ${passwordToSet}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
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
