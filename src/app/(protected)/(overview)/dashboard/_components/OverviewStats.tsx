import { getOverviewStats } from '@/actions/analytics';
import { Card, SimpleGrid, Span, Stat } from '@chakra-ui/react';

export default async function OverviewStats() {
  const stats = await getOverviewStats();

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Overview</Card.Title>
        <Card.Description>
          Key performance indicators at a glance
        </Card.Description>
      </Card.Header>
      <Card.Body>
        <SimpleGrid columns={3} gap={6}>
          <Stat.Root borderWidth={1} padding={4} rounded="md">
            <Stat.Label>Active Players</Stat.Label>
            <Stat.ValueText alignItems="baseline" color="tomato">
              {stats.active_players}
            </Stat.ValueText>
          </Stat.Root>
          <Stat.Root borderWidth={1} padding={4} rounded="md">
            <Stat.Label>Next Game</Stat.Label>
            <Stat.ValueText>{stats.next_game ?? '-'}</Stat.ValueText>
          </Stat.Root>
          <Stat.Root borderWidth={1} padding={4} rounded="md">
            <Stat.Label>Win Rate</Stat.Label>
            <Stat.ValueText alignItems="baseline">
              <Span color={stats.win_rate > 50 ? 'green' : 'tomato'}>
                {stats.win_rate}
              </Span>
              <Stat.ValueUnit>%</Stat.ValueUnit>
            </Stat.ValueText>
          </Stat.Root>
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}
