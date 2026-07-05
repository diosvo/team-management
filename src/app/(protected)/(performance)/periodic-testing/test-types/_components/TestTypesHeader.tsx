'use client';

import { Button, HStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageTitle from '@/components/PageTitle';

import { UpsertTestType } from './UpsertTestType';

export default function TestTypesHeader() {
  return (
    <HStack justifyContent="space-between">
      <PageTitle title="Test Types" />
      <Authorized resource="periodic-testing" action="create">
        <Button
          size={{ base: 'sm', md: 'md' }}
          onClick={() =>
            UpsertTestType.open('add-test-type', {
              action: 'Add',
              item: { type_id: '' },
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
