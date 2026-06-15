'use client';

import {
  Button,
  createListCollection,
  HStack,
  Portal,
  Select,
  SimpleGrid,
} from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import TimePicker from '@/components/filters/TimePicker';
import { Status } from '@/components/ui/status';

import usePermissions from '@/hooks/use-permissions';
import { ALL, SESSION_STATUS_SELECTION } from '@/utils/constant';
import { TrainingSearchParamsKeys, useTrainingFilters } from '@/utils/filters';
import { getColor } from '@/utils/helper';

import { UpsertSession } from './UpsertSession';

const statuses = createListCollection({
  items: [ALL, ...SESSION_STATUS_SELECTION],
});

export default function SessionFilters() {
  const { isAdmin } = usePermissions();
  const [{ interval, status }, setSearchParams] = useTrainingFilters();

  const handleSearchParams = (key: TrainingSearchParamsKeys, value: string) => {
    setSearchParams({ [key]: value, page: 1 }, { shallow: false });
  };

  return (
    <SimpleGrid columns={isAdmin ? 3 : 2} gap={3}>
      <Authorized resource="training" action="create">
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
            <Status colorPalette={getColor(status)} />
            <Select.ValueText placeholder="Status" />
          </HStack>
        </Select.Trigger>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {statuses.items.map((status) => (
                <Select.Item item={status} key={status.value}>
                  <HStack>
                    <Status colorPalette={getColor(status.value)} />
                    {status.label}
                    <Select.ItemIndicator />
                  </HStack>
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <TimePicker
        value={interval}
        onChange={(value) => handleSearchParams('interval', value)}
      />
      <UpsertSession.Viewport />
    </SimpleGrid>
  );
}
