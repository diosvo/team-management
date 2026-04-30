import { Card, HStack, Span, Text, VStack } from '@chakra-ui/react';
import { BetweenVerticalEnd, TrendingDown, TrendingUp } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';

import { PlayerSessionSummary, PlayerStats } from '@/types/analytics';
import { colorPlayerRank } from '@/utils/helper';

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
      <Text fontSize="sm" color={colorPlayerRank(player.attendance_rate)}>
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
  const mock: PlayerSessionSummary = {
    top_performers: [
      {
        player_name: 'John Smith',
        attended: 5,
        total_sessions: 5,
        attendance_rate: 100,
      },
      {
        player_name: 'Sarah Johnson',
        attended: 5,
        total_sessions: 5,
        attendance_rate: 100,
      },
      {
        player_name: 'Emma Brown',
        attended: 4,
        total_sessions: 5,
        attendance_rate: 80,
      },
    ],
    need_attention: [
      {
        player_name: 'Tom Wilson',
        attended: 2,
        total_sessions: 5,
        attendance_rate: 40,
      },
      {
        player_name: 'Mike Davis',
        attended: 1,
        total_sessions: 5,
        attendance_rate: 20,
      },
      {
        player_name: 'Lisa Ray',
        attended: 1,
        total_sessions: 5,
        attendance_rate: 20,
      },
    ],
  };

  const section = [
    {
      title: 'Attendance Stars',
      color: 'green.600',
      icon: TrendingUp,
      data: mock.top_performers,
    },
    {
      title: 'Need a Boost',
      color: 'red.600',
      icon: TrendingDown,
      data: mock.need_attention,
    },
  ];

  return (
    <Card.Root height="full">
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
          section.map(
            ({ title, color, icon: Icon, data }, index) =>
              data.length > 0 && (
                <VStack
                  key={index}
                  alignItems="stretch"
                  gap={2}
                  marginBottom={4}
                >
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
      </Card.Body>
    </Card.Root>
  );
}
