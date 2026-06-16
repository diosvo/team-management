'use client';

import { Button, HStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageTitle from '@/components/PageTitle';

import { UpsertMatch } from './UpsertMatch';

export default function MatchHeader() {
  return (
    <HStack justifyContent="space-between">
      <PageTitle title="Matches" />
      <Authorized resource="matches" action="create">
        <Button
          size={{ base: 'sm', md: 'md' }}
          onClick={() =>
            UpsertMatch.open('add-match', {
              action: 'Add',
              item: {
                match_id: '',
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
