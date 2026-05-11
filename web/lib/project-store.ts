/**
 * Project store — local-first builder state with debounced autosave.
 *
 * Why not Zustand / Redux: state is single-page, no cross-route sharing needed.
 * useReducer + localStorage is enough and ships ~0 KB of extra runtime.
 *
 * Persistence:
 *   • localStorage on every change (debounced 400ms)  → instant recovery if the tab reloads
 *   • Backend autosave PATCH every 5s when dirty       → recovery across devices + abandoned-cart emails
 *
 * The persisted shape is a RenderInputV1 minus things only the engine needs at
 * render time (theme palette is recomputed from theme.id by the server).
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { ArrangementId, FrameId } from '@celebratebanner/render-engine';
import type { PhotoMeta } from './render-input.schema';
import { newProjectId } from './utils';

export interface ProjectState {
  projectId: string;
  themeId: string;
  arrangement: ArrangementId;
  bannerText: Record<string, string>;
  photos: PhotoMeta[];
  heroId: string | null;
  frames: Record<string, FrameId>;
  defaultFrame: FrameId;
  rotations: Record<string, number>;
  seed: number;
  /** Monotonic version — bumps on every action. Powers dirty detection. */
  rev: number;
  /** Last server-acked rev (for autosave to know what's been saved). */
  serverRev: number;
}

export type ProjectAction =
  | { type: 'setTheme'; themeId: string }
  | { type: 'setArrangement'; arrangement: ArrangementId }
  | { type: 'setText'; key: string; value: string }
  | { type: 'addPhotos'; photos: PhotoMeta[] }
  | { type: 'removePhoto'; id: string }
  | { type: 'setHero'; id: string | null }
  | { type: 'setDefaultFrame'; frame: FrameId }
  | { type: 'setPhotoFrame'; id: string; frame: FrameId }
  | { type: 'rotatePhoto'; id: string }
  | { type: 'reseed' }
  | { type: 'hydrate'; state: Partial<ProjectState> }
  | { type: 'markSaved'; rev: number };

const STORAGE_KEY = 'cb_project_v1';

function bump(s: ProjectState): ProjectState {
  return { ...s, rev: s.rev + 1 };
}

export function reducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'setTheme':       return bump({ ...state, themeId: action.themeId });
    case 'setArrangement': return bump({ ...state, arrangement: action.arrangement });
    case 'setText':        return bump({ ...state, bannerText: { ...state.bannerText, [action.key]: action.value } });
    case 'addPhotos': {
      const known = new Set(state.photos.map((p) => p.id));
      const next = [...state.photos];
      for (const p of action.photos) {
        if (known.has(p.id)) continue;
        next.push(p);
        if (next.length >= 50) break;
      }
      const hero = state.heroId ?? next[0]?.id ?? null;
      return bump({ ...state, photos: next, heroId: hero });
    }
    case 'removePhoto': {
      const next = state.photos.filter((p) => p.id !== action.id);
      const { [action.id]: _f, ...frames } = state.frames;
      const { [action.id]: _r, ...rotations } = state.rotations;
      const hero = state.heroId === action.id ? next[0]?.id ?? null : state.heroId;
      return bump({ ...state, photos: next, heroId: hero, frames, rotations });
    }
    case 'setHero':            return bump({ ...state, heroId: action.id });
    case 'setDefaultFrame':    return bump({ ...state, defaultFrame: action.frame });
    case 'setPhotoFrame':      return bump({ ...state, frames: { ...state.frames, [action.id]: action.frame } });
    case 'rotatePhoto':        return bump({ ...state, rotations: { ...state.rotations, [action.id]: ((state.rotations[action.id] ?? 0) + 90) % 360 } });
    case 'reseed':             return bump({ ...state, seed: Math.floor(Math.random() * 2 ** 31) });
    case 'hydrate':            return { ...state, ...action.state };
    case 'markSaved':          return { ...state, serverRev: action.rev };
    default:                   return state;
  }
}

export function initialProjectState(): ProjectState {
  return {
    projectId: newProjectId(),
    themeId: 'graduation',
    arrangement: 'classic',
    bannerText: {},
    photos: [],
    heroId: null,
    frames: {},
    defaultFrame: 'rounded',
    rotations: {},
    seed: 12345,
    rev: 0,
    serverRev: 0,
  };
}

/**
 * React hook that owns the project state. Restores from localStorage on mount,
 * autosaves locally on every change with a 400ms debounce.
 */
export function useProjectStore() {
  const [state, dispatch] = useReducer(reducer, undefined, initialProjectState);
  const saveTimer = useRef<number | undefined>(undefined);
  const hydrated = useRef(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProjectState>;
        dispatch({ type: 'hydrate', state: parsed });
      }
    } catch {
      /* corrupted local data — start fresh */
    } finally {
      hydrated.current = true;
    }
  }, []);

  // Debounced persist to localStorage on every change.
  useEffect(() => {
    if (!hydrated.current) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* quota / private mode — silently skip */
      }
    }, 400);
    return () => window.clearTimeout(saveTimer.current);
  }, [state]);

  const reset = useCallback(() => {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    dispatch({ type: 'hydrate', state: initialProjectState() });
  }, []);

  return { state, dispatch, reset, isDirty: state.rev > state.serverRev };
}
