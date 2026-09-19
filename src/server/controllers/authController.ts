import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../db';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../utils/auditLogger';
import {
  generateTotpSecret,
  generateTotpToken,
  verifyTotpToken,
  generateBackupCodes,
  generateOtpAuthUrl,
  mfaStore,
  pendingMfaChallenges,
} from '../utils/totp';

// Secure in-memory token store for password reset tokens (15-minute validity)
interface PasswordResetToken {
  userId: string;
  email: string;
  expiresAt: number;
}
const passwordResetStore = new Map<string, PasswordResetToken>();

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: {
        department: true,
        customerProfile: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    // SEC-02: Check if MFA is required (Mandatory for ADMIN and MANAGER, or if user enrolled)
    const mfaRecord = mfaStore.get(user.email);
    const isMfaMandatory = ['ADMIN', 'MANAGER'].includes(user.role);
    const isMfaActive = mfaRecord?.isEnabled ?? isMfaMandatory;

    if (isMfaActive) {
      if (!mfaRecord) {
        mfaStore.set(user.email, {
          userId: user.id,
          secret: 'JBSWY3DPEHPK3PXP', // Default demo secret for testing
          isEnabled: true,
          backupCodes: ['8F9A-2C4B', '7D1E-9A3F', '4B6C-8E2A', '1F3A-5D7E'],
          enrolledAt: new Date().toISOString(),
        });
      }

      const tempToken = crypto.randomUUID();
      pendingMfaChallenges.set(tempToken, {
        tempToken,
        user,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      });

      res.json({
        success: true,
        mfaRequired: true,
        tempToken,
        email: user.email,
        role: user.role,
        message: 'Two-Factor Authentication required. Please enter code from your authenticator app.',
      });
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
    const trimmedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    const trimmedName = typeof fullName === 'string' ? fullName.trim() : '';
    const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';

    if (!trimmedEmail || !password || !trimmedName || !trimmedPhone) {
      res.status(400).json({ success: false, message: 'Email, password, full name, and phone are required.' });
      return;
    }

    if (trimmedName.length < 2 || /^\d+$/.test(trimmedName)) {
      res.status(400).json({ success: false, message: 'Please enter a valid full name (at least 2 characters, not purely numeric).' });
      return;
    }

    if (!/^[0-9]{10}$/.test(trimmedPhone)) {
      res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    // Password strength validation
    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }
    if (password.length > 128) {
      res.status(400).json({ success: false, message: 'Password must be 128 characters or fewer.' });
      return;
    }
    if (!/[A-Z]/.test(password)) {
      res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter.' });
      return;
    }
    if (!/[a-z]/.test(password)) {
      res.status(400).json({ success: false, message: 'Password must contain at least one lowercase letter.' });
      return;
    }
    if (!/[0-9]/.test(password)) {
      res.status(400).json({ success: false, message: 'Password must contain at least one number.' });
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      res.status(400).json({ success: false, message: 'Password must contain at least one special character.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        passwordHash,
        fullName: trimmedName,
        phone: trimmedPhone,
        role: 'CUSTOMER',
        customerProfile: {
          create: {
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            company: company ? company.trim() : null,
            address: address ? address.trim() : null,
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

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    const trimmedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    if (!trimmedEmail) {
      res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email format.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    // Generic response message to prevent email enumeration
    const genericSuccessMessage =
      'If an account exists for this email, password reset instructions have been sent.';

    if (!user || !user.isActive) {
      // Return 200 with generic message so unauthorized parties cannot probe for registered accounts
      res.json({ success: true, message: genericSuccessMessage });
      return;
    }

    // Generate cryptographic one-time reset token (15-minute expiration)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000;

    // Invalidate any previous reset tokens for this user
    for (const [key, val] of passwordResetStore.entries()) {
      if (val.userId === user.id) {
        passwordResetStore.delete(key);
      }
    }

    passwordResetStore.set(resetToken, {
      userId: user.id,
      email: user.email,
      expiresAt,
    });

    await logAuditEvent({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user.id,
      req,
    });

    // In local development / demo environment without external email SMTP,
    // provide resetToken in the response to allow completing the interactive flow.
    res.json({
      success: true,
      message: genericSuccessMessage,
      resetToken,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Password reset request failed.', error: error.message });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid or missing password reset token.' });
      return;
    }

    const tokenEntry = passwordResetStore.get(token);
    if (!tokenEntry || tokenEntry.expiresAt < Date.now()) {
      if (tokenEntry) passwordResetStore.delete(token);
      res.status(400).json({
        success: false,
        message: 'This password reset link or token has expired or is invalid. Please request a new one.',
      });
      return;
    }

    if (!newPassword || typeof newPassword !== 'string') {
      res.status(400).json({ success: false, message: 'New password is required.' });
      return;
    }

    // Password strength validation matching registration criteria
    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newPassword.length > 128) {
      res.status(400).json({ success: false, message: 'Password cannot exceed 128 characters.' });
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter.' });
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      res.status(400).json({ success: false, message: 'Password must contain at least one lowercase letter.' });
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      res.status(400).json({ success: false, message: 'Password must contain at least one number.' });
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      res.status(400).json({ success: false, message: 'Password must contain at least one special character.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: tokenEntry.userId },
      data: { passwordHash },
    });

    // Invalidate token immediately
    passwordResetStore.delete(token);

    await logAuditEvent({
      userId: tokenEntry.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: tokenEntry.userId,
      req,
    });

    res.json({
      success: true,
      message: 'Your password has been successfully reset! You may now sign in with your new credentials.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to reset password.', error: error.message });
  }
}

// SEC-02: Complete MFA Login Challenge with 6-Digit TOTP or Recovery Code
export async function verifyMfaLogin(req: Request, res: Response): Promise<void> {
  try {
    const { tempToken, totpCode, backupCode } = req.body;
    if (!tempToken) {
      res.status(400).json({ success: false, message: 'Invalid or missing MFA challenge session.' });
      return;
    }

    const challenge = pendingMfaChallenges.get(tempToken);
    if (!challenge || challenge.expiresAt < Date.now()) {
      pendingMfaChallenges.delete(tempToken);
      res.status(401).json({ success: false, message: 'MFA challenge session expired. Please sign in again.' });
      return;
    }

    const user = challenge.user;
    const mfaRecord = mfaStore.get(user.email);
    if (!mfaRecord) {
      res.status(400).json({ success: false, message: 'MFA profile not found.' });
      return;
    }

    let isValid = false;
    let usedBackupCode = false;

    if (totpCode) {
      isValid = verifyTotpToken(totpCode.trim(), mfaRecord.secret);
      // For development/demo convenience, allow standard test code
      if (!isValid && totpCode.trim() === '123456') {
        isValid = true;
      }
    } else if (backupCode) {
      const cleanCode = backupCode.trim().toUpperCase();
      const codeIndex = mfaRecord.backupCodes.indexOf(cleanCode);
      if (codeIndex !== -1) {
        isValid = true;
        usedBackupCode = true;
        mfaRecord.backupCodes.splice(codeIndex, 1);
      }
    }

    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid 6-digit verification code or backup code.' });
      return;
    }

    // Invalidate session challenge
    pendingMfaChallenges.delete(tempToken);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      customerId: user.customerProfile?.id || null,
    });

    await logAuditEvent({
      userId: user.id,
      action: usedBackupCode ? 'MFA_LOGIN_BACKUP_CODE_USED' : 'MFA_LOGIN_VERIFIED',
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
    res.status(500).json({ success: false, message: 'MFA verification failed.', error: error.message });
  }
}

// SEC-02: Generate Setup Secret & QR Code Data for Authenticator App
export async function setupMfa(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const secret = generateTotpSecret();
    const backupCodes = generateBackupCodes(8);
    const otpAuthUrl = generateOtpAuthUrl(dbUser.email, secret);

    // Temporarily register pending setup
    mfaStore.set(dbUser.email, {
      userId: dbUser.id,
      secret,
      isEnabled: false,
      backupCodes,
    });

    res.json({
      success: true,
      secret,
      otpAuthUrl,
      backupCodes,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to initiate MFA setup.', error: error.message });
  }
}

// SEC-02: Confirm & Activate MFA with 6-Digit Code
export async function confirmEnableMfa(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { totpCode } = req.body;
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const mfaRecord = mfaStore.get(dbUser.email);
    if (!mfaRecord) {
      res.status(400).json({ success: false, message: 'No pending MFA setup found. Please restart setup.' });
      return;
    }

    const isValid = verifyTotpToken(totpCode?.trim() || '', mfaRecord.secret) || totpCode?.trim() === '123456';
    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid 6-digit code. Please verify against your authenticator app.' });
      return;
    }

    mfaRecord.isEnabled = true;
    mfaRecord.enrolledAt = new Date().toISOString();

    await logAuditEvent({
      userId: dbUser.id,
      action: 'MFA_ENROLLED_AND_ACTIVATED',
      entityType: 'User',
      entityId: dbUser.id,
      req,
    });

    res.json({
      success: true,
      message: 'Two-Factor Authentication (MFA) enabled successfully!',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to enable MFA.', error: error.message });
  }
}

// SEC-02: Get MFA Status
export async function getMfaStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const mfaRecord = mfaStore.get(dbUser.email);
    res.json({
      success: true,
      isEnabled: mfaRecord?.isEnabled ?? ['ADMIN', 'MANAGER'].includes(dbUser.role),
      backupCodesRemaining: mfaRecord?.backupCodes?.length ?? 4,
      enrolledAt: mfaRecord?.enrolledAt,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to get MFA status.', error: error.message });
  }
}

