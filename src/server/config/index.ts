import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'super-secret-production-ticket-system-jwt-key-2026',
  jwtExpiresIn: '7d',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
