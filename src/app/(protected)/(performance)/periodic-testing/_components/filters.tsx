'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import {
  Button,
  createListCollection,
  HStack,
  Menu,
  Portal,
  Select,
} from '@chakra-ui/react';
import {
  CalendarSearch,
  ChartNoAxesGantt,
  Plus,
  Settings2,
} from 'lucide-react';

import SearchInput from '@/components/ui/search-input';
import Visibility from '@/components/visibility';

import { usePermissions } from '@/hooks/use-permissions';
import { formatDate } from '@/utils/formatter';

interface Filters {
  search: string;
  date: string;
}

interface TestingFiltersProps {
  dates: Array<string>;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

export default function TestingFilters({
  dates = [],
  filters,
  setFilters,
}: TestingFiltersProps) {
  const { isAdmin } = usePermissions();

  const dateRanges = useMemo(
    () =>
      createListCollection({
        items: dates.map((date) => ({
          label: formatDate(date),
          value: date,
        })),
      }),
    [dates]
  );

  return (
    <HStack marginBottom={6}>
      <SearchInput
        value={filters.search}
        onValueChange={(value) =>
          setFilters((prev) => ({ ...prev, search: value }))
        }
        onClear={() => {
          setFilters((prev) => ({ ...prev, search: '' }));
        }}
      />
      <Select.Root
        collection={dateRanges}
        width="2xs"
        size={{ base: 'sm', md: 'md' }}
        value={[filters.date]}
        onValueChange={({ value }) =>
          setFilters((prev) => ({ ...prev, date: value[0] }))
        }
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <HStack>
              <CalendarSearch size={16} />
              <Select.ValueText placeholder="Date" />
            </HStack>
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {dateRanges.items.map((date) => (
                <Select.Item item={date} key={date.value}>
                  {date.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <Visibility isVisible={isAdmin}>
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button>
              <ChartNoAxesGantt />
              Actions
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Link href="/periodic-testing/add-result">
                  <Menu.Item value="add-test-result">
                    <Plus size={14} />
                    Add Result
                  </Menu.Item>
                </Link>
                <Link href="/periodic-testing/test-types">
                  <Menu.Item value="test-types">
                    <Settings2 size={14} />
                    Manage Test Types
                  </Menu.Item>
                </Link>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Visibility>
    </HStack>
  );
}
