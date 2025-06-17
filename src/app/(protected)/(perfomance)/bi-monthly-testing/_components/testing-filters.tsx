'use client';

import { useState } from 'react';

import {
  Box,
  Button,
  createListCollection,
  HStack,
  Select,
  VStack,
} from '@chakra-ui/react';
import { Download } from 'lucide-react';

import SearchInput from '@/components/ui/search-input';

interface TestingFiltersProps {
  onFilterChange: (filters: {
    search: string;
    testType: string;
    status: string;
    dateRange: string;
  }) => void;
}

export default function TestingFilters({
  onFilterChange,
}: TestingFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    testType: 'all',
    status: 'all',
    dateRange: 'all',
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const testTypes = createListCollection({
    items: [
      { value: 'all', label: 'All Test Types' },
      { value: 'physical', label: 'Physical Tests' },
      { value: 'skills', label: 'Skills Tests' },
      { value: 'tactical', label: 'Tactical Tests' },
      { value: 'endurance', label: 'Endurance Tests' },
    ],
  });

  const statusOptions = createListCollection({
    items: [
      { value: 'all', label: 'All Status' },
      { value: 'completed', label: 'Completed' },
      { value: 'pending', label: 'Pending' },
      { value: 'overdue', label: 'Overdue' },
    ],
  });

  const dateRanges = createListCollection({
    items: [
      { value: 'all', label: 'All Time' },
      { value: 'last-week', label: 'Last Week' },
      { value: 'last-month', label: 'Last Month' },
      { value: 'last-quarter', label: 'Last Quarter' },
      { value: 'current-cycle', label: 'Current Cycle' },
    ],
  });

  return (
    <VStack align="stretch" gap={4} marginBottom={6}>
      <HStack wrap="wrap" gap={4}>
        <Box width={{ base: 'full', md: '300px' }}>
          <SearchInput
            value={filters.search}
            onValueChange={(value: string) =>
              handleFilterChange('search', value)
            }
            onClear={() => handleFilterChange('search', '')}
          />
        </Box>

        <Select.Root
          collection={testTypes}
          value={[filters.testType]}
          onValueChange={({ value }) =>
            handleFilterChange('testType', value[0])
          }
          size={{ base: 'sm', md: 'md' }}
          width="200px"
        >
          <Select.Trigger>
            <Select.ValueText placeholder="Test Type" />
          </Select.Trigger>
          <Select.Content>
            {testTypes.items.map((type) => (
              <Select.Item key={type.value} item={type}>
                {type.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <Select.Root
          collection={statusOptions}
          value={[filters.status]}
          onValueChange={({ value }) => handleFilterChange('status', value[0])}
          size={{ base: 'sm', md: 'md' }}
          width="150px"
        >
          <Select.Trigger>
            <Select.ValueText placeholder="Status" />
          </Select.Trigger>
          <Select.Content>
            {statusOptions.items.map((status) => (
              <Select.Item key={status.value} item={status}>
                {status.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <Select.Root
          collection={dateRanges}
          value={[filters.dateRange]}
          onValueChange={({ value }) =>
            handleFilterChange('dateRange', value[0])
          }
          size={{ base: 'sm', md: 'md' }}
          width="150px"
        >
          <Select.Trigger>
            <Select.ValueText placeholder="Date Range" />
          </Select.Trigger>
          <Select.Content>
            {dateRanges.items.map((range) => (
              <Select.Item key={range.value} item={range}>
                {range.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <Button
          size={{ base: 'sm', md: 'md' }}
          variant="outline"
          marginLeft="auto"
        >
          <Download />
          Export
        </Button>
      </HStack>
    </VStack>
  );
}
