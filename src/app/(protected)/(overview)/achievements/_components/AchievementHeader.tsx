'use client';

import { Button } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Authorized from '@/components/Authorized';

import { UpsertAchievement } from './UpsertAchievement';

export default function AchievementHeader() {
  const t = useTranslations('achievements.header');

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
