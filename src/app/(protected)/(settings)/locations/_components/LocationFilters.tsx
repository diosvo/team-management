'use client';

import { Button, HStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import SearchInput from '@/components/SearchInput';
import Visibility from '@/components/Visibility';

import usePermissions from '@/hooks/use-permissions';

import { UpsertLocation } from './UpsertLocation';

export default function LocationFilters() {
  const { isAdmin } = usePermissions();

  return (
    <HStack marginBlock={6}>
      <SearchInput />
      <Visibility isVisible={isAdmin}>
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
      </Visibility>
      <UpsertLocation.Viewport />
    </HStack>
  );
}
