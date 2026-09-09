import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../utils/auditLogger';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        department: true,
        customerProfile: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      customerId: user.customerProfile?.id || null,
    });

    await logAuditEvent({
      userId: user.id,
      action: 'USER_LOGGED_IN',
      entityType: 'User',
      entityId: user.id,
      req,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        department: user.department,
        customerId: user.customerProfile?.id || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
}

export async function registerCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, fullName, phone, company, address } = req.body;
    if (!email || !password || !fullName || !phone) {
      res.status(400).json({ success: false, message: 'Email, password, full name, and phone are required.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName,
        phone,
        role: 'CUSTOMER',
        customerProfile: {
          create: {
            name: fullName,
            email: email.toLowerCase().trim(),
            phone,
            company: company || null,
            address: address || null,
          },
        },
      },
      include: { customerProfile: true },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: null,
      customerId: user.customerProfile?.id || null,
    });

    await logAuditEvent({
      userId: user.id,
      action: 'CUSTOMER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      req,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        customerId: user.customerProfile?.id || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        department: true,
        customerProfile: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        department: user.department,
        customerId: user.customerProfile?.id || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
}

export async function getDemoAccounts(req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: { department: true, customerProfile: true },
      orderBy: { createdAt: 'asc' },
    });

    const demoAccounts = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      phone: u.phone,
      department: u.department?.name || 'N/A',
      customerId: u.customerProfile?.id || null,
    }));

    res.json({ success: true, accounts: demoAccounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch demo accounts', error: error.message });
  }
}

export async function switchUserDemo(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: true, customerProfile: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      customerId: user.customerProfile?.id || null,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        department: user.department,
        customerId: user.customerProfile?.id || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Switch failed', error: error.message });
  }
}
