'use client';

import { useTransition } from 'react';

import {
  Avatar,
  Badge,
  Card as ChakraCard,
  Circle,
  HStack,
  IconButton,
  Span,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Pencil, Trash2 } from 'lucide-react';

import Authorized from '@/components/Authorized';
import { toaster } from '@/components/ui/toaster';

import { formatDate } from '@/utils/formatter';

import { removeAchievement } from '@/actions/achievement';
import { AchievementWithRelations } from '@/db/achievement';

import { ACHIEVEMENT_STYLE } from '../_helpers/utils';
import { UpsertAchievement } from './UpsertAchievement';

export default function AchievementCard({
  achievement,
}: {
  achievement: AchievementWithRelations;
}) {
  const [isPending, startTransition] = useTransition();

  const { label, colorPalette, icon: Icon } = ACHIEVEMENT_STYLE[achievement.type];
  const { league, player } = achievement;

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
    <ChakraCard.Root
      size="sm"
      colorPalette={colorPalette}
      borderLeftWidth="4px"
      borderLeftColor="colorPalette.solid"
      _hover={{ shadow: 'sm', transition: 'box-shadow 0.2s' }}
    >
      <ChakraCard.Body>
        <HStack gap={3} alignItems="start">
          <Circle
            size={10}
            backgroundColor="colorPalette.subtle"
            color="colorPalette.fg"
          >
            <Icon size={20} />
          </Circle>
          <VStack flex={1} alignItems="stretch" gap={1}>
            <HStack>
              <Text fontWeight="bold">{achievement.title}</Text>
              <Badge
                size="sm"
                variant="surface"
                borderRadius="full"
                marginLeft="auto"
              >
                {label}
              </Badge>
            </HStack>
            <Span fontSize="sm" color="gray.600">
              {league
                ? `${league.name} · ${formatDate(league.start_date)} – ${formatDate(league.end_date)}`
                : 'Standalone honor'}
            </Span>
            {player && (
              <HStack gap={2}>
                <Avatar.Root size="2xs" variant="outline">
                  <Avatar.Fallback name={player.user.name} />
                  <Avatar.Image src={player.user.image ?? undefined} />
                </Avatar.Root>
                <Span fontSize="sm">{player.user.name}</Span>
              </HStack>
            )}
            {achievement.description && (
              <Text fontSize="sm" color="gray.500">
                {achievement.description}
              </Text>
            )}
          </VStack>
          <VStack gap={1}>
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
          </VStack>
        </HStack>
      </ChakraCard.Body>
    </ChakraCard.Root>
  );
}
