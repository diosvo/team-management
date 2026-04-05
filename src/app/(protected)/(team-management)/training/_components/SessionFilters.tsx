'use client';

import {
  Button,
  createListCollection,
  HStack,
  Portal,
  Select,
  SimpleGrid,
} from '@chakra-ui/react';
import { CalendarSearch, Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import { Status } from '@/components/ui/status';

import usePermissions from '@/hooks/use-permissions';
import {
  ALL,
  INTERVAL_SELECTION,
  SESSION_STATUS_SELECTION,
} from '@/utils/constant';
import { TrainingSearchParamsKeys, useTrainingFilters } from '@/utils/filters';
import { colorSessionStatus } from '@/utils/helper';

import { UpsertSession } from './UpsertSession';

const statuses = createListCollection({
  items: [ALL, ...SESSION_STATUS_SELECTION],
});
const dateRanges = createListCollection({
  items: INTERVAL_SELECTION,
});

export default function SessionFilters() {
  const { isAdmin } = usePermissions();
  const [{ interval, status }, setSearchParams] = useTrainingFilters();

  const handleSearchParams = (key: TrainingSearchParamsKeys, value: string) => {
    setSearchParams({ [key]: value, page: 1 }, { shallow: false });
  };

  return (
    <SimpleGrid columns={isAdmin ? 3 : 2} gap={3}>
      <Authorized action="create">
        <Button
          onClick={() =>
            UpsertSession.open('new-session', {
              action: 'Create',
              item: {
                session_id: '',
              },
            })
          }
        >
          <Plus />
          New Session
        </Button>
      </Authorized>
      <Select.Root
        collection={statuses}
        value={[status]}
        onValueChange={({ value }) => handleSearchParams('status', value[0])}
      >
        <Select.Trigger>
          <HStack width="full">
            <Status colorPalette={colorSessionStatus(status)} />
            <Select.ValueText placeholder="Status" />
          </HStack>
        </Select.Trigger>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {statuses.items.map((status) => (
                <Select.Item item={status} key={status.value}>
                  <HStack>
                    <Status colorPalette={colorSessionStatus(status.value)} />
                    {status.label}
                    <Select.ItemIndicator />
                  </HStack>
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <Select.Root
        collection={dateRanges}
        value={[interval]}
        onValueChange={({ value }) => handleSearchParams('interval', value[0])}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <HStack>
              <CalendarSearch size={16} />
              <Select.ValueText placeholder="Time" />
            </HStack>
          </Select.Trigger>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {dateRanges.items.map((year) => (
                <Select.Item item={year} key={year.value}>
                  {year.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <UpsertSession.Viewport />
    </SimpleGrid>
  );
}
