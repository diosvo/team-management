import { SimpleGrid } from '@chakra-ui/react';

import { Stat } from '@/components/ui/stat';

export default function TestingStats({
  stats,
}: {
  stats: {
    total_players: number;
    completed_tests: number;
  };
}) {
  return (
    <SimpleGrid columns={{ base: 2, md: 4, xl: 6 }} gap={{ base: 3, lg: 4 }}>
      <Stat
        label="Players Joined"
        value={stats.total_players}
        unit="player"
      />
      <Stat
        label="Completed Tests"
        value={stats.completed_tests}
        unit="test"
        color={stats.completed_tests > 0 ? 'green' : 'black'}
      />
    </SimpleGrid>
  );
}
