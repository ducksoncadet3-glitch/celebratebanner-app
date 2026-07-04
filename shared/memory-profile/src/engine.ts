/**
 * @celebratebanner/memory-profile — engine
 *
 * generateMemoryProfile(uploadedPhotos, options?) — the AI Creative Director's
 * analysis stage. Deterministic, pixel-free, dependency-free celebration
 * intelligence. See docs/MEMORY_PROFILE_SCHEMA.md and docs/WOW_ENGINE_PIPELINE.md.
 */

import {
  SCHEMA_VERSION,
  type ColorSwatch,
  type ConceptType,
  type DuplicateCandidate,
  type FamilyMember,
  type GenerateOptions,
  type MemoryProfile,
  type OccasionType,
  type Orientation,
  type PhotoGroup,
  type PhotoInput,
  type PhotoRanking,
  type PhotoSummary,
  type PrimarySubject,
  type QualityScore,
  type RestorationCandidate,
  type Warning,
} from './types.ts';

// ── Tunables ────────────────────────────────────────────────────────────────
/** Megapixels at which resolution score saturates to 1.0 (large-print ready). */
const RES_SATURATION_MP = 6;
/** Neutral default for a missing 0..1 signal. */
const NEUTRAL = 0.5;
/** Ideal mean luminance for exposure scoring. */
const IDEAL_BRIGHTNESS = 0.55;
/** Minimum composite score for a photo to be kept as supporting. */
const SUPPORTING_MIN_SCORE = 40;
/** Perceptual-hash Hamming distance (bits) at/under which photos are duplicates. */
const PHASH_DUP_DISTANCE = 8;
/** takenAt proximity (ms) for duplicate/grouping when no hash is present. */
const DUP_TIME_WINDOW_MS = 4000;

// ── Small pure helpers ────────────────────────────────────────────────────────
const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);
const round = (n: number): number => Math.round(n);

function orientationOf(w: number, h: number): Orientation {
  if (h <= 0 || w <= 0) return 'square';
  const ratio = w / h;
  if (ratio < 0.95) return 'portrait';
  if (ratio > 1.05) return 'landscape';
  return 'square';
}

function hasSignal(n: number | undefined): n is number {
  return typeof n === 'number' && !Number.isNaN(n);
}

// ── Occasion inference ────────────────────────────────────────────────────────
const FILENAME_HINTS: Array<[RegExp, OccasionType]> = [
  [/grad|diploma|commencement|class of/i, 'graduation'],
  [/champ|title|trophy|final/i, 'championship'],
  [/team|roster|squad/i, 'team'],
  [/wedding|bride|groom|nuptial/i, 'wedding'],
  [/birthday|bday|turning/i, 'birthday'],
  [/baby|shower|newborn/i, 'baby_shower'],
  [/retire/i, 'retirement'],
  [/reunion/i, 'family_reunion'],
  [/church|worship|ministry/i, 'church'],
  [/military|army|navy|marine|veteran|deploy/i, 'military'],
  [/corporate|company|award|gala/i, 'corporate'],
  [/memorial|memory|rip|celebration of life|forever/i, 'memorial'],
  [/senior night|seniornight|senior_night/i, 'senior_night'],
  [/insta|social|story|post/i, 'social'],
];

function inferOccasion(
  photos: PhotoInput[],
  explicit: OccasionType | undefined,
): { occasion: OccasionType; fromHint: boolean } {
  if (explicit) return { occasion: explicit, fromHint: false };
  for (const p of photos) {
    const name = p.filename ?? '';
    for (const [re, occ] of FILENAME_HINTS) {
      if (re.test(name)) return { occasion: occ, fromHint: true };
    }
  }
  return { occasion: 'unknown', fromHint: false };
}

// ── Concept recommendation (Design Bible Part 5/6) ────────────────────────────
function recommendConcept(occasion: OccasionType, subject: PrimarySubject): ConceptType {
  switch (occasion) {
    case 'memorial':
    case 'family_reunion':
    case 'retirement':
    case 'baby_shower':
      return 'Family Legacy';
    case 'championship':
      return 'Luxury Gold';
    case 'team':
    case 'senior_night':
    case 'social':
    case 'birthday':
      return 'Modern Editorial';
    case 'graduation':
    case 'wedding':
    case 'church':
    case 'corporate':
    case 'military':
      return 'Signature Edition';
    case 'unknown':
    default:
      // Fall back on subject shape: groups read as legacy, individuals as signature.
      return subject.type === 'group' ? 'Family Legacy' : 'Signature Edition';
  }
}

const STYLE_BY_CONCEPT: Record<ConceptType, string> = {
  'Signature Edition': 'editorial-classic',
  'Luxury Gold': 'opulent',
  'Family Legacy': 'heartfelt',
  'Modern Editorial': 'magazine',
};

const MOOD_BY_OCCASION: Record<OccasionType, string> = {
  graduation: 'proud',
  championship: 'triumphant',
  team: 'energetic',
  wedding: 'romantic',
  birthday: 'joyful',
  baby_shower: 'tender',
  retirement: 'grateful',
  family_reunion: 'warm',
  church: 'reverent',
  military: 'honored',
  corporate: 'confident',
  memorial: 'reverent',
  senior_night: 'nostalgic',
  social: 'bold',
  unknown: 'celebratory',
};

// ── Occasion default palettes (Design Bible Part 2) ───────────────────────────
const OBSIDIAN = '#0C0E14';
const GOLD = '#C9A84C';
const IVORY = '#FAF8F3';
const SKY = '#4A9ECC';

const DEFAULT_PALETTE: Record<OccasionType, string[]> = {
  graduation: [OBSIDIAN, GOLD, IVORY],
  championship: [OBSIDIAN, GOLD, SKY],
  team: [OBSIDIAN, SKY, GOLD],
  wedding: [IVORY, GOLD, OBSIDIAN],
  birthday: [OBSIDIAN, GOLD, IVORY],
  baby_shower: [IVORY, GOLD, OBSIDIAN],
  retirement: [OBSIDIAN, GOLD, IVORY],
  family_reunion: [OBSIDIAN, GOLD, IVORY],
  church: [OBSIDIAN, GOLD, IVORY],
  military: [OBSIDIAN, GOLD, IVORY],
  corporate: [OBSIDIAN, GOLD, IVORY],
  memorial: [OBSIDIAN, GOLD, IVORY],
  senior_night: [OBSIDIAN, GOLD, IVORY],
  social: [OBSIDIAN, GOLD, IVORY],
  unknown: [OBSIDIAN, GOLD, IVORY],
};

// ── Per-photo scoring ─────────────────────────────────────────────────────────
interface Scored {
  input: PhotoInput;
  index: number;
  orientation: Orientation;
  megapixels: number;
  resolutionScore: number;
  exposureScore: number;
  sharpness: number; // effective (defaulted)
  sharpnessProvided: number | null;
  faceCount: number; // effective (0 when absent)
  quality: number; // 0..100
  emotional: number; // 0..100
  heroScore: number; // 0..100
  supportScore: number; // 0..100
}

function scorePhoto(input: PhotoInput, index: number): Scored {
  const orientation = orientationOf(input.width, input.height);
  const megapixels = Math.max(0, (input.width * input.height) / 1_000_000);
  const resolutionScore = clamp01(megapixels / RES_SATURATION_MP);

  const brightness = hasSignal(input.brightness) ? clamp01(input.brightness) : NEUTRAL;
  const exposureScore = clamp01(1 - Math.abs(brightness - IDEAL_BRIGHTNESS) / IDEAL_BRIGHTNESS);

  const sharpnessProvided = hasSignal(input.sharpness) ? clamp01(input.sharpness) : null;
  const sharpness = sharpnessProvided ?? NEUTRAL;
  const contrast = hasSignal(input.contrast) ? clamp01(input.contrast) : NEUTRAL;
  const faceCount = hasSignal(input.faceCount) ? Math.max(0, Math.round(input.faceCount)) : 0;

  const quality = round(
    100 * (0.3 * resolutionScore + 0.3 * sharpness + 0.2 * exposureScore + 0.2 * contrast),
  );

  // Face component: 1 face is ideal hero material, groups still emotional.
  let faceComponent: number;
  if (!hasSignal(input.faceCount)) faceComponent = 0.4; // unknown → neutral-low
  else if (faceCount === 0) faceComponent = 0.2;
  else if (faceCount === 1) faceComponent = 1.0;
  else if (faceCount <= 4) faceComponent = 0.85;
  else faceComponent = 0.7;

  const emotional = round(100 * (0.5 * faceComponent + 0.3 * sharpness + 0.2 * exposureScore));

  // Hero suitability favors portrait + a single clear subject.
  const orientationPref = orientation === 'portrait' ? 1 : orientation === 'square' ? 0.75 : 0.55;
  const singleSubjectBonus = faceCount === 1 ? 1 : faceCount >= 2 && faceCount <= 4 ? 0.8 : 0.6;
  const heroSuitability = 0.6 * orientationPref + 0.4 * singleSubjectBonus;

  const heroScore = round(0.55 * quality + 0.3 * emotional + 15 * heroSuitability);
  const supportScore = round(0.6 * quality + 0.4 * emotional);

  return {
    input,
    index,
    orientation,
    megapixels,
    resolutionScore,
    exposureScore,
    sharpness,
    sharpnessProvided,
    faceCount,
    quality,
    emotional,
    heroScore,
    supportScore,
  };
}

function toSummary(s: Scored, score: number): PhotoSummary {
  return {
    photoId: s.input.id,
    filename: s.input.filename ?? null,
    orientation: s.orientation,
    score,
    faceCount: s.faceCount,
    width: s.input.width,
    height: s.input.height,
  };
}

// ── Duplicate detection ───────────────────────────────────────────────────────
function hammingHex(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  let dist = Math.abs(a.length - b.length) * 4;
  for (let i = 0; i < len; i++) {
    let x = (parseInt(a[i], 16) ^ parseInt(b[i], 16)) & 0xf;
    while (x) {
      dist += x & 1;
      x >>= 1;
    }
  }
  return dist;
}

function detectDuplicates(scored: Scored[]): DuplicateCandidate[] {
  const groups: DuplicateCandidate[] = [];
  const consumed = new Set<number>();

  for (let i = 0; i < scored.length; i++) {
    if (consumed.has(i)) continue;
    const a = scored[i];
    const members = [i];
    let reason = '';

    for (let j = i + 1; j < scored.length; j++) {
      if (consumed.has(j)) continue;
      const b = scored[j];
      let dup = false;

      if (a.input.perceptualHash && b.input.perceptualHash) {
        if (hammingHex(a.input.perceptualHash, b.input.perceptualHash) <= PHASH_DUP_DISTANCE) {
          dup = true;
          reason = 'near-identical (phash)';
        }
      } else if (a.input.takenAt && b.input.takenAt) {
        const dt = Math.abs(Date.parse(a.input.takenAt) - Date.parse(b.input.takenAt));
        if (
          Number.isFinite(dt) &&
          dt <= DUP_TIME_WINDOW_MS &&
          a.input.width === b.input.width &&
          a.input.height === b.input.height
        ) {
          dup = true;
          reason = 'near-identical (burst)';
        }
      }

      if (dup) {
        members.push(j);
        consumed.add(j);
      }
    }

    if (members.length > 1) {
      consumed.add(i);
      // Keep the highest-quality member.
      const best = members.reduce((m, k) => (scored[k].quality > scored[m].quality ? k : m), members[0]);
      groups.push({
        group: members.map((k) => scored[k].input.id),
        keep: scored[best].input.id,
        reason,
      });
    }
  }
  return groups;
}

// ── Restoration detection ─────────────────────────────────────────────────────
function detectRestoration(scored: Scored[]): RestorationCandidate[] {
  const out: RestorationCandidate[] = [];
  for (const s of scored) {
    const reasons: string[] = [];
    if (s.sharpnessProvided !== null && s.sharpnessProvided < 0.35) reasons.push('low_sharpness');
    if (s.megapixels < 1) reasons.push('low_resolution');
    if (s.input.isMonochrome) {
      const year = s.input.takenAt ? new Date(s.input.takenAt).getFullYear() : NaN;
      reasons.push(Number.isFinite(year) && year < 2005 ? 'monochrome_old' : 'monochrome');
    }
    if (reasons.length) out.push({ photoId: s.input.id, reasons });
  }
  return out;
}

// ── Color aggregation ─────────────────────────────────────────────────────────
function aggregateColors(scored: Scored[]): { colors: ColorSwatch[]; hadData: boolean } {
  const weights = new Map<string, number>();
  let hadData = false;

  for (const s of scored) {
    const swatches = s.input.dominantColors;
    if (!swatches || swatches.length === 0) continue;
    hadData = true;
    const photoWeight = Math.max(0.05, s.quality / 100);
    for (const sw of swatches) {
      const hex = sw.hex.toUpperCase();
      weights.set(hex, (weights.get(hex) ?? 0) + clamp01(sw.weight) * photoWeight);
    }
  }

  if (!hadData) return { colors: [], hadData: false };

  const total = [...weights.values()].reduce((a, b) => a + b, 0) || 1;
  const colors = [...weights.entries()]
    .map(([hex, w]) => ({ hex, weight: w / total }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6)
    .map((c) => ({ hex: c.hex, weight: round(c.weight * 100) / 100 }));

  return { colors, hadData: true };
}

// ── Grouping by capture day ───────────────────────────────────────────────────
function buildGroups(scored: Scored[]): PhotoGroup[] {
  const byDay = new Map<string, string[]>();
  for (const s of scored) {
    if (!s.input.takenAt) continue;
    const d = new Date(s.input.takenAt);
    if (Number.isNaN(d.getTime())) continue;
    const label = d.toISOString().slice(0, 10);
    if (!byDay.has(label)) byDay.set(label, []);
    byDay.get(label)!.push(s.input.id);
  }
  return [...byDay.entries()]
    .filter(([, ids]) => ids.length > 0)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([label, photoIds]) => ({ label, photoIds, size: photoIds.length }));
}

function subjectFromFaces(faceCount: number, sourcePhotoId: string | null): PrimarySubject {
  let type: PrimarySubject['type'];
  if (faceCount <= 0) type = 'unknown';
  else if (faceCount === 1) type = 'individual';
  else if (faceCount <= 4) type = 'small_group';
  else type = 'group';
  return { type, faceCount, sourcePhotoId };
}

function supportingCap(occasion: OccasionType): number {
  switch (occasion) {
    case 'championship':
    case 'social':
      return 5;
    case 'team':
    case 'senior_night':
      return 9;
    case 'family_reunion':
    case 'memorial':
      return 12;
    default:
      return 8;
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────
/**
 * Transform uploaded photos into a structured Memory Profile.
 * The ONLY public function of this module. Deterministic and pixel-free.
 */
export function generateMemoryProfile(
  uploadedPhotos: PhotoInput[],
  options: GenerateOptions = {},
): MemoryProfile {
  if (!Array.isArray(uploadedPhotos)) {
    throw new TypeError('generateMemoryProfile: uploadedPhotos must be an array of PhotoInput');
  }

  const warnings: Warning[] = [];
  const { occasion, fromHint } = inferOccasion(uploadedPhotos, options.occasion);

  if (!options.occasion) {
    warnings.push(
      fromHint
        ? {
            code: 'occasion_inferred',
            message: 'Occasion was inferred from filenames; confirm with the customer.',
            severity: 'info',
          }
        : {
            code: 'occasion_not_provided',
            message: 'No occasion supplied and none could be inferred; defaulted to "unknown".',
            severity: 'warning',
          },
    );
  }

  // Empty upload → minimal, honest profile.
  if (uploadedPhotos.length === 0) {
    warnings.push({
      code: 'no_photos',
      message: 'No photos were provided.',
      severity: 'warning',
    });
    const subject = subjectFromFaces(0, null);
    const concept = recommendConcept(occasion, subject);
    return {
      schema_version: SCHEMA_VERSION,
      occasion,
      style: STYLE_BY_CONCEPT[concept],
      story: 'No memories were provided yet.',
      mood: MOOD_BY_OCCASION[occasion],
      primary_subject: subject,
      hero_photo: null,
      supporting_photos: [],
      photo_rankings: [],
      family_members: [],
      groups: [],
      dominant_colors: DEFAULT_PALETTE[occasion].map((hex, i, arr) => ({
        hex,
        weight: round((100 * (arr.length - i)) / ((arr.length * (arr.length + 1)) / 2)) / 100,
      })),
      photo_quality_scores: [],
      face_count: 0,
      portrait_count: 0,
      landscape_count: 0,
      square_count: 0,
      duplicate_candidates: [],
      restoration_candidates: [],
      recommended_concept: concept,
      confidence_score: 0,
      warnings,
      future_extension_fields: {
        faceRecognition: null,
        aiVision: null,
        expressionAnalysis: null,
        textDetection: null,
      },
    };
  }

  // Score every photo.
  const scored = uploadedPhotos.map((p, i) => scorePhoto(p, i));

  // Signal availability (for confidence + warnings).
  const anyAnalysisSignal = uploadedPhotos.some(
    (p) => hasSignal(p.sharpness) || hasSignal(p.faceCount) || hasSignal(p.brightness),
  );
  const anyFaceData = uploadedPhotos.some((p) => hasSignal(p.faceCount));

  // Duplicates + restoration.
  const duplicate_candidates = detectDuplicates(scored);
  const restoration_candidates = detectRestoration(scored);
  const dupKeep = new Set(duplicate_candidates.map((d) => d.keep));
  const dupAll = new Set(duplicate_candidates.flatMap((d) => d.group));
  const isSuppressedDuplicate = (id: string) => dupAll.has(id) && !dupKeep.has(id);

  // Hero selection (skip suppressed duplicates). Deterministic tie-break.
  const heroPool = [...scored].filter((s) => !isSuppressedDuplicate(s.input.id));
  const heroSorted = [...heroPool].sort(
    (a, b) =>
      b.heroScore - a.heroScore ||
      b.quality - a.quality ||
      b.megapixels - a.megapixels ||
      b.faceCount - a.faceCount ||
      a.index - b.index,
  );
  const hero = heroSorted[0] ?? null;

  // Supporting selection: rank remaining, drop weak + suppressed duplicates, cap.
  const cap = supportingCap(occasion);
  const supportingSorted = scored
    .filter((s) => s !== hero && !isSuppressedDuplicate(s.input.id))
    .sort((a, b) => b.supportScore - a.supportScore || a.index - b.index);
  const supporting = supportingSorted
    .filter((s) => s.supportScore >= SUPPORTING_MIN_SCORE)
    .slice(0, cap);
  const supportingIds = new Set(supporting.map((s) => s.input.id));

  // Rankings for EVERY photo.
  const roleOf = (s: Scored): PhotoRanking['role'] =>
    s === hero ? 'hero' : supportingIds.has(s.input.id) ? 'supporting' : 'excluded';
  const photo_rankings: PhotoRanking[] = [...scored]
    .sort(
      (a, b) =>
        (a === hero ? 1e9 : a.supportScore) < (b === hero ? 1e9 : b.supportScore) ? 1 : -1,
    )
    .map((s, i) => ({
      photoId: s.input.id,
      rank: i + 1,
      compositeScore: s === hero ? s.heroScore : s.supportScore,
      role: roleOf(s),
    }));

  // Quality breakdown.
  const photo_quality_scores: QualityScore[] = scored.map((s) => ({
    photoId: s.input.id,
    quality: s.quality,
    resolutionScore: round(s.resolutionScore * 100) / 100,
    exposureScore: round(s.exposureScore * 100) / 100,
    sharpness: s.sharpnessProvided,
  }));

  // Orientation + face tallies.
  const portrait_count = scored.filter((s) => s.orientation === 'portrait').length;
  const landscape_count = scored.filter((s) => s.orientation === 'landscape').length;
  const square_count = scored.filter((s) => s.orientation === 'square').length;
  const face_count = scored.reduce((sum, s) => sum + s.faceCount, 0);

  // Subject + concept + style + mood.
  const primary_subject = subjectFromFaces(hero ? hero.faceCount : 0, hero ? hero.input.id : null);
  const recommended_concept = recommendConcept(occasion, primary_subject);
  const style = STYLE_BY_CONCEPT[recommended_concept];
  const avgBrightness =
    scored.reduce((sum, s) => sum + (hasSignal(s.input.brightness) ? s.input.brightness! : NEUTRAL), 0) /
    scored.length;
  const baseMood = MOOD_BY_OCCASION[occasion];
  const mood = anyAnalysisSignal && avgBrightness < 0.4 ? `${baseMood} · dramatic` : baseMood;

  // Colors.
  const { colors, hadData: hadColor } = aggregateColors(scored);
  const dominant_colors = hadColor
    ? colors
    : DEFAULT_PALETTE[occasion].map((hex, i, arr) => ({
        hex,
        weight: round((100 * (arr.length - i)) / ((arr.length * (arr.length + 1)) / 2)) / 100,
      }));

  // Groups (family_members reserved for a future face-recognition stage).
  const groups = buildGroups(scored);
  const family_members: FamilyMember[] = [];

  // Story.
  const heroDesc = hero ? `one standout ${hero.orientation} photo` : 'the strongest available photo';
  const story = `A ${occasion.replace(/_/g, ' ')} celebration anchored by ${heroDesc}, supported by ${supporting.length} favorite moment${supporting.length === 1 ? '' : 's'}.`;

  // Warnings.
  if (!anyAnalysisSignal) {
    warnings.push({
      code: 'limited_photo_analysis',
      message:
        'No per-photo analysis signals (sharpness/faces/brightness) supplied; scores use neutral defaults.',
      severity: 'info',
    });
  }
  if (anyFaceData && face_count === 0) {
    warnings.push({
      code: 'no_faces_detected',
      message: 'Face data was supplied but no faces were detected.',
      severity: 'info',
    });
  }
  if (!hadColor) {
    warnings.push({
      code: 'no_color_data',
      message: 'No per-photo color data supplied; used the occasion default palette.',
      severity: 'info',
    });
  }
  if (uploadedPhotos.length < 3) {
    warnings.push({
      code: 'low_photo_count',
      message: 'Fewer than 3 photos provided; concepts may be limited.',
      severity: 'info',
    });
  }
  if (scored.every((s) => s.quality < 45)) {
    warnings.push({
      code: 'all_low_quality',
      message: 'All photos scored low on technical quality.',
      severity: 'warning',
    });
  }
  if (duplicate_candidates.length) {
    warnings.push({
      code: 'duplicates_detected',
      message: `${duplicate_candidates.length} duplicate group(s) detected; kept the strongest of each.`,
      severity: 'info',
    });
  }
  if (restoration_candidates.length) {
    warnings.push({
      code: 'restoration_recommended',
      message: `${restoration_candidates.length} photo(s) may benefit from enhancement/restoration.`,
      severity: 'info',
    });
  }

  // Confidence.
  let confidence = 100;
  if (occasion === 'unknown') confidence -= 25;
  else if (!options.occasion) confidence -= 8; // inferred, not confirmed
  if (!anyAnalysisSignal) confidence -= 20;
  if (!anyFaceData) confidence -= 8;
  if (!hadColor) confidence -= 10;
  if (uploadedPhotos.length < 3) confidence -= 10;
  if (scored.every((s) => s.quality < 45)) confidence -= 15;
  const confidence_score = Math.max(0, Math.min(100, confidence));

  return {
    schema_version: SCHEMA_VERSION,
    occasion,
    style,
    story,
    mood,
    primary_subject,
    hero_photo: hero ? toSummary(hero, hero.heroScore) : null,
    supporting_photos: supporting.map((s) => toSummary(s, s.supportScore)),
    photo_rankings,
    family_members,
    groups,
    dominant_colors,
    photo_quality_scores,
    face_count,
    portrait_count,
    landscape_count,
    square_count,
    duplicate_candidates,
    restoration_candidates,
    recommended_concept,
    confidence_score,
    warnings,
    future_extension_fields: {
      faceRecognition: null,
      aiVision: null,
      expressionAnalysis: null,
      textDetection: null,
    },
  };
}
