import { ALL } from './app';

import { LeagueStatus } from '../enum';
import type { Selection } from '../type';

export const SELECTABLE_LEAGUE_STATUS = [
  LeagueStatus.UPCOMING,
  LeagueStatus.ONGOING,
  LeagueStatus.ENDED,
] as const;
export const LEAGUE_STATUS_SELECTION: Selection<string> = [
  {
    label: 'Upcoming',
    value: LeagueStatus.UPCOMING,
  },
  {
    label: 'Ongoing',
    value: LeagueStatus.ONGOING,
  },
  {
    label: 'Ended',
    value: LeagueStatus.ENDED,
  },
];
export const LEAGUE_STATUS_VALUES = [ALL.value, ...SELECTABLE_LEAGUE_STATUS];
