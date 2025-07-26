'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  Button,
  createListCollection,
  HStack,
  Menu,
  Portal,
  Select,
} from '@chakra-ui/react';
import { Filter, Plus, Settings2 } from 'lucide-react';

import SearchInput from '@/components/ui/search-input';
import Visibility from '@/components/visibility';
import { usePermissions } from '@/hooks/use-permissions';

interface TestingFiltersProps {
  onFilterChange: (filters: { search: string; date: string }) => void;
}

export default function TestingFilters({
  onFilterChange,
}: TestingFiltersProps) {
  const { isAdmin } = usePermissions();

  const [filters, setFilters] = useState({
    search: '',
    date: '2025-03-25', // Default to latest date
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const dateRanges = createListCollection({
    items: [
      { value: '2025-01-25', label: 'January 25, 2025' },
      { value: '2025-03-25', label: 'March 25, 2025' },
    ],
  });

  return (
    <HStack marginBottom={6}>
      <SearchInput
        value={filters.search}
        onValueChange={(value: string) => handleFilterChange('search', value)}
        onClear={() => handleFilterChange('search', '')}
      />
      <Select.Root
        collection={dateRanges}
        width="xs"
        size={{ base: 'sm', md: 'md' }}
        value={[filters.date]}
        onValueChange={({ value }) => handleFilterChange('date', value[0])}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <HStack>
              <Filter size={14} />
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
                <Select.Item item={date.value} key={date.value}>
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
            <Button>Actions</Button>
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
