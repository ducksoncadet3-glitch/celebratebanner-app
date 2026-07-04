/**
 * Unit-test fixtures — representative upload scenarios for five celebrations.
 * Each scenario feeds generateMemoryProfile(); expected outputs are snapshotted
 * in ../fixtures/*.json.
 */

import type { GenerateOptions, PhotoInput } from '../src/types.ts';

export interface Scenario {
  key: string;
  options: GenerateOptions;
  photos: PhotoInput[];
}

// A crisp portrait hero, a couple of good supporting shots, one weak, one dup.
export const graduation: Scenario = {
  key: 'graduation',
  options: { occasion: 'graduation' },
  photos: [
    { id: 'g1', filename: 'grad_portrait.jpg', width: 4032, height: 5040, faceCount: 1, sharpness: 0.9, brightness: 0.58, contrast: 0.64, dominantColors: [{ hex: '#0C0E14', weight: 0.5 }, { hex: '#C9A84C', weight: 0.3 }], takenAt: '2026-05-20T17:00:00Z' },
    { id: 'g2', filename: 'cap_toss.jpg', width: 6000, height: 4000, faceCount: 3, sharpness: 0.8, brightness: 0.6, contrast: 0.6, dominantColors: [{ hex: '#FAF8F3', weight: 0.4 }, { hex: '#C9A84C', weight: 0.35 }], takenAt: '2026-05-20T17:05:00Z' },
    { id: 'g3', filename: 'family_hug.jpg', width: 4000, height: 3000, faceCount: 4, sharpness: 0.72, brightness: 0.55, contrast: 0.58, takenAt: '2026-05-20T17:20:00Z' },
    { id: 'g4', filename: 'blurry_walk.jpg', width: 3024, height: 4032, faceCount: 1, sharpness: 0.22, brightness: 0.4, contrast: 0.4, takenAt: '2026-05-20T18:00:00Z' },
    { id: 'g5', filename: 'cap_toss_dup.jpg', width: 6000, height: 4000, faceCount: 3, sharpness: 0.79, brightness: 0.6, contrast: 0.6, takenAt: '2026-05-20T17:05:01Z' },
  ],
};

// Triumphant single hero, spotlighted, few supporting — Luxury Gold territory.
export const championship: Scenario = {
  key: 'championship',
  options: { occasion: 'championship' },
  photos: [
    { id: 'c1', filename: 'trophy_lift.jpg', width: 5000, height: 6250, faceCount: 1, sharpness: 0.92, brightness: 0.5, contrast: 0.7, dominantColors: [{ hex: '#0C0E14', weight: 0.55 }, { hex: '#C9A84C', weight: 0.35 }] },
    { id: 'c2', filename: 'team_celebrate.jpg', width: 6000, height: 4000, faceCount: 8, sharpness: 0.8, brightness: 0.52, contrast: 0.65 },
    { id: 'c3', filename: 'final_whistle.jpg', width: 5472, height: 3648, faceCount: 5, sharpness: 0.74, brightness: 0.48, contrast: 0.6 },
    { id: 'c4', filename: 'scoreboard.jpg', width: 4000, height: 2250, faceCount: 0, sharpness: 0.6, brightness: 0.45, contrast: 0.55 },
  ],
};

// Many people across a warm gathering — Family Legacy territory.
export const family: Scenario = {
  key: 'family',
  options: { occasion: 'family_reunion' },
  photos: [
    { id: 'f1', filename: 'grandparents.jpg', width: 4000, height: 5000, faceCount: 2, sharpness: 0.78, brightness: 0.6, contrast: 0.55, takenAt: '2026-07-04T15:00:00Z' },
    { id: 'f2', filename: 'whole_family.jpg', width: 6000, height: 4000, faceCount: 14, sharpness: 0.82, brightness: 0.62, contrast: 0.58, takenAt: '2026-07-04T15:30:00Z' },
    { id: 'f3', filename: 'kids_playing.jpg', width: 4032, height: 3024, faceCount: 4, sharpness: 0.7, brightness: 0.66, contrast: 0.5, takenAt: '2026-07-04T16:00:00Z' },
    { id: 'f4', filename: 'cousins.jpg', width: 4000, height: 3000, faceCount: 6, sharpness: 0.68, brightness: 0.58, contrast: 0.52, takenAt: '2026-07-04T16:10:00Z' },
    { id: 'f5', filename: 'old_photo_1980.jpg', width: 1200, height: 1600, faceCount: 3, sharpness: 0.4, brightness: 0.45, contrast: 0.5, isMonochrome: true, takenAt: '1980-06-01T12:00:00Z' },
  ],
};

// Elegant couple hero — Signature Edition lead for wedding.
export const wedding: Scenario = {
  key: 'wedding',
  options: { occasion: 'wedding' },
  photos: [
    { id: 'w1', filename: 'first_kiss.jpg', width: 4480, height: 6720, faceCount: 2, sharpness: 0.94, brightness: 0.66, contrast: 0.62, dominantColors: [{ hex: '#FAF8F3', weight: 0.5 }, { hex: '#C9A84C', weight: 0.3 }] },
    { id: 'w2', filename: 'rings.jpg', width: 4000, height: 4000, faceCount: 0, sharpness: 0.88, brightness: 0.6, contrast: 0.55 },
    { id: 'w3', filename: 'first_dance.jpg', width: 6000, height: 4000, faceCount: 2, sharpness: 0.8, brightness: 0.4, contrast: 0.66 },
    { id: 'w4', filename: 'bridal_party.jpg', width: 6000, height: 4000, faceCount: 8, sharpness: 0.79, brightness: 0.63, contrast: 0.57 },
  ],
};

// Reverent tribute, older restored photos — Family Legacy, muted mood.
export const memorial: Scenario = {
  key: 'memorial',
  options: { occasion: 'memorial' },
  photos: [
    { id: 'm1', filename: 'portrait_smiling.jpg', width: 3000, height: 3750, faceCount: 1, sharpness: 0.7, brightness: 0.5, contrast: 0.5, takenAt: '2001-04-10T12:00:00Z' },
    { id: 'm2', filename: 'young_years_bw.jpg', width: 1000, height: 1400, faceCount: 1, sharpness: 0.3, brightness: 0.42, contrast: 0.45, isMonochrome: true, takenAt: '1968-01-01T12:00:00Z' },
    { id: 'm3', filename: 'with_family.jpg', width: 3200, height: 2400, faceCount: 5, sharpness: 0.6, brightness: 0.48, contrast: 0.5, takenAt: '1995-08-15T12:00:00Z' },
    { id: 'm4', filename: 'garden.jpg', width: 2400, height: 1800, faceCount: 1, sharpness: 0.55, brightness: 0.38, contrast: 0.48, takenAt: '2010-05-01T12:00:00Z' },
  ],
};

export const scenarios: Scenario[] = [graduation, championship, family, wedding, memorial];
