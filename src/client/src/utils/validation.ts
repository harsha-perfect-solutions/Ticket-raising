/**
 * Validation utilities and constants for SupportPro ITSM
 */

export const PHONE_PLACEHOLDER = "Enter 10-digit mobile number";
export const PHONE_ERROR_MESSAGE = "Please enter a valid 10-digit mobile number.";

export const ALLOWED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'] as const;
export const ALLOWED_FILE_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const UNSUPPORTED_FILE_TYPE_MSG = "Unsupported file type. Please upload JPG, JPEG, PNG, or PDF files only.";
export const FILE_SIZE_LIMIT_MSG = "File exceeds the 15 MB limit.";

/**
 * Validates that a phone number is exactly 10 numeric digits
 */
export function isValid10DigitPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const clean = phone.trim();
  return /^[0-9]{10}$/.test(clean);
}

/**
 * Strips non-digits and caps at 10 digits for phone inputs
 */
export function sanitize10DigitPhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 10);
}

/**
 * Validates full name (min 2 chars, not purely numeric, trimmed)
 */
export function isValidFullName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  if (/^\d+$/.test(trimmed)) return false;
  return true;
}

/**
 * Validates standard email address
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Validates an uploaded file for allowed types and 15MB size limit
 */
export function validateAttachmentFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: FILE_SIZE_LIMIT_MSG };
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isExtensionAllowed = ALLOWED_FILE_EXTENSIONS.includes(extension as any);
  const isMimeAllowed = ALLOWED_FILE_MIME_TYPES.includes(file.type.toLowerCase() as any);

  // If MIME type is missing or generic octet-stream, extension must match. Otherwise both or extension should be valid.
  if (!isExtensionAllowed && !isMimeAllowed) {
    return { valid: false, error: UNSUPPORTED_FILE_TYPE_MSG };
  }

  // Reject explicitly forbidden types even if mismatched
  const forbiddenExts = ['.zip', '.rar', '.doc', '.docx', '.xls', '.xlsx', '.exe', '.js', '.html', '.svg'];
  if (forbiddenExts.includes(extension)) {
    return { valid: false, error: UNSUPPORTED_FILE_TYPE_MSG };
  }

  return { valid: true };
}
