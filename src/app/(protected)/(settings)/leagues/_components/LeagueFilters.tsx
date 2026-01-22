'use client';

import {
  Button,
  createListCollection,
  HStack,
  List,
  Portal,
  Select,
} from '@chakra-ui/react';
import { Crosshair, Filter, Plus } from 'lucide-react';

import SearchInput from '@/components/SearchInput';
import Visibility from '@/components/Visibility';
import { Status } from '@/components/ui/status';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';

import usePermissions from '@/hooks/use-permissions';
import { ALL, LEAGUE_STATUS_SELECTION } from '@/utils/constant';
import { LeagueStatus } from '@/utils/enum';
import { useLeagueFilters } from '@/utils/filters';
import { colorLeagueStatus } from '@/utils/helper';

import { upsertLeague } from '@/actions/league';
import { League } from '@/drizzle/schema';

import { UpsertLeague } from './UpsertLeague';

const statuses = createListCollection({
  items: [ALL, ...LEAGUE_STATUS_SELECTION],
});

export default function LeagueFilters({
  endedLeagues,
}: {
  endedLeagues: Array<League>;
}) {
  const { isAdmin } = usePermissions();
  const [{ status }, setSearchParams] = useLeagueFilters();

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
        ? `Deleted ${successCount} league(s), but some operations failed.`
        : `Successfully updated ${successCount} league(s).`,
    });
  };

  return (
    <HStack marginBlock={6}>
      <SearchInput />
      <Select.Root
        width="xs"
        size={{ base: 'sm', md: 'md' }}
        collection={statuses}
        value={[status]}
        onValueChange={({ value }) =>
          setSearchParams({ status: value[0], page: 1 })
        }
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <HStack>
              <Filter size={14} />
              <Select.ValueText placeholder="Status" />
            </HStack>
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {statuses.items.map((status) => (
                <Select.Item item={status} key={status.value}>
                  <HStack>
                    <Status colorPalette={colorLeagueStatus(status.value)} />
                    {status.label}
                    <Select.ItemIndicator />
                  </HStack>
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <Visibility isVisible={isAdmin}>
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

        <Button
          size={{ base: 'sm', md: 'md' }}
          onClick={() =>
            UpsertLeague.open('add-league', {
              action: 'Add',
              item: {
                league_id: '',
              },
            })
          }
        >
          <Plus />
          Add
        </Button>
      </Visibility>
      <UpsertLeague.Viewport />
    </HStack>
  );
}
