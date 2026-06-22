'use client';

import { SimpleGrid, Span, Stat } from '@chakra-ui/react';

import { SessionStatus } from '@/utils/enum';
import { useTrainingFilters } from '@/utils/filters';
import { formatValueUnit } from '@/utils/formatter';

import { TrainingSessionStats } from '@/types/training-session';

const cardHoverStyle = {
  cursor: 'pointer',
  shadow: 'sm',
  transform: 'translateY(-2px)',
  transition: 'all 0.2s',
};

export default function SessionStats({
  stats,
}: {
  stats: TrainingSessionStats;
}) {
  const [, setSearchParams] = useTrainingFilters();

  const avgAttendance = Number(stats.avg_attendance.toFixed(1));
  const totalHours = Number(stats.total_hours.toFixed(1));

  return (
    <SimpleGrid columns={{ base: 2, md: 4, xl: 6 }} gap={{ base: 3, lg: 4 }}>
      <Stat.Root
        borderWidth={1}
        padding={4}
        rounded="md"
        _hover={cardHoverStyle}
        onClick={() =>
          setSearchParams(
            { page: 1, status: SessionStatus.COMPLETED },
            { shallow: false },
          )
        }
      >
        <Stat.Label>Completed Sessions</Stat.Label>
        <Stat.ValueText alignItems="baseline">
          <Span color={stats.completed_sessions > 0 ? 'green' : 'black'}>
            {stats.completed_sessions}
          </Span>
          <Stat.ValueUnit>
            {formatValueUnit(stats.completed_sessions, 'session')}
          </Stat.ValueUnit>
        </Stat.ValueText>
      </Stat.Root>
      <Stat.Root borderWidth={1} padding={4} rounded="md">
        <Stat.Label>Average Attendance</Stat.Label>
        <Stat.ValueText alignItems="baseline">
          {avgAttendance}
          <Stat.ValueUnit>
            {formatValueUnit(avgAttendance, 'player')}
          </Stat.ValueUnit>
        </Stat.ValueText>
      </Stat.Root>
      <Stat.Root borderWidth={1} padding={4} rounded="md">
        <Stat.Label>Total Hours</Stat.Label>
        <Stat.ValueText alignItems="baseline">
          {totalHours}
          <Stat.ValueUnit>{formatValueUnit(totalHours, 'hr')}</Stat.ValueUnit>
        </Stat.ValueText>
      </Stat.Root>
    </SimpleGrid>
  );
}
