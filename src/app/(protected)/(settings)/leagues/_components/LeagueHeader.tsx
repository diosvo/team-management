'use client';

import { Button, HStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageTitle from '@/components/PageTitle';

import { UpsertLeague } from './UpsertLeague';

export default function LeagueHeader() {
  return (
    <HStack justifyContent="space-between">
      <PageTitle title="Leagues" />
      <Authorized resource="leagues" action="create">
        <Button
          size={{ base: 'sm', md: 'md' }}
          onClick={() =>
            UpsertLeague.open('add-league', {
              action: 'Add',
              item: {
                league_id: '',
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
