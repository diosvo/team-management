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

/**
 * Box-score columns recorded per player per match, in display order.
 * `label`/`short` are the English fallback; UI text comes from
 * `matches.boxScore.stats.<key>.{label,short}`.
 */
export const MATCH_STAT_FIELDS = [
  { key: 'points_scored', label: 'Points', short: 'PTS', max: 200 },
  { key: 'rebounds', label: 'Rebounds', short: 'REB', max: 100 },
  { key: 'assists', label: 'Assists', short: 'AST', max: 100 },
  { key: 'steals', label: 'Steals', short: 'STL', max: 50 },
  { key: 'blocks', label: 'Blocks', short: 'BLK', max: 50 },
  { key: 'turnovers', label: 'Turnovers', short: 'TOV', max: 50 },
  { key: 'fouls', label: 'Personal fouls', short: 'PF', max: 10 },
] as const;
export type MatchStatField = (typeof MATCH_STAT_FIELDS)[number]['key'];
