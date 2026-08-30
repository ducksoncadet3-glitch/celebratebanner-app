import { listArrangements, type ArrangementId } from '@celebratebanner/render-engine';

/**
 * Arrangement ↔ photo-count compatibility.
 *
 * The uploader accepts up to 50 photos, but each arrangement has its own documented
 * capacity (Magazine 25, Pyramid 28, Scattered/Mosaic 40, Classic 50). The renderer
 * clamps to that capacity — so without this, a customer could upload 50 photos, pick
 * Magazine, and never be told that 25 of them are not on the banner.
 *
 * This module is PURE and read-only. It never touches the photo collection: the
 * customer keeps every photo they uploaded, and switching arrangements re-derives the
 * state from scratch. Counts here are TOTAL photos, hero included — the same contract
 * the engine enforces (`ARRANGEMENT_MAX_PHOTOS`).
 */

export type FitStatus = 'ok' | 'below-min' | 'above-max';

export interface ArrangementFit {
  arrangement: ArrangementId;
  label: string;
  minPhotos: number;
  maxPhotos: number;
  /** Total photos the customer has uploaded. Never modified. */
  photoCount: number;
  status: FitStatus;
  compatible: boolean;
  /** How many photos this layout will actually place. */
  used: number;
  /** below-min only: how many more photos this arrangement wants. */
  shortBy: number;
  /** An arrangement that suits this photo count better, when one exists. */
  suggestion: { id: ArrangementId; label: string } | null;
  /** Customer-facing message. Empty string when the arrangement is compatible. */
  message: string;
}

interface Spec { id: ArrangementId; label: string; minPhotos: number; maxPhotos: number }

function specs(): Spec[] {
  return listArrangements().map((a) => ({
    id: a.id, label: a.label, minPhotos: a.minPhotos, maxPhotos: a.maxPhotos,
  }));
}

/** The arrangement that can show every uploaded photo, preferring the closest fit. */
function bestForAll(all: Spec[], count: number, exclude: ArrangementId): Spec | null {
  const holdsAll = all
    .filter((s) => s.id !== exclude && s.maxPhotos >= count && s.minPhotos <= count)
    .sort((a, b) => a.maxPhotos - b.maxPhotos || a.id.localeCompare(b.id));
  return holdsAll[0] ?? null;
}

/** The arrangement that already accepts this (small) photo count, preferring the roomiest. */
function bestForFew(all: Spec[], count: number, exclude: ArrangementId): Spec | null {
  const accepts = all
    .filter((s) => s.id !== exclude && s.minPhotos <= count && s.maxPhotos >= count)
    .sort((a, b) => a.minPhotos - b.minPhotos || b.maxPhotos - a.maxPhotos || a.id.localeCompare(b.id));
  return accepts[0] ?? null;
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Describe how the selected arrangement fits the uploaded photo count.
 * Pure: same inputs → same result, and nothing outside is read or written.
 */
export function arrangementFit(arrangement: ArrangementId, photoCount: number): ArrangementFit {
  const all = specs();
  const spec = all.find((s) => s.id === arrangement)
    ?? { id: arrangement, label: arrangement, minPhotos: 1, maxPhotos: 50 };
  const count = Math.max(0, Math.floor(photoCount));

  const base = {
    arrangement: spec.id,
    label: spec.label,
    minPhotos: spec.minPhotos,
    maxPhotos: spec.maxPhotos,
    photoCount: count,
  };

  if (count > spec.maxPhotos) {
    const suggestion = bestForAll(all, count, spec.id);
    const tail = suggestion
      ? ` Choose ${suggestion.label} to include all ${count}.`
      : ` Every photo stays saved — you can switch layouts at any time.`;
    return {
      ...base,
      status: 'above-max',
      compatible: false,
      used: spec.maxPhotos,
      shortBy: 0,
      suggestion: suggestion ? { id: suggestion.id, label: suggestion.label } : null,
      message:
        `${spec.label} supports up to ${plural(spec.maxPhotos, 'photo')}. ` +
        `You uploaded ${count}, so this layout will use your first ${spec.maxPhotos}. ` +
        `All ${count} stay saved in your project.${tail}`,
    };
  }

  // Below the recommended minimum: guidance only. The renderer handles these counts
  // safely, so we never block the customer from trying the layout.
  if (count > 0 && count < spec.minPhotos) {
    const suggestion = bestForFew(all, count, spec.id);
    const shortBy = spec.minPhotos - count;
    const tail = suggestion ? `, or choose ${suggestion.label}` : '';
    return {
      ...base,
      status: 'below-min',
      compatible: false,
      used: count,
      shortBy,
      suggestion: suggestion ? { id: suggestion.id, label: suggestion.label } : null,
      message:
        `${spec.label} is designed for ${spec.minPhotos}–${spec.maxPhotos} photos. ` +
        `Add ${plural(shortBy, 'more photo')} for this arrangement${tail}.`,
    };
  }

  return {
    ...base,
    status: 'ok',
    compatible: true,
    used: count,
    shortBy: 0,
    suggestion: null,
    message: '',
  };
}
