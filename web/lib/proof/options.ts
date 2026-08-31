import type { ProductOption, SelectOption } from './types';

/**
 * Options presented by the proof wizard. Kept as data (not JSX) so the wizard and any
 * future entry points can share the same source of truth. Products intentionally cover
 * the launch collections plus an "unsure" escape hatch — no prices are shown here.
 */

export const PROOF_PRODUCTS: ProductOption[] = [
  {
    id: 'team-roster-banner',
    title: 'Team Roster Banner',
    description: 'Full roster and coaches with a hero photo and player grid.',
    badge: 'Most Popular',
  },
  {
    id: 'senior-night-banner',
    title: 'Senior Night Banner',
    description: 'Spotlight a graduating senior with photo, number, and years played.',
  },
  {
    id: 'championship-poster',
    title: 'Championship Poster',
    description: 'Commemorate a title run with team name, record, and roster.',
  },
  {
    id: 'player-spotlight-poster',
    title: 'Player Spotlight Poster',
    description: 'A personalized poster for a standout player — action photo and stats.',
  },
  {
    id: 'coach-recognition-banner',
    title: 'Coach Recognition Banner',
    description: "Honor a coach's season, leadership, and years of service.",
  },
  {
    id: 'graduation-banner',
    title: 'Graduation Banner',
    description: 'Celebrate a graduate with a personalized name, year, and school design.',
  },
  {
    id: 'not-sure',
    title: 'Not sure yet',
    description: "Tell us about your team and we'll recommend the right design.",
  },
];

export const SIZE_OPTIONS: SelectOption[] = [
  { value: '', label: 'No preference' },
  { value: '24x36', label: '24 × 36 in (banner)' },
  { value: '18x24', label: '18 × 24 in (poster)' },
  { value: 'digital', label: 'Digital / social only' },
];

export const FORMAT_OPTIONS: SelectOption[] = [
  { value: '', label: 'No preference' },
  { value: 'printed', label: 'Printed' },
  { value: 'digital', label: 'Digital' },
  { value: 'both', label: 'Printed & digital' },
];

/** Human-readable lookups for the review summary. */
export function productTitle(id: string | null): string {
  return PROOF_PRODUCTS.find((p) => p.id === id)?.title ?? '—';
}

/**
 * NOTE: `football-social-graphics` was removed — the render engine has no social/square
 * output, so every product using that key is Coming Soon (lib/catalog/availability.ts).
 * A stale `/proof?product=football-social-graphics` link now resolves to null, i.e. no
 * preselection, which is the intended safe fallback rather than a broken design.
 */

/**
 * Resolve a `?product=<slug>` query value to a known product id, or null if it doesn't
 * match a real product. Guards the preselection entry point against stale/typo/hostile
 * slugs — an unknown value simply means "no preselection", never a crash.
 */
export function resolveProductId(param: string | string[] | undefined | null): string | null {
  const slug = Array.isArray(param) ? param[0] : param;
  if (!slug) return null;
  return PROOF_PRODUCTS.some((p) => p.id === slug) ? slug : null;
}

export function labelFor(options: SelectOption[], value: string): string {
  if (!value) return 'No preference';
  return options.find((o) => o.value === value)?.label ?? value;
}
