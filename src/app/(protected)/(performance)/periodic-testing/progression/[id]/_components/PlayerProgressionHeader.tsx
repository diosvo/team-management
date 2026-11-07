'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageHeader from '@/components/PageHeader';
import type { TestType } from '@/drizzle/schema';

import { AddTestNote } from './AddTestNote';

export default function PlayerProgressionHeader({
  playerId,
  playerName,
  types,
  usedTypeIds,
}: {
  playerId: string;
  playerName: string;
  types: Array<TestType>;
  usedTypeIds: Array<string>;
}) {
  const t = useTranslations('periodicTesting.playerProgression');

  return (
    <PageHeader title={playerName}>
      <Authorized resource="periodic-testing" action="create">
        <Button
          onClick={() =>
            AddTestNote.open('add-test-note', {
              playerId,
              types,
              usedTypeIds,
            })
          }
        >
          <Plus size={14} />
          {t('addNote')}
        </Button>
      </Authorized>
      <AddTestNote.Viewport />
    </PageHeader>
  );
}
