'use client';

import { Button, HStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageTitle from '@/components/PageTitle';

import { UpsertTeam } from './UpsertTeam';

export default function TeamHeader() {
  return (
    <HStack justifyContent="space-between">
      <PageTitle title="Teams" />
      <Authorized resource="teams" action="create">
        <Button
          size={{ base: 'sm', md: 'md' }}
          onClick={() =>
            UpsertTeam.open('add-team', {
              action: 'Add',
              item: {
                team_id: '',
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
