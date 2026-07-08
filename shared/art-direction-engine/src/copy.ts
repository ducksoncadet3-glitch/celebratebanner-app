/**
 * Card copy — a title, ONE emotional sentence, and THREE premium bullets.
 *
 * Every line is a design fact (composition, hero weight, palette, story) or an
 * occasion-appropriate sentiment. Nothing biographical is invented: we never name a
 * person, never claim a relationship, never assert something the profile did not say.
 */
import type { WowConceptName, ConceptCopy, ArtDirection } from './types.ts';

/** Occasion → one honest, warm sentence. Never names anyone. */
const SENTIMENT: Record<string, Record<WowConceptName, string>> = {
  graduation: {
    'Signature Edition': 'The years of work, framed with the calm of a gallery wall.',
    'Luxury Gold': 'A milestone worth every ounce of gold on the page.',
    'Family Legacy': 'The whole journey — not just the moment it ended.',
    'Modern Editorial': 'Achievement, stated plainly, with nothing in the way.',
  },
  championship: {
    'Signature Edition': 'The season distilled into one composed, permanent image.',
    'Luxury Gold': 'The trophy light, held on the page long after the whistle.',
    'Family Legacy': 'Every practice, every ride home, gathered in one story.',
    'Modern Editorial': 'Victory, stripped to its cleanest possible line.',
  },
  wedding: {
    'Signature Edition': 'A day of promises, given the stillness it deserves.',
    'Luxury Gold': 'The glow of the evening, kept at full brightness.',
    'Family Legacy': 'Two families, one page, in the order the day unfolded.',
    'Modern Editorial': 'Love, edited down to what actually matters.',
  },
  memorial: {
    'Signature Edition': 'A life, held quietly and with great care.',
    'Luxury Gold': 'A brightness that refuses to dim.',
    'Family Legacy': 'The story told the way the family remembers it.',
    'Modern Editorial': 'Presence, honoured with restraint.',
  },
};
const DEFAULT_SENTIMENT: Record<WowConceptName, string> = {
  'Signature Edition': 'A moment worth keeping, composed like a gallery print.',
  'Luxury Gold': 'A moment worth keeping, lit like a magazine cover.',
  'Family Legacy': 'A moment worth keeping, told as the story it really was.',
  'Modern Editorial': 'A moment worth keeping, with nothing in the way.',
};

export function emotionalSentence(name: WowConceptName, occasion: string): string {
  return (SENTIMENT[occasion] && SENTIMENT[occasion][name]) || DEFAULT_SENTIMENT[name];
}

const pct = (n: number): string => `${Math.round(n * 100)}%`;

/** Three bullets: composition, hero weight, and what makes this identity itself. */
export function bulletsFor(d: Omit<ArtDirection, 'copy'>): [string, string, string] {
  const heroPct = pct(d.hero.dominanceRatio);
  switch (d.conceptName) {
    case 'Signature Edition':
      return [
        'Symmetrical museum composition',
        `Hero commands ${heroPct} of the frame`,
        'Champagne gold, used sparingly',
      ];
    case 'Luxury Gold':
      return [
        'High-contrast editorial drama',
        `Spotlit hero at ${heroPct} of the frame`,
        `Only ${d.supporting.count} supporting frames — scarcity reads as luxury`,
      ];
    case 'Family Legacy':
      return [
        `A ${d.supporting.count}-photo journey, in story order`,
        `Warm hierarchy, hero at ${heroPct}`,
        'Amber and cream — the palette of a family album',
      ];
    case 'Modern Editorial':
      return [
        'Magazine-cover negative space',
        `Off-centre hero at ${heroPct}`,
        'Restrained, contemporary palette — light is the accent',
      ];
  }
}

export function copyFor(d: Omit<ArtDirection, 'copy'>, occasion: string): ConceptCopy {
  return {
    title: d.conceptName,
    emotionalSentence: emotionalSentence(d.conceptName, occasion),
    bullets: bulletsFor(d),
  };
}
