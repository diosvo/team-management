'use client';

import { Button } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import Authorized from '@/components/Authorized';

import usePermissions from '@/hooks/use-permissions';

import { UpsertAchievement } from './UpsertAchievement';

export default function AchievementHeader() {
  const t = useTranslations('achievements.header');
  const { can } = usePermissions();
  const searchParams = useSearchParams();
  // The Leagues table links here with `?record=<league_id>` so an honour can
  // be entered the moment a league ends.
  const record = searchParams.get('record');
  const canRecord = can('achievements', 'create');

  useEffect(() => {
    if (!record || !canRecord) return;

    UpsertAchievement.open('add-achievement', {
      action: 'Add',
      item: { achievement_id: '', league_id: record },
    });
  }, [record, canRecord]);

  return (
    <>
      <Authorized resource="achievements" action="create">
        <Button
          variant="ghost"
          onClick={() =>
            UpsertAchievement.open('add-achievement', {
              action: 'Add',
              item: { achievement_id: '' },
            })
          }
        >
          <Plus />
          {t('record')}
        </Button>
      </Authorized>
      <UpsertAchievement.Viewport />
    </>
  );
}
