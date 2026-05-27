'use client';

import { Button, HStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageTitle from '@/components/PageTitle';

import { UpsertLocation } from './UpsertLocation';

export default function LocationHeader() {
  return (
    <HStack justifyContent="space-between">
      <PageTitle title="Locations" />
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
    </HStack>
  );
}
