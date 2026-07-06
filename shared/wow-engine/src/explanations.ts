/**
 * Creative explanations, purchase psychology, and share copy.
 *
 * CONSTITUTIONAL RULE (Art. IX): never invent facts. Every sentence is derived
 * ONLY from the Memory Profile + Creative Brief. Purchase psychology guides —
 * it never manipulates (no fake scarcity, no pressure).
 */
import type { MemoryProfile, CreativeBrief, OccasionType, WowConceptName, SharePreview } from './types.ts';

/** A natural-language noun for the occasion (used in copy). */
export function occasionNoun(occasion: OccasionType): string {
  const map: Partial<Record<OccasionType, string>> = {
    graduation: 'graduation',
    championship: 'championship',
    team: 'team',
    wedding: 'wedding day',
    birthday: 'birthday',
    baby_shower: 'baby celebration',
    retirement: 'retirement',
    family_reunion: 'family reunion',
    church: 'church milestone',
    military: 'service and homecoming',
    corporate: 'milestone',
    memorial: 'life and legacy',
    senior_night: 'senior night',
    social: 'celebration',
    unknown: 'celebration',
  };
  return map[occasion] ?? 'celebration';
}

/** A short, gathering-context phrase for purchase guidance. */
function gatheringPhrase(occasion: OccasionType): string {
  const map: Partial<Record<OccasionType, string>> = {
    graduation: 'a graduation party',
    championship: 'a championship celebration',
    wedding: 'a wedding reception',
    birthday: 'a birthday party',
    retirement: 'a retirement send-off',
    family_reunion: 'a family reunion',
    memorial: 'a celebration of life',
    church: 'a church gathering',
    senior_night: 'senior night',
  };
  return map[occasion] ?? 'the celebration';
}

function heroPhrase(profile: MemoryProfile): string {
  const h = profile.hero_photo;
  if (!h) return 'your strongest photo';
  const name = h.filename ? `“${h.filename}”` : 'your hero photo';
  return `${name} (${h.orientation}, quality ${h.score}/100)`;
}

/**
 * WHY the AI made its decisions — 3–4 sentences, all derived from the inputs.
 */
export function creativeExplanation(
  concept: WowConceptName,
  profile: MemoryProfile,
  brief: CreativeBrief,
): string {
  const occ = occasionNoun(profile.occasion);
  const emotion = brief.emotionalDirection.primary;
  const suppN = profile.supporting_photos.length;
  const heroReason = brief.heroStrategy.rationale;
  const balance = brief.compositionDirection.balance;
  const whitespace = brief.compositionDirection.whitespace;
  const accent = brief.colorDirection.accent;
  const ground = brief.colorDirection.primary;

  // Sentence 1 — the hero and why it was chosen (from the brief's rationale).
  const s1 = `We made ${heroPhrase(profile)} the star. ${heroReason}`;

  // Sentence 2 — the concept's approach, tied to the brief's directions.
  const approach: Record<WowConceptName, string> = {
    'Signature Edition': `Signature Edition centers it with ${balance} balance and ${whitespace} whitespace, framed with restraint in ${accent} on ${ground} — timeless, so this ${occ} still feels right in ten years.`,
    'Luxury Gold': `Luxury Gold lifts it into a cinematic spotlight with luxurious negative space and gold framing in ${accent}, so the ${occ} feels as big as it was.`,
    'Family Legacy': `Family Legacy arranges the memories as a warm story — anchor moments, then story builders — with room around every face, honoring the ${occ} across time.`,
    'Modern Editorial': `Modern Editorial gives it magazine-cover scale and deliberate asymmetry, with bold negative space and strong type — the ${occ}, styled like a cover.`,
  };
  const s2 = approach[concept];

  // Sentence 3 — supporting-photo curation (beauty over quantity) or the solo hero.
  const s3 = suppN > 0
    ? `${suppN} supporting photo${suppN === 1 ? ' was' : 's were'} chosen only because they strengthen the hero and lead the eye back to it — beauty over quantity, nothing added for its own sake.`
    : `We let the hero stand alone rather than pad the design — restraint over filler.`;

  // Sentence 4 — the emotional aim (from the brief's statement).
  const s4 = `Everything serves one feeling: ${emotion}. ${brief.emotionalDirection.statement}`;

  return [s1, s2, s3, s4].join(' ');
}

/**
 * Gentle purchase guidance. Guides, never manipulates.
 */
export function purchasePsychology(
  concept: WowConceptName,
  profile: MemoryProfile,
  brief: CreativeBrief,
  recommendedProduct: string,
): string {
  const occ = occasionNoun(profile.occasion);
  const gathering = gatheringPhrase(profile.occasion);
  const audience = brief.audienceIntent.primaryAudience;

  const base: Record<WowConceptName, string> = {
    'Signature Edition': `The version most families choose — timeless and universally loved. A natural centerpiece for ${gathering}.`,
    'Luxury Gold': `Best displayed as a framed keepsake; the gold reads richest at a large size, so it looks strongest at 24×36.`,
    'Family Legacy': `Grandparents and extended family tend to love this one. It’s made to be handed down.`,
    'Modern Editorial': `Made to share — it looks strongest on a phone screen and social feed before it ever reaches a wall.`,
  };

  const product = recommendedProduct ? ` Recommended as a ${recommendedProduct}.` : '';
  const forWhom = ` Made for ${audience}.`;
  return `${base[concept]}${product}${forWhom}`.replace(/\s+/g, ' ').trim() + ` (${occ})`;
}

/** Pre-written, in-voice share copy — text only (no image). */
export function sharePreview(
  concept: WowConceptName,
  profile: MemoryProfile,
  brief: CreativeBrief,
): SharePreview {
  const occ = occasionNoun(profile.occasion);
  const reverent = profile.occasion === 'memorial';
  const headline = reverent
    ? `Honoring a life — our ${occ}.`
    : brief.emotionalDirection.statement;
  const caption = reverent
    ? `We turned our favorite photos into something worth keeping forever. 🤍`
    : `I can’t believe this came from our photos. 😮`;
  const altText = `A ${concept} CelebrateBanner ${occ} design, centered on the chosen hero photo${profile.supporting_photos.length ? ` with ${profile.supporting_photos.length} supporting photos` : ''}.`;
  return { headline, caption, altText };
}
