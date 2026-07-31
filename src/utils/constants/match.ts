import { MatchType } from '../enum';
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
