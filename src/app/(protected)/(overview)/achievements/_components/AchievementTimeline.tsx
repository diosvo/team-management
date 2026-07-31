import {
  Badge,
  Heading,
  SimpleGrid,
  Timeline,
} from '@chakra-ui/react';
import { Medal, Trophy } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';

import { formatValueUnit } from '@/utils/formatter';

import { AchievementWithRelations } from '@/db/achievement';

import AchievementCard from './AchievementCard';

export default function AchievementTimeline({
  achievements,
}: {
  achievements: Array<AchievementWithRelations>;
}) {
  if (achievements.length === 0) {
    return (
      <EmptyState
        icon={<Trophy />}
        title="The trophy cabinet awaits its first honor"
        description="Record the club's achievements once a league has ended."
      />
    );
  }

  // Achievements arrive sorted by year (desc), so insertion order is kept.
  const byYear = new Map<number, Array<AchievementWithRelations>>();
  for (const achievement of achievements) {
    const items = byYear.get(achievement.year) ?? [];
    byYear.set(achievement.year, [...items, achievement]);
  }

  return (
    <Timeline.Root size="xl" variant="subtle">
      {[...byYear.entries()].map(([year, items]) => (
        <Timeline.Item key={year}>
          <Timeline.Connector>
            <Timeline.Separator />
            <Timeline.Indicator backgroundColor="primary" color="white">
              <Medal size={16} />
            </Timeline.Indicator>
          </Timeline.Connector>
          <Timeline.Content width="full" gap={4} paddingBottom={8}>
            <Timeline.Title>
              <Heading size="lg" color="primary" fontStyle="italic">
                {year}
              </Heading>
              <Badge variant="surface" borderRadius="full" colorPalette="gray">
                {items.length} {formatValueUnit(items.length, 'honor')}
              </Badge>
            </Timeline.Title>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              {items.map((achievement) => (
                <AchievementCard
                  key={achievement.achievement_id}
                  achievement={achievement}
                />
              ))}
            </SimpleGrid>
          </Timeline.Content>
        </Timeline.Item>
      ))}
    </Timeline.Root>
  );
}
