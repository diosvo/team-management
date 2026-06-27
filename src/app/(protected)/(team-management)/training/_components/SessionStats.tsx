'use client';

import { SimpleGrid } from '@chakra-ui/react';

import { Stat } from '@/components/ui/stat';

import { useTrainingFilters } from '@/lib/nuqs';
import { SessionStatus } from '@/utils/enum';

import { TrainingSessionStats } from '@/types/training-session';

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
      <Stat
        label="Completed Sessions"
        value={stats.completed_sessions}
        unit="session"
        color={stats.completed_sessions > 0 ? 'green' : 'black'}
        onClick={() =>
          setSearchParams(
            { page: 1, status: [SessionStatus.COMPLETED] },
            { shallow: false },
          )
        }
      />
      <Stat label="Average Attendance" value={avgAttendance} unit="player" />
      <Stat label="Total Hours" value={totalHours} unit="hr" />
    </SimpleGrid>
  );
}
