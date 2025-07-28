'use client';

import SearchInput from '@/components/ui/search-input';
import { Button, HStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import { UpsertTestTypeSchema } from '@/features/periodic-testing/schemas/periodic-testing';
import { getDefaults } from '@/lib/zod';

import { UpsertTestType } from './upsert-type';

interface SelectionFilterProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
}

export default function TestTypesFilters({
  search,
  setSearch,
}: SelectionFilterProps) {
  return (
    <>
      <HStack marginBottom={6}>
        <SearchInput
          value={search}
          onValueChange={(value) => setSearch(value)}
          onClear={() => setSearch('')}
        />
        <Button
          size={{ base: 'sm', md: 'md' }}
          onClick={() =>
            UpsertTestType.open('add-test-type', {
              action: 'Add',
              item: {
                ...getDefaults(UpsertTestTypeSchema),
                type_id: '',
              },
            })
          }
        >
          <Plus />
          Add
        </Button>
      </HStack>
      <UpsertTestType.Viewport />
    </>
  );
}
