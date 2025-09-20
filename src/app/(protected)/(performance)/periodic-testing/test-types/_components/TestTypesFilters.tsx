'use client';

import { Button, HStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import SearchInput from '@/components/ui/search-input';

import { UpsertTestType } from './UpsertTestType';

export default function TestTypesFilters({
  search,
  setSearch,
}: Search<string>) {
  return (
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
              type_id: '',
            },
          })
        }
      >
        <Plus />
        Add
      </Button>
    </HStack>
  );
}
