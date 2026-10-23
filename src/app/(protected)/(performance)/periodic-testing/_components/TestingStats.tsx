import { Stat, StatGroup } from '@/components/ui/stat';

export default function TestingStats({
  stats,
}: {
  stats: {
    total_players: number;
    completed_tests: number;
  };
}) {
  return (
    <StatGroup>
      <Stat label="Players Joined" value={stats.total_players} unit="player" />
      <Stat
        label="Completed Tests"
        value={stats.completed_tests}
        unit="test"
        color={stats.completed_tests > 0 ? 'green' : 'black'}
      />
    </StatGroup>
  );
}
