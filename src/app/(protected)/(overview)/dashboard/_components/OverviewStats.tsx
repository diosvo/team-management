import { SimpleGrid } from '@chakra-ui/react';

import { Card } from '@/components/ui/card';
import { Stat } from '@/components/ui/stat';

import { getOverviewStats } from '@/actions/analytics';

export default async function OverviewStats() {
  const stats = await getOverviewStats();

  return (
    <Card title="Overview" description="Key performance indicators at a glance">
      <SimpleGrid columns={3} gap={4}>
        <Stat label="Active Players" value={stats.active_players} color="red" />
        <Stat
          label="Next Game"
          value={stats.next_game}
          unit="days remaining"
          hidden={stats.next_game == null}
        />
        <Stat
          label="Win Rate"
          value={stats.win_rate}
          unit="%"
          color={stats.win_rate > 50 ? 'green' : 'red'}
        />
      </SimpleGrid>
    </Card>
  );
}
