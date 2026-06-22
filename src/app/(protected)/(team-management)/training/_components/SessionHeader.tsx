'use client';

import { Button, HStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageTitle from '@/components/PageTitle';

import { UpsertSession } from './UpsertSession';

export default function SessionHeader() {
  return (
    <HStack justifyContent="space-between">
      <PageTitle title="Training Sessions" />
      <Authorized resource="training" action="create">
        <Button
          size={{ base: 'sm', md: 'md' }}
          onClick={() =>
            UpsertSession.open('new-session', {
              action: 'Create',
              item: {
                session_id: '',
              },
            })
          }
        >
          <Plus />
          New Session
        </Button>
      </Authorized>
    </HStack>
  );
}
