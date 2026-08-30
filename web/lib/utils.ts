import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware classname combiner. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Generate a URL-safe project id on the client.
 *
 * Uses crypto.randomUUID() (a CSPRNG, ~122 bits) rather than Math.random(): the
 * trust-on-first-use ownership model treats an unguessed project id as a claim
 * secret, so ids must be unpredictable, not merely unique. Hyphens are stripped
 * for compactness; the result stays [a-z0-9] after the "proj_" prefix, so it is
 * URL/path-safe. Available in all modern browsers and Node 19+ (no dependency).
 */
export function newProjectId(): string {
  return `proj_${crypto.randomUUID().replace(/-/g, '')}`;
}

/** Persist + read the user's email across pages so /success can show it. */
const EMAIL_KEY = 'cb_customer_email';
export function setStoredEmail(email: string): void {
  try { window.localStorage.setItem(EMAIL_KEY, email); } catch { /* ignore */ }
}
export function getStoredEmail(): string {
  try { return window.localStorage.getItem(EMAIL_KEY) ?? ''; } catch { return ''; }
}
