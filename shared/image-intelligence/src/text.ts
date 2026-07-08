/**
 * Banner-text cleanup — a keepsake never says "e.g., Sarah Johnson".
 *
 * Raw builder placeholders ("e.g., Sarah Johnson", "Your name", "", "{name}") are
 * replaced with a dignified, occasion-appropriate label ("Graduate Name"). Real
 * customer text is ALWAYS preserved — we never overwrite something a person typed,
 * and we never invent a name.
 */

/** Values the builder shows as hints, not as content. */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^\s*$/,                 // empty / whitespace
  /^\s*e\.?g\.?[,:]?\s+/i, // "e.g., Sarah Johnson"
  /^\s*your\s+\w+/i,       // "Your name"
  /^\s*enter\s+/i,         // "Enter your name"
  /^\s*\{.*\}\s*$/,        // "{name}"
  /^\s*\[.*\]\s*$/,        // "[name]"
  /^\s*(tbd|n\/?a|none|placeholder|sample|example)\s*$/i,
];

export function isPlaceholderText(value: unknown): boolean {
  if (typeof value !== 'string') return true;
  return PLACEHOLDER_PATTERNS.some((re) => re.test(value));
}

/**
 * Dignified stand-ins per occasion + field. A field with no label is DROPPED rather
 * than rendered as "Your school" — silence beats filler on a premium keepsake.
 */
export const DIGNIFIED_LABELS: Record<string, Record<string, string>> = {
  graduation: { name: 'Graduate Name', year: 'Class Year', class: 'Class Year', school: 'School Name', date: 'Class Year' },
  championship: { name: 'Team Name', year: 'Season', school: 'School Name', date: 'Season' },
  team: { name: 'Team Name', year: 'Season', school: 'School Name' },
  wedding: { name: 'The Couple', date: 'Wedding Day', year: 'Wedding Day' },
  memorial: { name: 'In Loving Memory', year: 'Years', date: 'Years' },
  family_reunion: { name: 'Family Name', year: 'Year', date: 'Year' },
};

/**
 * Clean a builder bannerText map for rendering.
 *   • real text            → kept verbatim (trimmed)
 *   • placeholder / empty  → the dignified label for that occasion+field
 *   • no label available   → the field is dropped entirely
 *
 * An "e.g., …" value is a builder HINT, not content, so the whole value is replaced —
 * we never promote the example name ("Sarah Johnson") into the customer's keepsake.
 */
export function sanitizeBannerText(
  bannerText: Record<string, unknown> | null | undefined,
  occasion?: string | null,
): Record<string, string> {
  const labels = (occasion && DIGNIFIED_LABELS[occasion]) || {};
  const out: Record<string, string> = {};
  if (!bannerText || typeof bannerText !== 'object') return out;

  for (const [key, raw] of Object.entries(bannerText)) {
    const value = typeof raw === 'string' ? raw : '';
    if (!isPlaceholderText(value)) {
      out[key] = value.trim();     // real customer text — preserved exactly
      continue;
    }
    const label = labels[key];
    if (label) out[key] = label;   // dignified stand-in
    // else: drop the field — never render "Your school"
  }
  return out;
}
