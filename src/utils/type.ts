import { SELECTABLE_USER_ROLES, SELECTABLE_USER_STATES } from './constant';

export type SelectableRole = (typeof SELECTABLE_USER_ROLES)[number];
export type SelectableState = (typeof SELECTABLE_USER_STATES)[number];

export interface Option<T> {
  label: string;
  value: T;
  max?: number;
  description?: string;
}
export type Selection<T> = Array<Option<T>>;
