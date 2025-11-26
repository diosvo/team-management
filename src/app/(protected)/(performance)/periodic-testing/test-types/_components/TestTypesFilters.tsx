'use client';

import { Button, HStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import SearchInput from '@/components/SearchInput';

import { UpsertTestType } from './UpsertTestType';

export default function TestTypesFilters() {
  return (
    <HStack marginBottom={6}>
      <SearchInput />
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
