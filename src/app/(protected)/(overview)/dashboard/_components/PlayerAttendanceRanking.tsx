import { HStack, Span, Text, VStack } from '@chakra-ui/react';
import { BetweenVerticalEnd, TrendingDown, TrendingUp } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

import { PlayerSessionSummary, PlayerStats } from '@/types/analytics';
import { colorRank } from '@/utils/helper';

const PlayerRank = (player: PlayerStats, index: number) => {
  return (
    <HStack key={index}>
      <Text fontSize="sm" color="GrayText">
        {index + 1}.
      </Text>
      <Text fontSize="sm">{player.player_name}</Text>
      <Text fontSize="xs" color="GrayText" marginLeft="auto" marginRight={4}>
        {player.attended} sessions
      </Text>
      <Text fontSize="sm" color={colorRank(player.attendance_rate)}>
        {player.attendance_rate}%
      </Text>
    </HStack>
  );
};

export default function PlayerAttendanceRanking({
  records,
}: {
  records: PlayerSessionSummary;
}) {
  const section = [
    {
      title: 'Attendance Stars',
      color: 'green.600',
      icon: TrendingUp,
      data: records.top_performers,
    },
    {
      title: 'Need a Boost',
      color: 'red.600',
      icon: TrendingDown,
      data: records.need_attention,
    },
  ];

  return (
    <Card
      height="full"
      title="Player Attendance Rankings"
      description="Stars of attendance and teammates who need a boost"
    >
      {!records.top_performers.length && !records.need_attention.length ? (
        <EmptyState
          icon={<BetweenVerticalEnd />}
          title="No player attendance records"
        />
      ) : (
        section.map(
          ({ title, color, icon: Icon, data }, index) =>
            data.length > 0 && (
              <VStack key={index} alignItems="stretch" gap={2} marginBottom={4}>
                <HStack gap={2} color={color}>
                  <Icon size={16} />
                  <Span fontSize="sm" fontWeight="medium">
                    {title}
                  </Span>
                </HStack>

                {data.map(PlayerRank)}
              </VStack>
            ),
        )
      )}
    </Card>
  );
}
