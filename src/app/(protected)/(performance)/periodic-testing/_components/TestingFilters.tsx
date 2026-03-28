'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';

import {
  Button,
  createListCollection,
  HStack,
  Menu,
  Portal,
  Select,
  Spinner,
} from '@chakra-ui/react';
import {
  CalendarSearch,
  ChartNoAxesGantt,
  Plus,
  Settings2,
} from 'lucide-react';

import Authorized from '@/components/Authorized';
import SearchInput from '@/components/SearchInput';

import usePermissions from '@/hooks/use-permissions';
import { usePeriodicTestingFilters } from '@/utils/filters';
import { formatDate } from '@/utils/formatter';

import { getTestDates } from '@/actions/test-result';

export default function TestingFilters() {
  const { isAdmin } = usePermissions();
  const [{ date }, setSearchParams] = usePeriodicTestingFilters();
  const {
    isValidating,
    data = [],
    error,
  } = useSWRImmutable('test-dates', getTestDates);

  const dateRanges = useMemo(
    () =>
      createListCollection({
        items: data.map((date) => ({
          label: formatDate(date),
          value: date,
        })),
      }),
    [data],
  );
  const disabledFilter = isValidating || !!error || data.length === 0;

  return (
    <HStack marginBottom={6}>
      <SearchInput disabled={disabledFilter} />
      <Select.Root
        collection={dateRanges}
        width="2xs"
        value={date ? [date] : []}
        size={{ base: 'sm', md: 'md' }}
        disabled={disabledFilter}
        onValueChange={({ value }) => setSearchParams({ date: value[0] })}
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
            {isValidating && (
              <Spinner size="xs" borderWidth={1} color="fg.muted" />
            )}
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
      <Authorized action="create">
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
                <Menu.Item value="add-test-result" asChild>
                  <Link href="/periodic-testing/add-result">
                    <Plus size={14} />
                    Add Result
                  </Link>
                </Menu.Item>
                <Menu.Item value="test-types" asChild>
                  <Link href="/periodic-testing/test-types">
                    <Settings2 size={14} />
                    Manage Test Types
                  </Link>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Authorized>
    </HStack>
  );
}
