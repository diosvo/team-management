'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Chart, useChart } from '@chakra-ui/charts';
import { parseISO } from 'date-fns';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ATTENDANCE_TARGET_RATE } from '@/utils/constants';
import { formatDay } from '@/utils/datetime';

import type { MonthlyAttendance } from '@/types/performance';

export default function AttendanceTrendChart({
  records,
  subject,
}: {
  records: Array<MonthlyAttendance>;
  /** Legend label for the player's line: "You" or their name. */
  subject: string;
}) {
  const t = useTranslations('performance.attendance');
  const locale = useLocale();
  // `YYYY-MM` → "Feb 2026" / "thg 2 2026"; `parseISO` keeps the day local.
  const data = useMemo(
    () =>
      records.map((record) => ({
        ...record,
        label: formatDay(parseISO(`${record.month}-01`), 'MMM yyyy', locale),
      })),
    [records, locale],
  );
  const chart = useChart({
    data,
    series: [
      { name: 'player', color: 'green.500', label: subject },
      {
        name: 'team',
        color: 'gray.400',
        label: t('team'),
        strokeDasharray: '4 4',
      },
    ],
  });

  return (
    <Chart.Root chart={chart} maxHeight="sm">
      <LineChart data={chart.data} responsive>
        <CartesianGrid
          stroke={chart.color('border')}
          vertical={false}
          strokeDasharray="2 2"
        />
        <XAxis
          axisLine={false}
          tickLine={false}
          dataKey={chart.key('label')}
          stroke={chart.color('border')}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
          width={32}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={<Chart.Tooltip />} />
        <Legend content={<Chart.Legend />} />
        <ReferenceLine
          y={ATTENDANCE_TARGET_RATE}
          stroke="orange"
          strokeDasharray="2 2"
          label={{
            value: t('target', { rate: ATTENDANCE_TARGET_RATE }),
            position: 'insideTopRight',
            fontSize: 12,
          }}
        />
        {chart.series.map((item) => (
          <Line
            key={item.name}
            type="monotone"
            connectNulls
            isAnimationActive={false}
            dataKey={chart.key(item.name)}
            stroke={chart.color(item.color)}
            strokeDasharray={item.strokeDasharray}
            strokeWidth={item.name === 'player' ? 2 : 1.5}
          />
        ))}
      </LineChart>
    </Chart.Root>
  );
}
