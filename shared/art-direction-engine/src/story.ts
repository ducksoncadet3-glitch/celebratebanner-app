/**
 * Storytelling flow — supporting photos should read as a story, not a shuffle.
 *
 * A graduation tells: portrait → diploma → parents → friends → celebration → cake.
 * We classify each photo into a narrative beat (from its filename and face count),
 * then order the photos by beat. Photos we cannot classify keep their original
 * relative order and follow the recognised beats — nothing is ever dropped, and every
 * move records its justification (the Constitution forbids silent reordering).
 */
import type { PhotoSummary, StoryBeat } from './types.ts';

/** The narrative arc per occasion. Index = position in the story. */
export const STORY_BEATS: Record<string, string[]> = {
  graduation: ['portrait', 'diploma', 'parents', 'friends', 'celebration', 'cake'],
  championship: ['portrait', 'action', 'team', 'trophy', 'celebration', 'crowd'],
  team: ['portrait', 'action', 'team', 'trophy', 'celebration', 'crowd'],
  wedding: ['portrait', 'ceremony', 'rings', 'family', 'celebration', 'cake'],
  family_reunion: ['portrait', 'generations', 'parents', 'children', 'gathering', 'feast'],
  memorial: ['portrait', 'younger-years', 'family', 'friends', 'legacy', 'remembrance'],
};
export const DEFAULT_BEATS = ['portrait', 'moment', 'family', 'friends', 'celebration', 'detail'];

/** Filename keywords that identify a beat. Checked in beat order. */
const BEAT_KEYWORDS: Record<string, string[]> = {
  portrait: ['portrait', 'headshot', 'solo', 'senior'],   // NOT 'cap'/'gown': graduation attire appears in many photos
  diploma: ['diploma', 'certificate', 'scroll', 'stage', 'walk', 'handshake'],
  parents: ['parents', 'mom', 'mother', 'dad', 'father', 'mum', 'family'],
  friends: ['friends', 'classmates', 'squad', 'crew', 'buddies'],
  celebration: ['celebration', 'party', 'cheer', 'toss', 'confetti', 'hug', 'jump', 'cap toss'],
  cake: ['cake', 'dessert', 'toast', 'champagne', 'cupcake'],
  action: ['action', 'play', 'game', 'match', 'shot', 'run'],
  team: ['team', 'squad', 'lineup', 'huddle'],
  trophy: ['trophy', 'medal', 'cup', 'award', 'banner'],
  crowd: ['crowd', 'stands', 'fans', 'stadium'],
  ceremony: ['ceremony', 'vows', 'aisle', 'altar'],
  rings: ['rings', 'ring', 'bands'],
  family: ['family', 'relatives', 'kin'],
  generations: ['generations', 'grandma', 'grandpa', 'grandparents'],
  children: ['children', 'kids', 'cousins'],
  gathering: ['gathering', 'reunion', 'group'],
  feast: ['feast', 'dinner', 'meal', 'table'],
  'younger-years': ['young', 'vintage', 'archive', 'old'],
  legacy: ['legacy', 'tribute'],
  remembrance: ['remembrance', 'memorial', 'candle', 'flowers'],
  moment: [],
  detail: ['detail', 'closeup', 'macro'],
};

export function beatsForOccasion(occasion: string, override?: string[]): string[] {
  if (override && override.length) return override;
  return STORY_BEATS[occasion] ?? DEFAULT_BEATS;
}

/**
 * Classify one photo into a beat. Filename keywords win; otherwise face count is a
 * gentle hint (1 face reads as a portrait, a crowd reads as friends). Never guesses a
 * beat that is not part of this occasion's arc.
 */
export function classifyPhoto(photo: PhotoSummary, beats: string[]): { beat: string; reason: string } {
  const name = String(photo.filename ?? '').toLowerCase();

  for (const beat of beats) {
    const keys = BEAT_KEYWORDS[beat] ?? [];
    const hit = keys.find((k) => name.includes(k));
    if (hit) return { beat, reason: `Filename mentions “${hit}”.` };
  }

  const faces = typeof photo.faceCount === 'number' ? photo.faceCount : 0;
  if (faces === 1 && beats.includes('portrait')) return { beat: 'portrait', reason: 'A single subject reads as a portrait.' };
  if (faces >= 4 && beats.includes('friends')) return { beat: 'friends', reason: `${faces} faces read as a group of friends.` };
  if (faces >= 2 && beats.includes('parents')) return { beat: 'parents', reason: `${faces} faces read as family.` };
  if (faces >= 2 && beats.includes('family')) return { beat: 'family', reason: `${faces} faces read as family.` };

  return { beat: 'unplaced', reason: 'No narrative cue — kept in the customer’s original order.' };
}

export interface StoryOrder {
  ordered: PhotoSummary[];
  flow: StoryBeat[];
}

/**
 * Order supporting photos into the occasion's narrative arc. Stable: photos sharing a
 * beat keep their incoming (ranked) order, and unclassified photos follow, untouched.
 */
export function orderPhotoStory(photos: PhotoSummary[], occasion: string, override?: string[]): StoryOrder {
  const beats = beatsForOccasion(occasion, override);
  const list = Array.isArray(photos) ? photos.filter(Boolean) : [];

  const tagged = list.map((photo, index) => {
    const { beat, reason } = classifyPhoto(photo, beats);
    const rank = beat === 'unplaced' ? beats.length : beats.indexOf(beat);
    return { photo, index, beat, reason, rank: rank < 0 ? beats.length : rank };
  });

  tagged.sort((a, b) => (a.rank - b.rank) || (a.index - b.index));

  return {
    ordered: tagged.map((t) => t.photo),
    flow: tagged.map((t) => ({ photoId: t.photo.photoId, beat: t.beat, reason: t.reason })),
  };
}
