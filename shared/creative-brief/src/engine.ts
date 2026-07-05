/**
 * @celebratebanner/creative-brief — engine
 *
 * generateCreativeBrief(memoryProfile, options?) — the AI Creative Director's
 * direction stage. Reads a Memory Profile and decides HOW to tell the story.
 * Deterministic, dependency-free, input is never mutated.
 *
 * Spec: docs/CREATIVE_BRIEF_SCHEMA.md · docs/WOW_ENGINE_PIPELINE.md
 */

import {
  SCHEMA_VERSION,
  type ColorDirection,
  type ColorRole,
  type ConceptType,
  type CreativeBrief,
  type DecorativeDirection,
  type EmotionalDirection,
  type GenerateBriefOptions,
  type HeroStrategy,
  type MemoryProfile,
  type OccasionType,
  type RiskWarning,
  type SupportingPhotoStrategy,
  type SupportingTierGroup,
  type TypographyDirection,
  type TypographyStyle,
} from './types.ts';

// Brand core (Design Bible Part 2).
const OBSIDIAN = '#0C0E14';
const GOLD = '#C9A84C';
const IVORY = '#FAF8F3';

const CONCEPTS: ConceptType[] = ['Signature Edition', 'Luxury Gold', 'Family Legacy', 'Modern Editorial'];

// ── Deterministic id (FNV-1a 32-bit over canonical key fields) ────────────────
function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function briefIdFor(p: MemoryProfile): string {
  const key = [
    p.occasion,
    p.recommended_concept,
    p.hero_photo?.photoId ?? 'none',
    p.supporting_photos.map((s) => s.photoId).join(','),
    p.mood,
    p.confidence_score,
  ].join('|');
  return `brief_${fnv1a(key)}`;
}

// ── Occasion → emotional direction (Sprint 2 Part 3, step 3) ──────────────────
const EMOTION: Record<OccasionType, EmotionalDirection> = {
  graduation: { primary: 'pride', keywords: ['pride', 'achievement', 'future'], statement: "Celebrate the pride of a milestone earned and the promise of what's next." },
  championship: { primary: 'victory', keywords: ['victory', 'energy', 'unity'], statement: 'Capture the roar of victory and the unity that earned it.' },
  team: { primary: 'unity', keywords: ['unity', 'strength', 'energy'], statement: 'Rally the shared identity and strength of the team.' },
  wedding: { primary: 'romance', keywords: ['romance', 'elegance', 'timelessness'], statement: 'Tell a love story with elegance and timeless grace.' },
  birthday: { primary: 'joy', keywords: ['joy', 'warmth', 'celebration'], statement: 'Radiate joy and warmth for a day worth celebrating.' },
  baby_shower: { primary: 'tenderness', keywords: ['tenderness', 'hope', 'new beginnings'], statement: 'Welcome new life with tenderness and hope.' },
  retirement: { primary: 'gratitude', keywords: ['gratitude', 'legacy', 'accomplishment'], statement: 'Honor a career of accomplishment and a legacy earned.' },
  family_reunion: { primary: 'warmth', keywords: ['warmth', 'legacy', 'belonging'], statement: 'Gather generations in warmth and belonging.' },
  church: { primary: 'reverence', keywords: ['reverence', 'community', 'faith'], statement: 'Uplift a community bound by faith.' },
  military: { primary: 'honor', keywords: ['honor', 'sacrifice', 'pride'], statement: 'Salute service with honor and quiet pride.' },
  corporate: { primary: 'achievement', keywords: ['achievement', 'professionalism', 'momentum'], statement: 'Mark achievement with confident professionalism.' },
  memorial: { primary: 'respect', keywords: ['respect', 'peace', 'remembrance'], statement: 'Remember a life with respect, peace, and love.' },
  senior_night: { primary: 'nostalgia', keywords: ['nostalgia', 'pride', 'farewell'], statement: 'Honor a bittersweet farewell with pride and nostalgia.' },
  social: { primary: 'excitement', keywords: ['excitement', 'boldness', 'shareability'], statement: 'Create an instantly shareable burst of pride.' },
  unknown: { primary: 'celebration', keywords: ['celebration', 'memory', 'joy'], statement: 'Celebrate a meaningful moment worth keeping.' },
};

// ── Occasion → story angle (Sprint 2 Part 3, step 4) ──────────────────────────
const STORY_ANGLE: Record<OccasionType, string> = {
  graduation: 'A journey of perseverance leading to graduation.',
  championship: 'A season of teamwork that became a championship.',
  team: 'A team forged in shared purpose.',
  wedding: 'A love story told with elegance and timelessness.',
  birthday: 'A joyful milestone in a life well lived.',
  baby_shower: 'The first chapter of a new life beginning.',
  retirement: 'A career of dedication honored at its close.',
  family_reunion: 'A family legacy told through generations.',
  church: 'A community gathered in faith and fellowship.',
  military: 'A story of service, sacrifice, and honor.',
  corporate: 'A milestone of achievement and momentum.',
  memorial: 'A life remembered with peace and gratitude.',
  senior_night: "A final home moment before a new chapter.",
  social: 'A proud moment made to be shared.',
  unknown: 'A celebration of a meaningful moment.',
};

// ── Occasion → primary/secondary message templates ────────────────────────────
const MESSAGES: Record<OccasionType, { primary: string; secondary: string }> = {
  graduation: { primary: '{Graduate Name}', secondary: 'Class of {Year}' },
  championship: { primary: '{Team} — Champions', secondary: '{Year} {Title}' },
  team: { primary: '{Team Name}', secondary: '{Season}' },
  wedding: { primary: '{Couple Names}', secondary: '{Wedding Date}' },
  birthday: { primary: 'Happy Birthday, {Name}', secondary: '{Age} / {Date}' },
  baby_shower: { primary: 'Welcome, {Baby Name}', secondary: '{Date}' },
  retirement: { primary: 'Congratulations, {Name}', secondary: '{Years} of Service' },
  family_reunion: { primary: 'The {Family} Family', secondary: '{Year} Reunion' },
  church: { primary: '{Occasion Title}', secondary: '{Date}' },
  military: { primary: '{Name}', secondary: '{Branch} · {Years}' },
  corporate: { primary: '{Headline}', secondary: '{Company} · {Year}' },
  memorial: { primary: '{Full Name}', secondary: '{Birth Year} – {Year}' },
  senior_night: { primary: '{Name} · #{Number}', secondary: 'Senior Night {Year}' },
  social: { primary: '{Short Headline}', secondary: '{Handle / Tag}' },
  unknown: { primary: '{Name}', secondary: '{Date}' },
};

// ── Concept → typography style ────────────────────────────────────────────────
const TYPO_BY_CONCEPT: Record<ConceptType, TypographyStyle> = {
  'Signature Edition': 'elegant',
  'Luxury Gold': 'bold',
  'Family Legacy': 'legacy',
  'Modern Editorial': 'editorial',
};

// ── Concept → composition direction ───────────────────────────────────────────
const COMPOSITION_BY_CONCEPT: Record<ConceptType, { layout: string; balance: string; whitespace: string }> = {
  'Signature Edition': { layout: 'Central hero with a disciplined supporting grid.', balance: 'symmetrical', whitespace: 'generous' },
  'Luxury Gold': { layout: 'Dramatic spotlighted hero with luxurious negative space and gold framing.', balance: 'symmetrical', whitespace: 'expansive' },
  'Family Legacy': { layout: 'Narrative flow — hero plus a meaningful gathered cluster.', balance: 'organic', whitespace: 'warm-generous' },
  'Modern Editorial': { layout: 'Editorial asymmetry with an oversized hero and bold type blocks.', balance: 'asymmetrical', whitespace: 'bold' },
};

// ── Occasion → decorative direction (Design Bible) ────────────────────────────
const BASE_FORBIDDEN = ['clip art', 'emoji as decoration', 'stock stickers', 'random photo placement'];
const DECOR: Record<OccasionType, { allowed: string[]; forbidden: string[] }> = {
  graduation: { allowed: ['thin gold accent lines', 'subtle spotlight', 'refined year label'], forbidden: ['cap-and-gown clip art', 'confetti overload'] },
  championship: { allowed: ['gold glow', 'spotlight', 'trophy emphasis', 'corner flourish'], forbidden: ['flat gold wash', 'busy background', 'licensed logos or likenesses'] },
  team: { allowed: ['spotlight rays', 'geometric accents', 'restrained sky/gold accent bars'], forbidden: ['licensed logos or likenesses', 'equal-size player grid'] },
  wedding: { allowed: ['soft florals (restrained)', 'thin gold lines', 'elegant framing'], forbidden: ['heavy ornament', 'busy patterns'] },
  birthday: { allowed: ['restrained confetti accent', 'warm glow', 'bold type block'], forbidden: ['confetti overload', 'cartoon clip art'] },
  baby_shower: { allowed: ['soft neutrals', 'gentle glow', 'delicate gold detail'], forbidden: ['loud color', 'busy patterns'] },
  retirement: { allowed: ['gold detail', 'warm vignette', 'timeline accents'], forbidden: ['corporate clutter'] },
  family_reunion: { allowed: ['soft texture', 'warm vignette', 'understated gold', 'tasteful dates'], forbidden: ['cold grids', 'heavy captions'] },
  church: { allowed: ['soft light', 'gold detail', 'dignified framing'], forbidden: ['garish color', 'clutter'] },
  military: { allowed: ['restrained gold', 'dignified framing', 'subtle emblematic accent'], forbidden: ['cheap patriotic clichés', 'clutter'] },
  corporate: { allowed: ['clean geometric accents', 'thin gold rules'], forbidden: ['gold overuse', 'clutter'] },
  memorial: { allowed: ['memorial glow', 'soft vignette', 'muted gold'], forbidden: ['bright confetti', 'celebratory glitz'] },
  senior_night: { allowed: ['cinematic lighting', 'gold accents', 'bold number treatment'], forbidden: ['licensed logos or likenesses', 'generic sports template'] },
  social: { allowed: ['geometric accents', 'bold rules', 'gold highlight'], forbidden: ['tiny text', 'gold overuse'] },
  unknown: { allowed: ['thin gold accent lines', 'subtle spotlight'], forbidden: ['clutter'] },
};

// ── Occasion → product + audience intent ──────────────────────────────────────
const HEIRLOOM = new Set<OccasionType>(['memorial', 'family_reunion', 'wedding', 'retirement', 'baby_shower', 'church']);

function productIntentFor(occasion: OccasionType) {
  if (occasion === 'social') {
    return {
      recommendedProducts: ['Digital download', 'Standard print', 'Framed'],
      primaryProduct: 'Digital download',
      guidance: 'Lead with the instantly shareable digital, then offer prints. (Descriptive only — no pricing.)',
    };
  }
  const primary = HEIRLOOM.has(occasion) ? 'Framed' : 'Standard print';
  return {
    recommendedProducts: ['Framed', 'Premium print', 'Standard print', 'Digital download'],
    primaryProduct: primary,
    guidance: `Lead toward the ${primary.toLowerCase()} as a display-worthy keepsake. (Descriptive only — no pricing.)`,
  };
}

const AUDIENCE: Record<OccasionType, { primaryAudience: string; sharingContext: string }> = {
  graduation: { primaryAudience: 'the graduate and immediate family', sharingContext: 'shared with extended family before purchase' },
  championship: { primaryAudience: 'the team, players, and their families', sharingContext: 'shared across the team and fans' },
  team: { primaryAudience: 'the team and its supporters', sharingContext: 'shared across the roster and community' },
  wedding: { primaryAudience: 'the couple and their families', sharingContext: 'shared with guests and loved ones' },
  birthday: { primaryAudience: 'the celebrant and close circle', sharingContext: 'shared with friends and family' },
  baby_shower: { primaryAudience: 'the parents-to-be and family', sharingContext: 'shared with close family and friends' },
  retirement: { primaryAudience: 'the retiree, family, and colleagues', sharingContext: 'shared with coworkers and family' },
  family_reunion: { primaryAudience: 'the extended family', sharingContext: 'shared across generations' },
  church: { primaryAudience: 'the congregation and community', sharingContext: 'shared within the community' },
  military: { primaryAudience: 'the service member and family', sharingContext: 'shared with family and unit' },
  corporate: { primaryAudience: 'the company and stakeholders', sharingContext: 'shared internally and externally' },
  memorial: { primaryAudience: 'the family and loved ones', sharingContext: 'shared with mourners and family' },
  senior_night: { primaryAudience: 'the athlete and family', sharingContext: 'shared with family, team, and fans' },
  social: { primaryAudience: 'the poster and their followers', sharingContext: 'posted publicly on social platforms' },
  unknown: { primaryAudience: 'the customer and their loved ones', sharingContext: 'shared with family and friends before purchase' },
};

// ── Occasion → personalization + upsell ───────────────────────────────────────
const PERSONALIZATION: Record<OccasionType, string[]> = {
  graduation: ["Graduate's name", 'School & class year', 'Optional short quote'],
  championship: ['Team or player name', 'Year & title', 'Optional final score/record'],
  team: ['Team name', 'Season / year', 'Optional roster line'],
  wedding: ["Couple's names", 'Wedding date', 'Optional vow or quote line'],
  birthday: ['Name', 'Age or date', 'Optional message'],
  baby_shower: ["Baby's name (or 'Baby {Surname}')", 'Date', 'Optional message'],
  retirement: ['Name', 'Years of service', 'Optional message'],
  family_reunion: ['Family name', 'Year or date', 'Optional caption per era'],
  church: ['Occasion title', 'Date', 'Optional scripture line'],
  military: ['Name', 'Branch & years', 'Optional honor/rank'],
  corporate: ['Headline', 'Company & year', 'Optional subtitle'],
  memorial: ['Full name', 'Years (birth–passing)', 'Optional short tribute'],
  senior_night: ['Name & number', 'Year', 'Optional stat line'],
  social: ['Short headline', 'Handle or tag', 'Optional caption'],
  unknown: ['Name', 'Date', 'Optional message'],
};

function upsellFor(occasion: OccasionType): string[] {
  const base = ['Matching social graphic', 'Phone wallpaper', 'Desktop wallpaper', 'Thank-you card', 'Extra prints'];
  if (HEIRLOOM.has(occasion)) return [...base, 'Gallery edition', 'Framed upgrade'];
  if (occasion === 'championship' || occasion === 'team' || occasion === 'senior_night') return [...base, 'Team print package'];
  return base;
}

// ── Concept → WOW emphasis ────────────────────────────────────────────────────
const WOW_EMPHASIS: Record<ConceptType, string[]> = {
  'Signature Edition': ['Layout Balance', 'Typography', 'Luxury Finish'],
  'Luxury Gold': ['Luxury Finish', 'Emotional Impact', 'Hero Strength'],
  'Family Legacy': ['Storytelling', 'Emotional Impact'],
  'Modern Editorial': ['Layout Balance', 'Typography', 'Shareability'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const clamp = (n: number, lo: number, hi: number): number => (n < lo ? lo : n > hi ? hi : n);
const isGoldish = (hex: string): boolean => /^#(c|d|e|f)/i.test(hex) && /a|b|c|8|9/i.test(hex.slice(3, 5));

function ensureConcept(p: MemoryProfile): ConceptType {
  if (CONCEPTS.includes(p.recommended_concept)) return p.recommended_concept;
  // Fallback: derive from subject shape.
  return p.primary_subject.type === 'group' ? 'Family Legacy' : 'Signature Edition';
}

function heroStrategyFor(p: MemoryProfile): HeroStrategy {
  const hero = p.hero_photo;
  if (!hero) {
    return {
      heroPhotoId: null,
      rationale: 'No hero could be selected from the uploaded photos.',
      dominance: 'balanced',
      dominanceRatio: 0,
      supportingRole: 'Without a clear hero, request a stronger central photo before finalizing.',
    };
  }
  let dominance: HeroStrategy['dominance'];
  let dominanceRatio: number;
  if (hero.score >= 88) {
    dominance = 'commanding';
    dominanceRatio = 0.62;
  } else if (hero.score >= 78) {
    dominance = 'strong';
    dominanceRatio = 0.55;
  } else {
    dominance = 'balanced';
    dominanceRatio = 0.45;
  }
  const subjects = hero.faceCount === 1 ? '1 clear subject' : hero.faceCount > 1 ? `${hero.faceCount} subjects` : 'a strong subject';
  return {
    heroPhotoId: hero.photoId,
    rationale: `Photo ${hero.photoId} (${hero.filename ?? 'untitled'}) is strongest: ${hero.orientation}, score ${hero.score}, ${subjects}.`,
    dominance,
    dominanceRatio,
    supportingRole: 'All supporting photos frame and lead the eye back to the hero; none competes with it.',
  };
}

function supportingStrategyFor(p: MemoryProfile): SupportingPhotoStrategy {
  const supporting = p.supporting_photos;
  const anchors: string[] = [];
  const builders: string[] = [];
  const accents: string[] = [];
  supporting.forEach((s, i) => {
    if (i < 2 && s.score >= 75) anchors.push(s.photoId);
    else if (s.score >= 60) builders.push(s.photoId);
    else accents.push(s.photoId);
  });
  const hierarchy: SupportingTierGroup[] = [];
  if (anchors.length) hierarchy.push({ tier: 'emotional_anchor', photoIds: anchors, role: 'Carry the strongest supporting emotion, just beneath the hero.' });
  if (builders.length) hierarchy.push({ tier: 'story_builder', photoIds: builders, role: 'Advance the narrative and connect moments.' });
  if (accents.length) hierarchy.push({ tier: 'accent', photoIds: accents, role: 'Provide gentle texture; use sparingly or omit if crowded.' });
  return {
    hierarchy,
    maxRecommended: supporting.length,
    guidance: 'Beauty over quantity — cut any supporting photo that weakens the composition or crowds the hero.',
  };
}

function colorDirectionFor(p: MemoryProfile): ColorDirection {
  const defaulted = p.warnings.some((w) => w.code === 'no_color_data');
  const source: ColorDirection['source'] = defaulted ? 'occasion-default' : 'photos';

  // Start from the profile palette, then guarantee the brand core is present.
  const palette: ColorRole[] = [];
  const seen = new Set<string>();
  const add = (hex: string, role: string) => {
    const H = hex.toUpperCase();
    if (seen.has(H)) return;
    seen.add(H);
    palette.push({ hex: H, role });
  };

  const colors = p.dominant_colors ?? [];
  const primaryHex = (colors[0]?.hex ?? OBSIDIAN).toUpperCase();
  add(primaryHex, 'primary');
  const goldFromPhotos = colors.find((c) => isGoldish(c.hex))?.hex;
  const accentHex = (goldFromPhotos ?? GOLD).toUpperCase();
  add(accentHex, 'accent');
  for (const c of colors.slice(1, 4)) add(c.hex.toUpperCase(), 'support');

  // Brand-core guarantees (Design Bible): obsidian ground, gold accent, ivory neutral.
  add(OBSIDIAN, 'ground');
  add(GOLD, 'gold-signature');
  add(IVORY, 'neutral');

  return {
    palette,
    primary: primaryHex,
    accent: accentHex,
    neutral: IVORY,
    source,
    guidance:
      source === 'photos'
        ? "Build on the photos' own palette, kept in harmony with the Obsidian/Gold/Ivory brand core."
        : 'No photo color data — use the occasion default layered on the Obsidian/Gold/Ivory brand core.',
  };
}

function typographyFor(occasion: OccasionType, concept: ConceptType): TypographyDirection {
  // Memorial always reads respectful, regardless of concept.
  const style: TypographyStyle = occasion === 'memorial' ? 'respectful' : TYPO_BY_CONCEPT[concept];
  const guidanceByStyle: Record<TypographyStyle, string> = {
    elegant: 'Elegant, high-contrast hierarchy; the name is the strongest text after the hero.',
    bold: 'Large, opulent display type in gold gradients; letter-spaced small-caps labels.',
    editorial: 'Confident, tightly-tracked type; strong blocks with a refined serif accent.',
    legacy: 'Warm classic serif with humanist support; approachable and heartfelt.',
    respectful: 'Restrained, dignified type; gentle sizing and low-key gold, never flashy.',
  };
  return {
    style,
    displayFont: 'Cormorant Garamond',
    supportingFont: 'Outfit',
    guidance: guidanceByStyle[style],
  };
}

function riskWarningsFor(p: MemoryProfile): RiskWarning[] {
  const risks: RiskWarning[] = [];
  const totalPhotos = p.photo_rankings.length;

  if (totalPhotos < 3) {
    risks.push({ code: 'too_few_photos', message: `Only ${totalPhotos} photo(s) available; concepts may feel sparse.`, severity: 'warning' });
  }
  if (!p.hero_photo) {
    risks.push({ code: 'weak_hero', message: 'No hero photo could be selected.', severity: 'warning' });
  } else if (p.hero_photo.score < 75) {
    risks.push({ code: 'weak_hero', message: `Hero photo scored ${p.hero_photo.score}, below the strong threshold (75).`, severity: 'warning' });
  }
  if (p.confidence_score < 70) {
    risks.push({ code: 'low_confidence', message: `Memory Profile confidence is ${p.confidence_score}; direction is less certain.`, severity: 'warning' });
  }
  const dupPhotos = p.duplicate_candidates.reduce((n, d) => n + d.group.length, 0);
  if (p.duplicate_candidates.length >= 2 || (totalPhotos > 0 && dupPhotos / totalPhotos > 0.3)) {
    risks.push({ code: 'duplicate_heavy', message: 'A large share of the upload is duplicates; curation applied.', severity: 'info' });
  }
  if (p.restoration_candidates.length > 0) {
    risks.push({ code: 'restoration_needed', message: `${p.restoration_candidates.length} photo(s) would benefit from enhancement/restoration.`, severity: 'info' });
  }
  // Mixed-orientation conflict: neither portrait nor landscape clearly dominates.
  const port = p.portrait_count;
  const land = p.landscape_count;
  if (port > 0 && land > 0) {
    const ratio = Math.min(port, land) / Math.max(port, land);
    if (ratio >= 0.5) {
      risks.push({ code: 'mixed_orientation_conflict', message: 'Portrait and landscape photos are mixed evenly; layout must reconcile orientations carefully.', severity: 'info' });
    }
  }
  // Overcrowding: many usable photos relative to a clean layout.
  if (p.supporting_photos.length >= 8 || totalPhotos >= 12) {
    risks.push({ code: 'overcrowding_risk', message: 'Many photos available; enforce restraint to avoid overcrowding the hero.', severity: 'info' });
  }
  return risks;
}

// ── Main entry point ──────────────────────────────────────────────────────────
/**
 * Decide HOW to tell the celebration story from a Memory Profile.
 * The ONLY public function of this module. Deterministic; input is never mutated.
 */
export function generateCreativeBrief(
  memoryProfile: MemoryProfile,
  options: GenerateBriefOptions = {},
): CreativeBrief {
  if (!memoryProfile || typeof memoryProfile !== 'object' || Array.isArray(memoryProfile)) {
    throw new TypeError('generateCreativeBrief: memoryProfile must be a MemoryProfile object');
  }

  const occasion: OccasionType = memoryProfile.occasion ?? 'unknown';
  const recommendedConcept = ensureConcept(memoryProfile);
  const emotion = EMOTION[occasion] ?? EMOTION.unknown;
  const messages = MESSAGES[occasion] ?? MESSAGES.unknown;
  const composition = COMPOSITION_BY_CONCEPT[recommendedConcept];
  const decor = DECOR[occasion] ?? DECOR.unknown;
  const heroStrategy = heroStrategyFor(memoryProfile);
  const riskWarnings = riskWarningsFor(memoryProfile);

  // Confidence: seed from the profile, penalize for weak hero + serious risks.
  let confidence = memoryProfile.confidence_score;
  if (!memoryProfile.hero_photo) confidence -= 30;
  else if (memoryProfile.hero_photo.score < 75) confidence -= 10;
  const seriousRisks = riskWarnings.filter((r) => r.severity === 'warning').length;
  confidence -= Math.min(20, seriousRisks * 5);
  const confidenceScore = clamp(Math.round(confidence), 0, 100);

  return {
    schemaVersion: SCHEMA_VERSION,
    briefId: briefIdFor(memoryProfile),
    createdAt: options.now ?? null,
    occasion,
    recommendedConcept,
    emotionalDirection: { primary: emotion.primary, keywords: [...emotion.keywords], statement: emotion.statement },
    storyAngle: STORY_ANGLE[occasion] ?? STORY_ANGLE.unknown,
    primaryMessage: {
      suggestion: messages.primary,
      guidance: 'Set as the dominant statement, second only to the hero photo.',
    },
    secondaryMessage: {
      suggestion: messages.secondary,
      guidance: 'Refined supporting label (often gold); never competes with the primary message.',
    },
    heroStrategy,
    supportingPhotoStrategy: supportingStrategyFor(memoryProfile),
    colorDirection: colorDirectionFor(memoryProfile),
    typographyDirection: typographyFor(occasion, recommendedConcept),
    compositionDirection: {
      layout: composition.layout,
      balance: composition.balance,
      whitespace: composition.whitespace,
      guidance: 'Whitespace is intentional; the eye must always find the hero first.',
    },
    decorativeDirection: {
      allowed: [...decor.allowed],
      forbidden: [...decor.forbidden, ...BASE_FORBIDDEN],
      guidance: 'Decoration must serve emotion or hierarchy — otherwise remove it.',
    },
    productIntent: productIntentFor(occasion),
    audienceIntent: {
      ...(AUDIENCE[occasion] ?? AUDIENCE.unknown),
      guidance: 'Let audience and sharing context shape tone and shareability.',
    },
    personalizationSuggestions: [...(PERSONALIZATION[occasion] ?? PERSONALIZATION.unknown)],
    upsellOpportunities: upsellFor(occasion),
    wowTargets: {
      overallTarget: 90,
      emphasis: [...WOW_EMPHASIS[recommendedConcept]],
      guidance: 'Never present a concept below 90; push hardest on the emphasized categories.',
    },
    riskWarnings,
    confidenceScore,
  };
}
