'use client';

import { useState } from 'react';

import { createListCollection, HStack, Portal, Select } from '@chakra-ui/react';

import SearchInput from '@/components/ui/search-input';
import { Filter } from 'lucide-react';

import AddTestResult from './add-test-result';

interface TestingFiltersProps {
  onFilterChange: (filters: { search: string; dateRange: string }) => void;
  onAddResult: (result: {
    player_name: string;
    test_type: string;
    score: number;
    notes?: string;
  }) => void;
}

export default function TestingFilters({
  onFilterChange,
  onAddResult,
}: TestingFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    dateRange: '2025-03-25', // Default to latest date
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const existingTestDates = ['2025-01-25', '2025-03-25'];

  const dateRanges = createListCollection({
    items: [
      { value: '2025-01-25', label: 'January 25, 2025' },
      { value: '2025-03-25', label: 'March 25, 2025' },
    ],
  });

  return (
    <HStack alignItems="normal">
      <SearchInput
        value={filters.search}
        onValueChange={(value: string) => handleFilterChange('search', value)}
        onClear={() => handleFilterChange('search', '')}
      />
      <Select.Root
        collection={dateRanges}
        width="xs"
        size={{ base: 'sm', md: 'md' }}
        value={[filters.dateRange]}
        onValueChange={({ value }) => handleFilterChange('dateRange', value[0])}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <HStack>
              <Filter size={14} />
              <Select.ValueText placeholder="Category" />
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
                <Select.Item item={date.value} key={date.value}>
                  {date.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <AddTestResult
        onAddResult={onAddResult}
        existingTestDates={existingTestDates}
      />
    </HStack>
  );
}
