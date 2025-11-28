import { SimpleGrid, Span, Stat } from '@chakra-ui/react';

import { MatchStats } from '@/types/match';

export default function MatchesStats({ stats }: { stats: MatchStats }) {
  return (
    <SimpleGrid
      columns={{ base: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
      gap={4}
      marginBottom={6}
    >
      <Stat.Root borderWidth={1} padding={4} rounded="md">
        <Stat.Label>Total Matches</Stat.Label>
        <Stat.ValueText alignItems="baseline">
          {stats.total_matches}
          <Stat.ValueUnit>games</Stat.ValueUnit>
        </Stat.ValueText>
      </Stat.Root>
      <Stat.Root borderWidth={1} padding={4} rounded="md">
        <Stat.Label>Win Streak</Stat.Label>
        <Stat.ValueText alignItems="baseline">
          <Span color={stats.win_streak > 0 ? 'green' : 'fg.error'}>
            {stats.win_streak}
          </Span>
          <Stat.ValueUnit>games</Stat.ValueUnit>
        </Stat.ValueText>
      </Stat.Root>
      <Stat.Root borderWidth={1} padding={4} rounded="md">
        <Stat.Label>Avg Win Rate</Stat.Label>
        <Stat.ValueText alignItems="baseline">
          <Span color={stats.avg_win_rate > 50 ? 'green' : 'fg.error'}>
            {stats.avg_win_rate}
          </Span>
          <Stat.ValueUnit>%</Stat.ValueUnit>
        </Stat.ValueText>
      </Stat.Root>
      <Stat.Root borderWidth={1} padding={4} rounded="md">
        <Stat.Label>Avg Points/Game</Stat.Label>
        <Stat.ValueText>{stats.avg_points_per_game}</Stat.ValueText>
      </Stat.Root>
    </SimpleGrid>
  );
}
