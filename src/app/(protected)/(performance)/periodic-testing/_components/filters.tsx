'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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

import SearchInput from '@/components/ui/search-input';
import Visibility from '@/components/visibility';

import { usePermissions } from '@/hooks/use-permissions';
import useQuery from '@/hooks/use-query';
import { formatDate } from '@/utils/formatter';

import { getTestDates } from '@/features/periodic-testing/actions/test-result';

interface TestingFiltersProps {
  date: string;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
}

export default function TestingFilters({
  date,
  search,
  setSearch,
}: TestingFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { isAdmin } = usePermissions();
  const request = useQuery(async () => await getTestDates());

  const dateRanges = useMemo(
    () =>
      createListCollection({
        items: (request.data ?? []).map((date) => ({
          label: formatDate(date),
          value: date,
        })),
      }),
    [request.data]
  );

  return (
    <HStack marginBottom={6}>
      <SearchInput
        value={search}
        onValueChange={(value) => setSearch(value)}
        onClear={() => setSearch('')}
      />
      <Select.Root
        collection={dateRanges}
        width="2xs"
        value={[date]}
        size={{ base: 'sm', md: 'md' }}
        disabled={request.loading || !!request.error}
        onValueChange={({ value }) => router.push(pathname + `?date=${value}`)}
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
