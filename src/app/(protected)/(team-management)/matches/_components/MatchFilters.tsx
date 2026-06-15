'use client';

import {
  Button,
  createListCollection,
  HStack,
  Portal,
  Select,
  SimpleGrid,
} from '@chakra-ui/react';
import { DraftingCompass, Plus } from 'lucide-react';

import { GAME_TYPE_SELECTION } from '@/utils/constant';

import TimePicker from '@/components/filters/TimePicker';
import { MatchSearchParamsKeys, useMatchFilters } from '@/utils/filters';
import { UpsertMatch } from './UpsertMatch';

const types = createListCollection({
  items: GAME_TYPE_SELECTION,
});

export default function MatchesFilters() {
  const [{ is5x5, interval }, setSearchParams] = useMatchFilters();

  const handleSearchParams = (key: MatchSearchParamsKeys, value: string) => {
    setSearchParams({ [key]: value, page: 1 }, { shallow: false });
  };

  return (
    <SimpleGrid columns={3} gap={3}>
      <Button
        size={{ base: 'sm', md: 'md' }}
        onClick={() =>
          UpsertMatch.open('add-match', {
            action: 'Add',
            item: {
              match_id: '',
            },
          })
        }
      >
        <Plus />
        Add
      </Button>
      <Select.Root
        collection={types}
        value={[String(is5x5)]}
        onValueChange={({ value }) => handleSearchParams('is5x5', value[0])}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <HStack>
              <DraftingCompass size={16} />
              <Select.ValueText placeholder="Type" />
            </HStack>
          </Select.Trigger>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {types.items.map((type) => (
                <Select.Item item={type} key={type.label}>
                  {type.label}
                  <Select.ItemIndicator />
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
      <UpsertMatch.Viewport />
    </SimpleGrid>
  );
}
