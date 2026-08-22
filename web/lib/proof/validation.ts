import type { ProofErrors, ProofFormData } from './types';

/** Pragmatic email check — good enough for a proof request, not RFC-exhaustive. */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Validate a single wizard step. Returns only the errors relevant to that step so a form
 * never shows errors for fields the user hasn't reached yet.
 *
 * Step 0: product · Step 1: team info · Step 2: preferences (optional) · Step 3: review.
 */
export function validateStep(step: number, data: ProofFormData): ProofErrors {
  const errors: ProofErrors = {};

  if (step === 0 && !data.productId) {
    errors.productId = 'Please choose a product to continue.';
  }

  if (step === 1) {
    if (!data.team.teamName.trim()) errors.teamName = 'Team or event name is required.';
    if (!data.team.contactName.trim()) errors.contactName = 'Your name is required.';
    if (!data.team.email.trim()) {
      errors.email = 'An email is required — we use it only for your order confirmation.';
    } else if (!isEmail(data.team.email)) {
      errors.email = 'Please enter a valid email address.';
    }
  }

  return errors;
}

/** True when every required field across the whole form is valid (used to gate submit). */
export function isProofComplete(data: ProofFormData): boolean {
  return (
    Object.keys(validateStep(0, data)).length === 0 &&
    Object.keys(validateStep(1, data)).length === 0
  );
}
