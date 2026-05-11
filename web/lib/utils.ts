import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware classname combiner. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Generate a short, URL-safe project id on the client. */
export function newProjectId(): string {
  // 11 chars of base36, ~57 bits of entropy — fine for project ids that are
  // also gated by server-side ownership checks.
  const a = Math.random().toString(36).slice(2, 8);
  const b = Math.random().toString(36).slice(2, 7);
  return `proj_${a}${b}`;
}

/** Persist + read the user's email across pages so /success can show it. */
const EMAIL_KEY = 'cb_customer_email';
export function setStoredEmail(email: string): void {
  try { window.localStorage.setItem(EMAIL_KEY, email); } catch { /* ignore */ }
}
export function getStoredEmail(): string {
  try { return window.localStorage.getItem(EMAIL_KEY) ?? ''; } catch { return ''; }
}
