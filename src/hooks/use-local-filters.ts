import { useState } from 'react';

export function useLocalFilters<T extends Record<string, unknown>>(
  committed: T,
  defaults: T,
  onApply: (draft: T) => void,
) {
  const [draft, setDraft] = useState<T>(committed);

  return {
    draft,
    setField: <K extends keyof T>(field: K, value: T[K]) =>
      setDraft((prev) => ({ ...prev, [field]: value })),
    handleReset: () => setDraft(defaults),
    handleApply: () => onApply(draft),
    handleInteractOutside: () => setDraft(committed),
  };
}
