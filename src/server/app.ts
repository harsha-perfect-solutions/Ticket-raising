import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';

import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import ticketRoutes from './routes/ticketRoutes';
import adminRoutes from './routes/adminRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import kbRoutes from './routes/kbRoutes';
import securityRoutes from './routes/securityRoutes';
import workspaceRoutes from './routes/workspaceRoutes';

const app = express();

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), config.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Global Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static file serving for uploaded attachments
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/kb', kbRoutes);
app.use('/api/v1/security', securityRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/workspaces', workspaceRoutes);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err && err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File exceeds the 15 MB limit.',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err && err.message && (err.message.includes('Unsupported file type') || err.message.includes('File exceeds the 15 MB limit'))) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
});

export default app;
