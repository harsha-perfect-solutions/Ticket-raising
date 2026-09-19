import crypto from 'crypto';

// Base32 alphabet for RFC 3548 / RFC 4648
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer to a Base32 string
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string to a Buffer
 */
export function base32Decode(base32: string): Buffer {
  const cleanBase32 = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanBase32.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleanBase32[i]);
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a random Base32 secret for TOTP (160 bits / 20 bytes)
 */
export function generateTotpSecret(): string {
  const randomBuffer = crypto.randomBytes(20);
  return base32Encode(randomBuffer);
}

/**
 * Generates a 6-digit TOTP code for a given secret at time t (defaults to now)
 */
export function generateTotpToken(secret: string, timeSeconds = Math.floor(Date.now() / 1000)): string {
  const key = base32Decode(secret);
  const counter = Math.floor(timeSeconds / 30);
  
  // 8-byte big-endian counter buffer
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP token allowing ±1 time step window (30s drift)
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  if (!token || token.length !== 6 || !secret) return false;
  const now = Math.floor(Date.now() / 1000);

  // Check current time step and ±1 step for clock drift
  for (let offset = -1; offset <= 1; offset++) {
    const testTime = now + offset * 30;
    const generated = generateTotpToken(secret, testTime);
    if (generated === token) {
      return true;
    }
  }
  return false;
}

/**
 * Generates 8 single-use emergency backup recovery codes
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

/**
 * Generates standard OTPAuth URL for Google Authenticator / Authy
 */
export function generateOtpAuthUrl(email: string, secret: string, issuer = 'ResolveHub (HPS Pvt Ltd)'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

// In-memory store for active MFA user records
export interface UserMfaRecord {
  userId: string;
  secret: string;
  isEnabled: boolean;
  backupCodes: string[];
  enrolledAt?: string;
}

export const mfaStore = new Map<string, UserMfaRecord>();

// Pre-enroll Demo Admin with sample secret for instant 2FA testing
const DEMO_ADMIN_ID = 'demo-admin-id';
mfaStore.set('admin@ticketdesk.local', {
  userId: DEMO_ADMIN_ID,
  secret: 'JBSWY3DPEHPK3PXP', // Well-known RFC 3548 test secret
  isEnabled: true,
  backupCodes: ['8F9A-2C4B', '7D1E-9A3F', '4B6C-8E2A', '1F3A-5D7E'],
  enrolledAt: new Date().toISOString(),
});

// Temporary session tokens for pending MFA login challenges (valid for 5 mins)
export interface PendingMfaChallenge {
  tempToken: string;
  user: any;
  expiresAt: number;
}
export const pendingMfaChallenges = new Map<string, PendingMfaChallenge>();
