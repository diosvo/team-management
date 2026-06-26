'use client';

import { SimpleGrid, Span, Stat } from '@chakra-ui/react';

import { AttendanceStats as StatsType } from '@/types/attendance';

import { useAttendanceFilters } from '@/lib/nuqs';
import { AttendanceStatus } from '@/utils/enum';
import { formatValueUnit } from '@/utils/formatter';
import { colorRank } from '@/utils/helper';

const cardHoverStyle = {
  cursor: 'pointer',
  shadow: 'sm',
  transform: 'translateY(-2px)',
  transition: 'all 0.2s',
};

interface StatCardProps {
  label: string;
  count: number;
  color: string;
  unit?: string;
  onClick?: () => void;
}

function StatCard({
  label,
  count,
  color,
  unit = 'player',
  onClick,
}: StatCardProps) {
  const clickable = Boolean(onClick) && count > 0;

  return (
    <Stat.Root
      borderWidth={1}
      padding={4}
      rounded="md"
      _hover={clickable ? cardHoverStyle : {}}
      onClick={clickable ? onClick : undefined}
    >
      <Stat.Label>{label}</Stat.Label>
      <Stat.ValueText alignItems="baseline">
        <Span color={count > 0 ? color : 'black'}>{count}</Span>
        <Stat.ValueUnit>{formatValueUnit(count, unit)}</Stat.ValueUnit>
      </Stat.ValueText>
    </Stat.Root>
  );
}

export default function AttendanceStats({ stats }: { stats: StatsType }) {
  const [, setSearchParams] = useAttendanceFilters();

  const handleClick = (status: AttendanceStatus) =>
    setSearchParams({ page: 1, q: '', status: [status] });

  return (
    <SimpleGrid columns={{ base: 2, md: 4, xl: 6 }} gap={{ base: 3, lg: 4 }}>
      <StatCard
        label="On Time"
        count={stats.on_time_count}
        color="green"
        onClick={() => handleClick(AttendanceStatus.ON_TIME)}
      />
      <StatCard
        label="Late Entry"
        count={stats.late_count}
        color="orange"
        onClick={() => handleClick(AttendanceStatus.LATE)}
      />
      <StatCard
        label="Absent"
        count={stats.absent_count}
        color="red"
        onClick={() => handleClick(AttendanceStatus.ABSENT)}
      />
      <Stat.Root borderWidth={1} padding={4} rounded="md">
        <Stat.Label>Present Rate</Stat.Label>
        <Stat.ValueText alignItems="baseline">
          <Span color={colorRank(stats.present_rate)}>
            {stats.present_rate}
          </Span>
          <Stat.ValueUnit>%</Stat.ValueUnit>
        </Stat.ValueText>
      </Stat.Root>
    </SimpleGrid>
  );
}
