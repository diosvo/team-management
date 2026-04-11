'use client';

import { Button, HStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import SearchInput from '@/components/SearchInput';

import { UpsertLocation } from './UpsertLocation';

export default function LocationFilters() {
  return (
    <HStack marginBlock={6}>
      <SearchInput />
      <Authorized resource="locations" action="create">
        <Button
          size={{ base: 'sm', md: 'md' }}
          onClick={() =>
            UpsertLocation.open('add-location', {
              action: 'Add',
              item: {
                location_id: '',
              },
            })
          }
        >
          <Plus />
          Add
        </Button>
      </Authorized>
      <UpsertLocation.Viewport />
    </HStack>
  );
}
