'use client';

import { SimpleGrid } from '@chakra-ui/react';

import { Stat } from '@/components/ui/stat';

import { useAttendanceFilters } from '@/lib/nuqs';
import { AttendanceStats as StatsType } from '@/types/attendance';
import { AttendanceStatus } from '@/utils/enum';

export default function AttendanceStats({ stats }: { stats: StatsType }) {
  const [, setSearchParams] = useAttendanceFilters();

  const handleClick = (status: AttendanceStatus) =>
    setSearchParams({ page: 1, q: '', status: [status] });

  return (
    <SimpleGrid columns={{ base: 2, md: 4, xl: 6 }} gap={{ base: 3, lg: 4 }}>
      <Stat
        label="On Time"
        value={stats.on_time_count}
        color="green"
        onClick={() => handleClick(AttendanceStatus.ON_TIME)}
      />
      <Stat
        label="Late Entry"
        value={stats.late_count}
        color="orange"
        onClick={() => handleClick(AttendanceStatus.LATE)}
      />
      <Stat
        label="Absent"
        value={stats.absent_count}
        color="red"
        onClick={() => handleClick(AttendanceStatus.ABSENT)}
      />
      <Stat
        label="Present Rate"
        value={stats.present_rate}
        unit="%"
        color="blue"
      />
    </SimpleGrid>
  );
}
