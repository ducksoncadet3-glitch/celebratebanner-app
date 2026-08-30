import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PROOF_CTA } from '@/lib/nav';
import { validateStep } from './validation';
import { EMPTY_PROOF } from './types';

/**
 * Launch guard for the "free preview" promise: the /proof flow must NOT claim a workflow the
 * app does not implement (a proof emailed/sent/prepared, stored for later human approval, or a
 * designer producing it). It is a guided intake that continues straight into the on-screen
 * builder/preview. This test fails if the misleading language creeps back in.
 */

const WEB = process.cwd(); // vitest runs from web/

// Files that make up the customer-facing preview promise.
const SURFACES = [
  'app/proof/page.tsx',
  'components/proof/proof-wizard.tsx',
  'components/proof/team-info-form.tsx',
  'components/proof/design-preferences-form.tsx',
  'lib/proof/validation.ts',
  'components/hero.tsx',
  'components/layout/announcement-bar.tsx',
];

// Phrases that assert a nonexistent send/prepare/human-review workflow.
const BANNED = [
  'send your proof',
  'send your free proof',
  "we'll send",
  'prepare a free proof',
  'help us design your proof',
  'where to send your proof',
  'call about your design',
  'design team produce',
];

describe('free-preview copy is truthful (no nonexistent proof workflow)', () => {
  it('the primary CTA is preview-centered, not "proof"', () => {
    expect(PROOF_CTA.label).toBe('Create Your Free Preview');
    expect(PROOF_CTA.href).toBe('/proof');
  });

  it('the required-email message does not promise to send a proof', () => {
    const errors = validateStep(1, EMPTY_PROOF);
    expect(errors.email).toBeTruthy();
    expect(errors.email!.toLowerCase()).not.toContain('send');
    expect(errors.email!.toLowerCase()).not.toContain('proof');
  });

  it('no customer-facing surface claims an emailed/prepared/human-reviewed proof', () => {
    for (const rel of SURFACES) {
      const src = readFileSync(path.join(WEB, rel), 'utf8').toLowerCase();
      for (const phrase of BANNED) {
        expect(src.includes(phrase.toLowerCase()), `${rel} contains "${phrase}"`).toBe(false);
      }
    }
  });
});
