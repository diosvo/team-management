import { SELECTABLE_ROLES, SELECTABLE_STATES } from './constant';

export type SelectableRole = (typeof SELECTABLE_ROLES)[number];
export type SelectableState = (typeof SELECTABLE_STATES)[number];

export interface Option<T> {
  label: string;
  value: T;
  max?: number;
  description?: string;
}
export type Selection<T> = Array<Option<T>>;
