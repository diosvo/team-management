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
  Spinner,
} from '@chakra-ui/react';
import {
  CalendarSearch,
  ChartNoAxesGantt,
  Plus,
  Settings2,
} from 'lucide-react';

import SearchInput from '@/components/SearchInput';
import Visibility from '@/components/Visibility';

import { usePermissions } from '@/hooks/use-permissions';
import useQuery from '@/hooks/use-query';
import { formatDate } from '@/utils/formatter';

import { getTestDates } from '@/actions/test-result';
import { usePeriodicTestingFilters } from '../search-params';

export default function TestingFilters() {
  const { isAdmin } = usePermissions();
  const [{ date }, setSearchParams] = usePeriodicTestingFilters();
  const request = useQuery(async () => await getTestDates());

  const dateRanges = useMemo(
    () =>
      createListCollection({
        items: (request.data ?? []).map((date) => ({
          label: formatDate(date),
          value: date,
        })),
      }),
    [request.data],
  );
  const disabledFilter =
    request.loading || !!request.error || dateRanges.items.length === 0;

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
            {request.loading && (
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
      </Visibility>
    </HStack>
  );
}
