'use client';

import { useTransition } from 'react';

import { Box, HStack, IconButton, Text, VStack } from '@chakra-ui/react';
import { Pencil, Trash2 } from 'lucide-react';

import Authorized from '@/components/Authorized';
import { toaster } from '@/components/ui/toaster';

import { ACHIEVEMENT_STYLE } from '@/utils/constants/achievement';
import { formatDate } from '@/utils/formatter';

import { removeAchievement } from '@/actions/achievement';
import { AchievementWithRelations } from '@/db/achievement';

import { UpsertAchievement } from './UpsertAchievement';

export default function AchievementCard({
  achievement,
}: {
  achievement: AchievementWithRelations;
}) {
  const [isPending, startTransition] = useTransition();

  const {
    label,
    colorPalette,
    icon: Icon,
  } = ACHIEVEMENT_STYLE[achievement.type];
  const { league, player } = achievement;

  // Individual honors read better under the player's name than the league's.
  const caption =
    [
      player?.user.name ?? league?.name,
      league &&
        `${formatDate(league.start_date)} – ${formatDate(league.end_date)}`,
    ]
      .filter(Boolean)
      .join(' • ') || 'Standalone honor';

  const removeItem = () => {
    const id = toaster.create({
      type: 'loading',
      title: 'Deleting achievement...',
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
      <VStack flex={1} alignItems="stretch">
        <Text fontWeight="semibold">{achievement.title}</Text>
        <Text fontSize="sm" color="gray.700">
          {caption}
        </Text>
      </VStack>
      <HStack
        opacity={0}
        transition="opacity 0.2s"
        display={{ base: 'none', md: 'flex' }}
        _groupHover={{ opacity: 1 }}
        _focusWithin={{ opacity: 1 }}
      >
        <Authorized resource="achievements" action="edit">
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Edit achievement"
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
            aria-label="Delete achievement"
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
