/**
 * Progressive Web App (PWA) Service Worker Registration & Local Cache Utility
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('ResolveHub PWA ServiceWorker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.error('ResolveHub ServiceWorker registration failed:', error);
        });
    });
  }
}

export const DRAFT_STORAGE_KEY = 'resolvehub_ticket_draft_v1';

export interface TicketDraft {
  subject: string;
  description: string;
  categoryId: string;
  priority: string;
  updatedAt: string;
}

export function saveTicketDraft(draft: Partial<TicketDraft>) {
  try {
    const existing = getTicketDraft() || {};
    const updated = { ...existing, ...draft, updatedAt: new Date().toISOString() };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save ticket draft:', err);
  }
}

export function getTicketDraft(): TicketDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export function clearTicketDraft() {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear ticket draft:', err);
  }
}
