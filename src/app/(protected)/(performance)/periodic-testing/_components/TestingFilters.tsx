'use client';

import { useMemo } from 'react';

import { createListCollection, HStack, Portal, Select } from '@chakra-ui/react';
import { CalendarSearch } from 'lucide-react';

import Filters from '@/components/filters/Filters';

import type { TestResult } from '@/types/periodic-testing';
import { usePeriodicTestingFilters } from '@/utils/filters';
import { formatDate } from '@/utils/formatter';

export default function TestingFilters({
  dates,
  headers,
}: {
  dates: Array<string>;
  headers: TestResult['headers'];
}) {
  const [values, setSearchParams] = usePeriodicTestingFilters();
  const disabled = dates.length === 0;

  const dateCollection = useMemo(
    () =>
      createListCollection({
        items: dates.map((value) => ({ label: formatDate(value), value })),
      }),
    [dates],
  );

  const currentDate = values.date as string;

  return (
    <Filters
      filters={[]}
      values={values}
      defaults={usePeriodicTestingFilters.defaults}
      disabled={disabled}
      onApply={(next) => setSearchParams({ ...next, page: 1 })}
      actions={
        <Select.Root
          collection={dateCollection}
          minWidth={36}
          flexShrink={0}
          width="max-content"
          disabled={disabled}
          size={{ base: 'sm', md: 'md' }}
          value={currentDate ? [currentDate] : []}
          onValueChange={({ value }) =>
            setSearchParams(
              { date: value[0], type: [], page: 1 },
              { shallow: false },
            )
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
                {dateCollection.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      }
    />
  );
}
