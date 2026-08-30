export function formatValueUnit(count: number, unit: string): Nullable<string> {
  // Symbols and multi-word phrases (e.g. "%", "days remaining") aren't count
  // nouns: show them verbatim. Simple words are hidden at 0 and pluralized,
  // unless they already end in "s" (e.g. "pts").
  if (!/^[a-z]+$/i.test(unit)) return unit;
  if (count === 0) return null;
  return count > 1 && !unit.endsWith('s') ? `${unit}s` : unit;
}
