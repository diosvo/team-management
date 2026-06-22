'use client';

import { useMemo } from 'react';

import { Button, List } from '@chakra-ui/react';
import { isPast } from 'date-fns';
import { Crosshair } from 'lucide-react';

import Authorized from '@/components/Authorized';
import Filters from '@/components/filters/Filters';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';

import { useLeagueFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import { LEAGUE_STATUS_SELECTION } from '@/utils/constant';
import { LeagueStatus } from '@/utils/enum';

import { upsertLeague } from '@/actions/league';
import { League } from '@/drizzle/schema';

const FILTERS: Array<FilterDef> = [
  {
    key: 'status',
    label: 'Status',
    control: { type: 'checkbox-group', options: LEAGUE_STATUS_SELECTION },
  },
];

export default function LeagueFilters({ leagues }: { leagues: Array<League> }) {
  const [values, setSearchParams] = useLeagueFilters();

  const endedLeagues = useMemo(
    () =>
      leagues.filter(
        (league) =>
          isPast(league.end_date) && league.status !== LeagueStatus.ENDED,
      ),
    [leagues],
  );

  const handleCorrectStatus = async () => {
    const results = await Promise.all(
      endedLeagues.map((league) =>
        upsertLeague(league.league_id, {
          ...league,
          status: LeagueStatus.ENDED,
        }),
      ),
    );
    const hasErrors = results.some(({ success }) => !success);
    const successCount = results.filter(({ success }) => success).length;

    toaster.create({
      type: hasErrors ? 'warning' : 'success',
      title: hasErrors
        ? `Updated ${successCount} league(s), but some operations failed.`
        : `Successfully updated ${successCount} league(s).`,
    });
  };

  return (
    <Filters
      filters={FILTERS}
      values={values}
      defaults={useLeagueFilters.defaults}
      onApply={(next) => setSearchParams({ ...next, page: 1 })}
      actions={
        <Authorized resource="leagues" action="edit">
          <Tooltip
            content={
              endedLeagues.length > 0 ? (
                <List.Root as="ol" paddingInline={3} paddingBlock={2}>
                  {endedLeagues.map((league) => (
                    <List.Item key={league.league_id}>{league.name}</List.Item>
                  ))}
                </List.Root>
              ) : (
                'All statuses are correct'
              )
            }
          >
            <Button
              variant="outline"
              colorPalette="red"
              size={{ base: 'sm', md: 'md' }}
              disabled={endedLeagues.length === 0}
              onClick={handleCorrectStatus}
            >
              <Crosshair />
              Correct Status
              {endedLeagues.length > 0 && ` (${endedLeagues.length})`}
            </Button>
          </Tooltip>
        </Authorized>
      }
    />
  );
}
