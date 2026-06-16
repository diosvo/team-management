'use client';

import { useMemo } from 'react';

import { Button, For, List, SegmentGroup } from '@chakra-ui/react';
import { isPast } from 'date-fns';
import { Crosshair } from 'lucide-react';

import Authorized from '@/components/Authorized';
import FilterBar from '@/components/filters/FilterBar';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';

import { ALL, LEAGUE_STATUS_SELECTION } from '@/utils/constant';
import { LeagueStatus } from '@/utils/enum';
import { useLeagueFilters } from '@/utils/filters';
import { getColor } from '@/utils/helper';

import { upsertLeague } from '@/actions/league';
import { League } from '@/drizzle/schema';
import { useLocalFilters } from '@/hooks/use-local-filters';

const statusItems = [ALL, ...LEAGUE_STATUS_SELECTION];
const DEFAULT_FILTERS = { status: ALL.value };

export default function LeagueFilters({ leagues }: { leagues: Array<League> }) {
  const [{ status }, setSearchParams] = useLeagueFilters();
  const { draft, setField, ...rest } = useLocalFilters(
    { status },
    DEFAULT_FILTERS,
    (values) => setSearchParams({ ...values, page: 1 }),
  );

  const activeCount = [status].filter((value) => value !== ALL.value).length;

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
    <FilterBar
      activeCount={activeCount}
      {...rest}
      inlineFilters={() => (
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
      )}
      advancedFilters={
        <Field label="Status">
          <SegmentGroup.Root
            size="sm"
            value={draft.status}
            data-testid="status-filter"
            onValueChange={({ value }) => setField('status', value as string)}
          >
            <SegmentGroup.Indicator />
            <For each={statusItems}>
              {({ label, value }) => (
                <SegmentGroup.Item key={value} value={value}>
                  <SegmentGroup.ItemText
                    _checked={{
                      fontWeight: 'medium',
                      color: getColor(value),
                    }}
                  >
                    {label}
                  </SegmentGroup.ItemText>
                  <SegmentGroup.ItemHiddenInput />
                </SegmentGroup.Item>
              )}
            </For>
          </SegmentGroup.Root>
        </Field>
      }
    />
  );
}
