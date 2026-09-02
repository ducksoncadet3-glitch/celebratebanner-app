/**
 * Pure Proof → Builder field mapping. No React, no browser APIs — safe to unit-test in
 * isolation and to import from both the client hook (handoff.ts) and the server page.
 *
 * Compatible fields (builder render-state ∩ wizard answers):
 *   • product  → themeId           (via PROOF_PRODUCT_MAP)
 *   • product  → arrangement       (optional per-product STARTING composition)
 *   • teamName → bannerText[field]  (the mapped theme's team/org text field)
 *
 * Everything else the wizard collects (contact name, email, phone, colors, size, format,
 * notes) has no corresponding builder render field, so it is intentionally not transferred.
 */

import { listArrangements, type ArrangementId, type Theme } from '@celebratebanner/render-engine';
import { THEMES } from '@/lib/themes';
import type { ProofFormData } from './types';

export interface ProductMapEntry {
  themeId: string;
  nameField: string;
  /**
   * Optional STARTING arrangement for this product. Only set it where the composition is
   * part of the product's identity; omit it and the builder keeps its own default, so no
   * existing product's behavior changes. The customer can still switch afterwards — this
   * seeds the initial value, it does not lock it.
   */
  arrangement?: ArrangementId;
}

/** Maps a wizard product slug to a builder theme + the theme text field that should receive
 * the team/event name. `null` means "let the user pick a theme" (no forced mapping). */
export const PROOF_PRODUCT_MAP: Record<string, ProductMapEntry | null> = {
  'team-roster-banner': { themeId: 'champion', nameField: 'teamName' },
  'senior-night-banner': { themeId: 'champion', nameField: 'teamName' },
  'championship-poster': { themeId: 'champion', nameField: 'teamName' },
  'player-spotlight-poster': { themeId: 'champion', nameField: 'teamName' },
  'coach-recognition-banner': { themeId: 'champion', nameField: 'teamName' },
  'graduation-banner': { themeId: 'graduation', nameField: 'school' },
  // 'scattered' is the composition the product was designed around: a prominent hero
  // with many smaller photographs balanced around it.
  'world-memories-collage': { themeId: 'world-memories-photo-collage', nameField: 'title', arrangement: 'scattered' },
  'not-sure': null,
};

export interface BuilderPrefill {
  themeId?: string;
  /** Theme text field values to seed, e.g. { teamName: 'Riverside Eagles' }. */
  text?: Record<string, string>;
  /** Starting arrangement, when the product specifies one. Absent → builder default. */
  arrangement?: ArrangementId;
}

export interface MapDeps {
  /** Theme catalog to validate against. Defaults to the real THEMES. */
  catalog?: Record<string, Theme>;
  /** Product→theme map. Defaults to PROOF_PRODUCT_MAP. */
  productMap?: Record<string, ProductMapEntry | null>;
  /** Arrangement ids to validate against. Defaults to the engine's real list. */
  arrangements?: readonly string[];
}

/**
 * Map wizard answers to the subset the builder can consume. Every value is guarded against
 * the theme catalog so a stale/unknown product can never inject an invalid themeId or a
 * field the selected theme doesn't have. Dependencies are injectable purely so each guard
 * branch is unit-testable; production callers use the defaults.
 */
export function mapProofToBuilder(data: ProofFormData, deps: MapDeps = {}): BuilderPrefill {
  const catalog = deps.catalog ?? THEMES;
  const productMap = deps.productMap ?? PROOF_PRODUCT_MAP;
  const arrangements = deps.arrangements ?? listArrangements().map((a) => a.id);

  const out: BuilderPrefill = {};

  // Empty / no product / unmapped ("not sure") → nothing to prefill.
  const map = data.productId ? productMap[data.productId] : null;
  if (!map) return out;

  // Guard: the mapped theme must exist in the catalog.
  const theme = catalog[map.themeId];
  if (!theme) return out;
  out.themeId = map.themeId;

  // Guard: only seed text when the team name is non-empty AND the theme actually has the
  // target field. Otherwise leave text unset (theme still applies).
  const name = data.team.teamName.trim();
  if (name && theme.fields.includes(map.nameField)) {
    out.text = { [map.nameField]: name };
  }

  // Guard: only seed an arrangement the engine actually supports, so a stale product config
  // can never inject an id the renderer would reject.
  if (map.arrangement && arrangements.includes(map.arrangement)) {
    out.arrangement = map.arrangement;
  }
  return out;
}
