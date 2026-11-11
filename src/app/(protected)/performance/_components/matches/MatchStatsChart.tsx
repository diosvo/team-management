'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Chart, useChart } from '@chakra-ui/charts';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatDate } from '@/utils/datetime';

import type { MatchPerformanceRecord } from '@/types/performance';

export default function MatchStatsChart({
  records,
}: {
  records: Array<MatchPerformanceRecord>;
}) {
  const ts = useTranslations('matches.boxScore');
  const data = useMemo(
    () =>
      records.map((record) => ({
        label: `${formatDate(record.date)} · ${record.opponent}`,
        points_scored: record.points_scored,
        rebounds: record.rebounds,
        assists: record.assists,
      })),
    [records],
  );

  const chart = useChart({
    data,
    series: [
      {
        name: 'points_scored',
        color: 'blue.600',
        label: ts('stats.points_scored.label'),
      },
      {
        name: 'rebounds',
        color: 'green.500',
        label: ts('stats.rebounds.label'),
      },
      {
        name: 'assists',
        color: 'orange.400',
        label: ts('stats.assists.label'),
      },
    ],
  });

  return (
    <Chart.Root chart={chart} maxHeight="sm">
      <BarChart data={chart.data} responsive>
        <CartesianGrid
          stroke={chart.color('border.muted')}
          vertical={false}
          strokeDasharray="2 2"
        />
        <XAxis
          axisLine={false}
          tickLine={false}
          dataKey={chart.key('label')}
          fontSize={12}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={28}
          allowDecimals={false}
        />
        <Tooltip
          content={<Chart.Tooltip />}
          cursor={{ fill: chart.color('bg.muted') }}
        />
        <Legend content={<Chart.Legend />} />
        {chart.series.map((item) => (
          <Bar
            key={item.name}
            isAnimationActive={false}
            dataKey={chart.key(item.name)}
            fill={chart.color(item.color)}
            radius={2}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </Chart.Root>
  );
}
