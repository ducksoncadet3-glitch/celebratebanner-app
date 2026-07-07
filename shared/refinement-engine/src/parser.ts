/**
 * Parser — turns a natural-language instruction into a deterministic set of
 * refinement intents, plus any forbidden requests the Constitution refuses.
 * Pure keyword/phrase matching: no model calls, no randomness, no I/O.
 */
import type { ParsedInstruction, RefinementIntent, ForbiddenRequest } from './types.ts';
import { REFINEMENT_INTENTS } from './types.ts';

/** Intent → trigger terms (matched case-insensitively as word-ish substrings). */
const INTENT_TERMS: Record<RefinementIntent, string[]> = {
  luxury: ['luxur', 'luxe', 'opulent', 'premium', 'lavish', 'rich', 'gold', 'expensive', 'high-end', 'upscale'],
  elegance: ['elegan', 'refined', 'sophisticat', 'graceful', 'tasteful', 'classy', 'polished'],
  modern: ['modern', 'contemporary', 'editorial', 'sleek', 'fresh', 'current', 'trendy'],
  classic: ['classic', 'timeless', 'traditional', 'formal', 'heritage', 'vintage'],
  minimal: ['minimal', 'clean', 'simple', 'less', 'declutter', 'uncluttered', 'sparse', 'understated', 'pared'],
  celebration: ['celebrat', 'festive', 'joyful', 'party', 'fun', 'cheer', 'jubilant', 'lively'],
  'hero-emphasis': ['bigger hero', 'larger hero', 'emphasize the hero', 'emphasise the hero', 'hero bigger', 'focus on the main', 'make the hero', 'bigger main photo', 'feature the hero', 'hero pop', 'emphasize the main', 'star photo', 'stand out', 'stands out', 'standout', 'make her pop', 'make him pop'],
  typography: ['typograph', 'font', 'headline', 'lettering', 'type', 'title', 'wording'],
  color: ['color', 'colour', 'palette', 'hue', 'warmer', 'cooler', 'tone', 'tint', 'saturat'],
  decoration: ['decorat', 'ornament', 'embellish', 'flourish', 'accent', 'motif', 'detail', 'adorn'],
  lighting: ['light', 'glow', 'spotlight', 'bright', 'illuminat', 'shine', 'radian', 'luminous'],
  emotion: ['emotion', 'heartfelt', 'moving', 'touching', 'sentiment', 'feeling', 'warmth', 'nostalg', 'tender'],
  background: ['background', 'backdrop', 'behind', 'setting', 'scene'],
  energy: ['energy', 'energetic', 'dynamic', 'vibrant', 'bold', 'pop', 'punch', 'exciting', 'striking', 'powerful'],
};

/** Forbidden-request detectors (Creative Constitution). */
const FORBIDDEN: { code: ForbiddenRequest['code']; reason: string; test: RegExp }[] = [
  {
    code: 'reduce-hero',
    reason: 'Cannot reduce hero dominance — the Design Bible requires the hero to anchor the piece.',
    test: /\b(smaller|shrink|reduce|less focus|de-?emphasi[sz]e|minimi[sz]e|tone down|downplay)\b[^.]*\bhero\b|\bhero\b[^.]*\b(smaller|shrink|less prominent|less dominant|reduce)\b/i,
  },
  {
    code: 'change-name',
    reason: 'Cannot change customer names — names are facts and are preserved exactly.',
    test: /\b(change|rename|replace|edit|fix|correct|update|misspell|respell)\b[^.]*\bname\b|\b(name it|call it|call him|call her|change the spelling|spell (?:my|the) name)\b/i,
  },
  {
    code: 'fabricate',
    reason: 'Cannot fabricate people or invent facts — only real, provided memories are used.',
    test: /\b(add|include|insert|put|photoshop|paste|place|composite|generate|invent|make up)\b[^.]*\b(person|people|someone|somebody|a face|another (?:face|person|photo)|grandma|grandpa|my (?:late|dad|mom|mother|father|son|daughter))\b/i,
  },
  {
    // Identity swaps are an authenticity refusal — the real people are preserved.
    code: 'change-identity',
    reason: 'Cannot change, replace, or swap the people in your photos — your real memory is preserved exactly.',
    test: /\b(change|replace|swap|switch|substitute)\b[^.]*\b(person|people|face|faces|subject|someone|somebody|man|woman|boy|girl|guy|graduate)\b|\bmake it (?:another|a different) person\b|\b(?:another|a different) person\b/i,
  },
  {
    code: 'reorder-memories',
    reason: 'Cannot reorder memories without justification — order reflects the story and the ranking.',
    // "swap/switch/move/put" only count as reordering when they act on photos/order —
    // "swap the person" is an identity change (above), not a reorder.
    test: /\b(reorder|re-?arrange|rearrange|shuffle|reshuffle|resequence|change the order|different order)\b|\b(swap|switch|move|put|resequence)\b[^.]*\b(photos?|images?|pictures?|order|memor)\w*/i,
  },
];

const normalize = (s: string): string => String(s || '').toLowerCase();

/**
 * Match a term against the instruction. Multi-word terms match as a phrase; single
 * words match on a token PREFIX (so "luxur" catches "luxurious" but "less" does NOT
 * fire on "timeless"). This word-boundary discipline avoids greedy false positives.
 */
function termHits(term: string, text: string, tokens: string[]): boolean {
  if (term.includes(' ')) return text.includes(term);
  return tokens.some((tok) => tok === term || tok.startsWith(term));
}

/** Reduction / negation cues — "reduce", "less", "remove", "fewer", "tone down"… */
const REDUCTION = /\b(reduce|reducing|less|fewer|fewest|remove|removing|removed|cut|drop|dropping|strip|stripped|minimi[sz]e|without|no more|get rid|take out|take away|lose the)\b/;
/** Decoration nouns (used with a reduction cue to detect "remove decoration"). */
const DECOR_NOUN = /(decorat|ornament|embellish|flourish|adorn|motif)/;

/** Parse a customer instruction into intents + forbidden requests. Deterministic. */
export function parseInstruction(instruction: string): ParsedInstruction {
  const raw = normalize(instruction);
  // Normalize the reduction idiom "tone down" so it does not read as a color ("tone").
  const text = raw.replace(/\btoned? down\b/g, 'reduce');
  const tokens = text.split(/[^a-z0-9]+/).filter(Boolean);
  const matchedTerms: Partial<Record<RefinementIntent, string[]>> = {};
  let intents: RefinementIntent[] = [];

  // Iterate in the canonical intent order for stable, snapshot-friendly output.
  for (const intent of REFINEMENT_INTENTS) {
    const hits = INTENT_TERMS[intent].filter((t) => termHits(t, text, tokens));
    if (hits.length) {
      intents.push(intent);
      matchedTerms[intent] = hits;
    }
  }

  // Negation: "reduce/less/remove … decoration" is a REMOVAL, not an addition.
  // Re-route it to a minimal (decoration-removal) direction instead of adding ornament.
  if (intents.includes('decoration') && REDUCTION.test(text) && DECOR_NOUN.test(text)) {
    const set = new Set<RefinementIntent>(intents.filter((i) => i !== 'decoration'));
    set.add('minimal');
    intents = REFINEMENT_INTENTS.filter((i) => set.has(i));
    delete matchedTerms.decoration;
    matchedTerms.minimal = matchedTerms.minimal ?? ['decoration-removal'];
  }

  const forbidden: ForbiddenRequest[] = [];
  for (const f of FORBIDDEN) {
    if (f.test.test(text)) forbidden.push({ code: f.code, reason: f.reason });
  }

  return { intents, forbidden, matchedTerms };
}
