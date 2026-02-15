'use client';

import {
  Badge,
  Card,
  Flex,
  HStack,
  SimpleGrid,
  Span,
  Text,
  VStack,
} from '@chakra-ui/react';
import { BetweenVerticalEnd, TrendingDown, TrendingUp } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';

import { PlayerSessionSummary, PlayerStats } from '@/types/analytics';
import { colorPlayerRank } from '@/utils/helper';

const PlayerRank = (player: PlayerStats, index: number) => {
  return (
    <Flex
      key={index}
      alignItems="start"
      justifyContent="space-between"
      padding={2}
      gap={2}
    >
      <VStack alignItems="start" gap={0}>
        <Text fontSize="sm" fontWeight="medium">
          {player.player_name}
        </Text>
        <Text fontSize="xs" color="GrayText">
          {player.attended}/{player.total_sessions}
        </Text>
      </VStack>

      <Badge
        variant="subtle"
        borderRadius="full"
        colorPalette={colorPlayerRank(player.attendance_rate)}
      >
        {player.attendance_rate}%
      </Badge>
    </Flex>
  );
};

export default function PlayerAttendanceRanking({
  records,
}: {
  records: PlayerSessionSummary;
}) {
  const section = [
    {
      title: 'Top Performers',
      color: 'green.600',
      icon: TrendingUp,
      data: records.top_performers,
    },
    {
      title: 'Needs Attention',
      color: 'red.600',
      icon: TrendingDown,
      data: records.need_attention,
    },
  ];

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Player Attendance Rankings</Card.Title>
        <Card.Description>
          Stars of attendance and teammates who need a boost
        </Card.Description>
      </Card.Header>
      <Card.Body>
        {!records.top_performers.length && !records.need_attention.length ? (
          <EmptyState
            icon={<BetweenVerticalEnd />}
            title="No player attendance records"
          />
        ) : (
          <SimpleGrid columns={2} gap={6}>
            {section.map(
              ({ title, color, icon: Icon, data }, index) =>
                data.length > 0 && (
                  <VStack key={index} alignItems="stretch" gap={3}>
                    <HStack gap={2} color={color}>
                      <Icon size={16} />
                      <Span fontSize="sm" fontWeight="medium">
                        {title}
                      </Span>
                    </HStack>

                    {data.map(PlayerRank)}
                  </VStack>
                ),
            )}
          </SimpleGrid>
        )}
      </Card.Body>
    </Card.Root>
  );
}
