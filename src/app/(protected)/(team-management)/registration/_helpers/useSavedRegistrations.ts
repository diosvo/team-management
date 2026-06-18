'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'registration:saved';

export type SavedRegistration = Required<{
  id: string;
  leagueName: string;
  playerCount: number;
  filename: string;
  pdfBase64: string; // The generated PDF, base64-encoded, so it can be re-downloaded later.
  savedAt: string;
}> &
  Partial<{
    notes: string;
    templateName: string;
  }>;

export type NewRegistration = Omit<SavedRegistration, 'id' | 'savedAt'>;

const write = (items: Array<SavedRegistration>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota/availability errors - persistence is best-effort.
  }
};

/**
 * @description Saved registrations persisted to localStorage (per-browser).
 */
export function useSavedRegistrations() {
  const [items, setItems] = useState<Array<SavedRegistration>>([]);

  // Load after mount (not a lazy initializer) so SSR and the first client
  // render both start empty and hydration stays in sync.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // One-time hydration of persisted state
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Corrupt/unavailable storage — start empty.
    }
  }, []);

  const save = useCallback((entry: NewRegistration) => {
    setItems((prev) => {
      const next = [
        {
          ...entry,
          id: crypto.randomUUID(),
          savedAt: new Date().toISOString(),
        },
        ...prev,
      ];
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      write(next);
      return next;
    });
  }, []);

  /**
   * @returns A name that does not collide with an existing saved
   * registration, appending " (2)", " (3)", … to `base` until it is unique.
   */
  const getUniqueName = useCallback(
    (base: string) => {
      const taken = new Set(items.map((item) => item.leagueName));
      if (!taken.has(base)) return base;

      let suffix = 2;
      while (taken.has(`${base} (${suffix})`)) suffix++;
      return `${base} (${suffix})`;
    },
    [items],
  );

  return { items, save, remove, getUniqueName };
}
