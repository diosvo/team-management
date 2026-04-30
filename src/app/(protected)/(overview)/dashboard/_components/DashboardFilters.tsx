'use client';

import {
  createListCollection,
  HStack,
  Portal,
  Select,
  SimpleGrid,
} from '@chakra-ui/react';
import { CalendarSearch } from 'lucide-react';

import { INTERVAL_SELECTION } from '@/utils/constant';

import { MatchSearchParamsKeys, useDashboardFilters } from '@/utils/filters';

const dates = createListCollection({
  items: INTERVAL_SELECTION,
});

export default function DashboardFilters() {
  const [{ interval }, setSearchParams] = useDashboardFilters();

  const handleSearchParams = (key: MatchSearchParamsKeys, value: string) => {
    setSearchParams({ [key]: value, page: 1 }, { shallow: false });
  };

  return (
    <SimpleGrid columns={1} gap={3}>
      <Select.Root
        colorPalette="pink"
        collection={dates}
        value={[interval]}
        onValueChange={({ value }) => handleSearchParams('interval', value[0])}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger
            borderColor="colorPalette.muted"
            bg="colorPalette.100"
            color="colorPalette.fg"
          >
            <HStack>
              <CalendarSearch size={16} />
              <Select.ValueText placeholder="Time" />
            </HStack>
          </Select.Trigger>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {dates.items.map((year) => (
                <Select.Item item={year} key={year.value}>
                  {year.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    </SimpleGrid>
  );
}
