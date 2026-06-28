'use client';

import Link from 'next/link';

import { Button, HStack } from '@chakra-ui/react';
import { MoveLeft, Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageTitle from '@/components/PageTitle';
import { Tooltip } from '@/components/ui/tooltip';

import { UpsertTestType } from './UpsertTestType';

export default function TestTypesHeader() {
  return (
    <HStack justifyContent="space-between">
      <HStack gap={2}>
        <Tooltip content="Back to Periodic Testing">
          <Button variant="ghost" asChild>
            <Link href="../periodic-testing">
              <MoveLeft />
            </Link>
          </Button>
        </Tooltip>
        <PageTitle title="Test Types" />
      </HStack>
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
