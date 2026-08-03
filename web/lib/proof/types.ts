/** Shared types for the Free Design Proof Wizard. */

export interface ProductOption {
  id: string;
  title: string;
  description: string;
  badge?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface TeamInfo {
  teamName: string;
  contactName: string;
  email: string;
  phone: string;
}

export interface DesignPreferences {
  colors: string;
  size: string;
  format: string;
  notes: string;
}

export interface ProofFormData {
  productId: string | null;
  team: TeamInfo;
  preferences: DesignPreferences;
}

/** Keyed by field so each form can surface its own inline errors. */
export interface ProofErrors {
  productId?: string;
  teamName?: string;
  contactName?: string;
  email?: string;
}

/** The payload handed to the (placeholder) submit handler. */
export interface ProofSubmission extends ProofFormData {
  submittedAtLabel: string;
}

export const EMPTY_PROOF: ProofFormData = {
  productId: null,
  team: { teamName: '', contactName: '', email: '', phone: '' },
  preferences: { colors: '', size: '', format: '', notes: '' },
};
