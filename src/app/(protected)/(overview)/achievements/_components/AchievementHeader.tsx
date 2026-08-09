'use client';

import { Button } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import Authorized from '@/components/Authorized';

import { UpsertAchievement } from './UpsertAchievement';

export default function AchievementHeader() {
  return (
    <>
      <Authorized resource="achievements" action="create">
        <Button
          variant="ghost"
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
      <UpsertAchievement.Viewport />
    </>
  );
}
