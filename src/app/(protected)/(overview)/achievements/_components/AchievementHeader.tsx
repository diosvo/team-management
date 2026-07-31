'use client';

import { useEffect } from 'react';

import { Button, HStack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageTitle from '@/components/PageTitle';

import { useAchievementFilters } from '@/lib/nuqs';

import { UpsertAchievement } from './UpsertAchievement';

export default function AchievementHeader() {
  const [{ record }, setSearchParams] = useAchievementFilters();

  // Opened from the leagues table: pre-fill the dialog with the ended league.
  useEffect(() => {
    if (!record) return;

    UpsertAchievement.open('add-achievement', {
      action: 'Add',
      item: { achievement_id: '', league_id: record },
    });
    setSearchParams({ record: '' });
  }, [record, setSearchParams]);

  return (
    <>
      <HStack justifyContent="space-between">
        <PageTitle title="Achievements" />
        <Authorized resource="achievements" action="create">
          <Button
            size={{ base: 'sm', md: 'md' }}
            onClick={() =>
              UpsertAchievement.open('add-achievement', {
                action: 'Add',
                item: { achievement_id: '' },
              })
            }
          >
            <Plus />
            Record
          </Button>
        </Authorized>
      </HStack>
      <UpsertAchievement.Viewport />
    </>
  );
}
