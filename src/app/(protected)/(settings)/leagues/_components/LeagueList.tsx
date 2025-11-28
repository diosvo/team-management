'use client';

import { isPast } from 'date-fns';
import { useMemo } from 'react';

import { League } from '@/drizzle/schema';

import { ALL } from '@/utils/constant';
import { LeagueStatus } from '@/utils/enum';
import { useLeagueFilters } from '@/utils/filters';

import LeagueFilters from './LeagueFilters';
import LeagueTable from './LeagueTable';

export default function LeagueList({ leagues }: { leagues: Array<League> }) {
  const [{ q, status }] = useLeagueFilters();
  const filteredLeagues = useMemo(
    () =>
      leagues.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(q.toLowerCase());
        const matchesStatus = status === ALL.value || item.status === status;

        return matchesSearch && matchesStatus;
      }),
    [leagues, q, status],
  );

  const endedLeagues = useMemo(
    () =>
      leagues.filter(
        (league) =>
          isPast(league.end_date) && league.status !== LeagueStatus.ENDED,
      ),
    [leagues],
  );

  return (
    <>
      <LeagueFilters endedLeagues={endedLeagues} />
      <LeagueTable leagues={filteredLeagues} />
    </>
  );
}
