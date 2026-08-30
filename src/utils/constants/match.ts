import { MatchStatus, MatchType } from '../enum';
import type { Selection } from '../type';
import { ALL } from './app';

export const GAME_TYPE_SELECTION: Selection<string> = [
  {
    label: '3x3',
    value: 'false',
  },
  {
    label: '5x5',
    value: 'true',
  },
];
export const GAME_TYPE_VALUES = [
  ALL.value,
  ...GAME_TYPE_SELECTION.map(({ value }) => value),
];
export const SELECTABLE_GAME_TYPES = GAME_TYPE_SELECTION.map(
  ({ value }) => value,
);

export const SELECTABLE_MATCH_TYPES = [
  MatchType.LEAGUE,
  MatchType.FRIENDLY,
] as const;
export const MATCH_TYPE_SELECTION: Selection<string> = [
  {
    label: 'League',
    value: MatchType.LEAGUE,
  },
  {
    label: 'Friendly',
    value: MatchType.FRIENDLY,
  },
];
export const MATCH_TYPE_VALUES = [ALL.value, ...SELECTABLE_MATCH_TYPES];

export const SELECTABLE_MATCH_STATUS = [
  MatchStatus.SCHEDULED,
  MatchStatus.COMPLETED,
  MatchStatus.CANCELLED,
] as const;
export const MATCH_STATUS_SELECTION: Selection<string> = [
  {
    label: 'Scheduled',
    value: MatchStatus.SCHEDULED,
    description: 'Fixture on the calendar, not played yet',
  },
  {
    label: 'Completed',
    value: MatchStatus.COMPLETED,
    description: 'Played, with a final score',
  },
  {
    label: 'Cancelled',
    value: MatchStatus.CANCELLED,
    description: 'Called off and never played',
  },
];
export const MATCH_STATUS_VALUES = [ALL.value, ...SELECTABLE_MATCH_STATUS];
