/**
 * Theme catalog — mirrored from index.html's THEMES. The frontend uses these
 * to show the theme picker; the backend has the same list (re-validated on
 * checkout) so a malicious payload can't sneak through a bogus theme id.
 */

import type { Theme } from '@celebratebanner/render-engine';

export const THEMES: Record<string, Theme> = {
  graduation: {
    id: 'graduation',
    fields: ['name', 'year', 'school'],
    fieldMeta: {
      name:   { label: 'Name',  placeholder: 'Your name' },
      year:   { label: 'Year',  placeholder: 'Class of 2026' },
      school: { label: 'School', placeholder: 'Lincoln High' },
    },
    palette: { bg: '#0C0E14', accent: '#C9A84C', text: '#F5E4B0' },
  },
  wedding: {
    id: 'wedding',
    fields: ['coupleNames', 'date', 'venue'],
    fieldMeta: {
      coupleNames: { placeholder: 'Maya & Daniel' },
      date:        { placeholder: 'June 14, 2026' },
      venue:       { placeholder: 'Sunset Vineyard' },
    },
    palette: { bg: '#1B1D24', accent: '#C9A84C', text: '#FAF8F3' },
  },
  anniversary: {
    id: 'anniversary',
    fields: ['names', 'years', 'date'],
    fieldMeta: {
      names: { placeholder: 'Lopez Family' },
      years: { placeholder: '25 Years' },
      date:  { placeholder: 'May 2026' },
    },
    palette: { bg: '#13161F', accent: '#C9A84C', text: '#F5E4B0' },
  },
  champion: {
    id: 'champion',
    fields: ['teamName', 'year', 'caption'],
    fieldMeta: {
      teamName: { placeholder: 'Champions' },
      year:     { placeholder: '2026' },
      caption:  { placeholder: 'State champions' },
    },
    palette: { bg: '#0D2B45', accent: '#4A9ECC', text: '#F5E4B0' },
  },
  pets: {
    id: 'pets',
    fields: ['petName', 'year', 'caption'],
    fieldMeta: {
      petName: { placeholder: 'Best floofs' },
      year:    { placeholder: '2026' },
      caption: { placeholder: 'Family favorites' },
    },
    palette: { bg: '#0C0E14', accent: '#C9A84C', text: '#FAF8F3' },
  },
  milestone: {
    id: 'milestone',
    fields: ['name', 'year', 'caption'],
    fieldMeta: {
      name:    { placeholder: 'Your name' },
      year:    { placeholder: '2026' },
      caption: { placeholder: 'Celebrating you' },
    },
    palette: { bg: '#0C0E14', accent: '#C9A84C', text: '#F5E4B0' },
  },
};

export const THEME_DISPLAY: Array<{ id: string; name: string; emoji: string }> = [
  { id: 'graduation', name: 'Graduation', emoji: '🎓' },
  { id: 'wedding', name: 'Wedding', emoji: '💍' },
  { id: 'anniversary', name: 'Anniversary', emoji: '🥂' },
  { id: 'champion', name: 'Champions', emoji: '🏆' },
  { id: 'pets', name: 'Pets', emoji: '🐾' },
  { id: 'milestone', name: 'Milestone', emoji: '✨' },
];

export function themeById(id: string): Theme {
  return THEMES[id] ?? THEMES.graduation;
}
