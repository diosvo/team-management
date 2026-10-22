/**
 * Unit label for a count: hidden at 0, pluralized words, symbols/phrases as-is.
 * @example formatValueUnit(3, 'game'); // 'games'
 */
export function formatValueUnit(count: number, unit: string): Nullable<string> {
  if (!/^[a-z]+$/i.test(unit)) return unit;
  if (count === 0) return null;
  return count > 1 && !unit.endsWith('s') ? `${unit}s` : unit;
}

/** @example pluralize(3, 'match'); // '3 matches' */
export function pluralize(count: number, noun: string): string {
  if (count === 1) return `${count} ${noun}`;
  const suffix = /(s|x|z|ch|sh)$/i.test(noun) ? 'es' : 's';
  return `${count} ${noun}${suffix}`;
}

/**
 * Title Case label for snake_case or kebab-case values.
 * @example toLabel('team-rule'); // 'Team Rule'
 */
export function toLabel(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
