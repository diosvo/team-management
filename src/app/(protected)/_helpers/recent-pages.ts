import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'global-search:recent';
// One more than shown, so the current page can be skipped and 3 still remain.
const LIMIT = 4;
const EMPTY: Array<string> = [];

const listeners = new Set<() => void>();
let cache: { raw: Nullable<string>; ids: Array<string> } = {
  raw: null,
  ids: EMPTY,
};

function parse(raw: Nullable<string>): Array<string> {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(value)
      ? value.filter((id) => typeof id === 'string')
      : EMPTY;
  } catch {
    return EMPTY;
  }
}

// `useSyncExternalStore` needs a stable snapshot between unchanged reads.
function getSnapshot(): Array<string> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cache.raw) cache = { raw, ids: parse(raw) };
  return cache.ids;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener); // Other tabs
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/**
 * @description Search entry ids, most recently visited first (per-browser).
 * Ids rather than labels are stored so they re-translate on a locale switch.
 */
export function useRecentPages(): Array<string> {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function recordVisit(id: string) {
  const ids = [id, ...getSnapshot().filter((value) => value !== id)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, LIMIT)));
  listeners.forEach((listener) => listener());
}
