'use client';

import { useTransition } from 'react';

import { Box, HStack, IconButton, Text, VStack } from '@chakra-ui/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Authorized from '@/components/Authorized';
import { toaster } from '@/components/ui/toaster';

import { enumLabel } from '@/i18n/enums';
import { ACHIEVEMENT_STYLE } from '@/utils/constants/achievement';
import { formatDate } from '@/utils/datetime';

import { removeAchievement } from '@/actions/achievement';
import type { AchievementWithRelations } from '@/db/achievement';

import { UpsertAchievement } from './UpsertAchievement';

export default function AchievementCard({
  achievement,
}: {
  achievement: AchievementWithRelations;
}) {
  const t = useTranslations('achievements.card');
  const tEnums = useTranslations('enums');
  const [isPending, startTransition] = useTransition();

  const { colorPalette, icon: Icon } = ACHIEVEMENT_STYLE[achievement.type];
  const label = enumLabel(tEnums, 'achievementType', achievement.type);
  const { league, player } = achievement;

  // Individual honors read better under the player's name than the league's.
  const caption =
    [
      player?.user.name ?? league?.name,
      league &&
        `${formatDate(league.start_date)} – ${formatDate(league.end_date)}`,
    ]
      .filter(Boolean)
      .join(' • ') || t('standalone');

  const removeItem = () => {
    const id = toaster.create({
      type: 'loading',
      title: t('deleting'),
    });

    startTransition(async () => {
      const { success, message: title } = await removeAchievement(
        achievement.achievement_id,
      );
      toaster.update(id, { type: success ? 'success' : 'error', title });
    });
  };

  return (
    <HStack
      gap={4}
      paddingBlock={2}
      className="group"
      alignItems="start"
      colorPalette={colorPalette}
    >
      <Box color="colorPalette.solid">
        <Icon size={20} role="img" aria-label={label} />
      </Box>
      <VStack flex={1} minWidth={0} alignItems="stretch">
        <Text fontWeight="semibold" lineClamp={2}>
          {achievement.title}
        </Text>
        <Text textStyle="secondary" color="gray.700">
          {caption}
        </Text>
      </VStack>
      <HStack
        // Hover-to-reveal only where a pointer can hover; always shown on touch.
        opacity={1}
        css={{ '@media (hover: hover)': { opacity: 0 } }}
        transition="opacity 0.2s"
        _groupHover={{ opacity: 1 }}
        _focusWithin={{ opacity: 1 }}
      >
        <Authorized resource="achievements" action="edit">
          <IconButton
            size="xs"
            variant="ghost"
            aria-label={t('edit')}
            disabled={isPending}
            onClick={() =>
              UpsertAchievement.open('update-achievement', {
                action: 'Update',
                item: {
                  achievement_id: achievement.achievement_id,
                  type: achievement.type,
                  title: achievement.title,
                  year: achievement.year,
                  league_id: achievement.league_id,
                  player_id: achievement.player_id,
                  description: achievement.description,
                },
              })
            }
          >
            <Pencil />
          </IconButton>
        </Authorized>
        <Authorized resource="achievements" action="delete">
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="red"
            aria-label={t('delete')}
            disabled={isPending}
            onClick={removeItem}
          >
            <Trash2 />
          </IconButton>
        </Authorized>
      </HStack>
    </HStack>
  );
}
