import { SessionStatus } from '../enum';
import type { Selection } from '../type';
import { ALL } from './app';

export const SELECTABLE_SESSION_STATUS = [
  SessionStatus.SCHEDULED,
  SessionStatus.ACTIVE,
  SessionStatus.COMPLETED,
  SessionStatus.CANCELLED,
] as const;
export const SESSION_STATUS_SELECTION: Selection<string> = [
  {
    label: 'Scheduled',
    value: SessionStatus.SCHEDULED,
  },
  {
    label: 'Active',
    value: SessionStatus.ACTIVE,
  },
  {
    label: 'Completed',
    value: SessionStatus.COMPLETED,
  },
  {
    label: 'Cancelled',
    value: SessionStatus.CANCELLED,
  },
];
export const SESSION_STATUS_VALUES = [ALL.value, ...SELECTABLE_SESSION_STATUS];
