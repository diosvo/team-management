import { type Messages, useTranslations } from 'next-intl';

import type { Selection } from '@/utils/type';

type Enums = Messages['enums'];
export type EnumGroup = Exclude<keyof Enums, `${string}Hint` | 'all'>;

/** Minimal shape shared by `useTranslations('enums')` and `getTranslations('enums')` */
type EnumTranslator = {
  (key: never): string;
  has(key: never): boolean;
};

/**
 * Label for an enum value, _e.g.,_ `enumLabel(t, 'userRole', 'coach')` → "Coach".
 * Falls back to the raw value when it has no message.
 */
export function enumLabel(
  t: EnumTranslator,
  group: EnumGroup,
  value: Nullish<string | boolean>,
): string {
  if (value == null) return '-';
  const key = `${group}.${value}` as never;
  return t.has(key) ? t(key) : String(value);
}

/**
 * Full name of an enum value from its `<group>Hint` message, _e.g.,_
 * `enumFullLabel(t, 'playerPosition', 'power_forward')` → "Power Forward"
 * where `enumLabel` gives "PF". Falls back to `enumLabel` without a hint.
 */
export function enumFullLabel(
  t: EnumTranslator,
  group: EnumGroup,
  value: Nullish<string | boolean>,
): string {
  const hint = `${group}Hint.${value}` as never;
  return value != null && t.has(hint) ? t(hint) : enumLabel(t, group, value);
}

/** Translates `label`/`description` of a constant `Selection` by its values. */
export function translateSelection<T>(
  t: EnumTranslator,
  selection: Selection<T>,
  group: EnumGroup,
): Selection<T> {
  return selection.map((option) => {
    const hint = `${group}Hint.${option.value}` as never;
    return {
      ...option,
      label: enumLabel(t, group, String(option.value)),
      description: t.has(hint) ? t(hint) : option.description,
    };
  });
}

/** Client/server component hook for `translateSelection` */
export function useSelection<T>(selection: Selection<T>, group: EnumGroup) {
  const t = useTranslations('enums');
  return translateSelection(t, selection, group);
}
